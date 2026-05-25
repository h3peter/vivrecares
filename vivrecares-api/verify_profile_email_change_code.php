<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'verification_helper.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
$userId = (int) ($data['user_id'] ?? 0);
$email = strtolower(trim((string) ($data['email'] ?? '')));
$code = trim((string) ($data['code'] ?? ''));

if ($userId <= 0 || $email === '' || $code === '') {
    echo json_encode(["status" => "error", "message" => "User, email, and verification code are required."]);
    exit;
}

require_same_user_or_roles($userId, ['Admin']);

try {
    $token = verify_email_code_and_issue_token($conn, $email, verification_purpose_profile_email_change(), $code);
    echo json_encode([
        "status" => "success",
        "message" => "Email verified. Save your profile to apply the change.",
        "verification_token" => $token
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
