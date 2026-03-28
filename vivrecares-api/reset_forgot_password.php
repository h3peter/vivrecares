<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'verification_helper.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
$email = trim((string) ($data['email'] ?? ''));
$verificationToken = trim((string) ($data['verification_token'] ?? ''));
$newPassword = (string) ($data['new_password'] ?? '');

if ($email === '' || $verificationToken === '' || $newPassword === '') {
    echo json_encode(["status" => "error", "message" => "Incomplete password reset request."]);
    exit;
}

if (strlen($newPassword) < 8) {
    echo json_encode(["status" => "error", "message" => "Password must be at least 8 characters long."]);
    exit;
}

try {
    ensure_email_verification_schema($conn);
    $conn->beginTransaction();

    $userStmt = $conn->prepare("SELECT user_id, email FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1");
    $userStmt->execute([$email]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['email'])) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        echo json_encode(["status" => "error", "message" => "Account email could not be found."]);
        exit;
    }

    $purpose = 'forgot_password_' . $user['user_id'];
    consume_verified_email_token($conn, $user['email'], $purpose, $verificationToken);

    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE user_id = ?");
    $updateStmt->execute([$passwordHash, $user['user_id']]);

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Password reset successfully. You can now log in."]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
