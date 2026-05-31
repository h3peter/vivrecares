<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'staff_invitation_helper.php';
require_once 'admin_permissions.php';

init_api_auth();
require_roles(['Admin']);
require_admin_permission($conn, 'settings');

try {
    ensure_staff_invitation_schema($conn);

    ensure_admin_permissions_schema($conn);

    $stmt = $conn->query("SELECT user_id, first_name, last_name, email, role, is_super_admin, admin_permissions, created_at, deleted_at
                          FROM users
                          WHERE role IN ('Admin', 'Doctor')
                          ORDER BY deleted_at IS NOT NULL ASC, first_name ASC, last_name ASC");

    $inviteStmt = $conn->query("SELECT invitation_id, first_name, last_name, email, role, expires_at, created_at
                                FROM staff_invitations
                                WHERE accepted_at IS NULL
                                  AND revoked_at IS NULL
                                  AND expires_at >= NOW()
                                ORDER BY created_at DESC");

    $rows = array_map(function ($row) {
        $isSuperAdmin = !empty($row['is_super_admin']);
        $row['is_super_admin'] = $isSuperAdmin ? 1 : 0;
        $row['admin_permissions'] = normalize_admin_permissions($row['admin_permissions'] ?? null, $isSuperAdmin);
        return $row;
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    echo json_encode([
        "status" => "success",
        "data" => $rows,
        "pending_invites" => $inviteStmt->fetchAll(PDO::FETCH_ASSOC),
        "permission_definitions" => admin_permission_definitions(),
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
