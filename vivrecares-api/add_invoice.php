<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['appointment_id']) || empty($data['total_amount'])) {
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
    exit;
}

try {
    $paymentMethod = $data['payment_method'] ?? 'Cash';
    $paymentStatus = $data['payment_status'] ?? 'Paid';
    $referenceNumber = trim($data['reference_number'] ?? '');
    $allowedMethods = ['Cash', 'GCash', 'Maya', 'Credit Card', 'Bank Transfer'];
    $allowedStatuses = ['Paid', 'Unpaid', 'Overdue'];

    if (!in_array($paymentMethod, $allowedMethods, true)) {
        throw new Exception('Invalid payment method.');
    }

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

    $sql = "INSERT INTO billings (appointment_id, total_amount, payment_method, reference_number, payment_status, payment_date)
            VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $data['appointment_id'],
        $data['total_amount'],
        $paymentMethod,
        $referenceNumber,
        $paymentStatus,
        $paymentDate
    ]);

    $updateApt = $conn->prepare("UPDATE appointments SET status = 'Completed' WHERE appointment_id = ?");
    $updateApt->execute([$data['appointment_id']]);

    echo json_encode(["status" => "success", "message" => "Invoice generated!"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Failed to generate invoice: " . $e->getMessage()]);
}
?>
