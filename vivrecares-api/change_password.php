<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'verification_helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);
$userId = (int) ($data['user_id'] ?? 0);
$verificationToken = trim((string) ($data['verification_token'] ?? ''));
$newPassword = (string) ($data['new_password'] ?? '');

if ($userId <= 0 || $verificationToken === '' || $newPassword === '') {
    echo json_encode(["status" => "error", "message" => "Incomplete password change request."]);
    exit;
}

if (strlen($newPassword) < 8) {
    echo json_encode(["status" => "error", "message" => "Password must be at least 8 characters long."]);
    exit;
}

try {
    ensure_email_verification_schema($conn);
    $conn->beginTransaction();

    $userStmt = $conn->prepare("SELECT email FROM users WHERE user_id = ? AND deleted_at IS NULL LIMIT 1");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['email'])) {
        echo json_encode(["status" => "error", "message" => "Account email could not be found."]);
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        exit;
    }

    $purpose = 'password_change_' . $userId;
    consume_verified_email_token($conn, $user['email'], $purpose, $verificationToken);

    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE user_id = ?");
    $updateStmt->execute([$passwordHash, $userId]);

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Password updated successfully."]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
