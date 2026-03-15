<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

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
    $passwordToHash = isset($data['password']) && !empty($data['password']) ? $data['password'] : 'Vivre2026!';
    $hashedPassword = password_hash($passwordToHash, PASSWORD_DEFAULT);
    
    $sqlUser = "INSERT INTO users (first_name, middle_name, last_name, extension_name, nickname, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, 'Patient')";
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

    // 3. Insert into patients table with ALL new medical fields
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
        isset($data['surgical_procedures']) ? $data['surgical_procedures'] : '',
        isset($data['aesthetic_procedures']) ? $data['aesthetic_procedures'] : '',
        isset($data['tooth_extraction']) && $data['tooth_extraction'] ? 1 : 0,
        isset($data['allergies']) ? $data['allergies'] : '',
        isset($data['pregnant']) ? $data['pregnant'] : 'No',
        isset($data['untoward_reactions']) ? $data['untoward_reactions'] : '',
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
        isset($data['others']) ? $data['others'] : '',
        isset($data['medications']) ? $data['medications'] : '',
        isset($data['current_skin_treatment']) ? $data['current_skin_treatment'] : ''
    ]);

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Account created successfully."]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>