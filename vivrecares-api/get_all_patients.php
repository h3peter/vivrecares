<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$isArchived = isset($_GET['archived']) && $_GET['archived'] == '1';

try {
    if ($isArchived) {
        $sql = "SELECT u.user_id, u.first_name, u.last_name, u.created_at, p.patient_id, p.age, p.sex, p.address, p.phone
                FROM users u
                JOIN patients p ON u.user_id = p.user_id
                WHERE u.role = 'Patient' AND u.deleted_at IS NOT NULL
                ORDER BY u.created_at DESC, u.user_id DESC";
    } else {
        $sql = "SELECT u.user_id, u.first_name, u.last_name, u.created_at, p.patient_id, p.age, p.sex, p.address, p.phone
                FROM users u
                JOIN patients p ON u.user_id = p.user_id
                WHERE u.role = 'Patient' AND u.deleted_at IS NULL
                ORDER BY u.created_at DESC, u.user_id DESC";
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($patients);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
