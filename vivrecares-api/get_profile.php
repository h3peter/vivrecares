<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// Get the user_id from the URL parameter (e.g., get_profile.php?user_id=1)
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "No user ID provided."]);
    exit;
}

try {
    // Joining tables to get the full profile in one go
    $sql = "SELECT 
                u.first_name, u.last_name, u.middle_name, u.extension_name, u.nickname, 
                u.email, u.profile_photo, u.role,
                p.patient_id, p.age, p.sex, p.address, p.phone, p.illnesses, 
                p.surgical_procedures, p.aesthetic_procedures, p.current_treatments
            FROM users u
            LEFT JOIN patients p ON u.user_id = p.user_id
            WHERE u.user_id = ? AND u.deleted_at IS NULL";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$user_id]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($profile) {
        echo json_encode($profile);
    } else {
        echo json_encode(["status" => "error", "message" => "Profile not found."]);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>