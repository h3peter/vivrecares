<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['invoice_id'])) exit;

try {
    $referenceNumber = trim($data['reference_number'] ?? '');
    $paymentMethod = $data['payment_method'] ?? 'Cash';

    if ($paymentMethod !== 'Cash' && $referenceNumber === '') {
        throw new Exception('Reference number is required for non-cash payments.');
    }

    if ($paymentMethod === 'Cash') {
        $referenceNumber = null;
    }

    $stmt = $conn->prepare("UPDATE billings SET payment_status = 'Paid', reference_number = ?, payment_date = NOW() WHERE invoice_id = ?");
    $stmt->execute([$referenceNumber, $data['invoice_id']]);
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
