<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'admin_security.php';
require_once 'admin_permissions.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
$authUser = require_admin_password($conn, is_array($data) ? $data : []);
$actorAccess = get_admin_access_for_user($conn, $authUser['user_id'] ?? 0);

if (!$actorAccess['is_super_admin']) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Only the super admin can assign admin tasks."]);
    exit;
}

$targetUserId = isset($data['user_id']) ? (int) $data['user_id'] : 0;
$permissions = normalize_admin_permissions($data['permissions'] ?? [], false);
$makeSuperAdmin = !empty($data['is_super_admin']) ? 1 : 0;

if ($targetUserId <= 0) {
    echo json_encode(["status" => "error", "message" => "Invalid admin user."]);
    exit;
}

try {
    ensure_admin_permissions_schema($conn);

    $stmt = $conn->prepare("SELECT role FROM users WHERE user_id = ? AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([$targetUserId]);
    if ($stmt->fetchColumn() !== 'Admin') {
        throw new Exception('Permissions can only be assigned to Admin accounts.');
    }

    $conn->beginTransaction();

    if ($makeSuperAdmin === 1) {
        $conn->exec("UPDATE users SET is_super_admin = 0 WHERE role = 'Admin'");
    }

    $updateStmt = $conn->prepare("UPDATE users SET is_super_admin = ?, admin_permissions = ? WHERE user_id = ? AND role = 'Admin'");
    $updateStmt->execute([
        $makeSuperAdmin,
        json_encode($permissions),
        $targetUserId,
    ]);

    $superCount = (int) $conn->query("SELECT COUNT(*) FROM users WHERE role = 'Admin' AND is_super_admin = 1 AND deleted_at IS NULL")->fetchColumn();
    if ($superCount === 0) {
        throw new Exception('At least one active super admin is required.');
    }

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Admin task access updated."]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
