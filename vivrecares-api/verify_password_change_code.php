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
$code = trim((string) ($data['code'] ?? ''));

if ($userId <= 0 || $code === '') {
    echo json_encode(["status" => "error", "message" => "User ID and verification code are required."]);
    exit;
}

try {
    $userStmt = $conn->prepare("SELECT email FROM users WHERE user_id = ? AND deleted_at IS NULL LIMIT 1");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['email'])) {
        echo json_encode(["status" => "error", "message" => "Account email could not be found."]);
        exit;
    }

    $purpose = 'password_change_' . $userId;
    $token = verify_email_code_and_issue_token($conn, $user['email'], $purpose, $code);

    echo json_encode([
        "status" => "success",
        "message" => "Email verified. You can now update your password.",
        "verification_token" => $token
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
