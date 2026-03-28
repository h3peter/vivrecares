<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'Encryption.php';
require_once 'verification_helper.php';

init_api_auth();
require_roles(['Admin']);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['email']) || !isset($data['first_name'])) {
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
    exit;
}

try {
    $conn->beginTransaction();

    // 1. Check for duplicate email
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Email is already registered."]);
        $conn->rollBack();
        exit;
    }

    // 2. Insert into users table
    $passwordToHash = !empty($data['password']) ? $data['password'] : 'Vivre2026!';
    $hashedPassword = password_hash($passwordToHash, PASSWORD_DEFAULT);

    $stmtUser = $conn->prepare("
        INSERT INTO users (first_name, middle_name, last_name, extension_name, nickname, email, email_verified_at, password, role)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 'Patient')
    ");
    $stmtUser->execute([
        $data['first_name'],
        $data['middle_name']    ?? null,
        $data['last_name'],
        $data['extension_name'] ?? null,
        $data['nickname']       ?? null,
        $data['email'],
        $hashedPassword
    ]);

    $newUserId = $conn->lastInsertId();
    mark_user_email_verified($conn, $newUserId);

    // 3. Insert into patients table
    //    Sensitive text fields encrypted via Encryption::encrypt() — AES-256-CBC
    $stmtPatient = $conn->prepare("
        INSERT INTO patients (
            user_id, age, sex, address, phone,
            surgical_procedures, aesthetic_procedures,
            tooth_extraction, allergies, pregnant, untoward_reactions,
            heart_disease, hypertension, diabetes, hyperthyroidism, autoimmune_disease,
            cancer, renal_failure, liver_disease, bronchial_asthma, pulmonary_disease,
            infectious_disease, others, medications, current_skin_treatment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmtPatient->execute([
        $newUserId,
        $data['age'],
        $data['sex'],
        $data['address'],
        $data['phone'],

        // ✅ Encrypted at rest
        Encryption::encrypt($data['surgical_procedures']    ?? ''),
        Encryption::encrypt($data['aesthetic_procedures']   ?? ''),
        !empty($data['tooth_extraction']) ? 1 : 0,
        Encryption::encrypt($data['allergies']              ?? ''),
        $data['pregnant']                                   ?? 'No',
        Encryption::encrypt($data['untoward_reactions']     ?? ''),

        // Boolean illness flags — 0/1, no encryption needed
        !empty($data['heart_disease'])        ? 1 : 0,
        !empty($data['hypertension'])         ? 1 : 0,
        !empty($data['diabetes'])             ? 1 : 0,
        !empty($data['hyperthyroidism'])      ? 1 : 0,
        !empty($data['autoimmune_disease'])   ? 1 : 0,
        !empty($data['cancer'])               ? 1 : 0,
        !empty($data['renal_failure'])        ? 1 : 0,
        !empty($data['liver_disease'])        ? 1 : 0,
        !empty($data['bronchial_asthma'])     ? 1 : 0,
        !empty($data['pulmonary_disease'])    ? 1 : 0,
        !empty($data['infectious_disease'])   ? 1 : 0,

        // ✅ Encrypted at rest (cont.)
        Encryption::encrypt($data['others']                 ?? ''),
        Encryption::encrypt($data['medications']            ?? ''),
        Encryption::encrypt($data['current_skin_treatment'] ?? ''),
    ]);

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Account created successfully."]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
