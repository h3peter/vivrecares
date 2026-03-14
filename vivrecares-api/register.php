<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "No data provided."]);
    exit;
}

try {
    $conn->beginTransaction(); // Use transactions to ensure data integrity

    // 1. Check if email already exists
    $check = $conn->prepare("SELECT user_id FROM users WHERE email = ? AND deleted_at IS NULL");
    $check->execute([$data['email']]);
    if ($check->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "Email already registered."]);
        $conn->rollBack();
        exit;
    }

    // 2. Insert into 'users' table (Identity & Credentials)
    $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
    $stmt1 = $conn->prepare("INSERT INTO users (first_name, last_name, middle_name, extension_name, nickname, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?, 'Patient')");
    
    $stmt1->execute([
        $data['firstName'],
        $data['lastName'],
        $data['middleName'] ?? null,
        $data['extensionName'] ?? null,
        $data['nickname'] ?? null,
        $data['email'],
        $hashedPassword
    ]);
    
    // Capture the generated user_id for the next step
    $newUserId = $conn->lastInsertId();

    // 3. Insert into 'patients' table (Medical Data)
    $sql2 = "INSERT INTO patients (
        user_id, age, sex, address, phone, 
        tooth_extraction, surgical_procedures, aesthetic_procedures, pregnant, 
        untoward_reactions, illnesses, other_illness, medications, current_treatments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt2 = $conn->prepare($sql2);
    
    // Format illnesses array into a string for storage
    $illnessString = isset($data['illnesses']) ? implode(", ", $data['illnesses']) : "";

    $stmt2->execute([
        $newUserId, 
        (int)$data['age'], 
        $data['sex'],
        $data['address'], 
        $data['phone'], 
        $data['toothExtraction'] ? 1 : 0,
        $data['surgicalProcedures'], 
        $data['aestheticProcedures'], 
        $data['pregnant'],
        $data['untowardReactions'], 
        $illnessString, 
        $data['otherIllness'],
        $data['medications'], 
        $data['currentTreatments']
    ]);

    $conn->commit(); // Save changes to both tables
    echo json_encode(["status" => "success", "message" => "Welcome to Vivre! Account created."]);

} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack(); // Undo everything if an error occurs
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>