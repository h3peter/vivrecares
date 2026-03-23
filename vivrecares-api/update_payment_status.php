<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['invoice_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing invoice ID."]);
    exit;
}

try {
    $referenceNumber = trim($data['reference_number'] ?? '');
    $paymentMethod = $data['payment_method'] ?? 'Cash';
    $paymentStatus = $data['payment_status'] ?? 'Paid';
    $allowedStatuses = ['Paid', 'Unpaid', 'Overdue'];

    if (!in_array($paymentStatus, $allowedStatuses, true)) {
        throw new Exception('Invalid payment status.');
    }

    if ($paymentMethod !== 'Cash' && $paymentStatus === 'Paid' && $referenceNumber === '') {
        throw new Exception('Reference number is required for non-cash paid invoices.');
    }

    if ($paymentMethod === 'Cash' || $referenceNumber === '') {
        $referenceNumber = null;
    }

    $paymentDate = $paymentStatus === 'Paid' ? date('Y-m-d H:i:s') : null;

    $stmt = $conn->prepare("UPDATE billings
                            SET payment_status = ?, reference_number = ?, payment_date = ?
                            WHERE invoice_id = ?");
    $stmt->execute([
        $paymentStatus,
        $referenceNumber,
        $paymentDate,
        $data['invoice_id']
    ]);
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
