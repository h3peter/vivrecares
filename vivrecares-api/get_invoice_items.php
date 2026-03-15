<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

$invoice_id = $_GET['id'] ?? null;

if (!$invoice_id) {
    echo json_encode(["status" => "error", "message" => "Invoice ID missing"]);
    exit;
}

try {
    // Fetch master data including names and payment_status
    $sqlMaster = "SELECT b.total_amount, b.payment_date, b.payment_status, b.payment_method, u.first_name, u.last_name 
              FROM billings b
              LEFT JOIN appointments a ON b.appointment_id = a.appointment_id
              LEFT JOIN patients p ON p.patient_id = COALESCE(b.patient_id, a.patient_id)
              LEFT JOIN users u ON p.user_id = u.user_id
              WHERE b.invoice_id = ?";
    
    $stmt1 = $conn->prepare($sqlMaster);
    $stmt1->execute([$invoice_id]);
    $master = $stmt1->fetch(PDO::FETCH_ASSOC);

    if (!$master) {
        echo json_encode(["status" => "error", "message" => "Invoice not found"]);
        exit;
    }

    // Fetch line items from your billing_items table
    $sqlItems = "SELECT * FROM billing_items WHERE invoice_id = ?";
    $stmt2 = $conn->prepare($sqlItems);
    $stmt2->execute([$invoice_id]);
    $items = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // FIX: Added "payment_status" to the output array below!
    echo json_encode([
        "status" => "success",
        "patient_name" => $master['first_name'] . " " . $master['last_name'],
        "date" => $master['payment_date'],
        "total" => $master['total_amount'],
        "payment_status" => $master['payment_status'],
        "payment_method" => $master['payment_method'], // <-- Added this line
        "items" => $items
    ]);

    
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>