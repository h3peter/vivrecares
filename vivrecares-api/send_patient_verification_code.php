<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'mail_helper.php';
require_once 'verification_helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);
$email = trim((string) ($data['email'] ?? ''));
$firstName = trim((string) ($data['first_name'] ?? 'Patient'));

if ($email === '') {
    echo json_encode(["status" => "error", "message" => "Email is required."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Please provide a valid email address."]);
    exit;
}

try {
    ensure_email_verification_schema($conn);

    $existingStmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1");
    $existingStmt->execute([$email]);
    if ($existingStmt->fetchColumn()) {
        echo json_encode(["status" => "error", "message" => "Email is already registered."]);
        exit;
    }

    $code = create_email_verification_code($conn, $email, verification_purpose_patient_registration());

    $sent = send_vivre_email(
        $email,
        $firstName,
        'Your Vivre verification code',
        'Verify your email address',
        "Use this verification code to continue creating your Vivre patient account:\n\n" . $code . "\n\nThe code expires in 10 minutes.",
        null,
        'Verify Email'
    );

    if (!$sent) {
        $appBaseUrl = (string) app_env('APP_BASE_URL', 'http://localhost:5173');
        $isLocalEnvironment = stripos($appBaseUrl, 'localhost') !== false || stripos($appBaseUrl, '127.0.0.1') !== false;

        if ($isLocalEnvironment) {
            echo json_encode([
                "status" => "success",
                "message" => "Mail delivery is unavailable locally. Use the development verification code below.",
                "dev_code" => $code,
                "mail_error" => get_last_mail_error()
            ]);
            exit;
        }

        echo json_encode([
            "status" => "error",
            "message" => "Unable to send the verification code right now.",
            "mail_error" => get_last_mail_error()
        ]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "Verification code sent to your email."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
