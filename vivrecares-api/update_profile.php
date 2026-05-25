<?php
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auth.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

require_same_user_or_roles($data['user_id'], ['Admin']);

try {
    $conn->beginTransaction();

    // 1. Update basic user info
    $stmt1 = $conn->prepare("UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ?");
    $stmt1->execute([
        $data['first_name'] ?? '',
        $data['last_name'] ?? '',
        $data['email'] ?? '',
        $data['user_id']
    ]);

    // 2. Update patient-specific contact info only when that field is present.
    if (array_key_exists('phone', $data)) {
        $stmt2 = $conn->prepare("UPDATE patients SET phone = ? WHERE user_id = ?");
        $stmt2->execute([$data['phone'] ?? '', $data['user_id']]);
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
