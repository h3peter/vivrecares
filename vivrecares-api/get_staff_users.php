<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'staff_invitation_helper.php';

init_api_auth();
require_roles(['Admin']);

try {
    ensure_staff_invitation_schema($conn);

    $stmt = $conn->query("SELECT user_id, first_name, last_name, email, role, created_at, deleted_at
                          FROM users
                          WHERE role IN ('Admin', 'Doctor')
                          ORDER BY deleted_at IS NOT NULL ASC, first_name ASC, last_name ASC");

    $inviteStmt = $conn->query("SELECT invitation_id, first_name, last_name, email, role, expires_at, created_at
                                FROM staff_invitations
                                WHERE accepted_at IS NULL
                                  AND revoked_at IS NULL
                                  AND expires_at >= NOW()
                                ORDER BY created_at DESC");

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode([
        "status" => "success",
        "data" => $rows,
        "pending_invites" => $inviteStmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
