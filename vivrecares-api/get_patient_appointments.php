<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode([]);
    exit;
}

try {
    // We join the patients table so we can look them up by their login account (user_id)
    $sql = "SELECT a.appointment_id, COALESCE(s.service_name, a.appointment_type) AS appointment_type, 
                   CASE WHEN a.branch = 'Main Branch' THEN 'Pasay Branch' ELSE a.branch END AS branch,
                   a.appointment_date as date, 
                   a.appointment_time as time, a.status, a.concerns 
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            LEFT JOIN services s ON a.service_id = s.service_id
            WHERE p.user_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$user_id]);
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
