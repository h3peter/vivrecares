<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

try {
    $sql = "SELECT
                b.invoice_id, b.total_amount, b.payment_method, b.reference_number, b.payment_status, b.payment_date,
                u.first_name, u.last_name,
                (SELECT description FROM billing_items WHERE invoice_id = b.invoice_id ORDER BY item_id ASC LIMIT 1) as main_treatment,
                (SELECT COUNT(*) FROM billing_items WHERE invoice_id = b.invoice_id) as item_count
            FROM billings b
            LEFT JOIN appointments a ON b.appointment_id = a.appointment_id
            LEFT JOIN patients p ON p.patient_id = COALESCE(b.patient_id, a.patient_id)
            LEFT JOIN users u ON p.user_id = u.user_id
            ORDER BY COALESCE(b.payment_date, '1970-01-01 00:00:00') DESC, b.invoice_id DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
