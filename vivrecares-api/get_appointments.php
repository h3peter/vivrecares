<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

$patient_id = isset($_GET['patient_id']) ? $_GET['patient_id'] : null;

if (!$patient_id) {
    echo json_encode(["status" => "error", "message" => "Patient ID missing"]);
    exit;
}

try {
    // Joining with services to get the name and price for the table
    $sql = "SELECT 
                a.concerns AS remarks, 
                s.service_name AS service, 
                a.appointment_date AS date, 
                s.base_price AS price,
                a.status
            FROM appointments a 
            JOIN services s ON a.service_id = s.service_id 
            WHERE a.patient_id = ? 
            ORDER BY a.appointment_date DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$patient_id]);
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>