<?php
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auth.php';
require_once 'appointment_reschedule.php';

init_api_auth();
$authenticatedUser = require_roles(['Patient']);

$data = json_decode(file_get_contents("php://input"), true);
$appointmentId = (int) ($data['appointment_id'] ?? 0);

if ($appointmentId <= 0) {
    echo json_encode(["status" => "error", "message" => "Invalid appointment."]);
    exit;
}

try {
    ensure_appointment_reschedule_columns($conn);

    $stmt = $conn->prepare("
        SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.branch, a.status,
               COALESCE(s.service_name, a.appointment_type) AS appointment_type,
               p.user_id, u.first_name, u.last_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN users u ON p.user_id = u.user_id
        LEFT JOIN services s ON a.service_id = s.service_id
        WHERE a.appointment_id = ?
        LIMIT 1
    ");
    $stmt->execute([$appointmentId]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        echo json_encode(["status" => "error", "message" => "Appointment not found."]);
        exit;
    }

    require_same_user_or_roles((int) ($appointment['user_id'] ?? 0));

    $status = trim((string) ($appointment['status'] ?? ''));
    $cancellableStatuses = ['Pending', 'Confirmed', 'Rescheduled'];
    if (!in_array($status, $cancellableStatuses, true)) {
        echo json_encode(["status" => "error", "message" => "This appointment can no longer be cancelled."]);
        exit;
    }

    $appointmentDate = trim((string) ($appointment['appointment_date'] ?? ''));
    $parsedDate = DateTime::createFromFormat('Y-m-d', $appointmentDate);
    if ($parsedDate && $parsedDate < new DateTime('today')) {
        echo json_encode(["status" => "error", "message" => "Past appointments can no longer be cancelled."]);
        exit;
    }

    $updateStmt = $conn->prepare("
        UPDATE appointments
        SET status = 'Cancelled',
            reschedule_responded_at = CASE WHEN status = 'Rescheduled' THEN NOW() ELSE reschedule_responded_at END
        WHERE appointment_id = ?
    ");
    $updateStmt->execute([$appointmentId]);
    clear_reschedule_metadata($conn, $appointmentId);

    $patientName = trim(($appointment['first_name'] ?? 'Patient') . ' ' . ($appointment['last_name'] ?? ''));
    $appointmentLabel = $appointment['appointment_type'] ?: 'appointment';
    $branch = normalize_appointment_branch($appointment['branch'] ?? '');
    $message = "{$patientName} cancelled their {$appointmentLabel} appointment for {$appointmentDate} at {$appointment['appointment_time']} in {$branch}.";
    notify_admin_users($conn, 'Appointment Cancelled by Patient', $message);

    echo json_encode([
        "status" => "success",
        "message" => "Your appointment has been cancelled.",
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Cancellation failed: " . $e->getMessage()]);
}
?>
