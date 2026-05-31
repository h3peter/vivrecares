<?php
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auth.php';
require_once 'admin_permissions.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["status" => "error", "message" => "Missing credentials."]);
    exit;
}

try {
    // 1. We added u.last_name to the SELECT list here:
    ensure_admin_permissions_schema($conn);

    $sql = "SELECT u.user_id, u.password, u.role, u.first_name, u.last_name, u.nickname, u.profile_photo, u.is_super_admin, u.admin_permissions, p.patient_id 
            FROM users u 
            LEFT JOIN patients p ON u.user_id = p.user_id 
            WHERE u.email = ? AND u.deleted_at IS NULL LIMIT 1";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify password against the hash
    if ($user && password_verify($data['password'], $user['password'])) {
        set_authenticated_user($user);
        $token = create_auth_token($user);
        
        $displayName = !empty($user['nickname']) ? $user['nickname'] : $user['first_name'];

        $adminAccess = $user['role'] === 'Admin' ? get_admin_access_for_user($conn, $user['user_id']) : null;

        echo json_encode([
            "status" => "success",
            "token" => $token,
            "user" => [
                "id" => $user['user_id'],
                "patient_id" => $user['patient_id'],
                "role" => $user['role'],
                
                // We keep the old labels so we don't break your existing greetings...
                "name" => $displayName,
                "photo" => $user['profile_photo'],
                
                // ...and we ADD the exact labels your ProfileAvatar component is looking for!
                "first_name" => $user['first_name'],
                "last_name" => $user['last_name'],
                "profile_photo" => $user['profile_photo'],
                "is_super_admin" => $adminAccess ? $adminAccess['is_super_admin'] : false,
                "admin_permissions" => $adminAccess ? $adminAccess['permissions'] : []
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>
