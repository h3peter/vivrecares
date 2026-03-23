<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'verification_helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);
$email = trim((string) ($data['email'] ?? ''));
$code = trim((string) ($data['code'] ?? ''));

if ($email === '' || $code === '') {
    echo json_encode(["status" => "error", "message" => "Email and verification code are required."]);
    exit;
}

try {
    $userStmt = $conn->prepare("SELECT user_id, email FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1");
    $userStmt->execute([$email]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['email'])) {
        echo json_encode(["status" => "error", "message" => "Invalid email or verification request."]);
        exit;
    }

    $purpose = 'forgot_password_' . $user['user_id'];
    $token = verify_email_code_and_issue_token($conn, $user['email'], $purpose, $code);

    echo json_encode([
        "status" => "success",
        "message" => "Email verified. You can now reset your password.",
        "verification_token" => $token
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
