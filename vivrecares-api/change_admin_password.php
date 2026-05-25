<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'verification_helper.php';
require_once 'admin_security.php';

init_api_auth();
$authUser = require_roles(['Admin']);
$data = json_decode(file_get_contents("php://input"), true);

$verificationToken = trim((string) ($data['verification_token'] ?? ''));
$newPassword = (string) ($data['new_password'] ?? '');

if ($verificationToken === '' || $newPassword === '') {
    echo json_encode(["status" => "error", "message" => "Incomplete admin password request."]);
    exit;
}

if (strlen($newPassword) < 8) {
    echo json_encode(["status" => "error", "message" => "Admin password must be at least 8 characters long."]);
    exit;
}

try {
    ensure_admin_password_schema($conn);
    ensure_email_verification_schema($conn);
    $conn->beginTransaction();

    $stmt = $conn->prepare("SELECT user_id, email FROM users WHERE user_id = ? AND role = 'Admin' AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([(int) $authUser['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['email'])) {
        throw new Exception('Admin account email could not be found.');
    }

    $purpose = 'admin_password_' . (int) $user['user_id'];
    consume_verified_email_token($conn, $user['email'], $purpose, $verificationToken);

    $updateStmt = $conn->prepare("UPDATE users SET admin_password_hash = ? WHERE user_id = ?");
    $updateStmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), (int) $user['user_id']]);

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Admin password updated successfully."]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
