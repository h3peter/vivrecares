<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'mail_helper.php';
require_once 'verification_helper.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
$email = trim((string) ($data['email'] ?? ''));

if ($email === '') {
    echo json_encode(["status" => "error", "message" => "Email is required."]);
    exit;
}

try {
    ensure_email_verification_schema($conn);

    $userStmt = $conn->prepare("SELECT user_id, first_name, email FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1");
    $userStmt->execute([$email]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode([
            "status" => "success",
            "message" => "If an account with that email exists, a verification code has been prepared."
        ]);
        exit;
    }

    $purpose = 'forgot_password_' . $user['user_id'];
    $code = create_email_verification_code($conn, $user['email'], $purpose);

    $sent = send_vivre_email(
        $user['email'],
        $user['first_name'] ?? '',
        'Your Vivre password reset verification code',
        'Verify your password reset request',
        "Use this verification code to continue resetting your Vivre account password:\n\n" . $code . "\n\nThe code expires in 10 minutes.",
        null,
        'Verify Password Reset'
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

    echo json_encode([
        "status" => "success",
        "message" => "If an account with that email exists, a verification code has been sent."
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
