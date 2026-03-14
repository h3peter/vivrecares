<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

try {
    // We select specific columns to match your wireframe exactly
    $sql = "SELECT 
                u.user_id, u.first_name, u.last_name, u.profile_photo,
                p.patient_id, p.sex, p.age, p.address, p.phone 
            FROM users u
            JOIN patients p ON u.user_id = p.user_id
            WHERE u.role = 'Patient' AND u.deleted_at IS NULL
            ORDER BY p.patient_id DESC";
    
    $stmt = $conn->query($sql);
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($patients);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>