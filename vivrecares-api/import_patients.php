<?php
header("Content-Type: application/json");

require_once 'auth.php';
require_once 'config.php';
require_once 'Encryption.php';
require_once 'verification_helper.php';
require_once 'admin_security.php';
require_once 'admin_permissions.php';

init_api_auth();
require_admin_password($conn, $_POST);
require_admin_permission($conn, 'imports');

function normalize_import_header($value) {
    return strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '_', (string) $value), '_'));
}

function parse_import_bool($value) {
    $normalized = strtolower(trim((string) $value));
    return in_array($normalized, ['1', 'yes', 'y', 'true', 'checked'], true) ? 1 : 0;
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

try {
    ensure_email_verification_schema($conn);

    $rows = read_import_csv($_FILES['file'] ?? null);

    if (empty($rows)) {
        throw new Exception('CSV file has no patient rows.');
    }

    if (count($rows) > 500) {
        throw new Exception('Import limit is 500 patients per file.');
    }

    $requiredFields = ['first_name', 'last_name', 'email', 'age', 'sex', 'address', 'phone'];
    $errors = [];
    $seenEmails = [];
    $validRows = [];

    $emailCheckStmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");

    foreach ($rows as $row) {
        $lineErrors = [];

        foreach ($requiredFields as $field) {
            if (($row[$field] ?? '') === '') {
                $lineErrors[] = "{$field} is required";
            }
        }

        $email = strtolower(trim($row['email'] ?? ''));
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $lineErrors[] = 'email is invalid';
        }

        if ($email !== '') {
            if (isset($seenEmails[$email])) {
                $lineErrors[] = 'email is duplicated in the CSV';
            } else {
                $seenEmails[$email] = true;
            }

            $emailCheckStmt->execute([$email]);
            if ($emailCheckStmt->fetchColumn()) {
                $lineErrors[] = 'email already exists';
            }
        }

        $age = filter_var($row['age'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 130]]);
        if ($age === false) {
            $lineErrors[] = 'age must be a valid number';
        }

        $sex = ucfirst(strtolower(trim($row['sex'] ?? '')));
        if (!in_array($sex, ['Male', 'Female'], true)) {
            $lineErrors[] = 'sex must be Male or Female';
        }

        $pregnant = ucfirst(strtolower(trim($row['pregnant'] ?? 'No')));
        if (!in_array($pregnant, ['Yes', 'No'], true)) {
            $lineErrors[] = 'pregnant must be Yes or No';
        }

        if (!empty($lineErrors)) {
            $errors[] = [
                'line' => $row['_line'],
                'email' => $row['email'] ?? '',
                'errors' => $lineErrors,
            ];
            continue;
        }

        $row['email'] = $email;
        $row['age'] = $age;
        $row['sex'] = $sex;
        $row['pregnant'] = $pregnant;
        $validRows[] = $row;
    }

    if (!empty($errors)) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Import validation failed. No records were imported.',
            'errors' => $errors,
        ]);
        exit;
    }

    $conn->beginTransaction();

    $userStmt = $conn->prepare("
        INSERT INTO users (first_name, middle_name, last_name, extension_name, nickname, email, email_verified_at, password, role)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 'Patient')
    ");

    $patientStmt = $conn->prepare("
        INSERT INTO patients (
            user_id, age, sex, address, phone,
            surgical_procedures, aesthetic_procedures,
            tooth_extraction, allergies, pregnant, untoward_reactions,
            heart_disease, hypertension, diabetes, hyperthyroidism, autoimmune_disease,
            cancer, renal_failure, liver_disease, bronchial_asthma, pulmonary_disease,
            infectious_disease, others, medications, current_skin_treatment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    foreach ($validRows as $row) {
        $temporaryPassword = bin2hex(random_bytes(16));
        $userStmt->execute([
            $row['first_name'],
            $row['middle_name'] ?? null,
            $row['last_name'],
            $row['extension_name'] ?? null,
            $row['nickname'] ?? null,
            $row['email'],
            password_hash($temporaryPassword, PASSWORD_DEFAULT),
        ]);

        $newUserId = (int) $conn->lastInsertId();
        mark_user_email_verified($conn, $newUserId);

        $patientStmt->execute([
            $newUserId,
            $row['age'],
            $row['sex'],
            $row['address'],
            $row['phone'],
            Encryption::encrypt($row['surgical_procedures'] ?? ''),
            Encryption::encrypt($row['aesthetic_procedures'] ?? ''),
            parse_import_bool($row['tooth_extraction'] ?? ''),
            Encryption::encrypt($row['allergies'] ?? ''),
            $row['pregnant'],
            Encryption::encrypt($row['untoward_reactions'] ?? ''),
            parse_import_bool($row['heart_disease'] ?? ''),
            parse_import_bool($row['hypertension'] ?? ''),
            parse_import_bool($row['diabetes'] ?? ''),
            parse_import_bool($row['hyperthyroidism'] ?? ''),
            parse_import_bool($row['autoimmune_disease'] ?? ''),
            parse_import_bool($row['cancer'] ?? ''),
            parse_import_bool($row['renal_failure'] ?? ''),
            parse_import_bool($row['liver_disease'] ?? ''),
            parse_import_bool($row['bronchial_asthma'] ?? ''),
            parse_import_bool($row['pulmonary_disease'] ?? ''),
            parse_import_bool($row['infectious_disease'] ?? ''),
            Encryption::encrypt($row['others'] ?? ''),
            Encryption::encrypt($row['medications'] ?? ''),
            Encryption::encrypt($row['current_skin_treatment'] ?? ''),
        ]);
    }

    $conn->commit();

    echo json_encode([
        'status' => 'success',
        'message' => count($validRows) . ' patient record(s) imported securely.',
        'imported' => count($validRows),
    ]);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }

    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
