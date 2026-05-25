<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'staff_invitation_helper.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
$token = trim((string) ($data['token'] ?? ''));
$password = (string) ($data['password'] ?? '');

if ($token === '' || $password === '') {
    echo json_encode(["status" => "error", "message" => "Invitation token and password are required."]);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode(["status" => "error", "message" => "Password must be at least 8 characters."]);
    exit;
}

try {
    ensure_staff_invitation_schema($conn);
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT *
        FROM staff_invitations
        WHERE token_hash = ?
        LIMIT 1
        FOR UPDATE
    ");
    $stmt->execute([hash_staff_invitation_token($token)]);
    $invite = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$invite || $invite['accepted_at'] || $invite['revoked_at'] || strtotime((string) $invite['expires_at']) < time()) {
        throw new Exception('This invitation is invalid or expired.');
    }

    $email = strtolower(trim((string) $invite['email']));
    $userStmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");
    $userStmt->execute([$email]);
    if ($userStmt->fetchColumn()) {
        throw new Exception('This email is already registered.');
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $insertUserStmt = $conn->prepare("
        INSERT INTO users (first_name, last_name, email, email_verified_at, password, role)
        VALUES (?, ?, ?, NOW(), ?, ?)
    ");
    $insertUserStmt->execute([
        $invite['first_name'],
        $invite['last_name'],
        $email,
        $passwordHash,
        $invite['role'],
    ]);

    $newUserId = (int) $conn->lastInsertId();
    $acceptStmt = $conn->prepare("
        UPDATE staff_invitations
        SET accepted_user_id = ?, accepted_at = NOW()
        WHERE invitation_id = ?
    ");
    $acceptStmt->execute([$newUserId, (int) $invite['invitation_id']]);

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Invitation accepted. You can now log in."]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
