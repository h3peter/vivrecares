<?php
require 'cors.php'; 
require 'config.php';
require 'Encryption.php';

header('Content-Type: application/json');

$json = file_get_contents("php://input");
$data = json_decode($json);

// 1. Diagnostic Checks
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Wrong method: " . $_SERVER['REQUEST_METHOD']]);
    exit();
}

if ($data === null) {
    echo json_encode(["status" => "error", "message" => "Data is empty or not valid JSON."]);
    exit();
}

if (empty($data->email) || empty($data->password)) {
    echo json_encode(["status" => "error", "message" => "Email or password field is missing from the payload."]);
    exit();
}

// 2. Database Insertion Logic
try {
    $conn->beginTransaction();

    $hashed_password = password_hash($data->password, PASSWORD_BCRYPT);
    $role = 'Patient'; 

    $stmt = $conn->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");
    $stmt->execute([$data->email, $hashed_password, $role]);
    $user_id = $conn->lastInsertId();

    $stmt = $conn->prepare("INSERT INTO patients (user_id, first_name, last_name, birth_date, address, contact_no) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $user_id, 
        $data->first_name, 
        $data->last_name, 
        $data->birth_date, 
        $data->address, 
        $data->contact_no
    ]);
    $patient_id = $conn->lastInsertId();

    $enc_allergies = Encryption::encrypt($data->allergies ?? 'None');
    $enc_surgeries = Encryption::encrypt($data->previous_surgeries ?? 'None');
    $enc_aesthetic = Encryption::encrypt($data->aesthetic_procedures ?? 'None');
    $pregnancy_status = $data->pregnancy_status ?? 'N/A';

    $stmt = $conn->prepare("INSERT INTO medical_histories (patient_id, allergies, previous_surgeries, aesthetic_procedures, pregnancy_status) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $patient_id, 
        $enc_allergies, 
        $enc_surgeries, 
        $enc_aesthetic, 
        $pregnancy_status
    ]);

    $conn->commit();

    echo json_encode([
        "status" => "success", 
        "message" => "Patient account created."
    ]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode([
        "status" => "error", 
        "message" => "Database failure: " . $e->getMessage()
    ]);
}
?>