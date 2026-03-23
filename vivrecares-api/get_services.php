<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'config.php';

try {
    $activeOnly = isset($_GET['active_only']) && $_GET['active_only'] === '1';
    $sql = "SELECT service_id, service_name, category_name, description, base_price, is_active, sort_order
            FROM services";

    if ($activeOnly) {
        $sql .= " WHERE is_active = 1";
    }

    $sql .= " ORDER BY category_name ASC, sort_order ASC, service_name ASC";

    $stmt = $conn->query($sql);
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($services);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
