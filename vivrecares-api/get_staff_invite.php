<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'staff_invitation_helper.php';

init_api_auth();

$token = trim((string) ($_GET['token'] ?? ''));
if ($token === '') {
    echo json_encode(["status" => "error", "message" => "Invitation token is required."]);
    exit;
}

try {
    ensure_staff_invitation_schema($conn);

    $stmt = $conn->prepare("
        SELECT invitation_id, first_name, last_name, email, role, expires_at, accepted_at, revoked_at
        FROM staff_invitations
        WHERE token_hash = ?
        LIMIT 1
    ");
    $stmt->execute([hash_staff_invitation_token($token)]);
    $invite = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$invite || $invite['accepted_at'] || $invite['revoked_at'] || strtotime((string) $invite['expires_at']) < time()) {
        echo json_encode(["status" => "error", "message" => "This invitation is invalid or expired."]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "invite" => [
            "first_name" => $invite['first_name'],
            "last_name" => $invite['last_name'],
            "email" => $invite['email'],
            "role" => $invite['role'],
            "expires_at" => $invite['expires_at'],
        ],
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
