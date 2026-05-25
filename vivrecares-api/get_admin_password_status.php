<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'admin_security.php';

init_api_auth();
$authUser = require_roles(['Admin']);

try {
    ensure_admin_password_schema($conn);
    $stmt = $conn->prepare("SELECT admin_password_hash FROM users WHERE user_id = ? AND role = 'Admin' AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([(int) $authUser['user_id']]);
    $hash = $stmt->fetchColumn();

    echo json_encode([
        "status" => "success",
        "is_set" => !empty($hash),
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
