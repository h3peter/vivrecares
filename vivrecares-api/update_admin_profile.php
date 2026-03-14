
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Invalid data"]);
    exit;
}

try {
    // We strictly update the users table for the Admin
    $stmt = $conn->prepare("UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE user_id = ? AND role = 'Admin'");
    $stmt->execute([$data['first_name'], $data['last_name'], $data['email'], $data['user_id']]);

    echo json_encode(["status" => "success", "message" => "Admin profile updated!"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>