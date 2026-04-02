<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'billing_branch.php';

init_api_auth();
require_roles(['Admin']);

$invoice_id = $_GET['id'] ?? null;

if (!$invoice_id) {
    echo json_encode(["status" => "error", "message" => "Invoice ID missing"]);
    exit;
}

try {
    ensure_billings_branch_column($conn);

    $sqlMaster = "SELECT b.total_amount, b.payment_date, b.payment_status, b.payment_method, b.reference_number, u.first_name, u.last_name,
                     CASE
                         WHEN b.branch = 'Main Branch' THEN 'Pasay Branch'
                         WHEN b.branch IS NOT NULL AND b.branch <> '' THEN b.branch
                         WHEN a.branch = 'Main Branch' THEN 'Pasay Branch'
                         ELSE a.branch
                     END AS branch
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

    $sqlItems = "SELECT bi.*, s.service_name, s.category_name
                 FROM billing_items bi
                 LEFT JOIN services s ON bi.service_id = s.service_id
                 WHERE bi.invoice_id = ?";
    $stmt2 = $conn->prepare($sqlItems);
    $stmt2->execute([$invoice_id]);
    $items = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "status" => "success",
        "patient_name" => $master['first_name'] . " " . $master['last_name'],
        "date" => $master['payment_date'],
        "total" => $master['total_amount'],
        "branch" => $master['branch'],
        "payment_status" => $master['payment_status'],
        "payment_method" => $master['payment_method'],
        "reference_number" => $master['reference_number'],
        "items" => $items
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
