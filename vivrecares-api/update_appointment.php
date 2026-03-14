<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['appointment_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing appointment ID."]);
    exit;
}

try {
    // We allow the admin to update the date, time, branch, and status
    $sql = "UPDATE appointments 
            SET appointment_date = ?, 
                appointment_time = ?, 
                branch = ?, 
                status = ? 
            WHERE appointment_id = ?";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $data['date'],
        $data['time'],
        $data['branch'],
        $data['status'],
        $data['appointment_id']
    ]);

    echo json_encode(["status" => "success", "message" => "Appointment updated!"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Update failed: " . $e->getMessage()]);
}
?>