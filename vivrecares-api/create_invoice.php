<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['patient_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing patient data."]);
    exit;
}

try {
    $conn->beginTransaction();

    // 1. Insert Master Record (tied to patient_id, appointment is NULL)
    $sqlBilling = "INSERT INTO billings (patient_id, appointment_id, total_amount, payment_method, payment_status, payment_date) 
                   VALUES (?, NULL, ?, ?, 'Paid', NOW())";
    
    $stmtBilling = $conn->prepare($sqlBilling);
    $stmtBilling->execute([$data['patient_id'], $data['total_amount'], $data['payment_method']]);
    $newInvoiceId = $conn->lastInsertId();

    // 2. Insert detailed Line Items
    $sqlItem = "INSERT INTO billing_items (invoice_id, description, quantity, unit_price, total_price) 
                VALUES (?, ?, ?, ?, ?)";
    $stmtItem = $conn->prepare($sqlItem);

    foreach ($data['items'] as $item) {
        $stmtItem->execute([
            $newInvoiceId,
            $item['description'],
            $item['quantity'],
            $item['unit_price'],
            ($item['quantity'] * $item['unit_price'])
        ]);
    }

    $conn->commit();
    echo json_encode(["status" => "success", "invoice_id" => $newInvoiceId]);

} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>