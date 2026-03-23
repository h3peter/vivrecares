<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once 'config.php';

try {
    $availabilityStmt = $conn->query("SELECT branch, weekday, weekday_name, is_active
                                      FROM appointment_availability
                                      ORDER BY branch ASC, weekday ASC");
    $slotStmt = $conn->query("SELECT slot_id, branch, slot_time, slot_label, sort_order, is_active
                              FROM appointment_slots
                              ORDER BY branch ASC, sort_order ASC, slot_time ASC");

    echo json_encode([
        "status" => "success",
        "availability" => $availabilityStmt->fetchAll(PDO::FETCH_ASSOC),
        "slots" => $slotStmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
