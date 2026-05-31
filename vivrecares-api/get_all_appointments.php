<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'appointment_reschedule.php';
require_once 'appointment_expiration.php';
require_once 'admin_permissions.php';

init_api_auth();
require_admin_permission($conn, 'appointments');

try {
    ensure_appointment_reschedule_columns($conn);
    cancel_expired_pending_appointments($conn);

    $sql = "SELECT a.appointment_id, a.appointment_date as date, a.appointment_time as time, 
                   a.status,
                   CASE WHEN a.branch = 'Main Branch' THEN 'Pasay Branch' ELSE a.branch END AS branch,
                   CASE WHEN a.previous_branch = 'Main Branch' THEN 'Pasay Branch' ELSE a.previous_branch END AS previous_branch,
                   a.previous_appointment_date,
                   a.previous_appointment_time,
                   a.reschedule_requested_at,
                   a.reschedule_responded_at,
                   COALESCE(s.service_name, a.appointment_type) AS appointment_type, a.concerns,
                   u.first_name, u.last_name
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.patient_id
            LEFT JOIN services s ON a.service_id = s.service_id
            LEFT JOIN users u ON p.user_id = u.user_id
            ORDER BY a.appointment_date DESC, a.appointment_time DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($appointments);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
