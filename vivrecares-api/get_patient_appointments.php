<?php
header("Content-Type: application/json");
require_once 'config.php';
require_once 'auth.php';
require_once 'appointment_reschedule.php';

init_api_auth();

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode([]);
    exit;
}

require_same_user_or_roles($user_id, ['Admin', 'Doctor']);

try {
    ensure_appointment_reschedule_columns($conn);

    // We join the patients table so we can look them up by their login account (user_id)
    $sql = "SELECT a.appointment_id, COALESCE(s.service_name, a.appointment_type) AS appointment_type, 
                   CASE WHEN a.branch = 'Main Branch' THEN 'Pasay Branch' ELSE a.branch END AS branch,
                   CASE WHEN a.previous_branch = 'Main Branch' THEN 'Pasay Branch' ELSE a.previous_branch END AS previous_branch,
                   a.appointment_date as date, 
                   a.appointment_time as time, a.status, a.concerns,
                   a.previous_appointment_date,
                   a.previous_appointment_time,
                   a.reschedule_requested_at,
                   a.reschedule_responded_at
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            LEFT JOIN services s ON a.service_id = s.service_id
            WHERE p.user_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$user_id]);
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
