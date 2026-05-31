<?php
header("Content-Type: application/json");

require_once 'auth.php';
require_once 'config.php';
require_once 'billing_branch.php';
require_once 'admin_security.php';
require_once 'admin_permissions.php';

init_api_auth();
require_admin_password($conn, $_POST);
require_admin_permission($conn, 'imports');

function normalize_import_header($value) {
    return strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '_', (string) $value), '_'));
}

function read_import_csv($file) {
    if (empty($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new Exception('Please upload a valid CSV file.');
    }

    $extension = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
    if ($extension !== 'csv') {
        throw new Exception('Only CSV files are supported for secure import.');
    }

    if (($file['size'] ?? 0) > 2 * 1024 * 1024) {
        throw new Exception('CSV file must be 2MB or smaller.');
    }

    $handle = fopen($file['tmp_name'], 'r');
    if (!$handle) {
        throw new Exception('Unable to read the uploaded CSV file.');
    }

    $headers = fgetcsv($handle);
    if (!$headers) {
        fclose($handle);
        throw new Exception('CSV file is empty.');
    }

    $headers = array_map('normalize_import_header', $headers);
    $rows = [];
    $lineNumber = 1;

    while (($values = fgetcsv($handle)) !== false) {
        $lineNumber++;
        if (count(array_filter($values, fn($value) => trim((string) $value) !== '')) === 0) {
            continue;
        }

        $row = ['_line' => $lineNumber];
        foreach ($headers as $index => $header) {
            if ($header === '') continue;
            $row[$header] = trim((string) ($values[$index] ?? ''));
        }
        $rows[] = $row;
    }

    fclose($handle);
    return $rows;
}

function parse_import_datetime($value, $status) {
    $value = trim((string) $value);
    if ($value === '') {
        return $status === 'Paid' ? date('Y-m-d H:i:s') : null;
    }

    $timestamp = strtotime($value);
    if ($timestamp === false) {
        throw new Exception('payment_date is invalid');
    }

    return date('Y-m-d H:i:s', $timestamp);
}

try {
    ensure_billings_branch_column($conn);

    $rows = read_import_csv($_FILES['file'] ?? null);
    if (empty($rows)) {
        throw new Exception('CSV file has no invoice rows.');
    }

    if (count($rows) > 1000) {
        throw new Exception('Import limit is 1000 invoice item rows per file.');
    }

    $allowedMethods = ['Cash', 'GCash', 'Maya', 'Credit Card', 'Bank Transfer'];
    $allowedStatuses = ['Paid', 'Unpaid', 'Overdue'];
    $errors = [];
    $groups = [];
    $patientByEmailStmt = $conn->prepare("
        SELECT p.patient_id
        FROM patients p
        JOIN users u ON p.user_id = u.user_id
        WHERE LOWER(u.email) = ? AND u.role = 'Patient'
        LIMIT 1
    ");
    $patientByIdStmt = $conn->prepare("SELECT patient_id FROM patients WHERE patient_id = ? LIMIT 1");

    foreach ($rows as $index => $row) {
        $lineErrors = [];
        $patientId = 0;
        $patientEmail = strtolower(trim($row['patient_email'] ?? ''));

        if (!empty($row['patient_id'])) {
            $patientByIdStmt->execute([(int) $row['patient_id']]);
            $patientId = (int) $patientByIdStmt->fetchColumn();
        } elseif ($patientEmail !== '') {
            $patientByEmailStmt->execute([$patientEmail]);
            $patientId = (int) $patientByEmailStmt->fetchColumn();
        }

        if ($patientId <= 0) {
            $lineErrors[] = 'patient_id or patient_email must match an existing patient';
        }

        $branch = normalize_billing_branch($row['branch'] ?? '');
        if (!$branch) {
            $lineErrors[] = 'branch is required';
        }

        $paymentMethod = trim($row['payment_method'] ?? 'Cash');
        if (!in_array($paymentMethod, $allowedMethods, true)) {
            $lineErrors[] = 'payment_method is invalid';
        }

        $paymentStatus = trim($row['payment_status'] ?? 'Paid');
        if (!in_array($paymentStatus, $allowedStatuses, true)) {
            $lineErrors[] = 'payment_status is invalid';
        }

        $referenceNumber = trim($row['reference_number'] ?? '');
        if ($paymentMethod === 'Cash') {
            $referenceNumber = null;
        } elseif ($paymentStatus === 'Paid' && $referenceNumber === '') {
            $lineErrors[] = 'reference_number is required for non-cash paid invoices';
        } elseif ($referenceNumber === '') {
            $referenceNumber = null;
        }

        $description = trim($row['item_description'] ?? $row['description'] ?? '');
        if ($description === '') {
            $lineErrors[] = 'item_description is required';
        }

        $quantity = filter_var($row['quantity'] ?? 1, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($quantity === false) {
            $lineErrors[] = 'quantity must be at least 1';
        }

        $unitPrice = filter_var($row['unit_price'] ?? null, FILTER_VALIDATE_FLOAT);
        if ($unitPrice === false || $unitPrice < 0) {
            $lineErrors[] = 'unit_price must be a valid amount';
        }

        $totalAmount = null;
        if (trim((string) ($row['total_amount'] ?? '')) !== '') {
            $totalAmount = filter_var($row['total_amount'], FILTER_VALIDATE_FLOAT);
            if ($totalAmount === false || $totalAmount < 0) {
                $lineErrors[] = 'total_amount must be a valid amount';
            }
        }

        $serviceId = null;
        if (trim((string) ($row['service_id'] ?? '')) !== '') {
            $serviceId = filter_var($row['service_id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($serviceId === false) {
                $lineErrors[] = 'service_id must be a valid number';
            }
        }

        $paymentDate = null;
        try {
            $paymentDate = parse_import_datetime($row['payment_date'] ?? '', $paymentStatus);
        } catch (Exception $dateError) {
            $lineErrors[] = $dateError->getMessage();
        }

        if (!empty($lineErrors)) {
            $errors[] = [
                'line' => $row['_line'],
                'patient' => $row['patient_email'] ?? $row['patient_id'] ?? '',
                'errors' => $lineErrors,
            ];
            continue;
        }

        $invoiceKey = trim($row['invoice_key'] ?? '');
        if ($invoiceKey === '') {
            $invoiceKey = 'line_' . $index;
        }

        if (!isset($groups[$invoiceKey])) {
            $groups[$invoiceKey] = [
                'patient_id' => $patientId,
                'branch' => $branch,
                'total_amount' => $totalAmount,
                'payment_method' => $paymentMethod,
                'reference_number' => $referenceNumber,
                'payment_status' => $paymentStatus,
                'payment_date' => $paymentDate,
                'items' => [],
                'lines' => [],
            ];
        } else {
            $group = $groups[$invoiceKey];
            if (
                $group['patient_id'] !== $patientId ||
                $group['branch'] !== $branch ||
                $group['payment_method'] !== $paymentMethod ||
                $group['payment_status'] !== $paymentStatus ||
                (string) $group['reference_number'] !== (string) $referenceNumber
            ) {
                $errors[] = [
                    'line' => $row['_line'],
                    'patient' => $row['patient_email'] ?? $row['patient_id'] ?? '',
                    'errors' => ['rows with the same invoice_key must use the same patient, branch, method, status, and reference number'],
                ];
                continue;
            }
        }

        $groups[$invoiceKey]['lines'][] = $row['_line'];
        if ($groups[$invoiceKey]['total_amount'] === null && $totalAmount !== null) {
            $groups[$invoiceKey]['total_amount'] = $totalAmount;
        }
        $groups[$invoiceKey]['items'][] = [
            'service_id' => $serviceId,
            'description' => $description,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_price' => $quantity * $unitPrice,
        ];
    }

    if (!empty($errors)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Import validation failed. No invoices were imported.',
            'errors' => $errors,
        ]);
        exit;
    }

    foreach ($groups as $key => $group) {
        if (empty($group['items'])) {
            $errors[] = ['line' => implode(', ', $group['lines']), 'patient' => '', 'errors' => ['invoice has no valid items']];
            continue;
        }

        if ($group['total_amount'] === null) {
            $groups[$key]['total_amount'] = array_reduce($group['items'], fn($sum, $item) => $sum + $item['total_price'], 0);
        }
    }

    if (!empty($errors)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Import validation failed. No invoices were imported.',
            'errors' => $errors,
        ]);
        exit;
    }

    $conn->beginTransaction();

    $billingStmt = $conn->prepare("
        INSERT INTO billings (patient_id, appointment_id, branch, total_amount, payment_method, reference_number, payment_status, payment_date)
        VALUES (?, NULL, ?, ?, ?, ?, ?, ?)
    ");
    $itemStmt = $conn->prepare("
        INSERT INTO billing_items (invoice_id, service_id, description, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    $importedInvoices = 0;
    $importedItems = 0;

    foreach ($groups as $group) {
        $billingStmt->execute([
            $group['patient_id'],
            $group['branch'],
            $group['total_amount'],
            $group['payment_method'],
            $group['reference_number'],
            $group['payment_status'],
            $group['payment_date'],
        ]);

        $invoiceId = (int) $conn->lastInsertId();
        $importedInvoices++;

        foreach ($group['items'] as $item) {
            $itemStmt->execute([
                $invoiceId,
                $item['service_id'],
                $item['description'],
                $item['quantity'],
                $item['unit_price'],
                $item['total_price'],
            ]);
            $importedItems++;
        }
    }

    $conn->commit();

    echo json_encode([
        'status' => 'success',
        'message' => "{$importedInvoices} invoice(s) and {$importedItems} item row(s) imported.",
        'imported_invoices' => $importedInvoices,
        'imported_items' => $importedItems,
    ]);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
