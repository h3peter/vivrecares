<?php
header("Content-Type: application/json");
require_once 'config.php';
require_once 'auth.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data['user_id'] ?? null;

if ($user_id) {
    require_same_user_or_roles($user_id, ['Admin', 'Doctor']);
    try {
        $sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$user_id]);
        echo json_encode(["status" => "success"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "error"]);
    }
}
?>
