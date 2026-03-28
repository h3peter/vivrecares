<?php
require_once 'auth.php';
require_once 'config.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

require_same_user_or_roles($data['user_id'], ['Admin']);

try {
    // We strictly update the users table for the Admin
    $stmt = $conn->prepare("UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ? AND role = 'Admin'");
    $stmt->execute([$data['first_name'], $data['last_name'], $data['email'], $data['user_id']]);

    echo json_encode(["status" => "success", "message" => "Admin profile updated!"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
