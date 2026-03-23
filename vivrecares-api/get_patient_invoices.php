<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

$id = $_GET['patient_id'] ?? null;

if (!$id) {
    echo json_encode([]);
    exit;
}

try {
    $sql = "SELECT b.invoice_id, b.total_amount, b.payment_date, b.payment_status, b.payment_method, b.reference_number,
                   (SELECT description FROM billing_items WHERE invoice_id = b.invoice_id ORDER BY item_id ASC LIMIT 1) as main_treatment
            FROM billings b
            LEFT JOIN appointments a ON b.appointment_id = a.appointment_id
            WHERE COALESCE(b.patient_id, a.patient_id) = ?
            ORDER BY COALESCE(b.payment_date, '1970-01-01 00:00:00') DESC, b.invoice_id DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$id]);

    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($results);
} catch (Exception $e) {
    echo json_encode([]);
}
?>
