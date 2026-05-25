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
} catch (PDOException $e) {
    $errorCode = $e->errorInfo[1] ?? null;
    if ((string) $e->getCode() === '23000' || (int) $errorCode === 1062) {
        echo json_encode(["status" => "error", "message" => "That email address is already used by another account."]);
        exit;
    }

    echo json_encode(["status" => "error", "message" => "Unable to update your profile right now."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
