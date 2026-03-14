<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["status" => "error", "message" => "Missing credentials."]);
    exit;
}

try {
    // We JOIN users (u) and patients (p) to get the nickname and full name
    $sql = "SELECT u.user_id, u.password, u.role, u.first_name, u.nickname, u.profile_photo, p.patient_id 
            FROM users u 
            LEFT JOIN patients p ON u.user_id = p.user_id 
            WHERE u.email = ? AND u.deleted_at IS NULL LIMIT 1";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify password against the hash
    if ($user && password_verify($data['password'], $user['password'])) {
        
        // Decide what name to show on the dashboard (Nickname is the 'soft luxury' choice)
        $displayName = !empty($user['nickname']) ? $user['nickname'] : $user['first_name'];

        echo json_encode([
            "status" => "success",
            "user" => [
                "id" => $user['user_id'],
                "patient_id" => $user['patient_id'], // Useful for booking later
                "role" => $user['role'],
                "name" => $displayName,
                "photo" => $user['profile_photo']
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server error: " . $e->getMessage()]);
}
?>