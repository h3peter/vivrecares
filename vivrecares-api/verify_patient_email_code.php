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
    $token = verify_email_code_and_issue_token($conn, $email, verification_purpose_patient_registration(), $code);
    echo json_encode([
        "status" => "success",
        "message" => "Email verified. You can now finish creating the account.",
        "verification_token" => $token
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
