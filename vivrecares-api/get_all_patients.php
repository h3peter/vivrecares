<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

// Check if the React app is requesting archived patients
$isArchived = isset($_GET['archived']) && $_GET['archived'] == '1' ? true : false;

try {
    // We filter using the 'deleted_at' column in the users table
    if ($isArchived) {
        $sql = "SELECT u.user_id, u.first_name, u.last_name, p.patient_id, p.age, p.sex, p.address, p.phone 
                FROM users u 
                JOIN patients p ON u.user_id = p.user_id 
                WHERE u.role = 'Patient' AND u.deleted_at IS NOT NULL
                ORDER BY u.last_name ASC";
    } else {
        $sql = "SELECT u.user_id, u.first_name, u.last_name, p.patient_id, p.age, p.sex, p.address, p.phone 
                FROM users u 
                JOIN patients p ON u.user_id = p.user_id 
                WHERE u.role = 'Patient' AND u.deleted_at IS NULL
                ORDER BY u.last_name ASC";
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($patients);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>