<?php
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auth.php';
require_once 'appointment_reschedule.php';
require_once 'mail_helper.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
$appointmentId = (int) ($data['appointment_id'] ?? 0);
$action = strtolower(trim((string) ($data['action'] ?? '')));
$authenticatedUser = require_roles(['Patient', 'Admin']);

if ($appointmentId <= 0 || !in_array($action, ['confirm', 'decline'], true)) {
    echo json_encode(["status" => "error", "message" => "Invalid reschedule response."]);
    exit;
}

try {
    ensure_appointment_reschedule_columns($conn);

    $sql = "
        SELECT a.appointment_id, a.patient_id, a.appointment_date, a.appointment_time, a.branch, a.status,
               a.previous_branch, a.previous_appointment_date, a.previous_appointment_time,
               COALESCE(s.service_name, a.appointment_type) AS appointment_type,
               p.user_id, u.first_name, u.email
        FROM appointments a
        JOIN patients p ON a.patient_id = p.patient_id
        JOIN users u ON p.user_id = u.user_id
        LEFT JOIN services s ON a.service_id = s.service_id
        WHERE a.appointment_id = ?
        LIMIT 1
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$appointmentId]);
    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        echo json_encode(["status" => "error", "message" => "Appointment not found."]);
        exit;
    }

    require_same_user_or_roles((int) ($appointment['user_id'] ?? 0), ['Admin']);

    if (($appointment['status'] ?? '') !== 'Rescheduled') {
        echo json_encode(["status" => "error", "message" => "This appointment does not have a pending reschedule request."]);
        exit;
    }

    $appointmentLabel = $appointment['appointment_type'] ?: 'appointment';
    $currentBranch = normalize_appointment_branch($appointment['branch'] ?? '');
    $previousBranch = normalize_appointment_branch($appointment['previous_branch'] ?? '');
    $currentDate = trim((string) ($appointment['appointment_date'] ?? ''));
    $currentTime = trim((string) ($appointment['appointment_time'] ?? ''));
    $previousDate = trim((string) ($appointment['previous_appointment_date'] ?? ''));
    $previousTime = trim((string) ($appointment['previous_appointment_time'] ?? ''));

    if ($action === 'confirm') {
        validate_appointment_schedule($conn, $currentBranch, $currentDate, $currentTime, $appointmentId, ['Confirmed']);

        $updateStmt = $conn->prepare("
            UPDATE appointments
            SET status = 'Confirmed',
                reschedule_responded_at = NOW()
            WHERE appointment_id = ?
        ");
        $updateStmt->execute([$appointmentId]);

        $competingStmt = $conn->prepare("
            SELECT a.appointment_id, u.user_id, u.email, u.first_name,
                   COALESCE(s.service_name, a.appointment_type) AS appointment_type
            FROM appointments a
            JOIN patients p ON a.patient_id = p.patient_id
            JOIN users u ON p.user_id = u.user_id
            LEFT JOIN services s ON a.service_id = s.service_id
            WHERE a.branch = ?
              AND a.appointment_date = ?
              AND a.appointment_time = ?
              AND a.status IN ('Pending', 'Rescheduled')
              AND a.appointment_id <> ?
        ");
        $competingStmt->execute([$currentBranch, $currentDate, $currentTime, $appointmentId]);
        $competingAppointments = $competingStmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($competingAppointments)) {
            $cancelStmt = $conn->prepare("UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = ?");
            $cancelNotifStmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, redirect_url) VALUES (?, ?, ?, ?)");
            $appBaseUrl = rtrim((string) app_env('APP_BASE_URL', 'http://localhost:5173'), '/');

            foreach ($competingAppointments as $competingAppointment) {
                $cancelStmt->execute([$competingAppointment['appointment_id']]);

                $cancelledLabel = $competingAppointment['appointment_type'] ?: 'appointment';
                $cancelledMessage = "Your {$cancelledLabel} request for {$currentDate} at {$currentTime} in {$currentBranch} was cancelled because that slot has already been confirmed for another patient.";

                $cancelNotifStmt->execute([
                    $competingAppointment['user_id'],
                    'Appointment Request Cancelled',
                    $cancelledMessage,
                    '/appointment-history',
                ]);

                if (!empty($competingAppointment['email'])) {
                    send_vivre_email(
                        $competingAppointment['email'],
                        $competingAppointment['first_name'] ?? '',
                        'Appointment Request Cancelled - Vivre Medical Group',
                        'Appointment Request Cancelled',
                        $cancelledMessage,
                        $appBaseUrl . '/appointment-history',
                        'View Appointment'
                    );
                }
            }
        }

        $adminMessage = ($authenticatedUser['role'] ?? '') === 'Admin'
            ? "The rescheduled {$appointmentLabel} appointment has been confirmed."
            : ($appointment['first_name'] ?? 'The patient') . " confirmed the rescheduled {$appointmentLabel} appointment for {$currentDate} at {$currentTime} in {$currentBranch}.";
        notify_admin_users($conn, 'Reschedule Confirmed', $adminMessage);

        echo json_encode([
            "status" => "success",
            "message" => "Rescheduled appointment confirmed.",
        ]);
        exit;
    }

    $updateStmt = $conn->prepare("
        UPDATE appointments
        SET status = 'Cancelled',
            reschedule_responded_at = NOW()
        WHERE appointment_id = ?
    ");
    $updateStmt->execute([$appointmentId]);

    $declineMessage = ($authenticatedUser['role'] ?? '') === 'Admin'
        ? "The rescheduled {$appointmentLabel} appointment was declined and cancelled."
        : ($appointment['first_name'] ?? 'The patient') . " declined the proposed reschedule from {$previousDate} at {$previousTime} in {$previousBranch} to {$currentDate} at {$currentTime} in {$currentBranch}.";
    notify_admin_users($conn, 'Reschedule Declined', $declineMessage);

    echo json_encode([
        "status" => "success",
        "message" => "Reschedule request declined. The appointment has been cancelled.",
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
