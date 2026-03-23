<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'config.php';

try {
    $stmt = $conn->query("SELECT user_id, first_name, last_name, email, role, created_at, deleted_at
                          FROM users
                          WHERE role IN ('Admin', 'Doctor')
                          ORDER BY deleted_at IS NOT NULL ASC, first_name ASC, last_name ASC");

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode([
        "status" => "success",
        "data" => $rows
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
