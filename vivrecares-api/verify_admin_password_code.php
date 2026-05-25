<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'verification_helper.php';
require_once 'admin_security.php';

init_api_auth();
$authUser = require_roles(['Admin']);
$data = json_decode(file_get_contents("php://input"), true);
$code = trim((string) ($data['code'] ?? ''));

if ($code === '') {
    echo json_encode(["status" => "error", "message" => "Verification code is required."]);
    exit;
}

try {
    ensure_admin_password_schema($conn);

    $stmt = $conn->prepare("SELECT user_id, email FROM users WHERE user_id = ? AND role = 'Admin' AND deleted_at IS NULL LIMIT 1");
    $stmt->execute([(int) $authUser['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || empty($user['email'])) {
        echo json_encode(["status" => "error", "message" => "Admin account email could not be found."]);
        exit;
    }

    $purpose = 'admin_password_' . (int) $user['user_id'];
    $token = verify_email_code_and_issue_token($conn, $user['email'], $purpose, $code);

    echo json_encode([
        "status" => "success",
        "message" => "Email verified. You can now set your admin password.",
        "verification_token" => $token,
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
