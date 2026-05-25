<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'billing_branch.php';

init_api_auth();
require_roles(['Admin']);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['patient_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing patient data."]);
    exit;
}

try {
    ensure_billings_branch_column($conn);

    $paymentMethod = $data['payment_method'] ?? 'Cash';
    $paymentStatus = $data['payment_status'] ?? 'Paid';
    $referenceNumber = trim($data['reference_number'] ?? '');
    $branch = validate_billing_branch($conn, $data['branch'] ?? null);
    $allowedMethods = ['Cash', 'GCash', 'Maya', 'Credit Card', 'Bank Transfer'];
    $allowedStatuses = ['Paid', 'Unpaid', 'Overdue'];

    if (!in_array($paymentMethod, $allowedMethods, true)) {
        throw new Exception('Invalid payment method.');
    }

    if (!in_array($paymentStatus, $allowedStatuses, true)) {
        throw new Exception('Invalid payment status.');
    }

    if ($paymentMethod === 'Cash') {
        $referenceNumber = null;
    } elseif ($paymentStatus === 'Paid' && $referenceNumber === '') {
        throw new Exception('Reference number is required for non-cash paid invoices.');
    } elseif ($referenceNumber === '') {
        $referenceNumber = null;
    }

    $paymentDate = $paymentStatus === 'Paid' ? date('Y-m-d H:i:s') : null;

    $conn->beginTransaction();

    $sqlBilling = "INSERT INTO billings (patient_id, appointment_id, branch, total_amount, payment_method, reference_number, payment_status, payment_date)
                   VALUES (?, NULL, ?, ?, ?, ?, ?, ?)";

    $stmtBilling = $conn->prepare($sqlBilling);
    $stmtBilling->execute([
        $data['patient_id'],
        $branch,
        $data['total_amount'],
        $paymentMethod,
        $referenceNumber,
        $paymentStatus,
        $paymentDate
    ]);
    $newInvoiceId = $conn->lastInsertId();

    $sqlItem = "INSERT INTO billing_items (invoice_id, service_id, description, quantity, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?, ?)";
    $stmtItem = $conn->prepare($sqlItem);

    foreach ($data['items'] as $item) {
        $serviceId = !empty($item['service_id']) ? (int) $item['service_id'] : null;
        $stmtItem->execute([
            $newInvoiceId,
            $serviceId,
            $item['description'],
            $item['quantity'],
            $item['unit_price'],
            ($item['quantity'] * $item['unit_price'])
        ]);
    }

    $conn->commit();
    echo json_encode(["status" => "success", "invoice_id" => $newInvoiceId]);
} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
