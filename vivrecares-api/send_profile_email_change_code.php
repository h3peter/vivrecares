<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'mail_helper.php';
require_once 'verification_helper.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
$userId = (int) ($data['user_id'] ?? 0);
$email = strtolower(trim((string) ($data['email'] ?? '')));
$firstName = trim((string) ($data['first_name'] ?? 'Patient'));

if ($userId <= 0 || $email === '') {
    echo json_encode(["status" => "error", "message" => "User and email are required."]);
    exit;
}

require_same_user_or_roles($userId, ['Admin']);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Please provide a valid email address."]);
    exit;
}

try {
    ensure_email_verification_schema($conn);

    $existingStmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? AND user_id <> ? AND deleted_at IS NULL LIMIT 1");
    $existingStmt->execute([$email, $userId]);
    if ($existingStmt->fetchColumn()) {
        echo json_encode(["status" => "error", "message" => "That email address is already used by another account."]);
        exit;
    }

    $code = create_email_verification_code($conn, $email, verification_purpose_profile_email_change());

    $sent = send_vivre_email(
        $email,
        $firstName,
        'Confirm your new Vivre email',
        'Verify your new email address',
        "Use this verification code to confirm your new Vivre account email:\n\n" . $code . "\n\nThe code expires in 10 minutes.",
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

        echo json_encode(["status" => "error", "message" => "Unable to send the verification code right now."]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "Verification code sent to your new email."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
