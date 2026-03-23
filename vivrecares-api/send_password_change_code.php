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
$userId = (int) ($data['user_id'] ?? 0);

if ($userId <= 0) {
    echo json_encode(["status" => "error", "message" => "User ID is required."]);
    exit;
}

try {
    ensure_email_verification_schema($conn);

    $userStmt = $conn->prepare("SELECT user_id, first_name, email FROM users WHERE user_id = ? AND deleted_at IS NULL LIMIT 1");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['email'])) {
        echo json_encode(["status" => "error", "message" => "A valid email is required before changing the password."]);
        exit;
    }

    $purpose = 'password_change_' . $userId;
    $code = create_email_verification_code($conn, $user['email'], $purpose);

    $sent = send_vivre_email(
        $user['email'],
        $user['first_name'] ?? '',
        'Your Vivre password verification code',
        'Verify your password change',
        "Use this verification code to continue changing your Vivre account password:\n\n" . $code . "\n\nThe code expires in 10 minutes.",
        null,
        'Verify Password Change'
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
