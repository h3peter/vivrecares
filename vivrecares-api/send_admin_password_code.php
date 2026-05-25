<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'mail_helper.php';
require_once 'verification_helper.php';
require_once 'admin_security.php';

init_api_auth();
$authUser = require_roles(['Admin']);

try {
    ensure_admin_password_schema($conn);
    ensure_email_verification_schema($conn);

    $stmt = $conn->prepare("SELECT user_id, first_name, email FROM users WHERE user_id = ? AND role = 'Admin' AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([(int) $authUser['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['email'])) {
        echo json_encode(["status" => "error", "message" => "A valid admin email is required."]);
        exit;
    }

    $purpose = 'admin_password_' . (int) $user['user_id'];
    $code = create_email_verification_code($conn, $user['email'], $purpose);

    $sent = send_vivre_email(
        $user['email'],
        $user['first_name'] ?? '',
        'Your Vivre admin password verification code',
        'Verify admin password change',
        "Use this verification code to set or change your Vivre admin password:\n\n" . $code . "\n\nThe code expires in 10 minutes.",
        null,
        'Verify Admin Password'
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

    echo json_encode(["status" => "success", "message" => "Verification code sent to your admin email."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
