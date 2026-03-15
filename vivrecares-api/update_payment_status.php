<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");
require_once 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['invoice_id'])) exit;

try {
    $stmt = $conn->prepare("UPDATE billings SET payment_status = 'Paid', payment_date = NOW() WHERE invoice_id = ?");
    $stmt->execute([$data['invoice_id']]);
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>