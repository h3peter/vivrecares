<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['service_name']) || empty($data['category_name'])) {
    echo json_encode(["status" => "error", "message" => "Service name and category are required."]);
    exit;
}

try {
    $serviceId = $data['service_id'] ?? null;
    $serviceName = trim($data['service_name']);
    $categoryName = trim($data['category_name']);
    $description = trim($data['description'] ?? '');
    $basePrice = isset($data['base_price']) ? (float) $data['base_price'] : 0;
    $sortOrder = isset($data['sort_order']) ? (int) $data['sort_order'] : 0;
    $isActive = !empty($data['is_active']) ? 1 : 0;

    if ($serviceId) {
        $stmt = $conn->prepare("UPDATE services
                                SET service_name = ?, category_name = ?, description = ?, base_price = ?, sort_order = ?, is_active = ?
                                WHERE service_id = ?");
        $stmt->execute([$serviceName, $categoryName, $description, $basePrice, $sortOrder, $isActive, $serviceId]);
    } else {
        $stmt = $conn->prepare("INSERT INTO services (service_name, category_name, description, base_price, sort_order, is_active)
                                VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$serviceName, $categoryName, $description, $basePrice, $sortOrder, $isActive]);
    }

    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
