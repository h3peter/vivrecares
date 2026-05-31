<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'admin_permissions.php';

init_api_auth();

$authUser = require_auth();

if (!$authUser || empty($authUser['user_id'])) {
    http_response_code(401);
    echo json_encode([
        "status" => "error",
        "message" => "No active session."
    ]);
    exit;
}

ensure_admin_permissions_schema($conn);

$stmt = $conn->prepare("
    SELECT u.user_id, u.role, u.first_name, u.last_name, u.nickname, u.profile_photo, u.is_super_admin, u.admin_permissions, p.patient_id
    FROM users u
    LEFT JOIN patients p ON u.user_id = p.user_id
    WHERE u.user_id = ? AND u.deleted_at IS NULL
    LIMIT 1
");
$stmt->execute([(int) $authUser['user_id']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    clear_authenticated_user();
    http_response_code(401);
    echo json_encode([
        "status" => "error",
        "message" => "Account not found."
    ]);
    exit;
}

$adminAccess = $user['role'] === 'Admin' ? get_admin_access_for_user($conn, $user['user_id']) : null;

echo json_encode([
    "status" => "success",
    "user" => [
        "id" => (int) $user['user_id'],
        "patient_id" => isset($user['patient_id']) ? (int) $user['patient_id'] : null,
        "role" => $user['role'],
        "name" => !empty($user['nickname']) ? $user['nickname'] : $user['first_name'],
        "photo" => $user['profile_photo'],
        "first_name" => $user['first_name'],
        "last_name" => $user['last_name'],
        "profile_photo" => $user['profile_photo'],
        "is_super_admin" => $adminAccess ? $adminAccess['is_super_admin'] : false,
        "admin_permissions" => $adminAccess ? $adminAccess['permissions'] : [],
    ]
]);
?>
