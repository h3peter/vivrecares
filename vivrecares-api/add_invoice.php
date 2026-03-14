<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

// Basic validation
if (!$data || empty($data['appointment_id']) || empty($data['total_amount'])) {
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
    exit;
}

try {
    $sql = "INSERT INTO billings (appointment_id, total_amount, payment_method, payment_status) 
            VALUES (?, ?, ?, 'Paid')";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $data['appointment_id'],
        $data['total_amount'],
        $data['payment_method']
    ]);

    // Optional pro-move: We could also automatically update that appointment's status to 'Completed' here!
    $updateApt = $conn->prepare("UPDATE appointments SET status = 'Completed' WHERE appointment_id = ?");
    $updateApt->execute([$data['appointment_id']]);

    echo json_encode(["status" => "success", "message" => "Invoice generated!"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Failed to generate invoice: " . $e->getMessage()]);
}
?>