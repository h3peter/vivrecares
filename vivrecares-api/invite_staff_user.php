<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'admin_security.php';
require_once 'mail_helper.php';
require_once 'staff_invitation_helper.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
$authUser = require_admin_password($conn, is_array($data) ? $data : []);

$firstName = trim($data['first_name'] ?? '');
$lastName = trim($data['last_name'] ?? '');
$email = strtolower(trim($data['email'] ?? ''));
$role = trim($data['role'] ?? '');

if ($firstName === '' || $lastName === '' || $email === '' || !in_array($role, ['Admin', 'Doctor'], true)) {
    echo json_encode(["status" => "error", "message" => "First name, last name, role, and email are required."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Please provide a valid email address."]);
    exit;
}

try {
    ensure_staff_invitation_schema($conn);

    $userStmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");
    $userStmt->execute([$email]);
    if ($userStmt->fetchColumn()) {
        echo json_encode(["status" => "error", "message" => "Email is already registered."]);
        exit;
    }

    $token = create_staff_invitation_token();
    $tokenHash = hash_staff_invitation_token($token);
    $expiresAt = (new DateTimeImmutable('+7 days'))->format('Y-m-d H:i:s');

    $conn->beginTransaction();

    $archiveStmt = $conn->prepare("
        UPDATE staff_invitations
        SET revoked_at = NOW()
        WHERE email = ?
          AND accepted_at IS NULL
          AND revoked_at IS NULL
    ");
    $archiveStmt->execute([$email]);

    $insertStmt = $conn->prepare("
        INSERT INTO staff_invitations (first_name, last_name, email, role, token_hash, invited_by, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $insertStmt->execute([
        $firstName,
        $lastName,
        $email,
        $role,
        $tokenHash,
        (int) ($authUser['user_id'] ?? 0),
        $expiresAt,
    ]);

    $conn->commit();

    $inviteUrl = get_frontend_invitation_url($token);
    $sent = send_vivre_email(
        $email,
        $firstName,
        'You are invited to VivreCares',
        'Accept your VivreCares staff invitation',
        "You have been invited as a VivreCares {$role}.\n\nUse the button below to accept the invitation and set your own password. This invitation expires in 7 days.",
        $inviteUrl,
        'Accept Invitation'
    );

    if (!$sent) {
        $appBaseUrl = (string) app_env('APP_BASE_URL', 'http://localhost:5173');
        $isLocalEnvironment = stripos($appBaseUrl, 'localhost') !== false || stripos($appBaseUrl, '127.0.0.1') !== false;

        if ($isLocalEnvironment) {
            echo json_encode([
                "status" => "success",
                "message" => "Invitation created. Mail is unavailable locally, so use the development invite link below.",
                "dev_invite_url" => $inviteUrl,
                "mail_error" => get_last_mail_error(),
            ]);
            exit;
        }

        echo json_encode([
            "status" => "error",
            "message" => "Invitation was created, but the email could not be sent.",
            "mail_error" => get_last_mail_error(),
        ]);
        exit;
    }

    echo json_encode(["status" => "success", "message" => "{$role} invitation sent."]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
