<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

try {
    $conn->beginTransaction();

    // 1. Update basic user info
    $stmt1 = $conn->prepare("UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ?");
    $stmt1->execute([$data['first_name'], $data['last_name'], $data['email'], $data['user_id']]);

    // 2. Update patient-specific contact info
    $stmt2 = $conn->prepare("UPDATE patients SET phone = ? WHERE user_id = ?");
    $stmt2->execute([$data['phone'], $data['user_id']]);

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Profile updated!"]);
} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>