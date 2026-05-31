<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'admin_security.php';
require_once 'admin_permissions.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
require_admin_password($conn, is_array($data) ? $data : []);
require_admin_permission($conn, 'settings');

$userId = isset($data['user_id']) ? (int) $data['user_id'] : 0;
$nextActive = !empty($data['is_active']) ? 1 : 0;

if ($userId <= 0) {
    echo json_encode(["status" => "error", "message" => "Invalid staff user id."]);
    exit;
}

try {
    $checkStmt = $conn->prepare("SELECT role FROM users WHERE user_id = ? LIMIT 1");
    $checkStmt->execute([$userId]);
    $role = $checkStmt->fetchColumn();
    if (!$role || !in_array($role, ['Admin', 'Doctor'], true)) {
        throw new Exception('Only Admin and Doctor accounts can be updated here.');
    }

    if ($nextActive === 1) {
        $stmt = $conn->prepare("UPDATE users SET deleted_at = NULL WHERE user_id = ?");
        $stmt->execute([$userId]);
        $message = "Staff account reactivated.";
    } else {
        $stmt = $conn->prepare("UPDATE users SET deleted_at = NOW() WHERE user_id = ?");
        $stmt->execute([$userId]);
        $message = "Staff account archived.";
    }

    echo json_encode(["status" => "success", "message" => $message]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
