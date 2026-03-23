<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

try {
    $sql = "SELECT a.appointment_id, a.appointment_date as date, a.appointment_time as time, 
                   a.status,
                   CASE WHEN a.branch = 'Main Branch' THEN 'Pasay Branch' ELSE a.branch END AS branch,
                   COALESCE(s.service_name, a.appointment_type) AS appointment_type, a.concerns,
                   u.first_name, u.last_name
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.patient_id
            LEFT JOIN services s ON a.service_id = s.service_id
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
