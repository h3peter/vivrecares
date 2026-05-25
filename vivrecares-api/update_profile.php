<?php
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auth.php';
require_once 'verification_helper.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

require_same_user_or_roles($data['user_id'], ['Admin']);

try {
    ensure_email_verification_schema($conn);

    $userId = (int) $data['user_id'];
    $newEmail = strtolower(trim((string) ($data['email'] ?? '')));
    $verificationToken = trim((string) ($data['email_verification_token'] ?? ''));

    if ($newEmail === '' || !filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["status" => "error", "message" => "Please provide a valid email address."]);
        exit;
    }

    $currentStmt = $conn->prepare("SELECT email FROM users WHERE user_id = ? AND deleted_at IS NULL LIMIT 1");
    $currentStmt->execute([$userId]);
    $currentEmail = strtolower(trim((string) $currentStmt->fetchColumn()));

    if ($currentEmail === '') {
        echo json_encode(["status" => "error", "message" => "Account could not be found."]);
        exit;
    }

    $emailChanged = $newEmail !== $currentEmail;

    if ($emailChanged) {
        if ($verificationToken === '') {
            echo json_encode(["status" => "verification_required", "message" => "Verify your new email before saving this change."]);
            exit;
        }

        $duplicateStmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? AND user_id <> ? AND deleted_at IS NULL LIMIT 1");
        $duplicateStmt->execute([$newEmail, $userId]);
        if ($duplicateStmt->fetchColumn()) {
            echo json_encode(["status" => "error", "message" => "That email address is already used by another account."]);
            exit;
        }

        consume_verified_email_token($conn, $newEmail, verification_purpose_profile_email_change(), $verificationToken);
    }

    $conn->beginTransaction();

    // 1. Update basic user info
    $stmt1 = $conn->prepare("UPDATE users SET first_name = ?, last_name = ?, email = ?, email_verified_at = CASE WHEN ? THEN NOW() ELSE email_verified_at END WHERE user_id = ?");
    $stmt1->execute([
        $data['first_name'] ?? '',
        $data['last_name'] ?? '',
        $newEmail,
        $emailChanged ? 1 : 0,
        $userId
    ]);

    // 2. Update patient-specific contact info only when that field is present.
    if (array_key_exists('phone', $data)) {
        $stmt2 = $conn->prepare("UPDATE patients SET phone = ? WHERE user_id = ?");
        $stmt2->execute([$data['phone'] ?? '', $userId]);
    }

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Profile updated!"]);
} catch (PDOException $e) {
    $conn->rollBack();
    $errorCode = $e->errorInfo[1] ?? null;
    if ((string) $e->getCode() === '23000' || (int) $errorCode === 1062) {
        echo json_encode(["status" => "error", "message" => "That email address is already used by another account."]);
        exit;
    }

    echo json_encode(["status" => "error", "message" => "Unable to update your profile right now."]);
} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["status" => "error", "message" => "Unable to update your profile right now."]);
}
?>
