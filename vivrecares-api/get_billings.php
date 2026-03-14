<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

try {
    $sql = "SELECT 
                b.invoice_id, 
                b.total_amount, 
                b.payment_method, 
                b.payment_date,
                a.appointment_date,
                s.service_name,
                u.first_name, 
                u.last_name
            FROM billings b
            JOIN appointments a ON b.appointment_id = a.appointment_id
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN users u ON p.user_id = u.user_id
            JOIN services s ON a.service_id = s.service_id
            ORDER BY b.payment_date DESC";
            
    $stmt = $conn->query($sql);
    $billings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($billings);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>