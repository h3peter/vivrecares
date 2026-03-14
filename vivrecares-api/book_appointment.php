<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Empty booking data."]);
    exit;
}

try {
    $sql = "INSERT INTO appointments (patient_id, service_id, appointment_date, appointment_time, concerns) 
            VALUES (?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $data['patientId'],
        $data['serviceId'],
        $data['date'],
        $data['time'],
        $data['concerns']
    ]);

    echo json_encode(["status" => "success", "message" => "Appointment requested!"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Booking failed: " . $e->getMessage()]);
}
?>