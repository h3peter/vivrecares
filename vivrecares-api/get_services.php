<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'config.php';

try {
    $stmt = $conn->query("SELECT service_id, service_name, base_price FROM services WHERE is_active = 1");
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($services);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>