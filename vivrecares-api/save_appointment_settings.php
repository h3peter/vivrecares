<?php
require_once 'auth.php';
require_once 'config.php';

init_api_auth();
require_roles(['Admin']);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['branch']) || !isset($data['availability']) || !isset($data['slots'])) {
    echo json_encode(["status" => "error", "message" => "Incomplete appointment settings payload."]);
    exit;
}

try {
    $conn->beginTransaction();

    $branch = $data['branch'];
    $availabilityStmt = $conn->prepare("INSERT INTO appointment_availability (branch, weekday, weekday_name, is_active)
                                        VALUES (?, ?, ?, ?)
                                        ON DUPLICATE KEY UPDATE weekday_name = VALUES(weekday_name), is_active = VALUES(is_active)");

    foreach ($data['availability'] as $day) {
        $availabilityStmt->execute([
            $branch,
            (int) $day['weekday'],
            $day['weekday_name'],
            !empty($day['is_active']) ? 1 : 0
        ]);
    }

    $seenSlotIds = [];
    $slotStmt = $conn->prepare("INSERT INTO appointment_slots (branch, slot_time, slot_label, sort_order, is_active)
                                VALUES (?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE slot_label = VALUES(slot_label), sort_order = VALUES(sort_order), is_active = VALUES(is_active)");
    $findSlotStmt = $conn->prepare("SELECT slot_id FROM appointment_slots WHERE branch = ? AND slot_time = ?");

    foreach ($data['slots'] as $slot) {
        $slotTime = $slot['slot_time'];
        $slotStmt->execute([
            $branch,
            $slotTime,
            $slot['slot_label'],
            (int) $slot['sort_order'],
            !empty($slot['is_active']) ? 1 : 0
        ]);

        $findSlotStmt->execute([$branch, $slotTime]);
        $slotId = $findSlotStmt->fetchColumn();
        if ($slotId) $seenSlotIds[] = (int) $slotId;
    }

    if (!empty($seenSlotIds)) {
        $placeholders = implode(',', array_fill(0, count($seenSlotIds), '?'));
        $deleteStmt = $conn->prepare("DELETE FROM appointment_slots WHERE branch = ? AND slot_id NOT IN ($placeholders)");
        $deleteStmt->execute(array_merge([$branch], $seenSlotIds));
    } else {
        $deleteStmt = $conn->prepare("DELETE FROM appointment_slots WHERE branch = ?");
        $deleteStmt->execute([$branch]);
    }

    $conn->commit();
    echo json_encode(["status" => "success"]);
} catch (Exception $e) {
    if ($conn->inTransaction()) $conn->rollBack();
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
