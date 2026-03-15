<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

try {
    // Notice we grab 'appointment_type' and 'concerns', and we removed the JOIN on the services table completely
    $sql = "SELECT a.appointment_id, a.appointment_date as date, a.appointment_time as time, 
                   a.status, a.branch, a.appointment_type, a.concerns,
                   u.first_name, u.last_name
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.patient_id
            LEFT JOIN users u ON p.user_id = u.user_id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($appointments);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>