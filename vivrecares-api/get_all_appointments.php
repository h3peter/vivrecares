<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

try {
    $sql = "SELECT 
                a.appointment_id,
                a.status,
                a.concerns AS remarks,
                a.appointment_date AS date,
                a.appointment_time AS time,
                a.branch,
                s.service_name AS service,
                u.first_name,
                u.last_name
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN users u ON p.user_id = u.user_id
            JOIN services s ON a.service_id = s.service_id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC";
            
    $stmt = $conn->query($sql);
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($appointments);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>