<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'Encryption.php';
require_once 'verification_helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['email']) || !isset($data['first_name']) || !isset($data['password']) || !isset($data['verification_token'])) {
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
    exit;
}

try {
    ensure_email_verification_schema($conn);
    $conn->beginTransaction();

    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? AND deleted_at IS NULL");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Email is already registered."]);
        $conn->rollBack();
        exit;
    }

    consume_verified_email_token($conn, $data['email'], verification_purpose_patient_registration(), $data['verification_token']);

    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

    $sqlUser = "INSERT INTO users (first_name, middle_name, last_name, extension_name, nickname, email, email_verified_at, password, role) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 'Patient')";
    $stmtUser = $conn->prepare($sqlUser);
    $stmtUser->execute([
        $data['first_name'],
        isset($data['middle_name']) ? $data['middle_name'] : null,
        $data['last_name'],
        isset($data['extension_name']) ? $data['extension_name'] : null,
        isset($data['nickname']) ? $data['nickname'] : null,
        $data['email'],
        $hashedPassword
    ]);

    $newUserId = $conn->lastInsertId();
    mark_user_email_verified($conn, $newUserId);

    $sqlPatient = "INSERT INTO patients (
        user_id, age, sex, address, phone,
        surgical_procedures, aesthetic_procedures,
        tooth_extraction, allergies, pregnant, untoward_reactions,
        heart_disease, hypertension, diabetes, hyperthyroidism, autoimmune_disease,
        cancer, renal_failure, liver_disease, bronchial_asthma, pulmonary_disease,
        infectious_disease, others, medications, current_skin_treatment
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmtPatient = $conn->prepare($sqlPatient);

    $stmtPatient->execute([
        $newUserId,
        $data['age'],
        $data['sex'],
        $data['address'],
        $data['phone'],
        Encryption::encrypt(isset($data['surgical_procedures']) ? $data['surgical_procedures'] : ''),
        Encryption::encrypt(isset($data['aesthetic_procedures']) ? $data['aesthetic_procedures'] : ''),
        isset($data['tooth_extraction']) && $data['tooth_extraction'] ? 1 : 0,
        Encryption::encrypt(isset($data['allergies']) ? $data['allergies'] : ''),
        isset($data['pregnant']) ? $data['pregnant'] : 'No',
        Encryption::encrypt(isset($data['untoward_reactions']) ? $data['untoward_reactions'] : ''),
        isset($data['heart_disease']) && $data['heart_disease'] ? 1 : 0,
        isset($data['hypertension']) && $data['hypertension'] ? 1 : 0,
        isset($data['diabetes']) && $data['diabetes'] ? 1 : 0,
        isset($data['hyperthyroidism']) && $data['hyperthyroidism'] ? 1 : 0,
        isset($data['autoimmune_disease']) && $data['autoimmune_disease'] ? 1 : 0,
        isset($data['cancer']) && $data['cancer'] ? 1 : 0,
        isset($data['renal_failure']) && $data['renal_failure'] ? 1 : 0,
        isset($data['liver_disease']) && $data['liver_disease'] ? 1 : 0,
        isset($data['bronchial_asthma']) && $data['bronchial_asthma'] ? 1 : 0,
        isset($data['pulmonary_disease']) && $data['pulmonary_disease'] ? 1 : 0,
        isset($data['infectious_disease']) && $data['infectious_disease'] ? 1 : 0,
        Encryption::encrypt(isset($data['others']) ? $data['others'] : ''),
        Encryption::encrypt(isset($data['medications']) ? $data['medications'] : ''),
        Encryption::encrypt(isset($data['current_skin_treatment']) ? $data['current_skin_treatment'] : '')
    ]);

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Account created successfully."]);

} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    $errorCode = $e->errorInfo[1] ?? null;
    if ((string) $e->getCode() === '23000' || (int) $errorCode === 1062) {
        echo json_encode(["status" => "error", "message" => "Email is already registered."]);
        exit;
    }

    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
