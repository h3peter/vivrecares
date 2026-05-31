<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'appointment_reschedule.php';
require_once 'appointment_expiration.php';

init_api_auth();
require_roles(['Doctor', 'Admin']);

try {
    ensure_appointment_reschedule_columns($conn);
    cancel_expired_pending_appointments($conn);

    $sql = "SELECT a.appointment_id, a.patient_id, a.appointment_date AS date, a.appointment_time AS time,
                   a.status, CASE WHEN a.branch = 'Main Branch' THEN 'Pasay Branch' ELSE a.branch END AS branch,
                   CASE WHEN a.previous_branch = 'Main Branch' THEN 'Pasay Branch' ELSE a.previous_branch END AS previous_branch,
                   a.previous_appointment_date,
                   a.previous_appointment_time,
                   COALESCE(s.service_name, a.appointment_type) AS appointment_type,
                   a.concerns, u.first_name, u.last_name, p.user_id
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN services s ON a.service_id = s.service_id
            WHERE u.deleted_at IS NULL
            ORDER BY a.appointment_date DESC, a.appointment_time DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
