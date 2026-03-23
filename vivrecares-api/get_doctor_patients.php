<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

try {
    $sql = "SELECT u.user_id, u.first_name, u.last_name, u.created_at,
                   p.patient_id, p.age, p.sex, p.address, p.phone
            FROM users u
            JOIN patients p ON u.user_id = p.user_id
            WHERE u.role = 'Patient' AND u.deleted_at IS NULL
            ORDER BY u.first_name ASC, u.last_name ASC, p.patient_id ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
