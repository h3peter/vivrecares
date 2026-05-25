<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'branch_helper.php';

init_api_auth();

try {
    ensure_branch_schema($conn);
    $availabilityStmt = $conn->query("SELECT branch, weekday, weekday_name, is_active
                                      FROM appointment_availability
                                      ORDER BY branch ASC, weekday ASC");
    $slotStmt = $conn->query("SELECT slot_id, branch, slot_time, slot_label, sort_order, is_active
                              FROM appointment_slots
                              ORDER BY branch ASC, sort_order ASC, slot_time ASC");

    echo json_encode([
        "status" => "success",
        "branches" => get_active_clinic_branches($conn),
        "availability" => $availabilityStmt->fetchAll(PDO::FETCH_ASSOC),
        "slots" => $slotStmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
