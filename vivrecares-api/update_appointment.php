<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'appointment_validation.php';
require_once 'mail_helper.php';

init_api_auth();
require_roles(['Admin']);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['appointment_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing appointment ID."]);
    exit;
}

try {
    $mailSent = null;
    $mailError = null;

    $rawBranch = trim((string) ($data['branch'] ?? ''));
    $appointmentDate = trim((string) ($data['date'] ?? ''));
    $appointmentTime = trim((string) ($data['time'] ?? ''));
    $status = trim((string) ($data['status'] ?? ''));

    $normalizedBranch = normalize_appointment_branch($rawBranch);

    if ($normalizedBranch === '' || $appointmentDate === '' || $appointmentTime === '' || $status === '') {
        echo json_encode(["status" => "error", "message" => "Date, time, branch, and status are required."]);
        exit;
    }

    $currentStmt = $conn->prepare("
        SELECT a.appointment_date, a.appointment_time, a.branch, a.status,
               COALESCE(s.service_name, a.appointment_type) AS appointment_type
        FROM appointments a
        LEFT JOIN services s ON a.service_id = s.service_id
        WHERE a.appointment_id = ?
        LIMIT 1
    ");
    $currentStmt->execute([$data['appointment_id']]);
    $currentAppointment = $currentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$currentAppointment) {
        echo json_encode(["status" => "error", "message" => "Appointment not found."]);
        exit;
    }

    $slotLabel = null;
    if ($status !== 'Cancelled') {
        $schedule = validate_appointment_schedule($conn, $normalizedBranch, $appointmentDate, $appointmentTime, $data['appointment_id'], ['Confirmed']);
        $normalizedBranch = $schedule['branch'];
        $slotLabel = $schedule['slot_label'];
    }

    // 1. Update the appointment (Your original working code)
    $sql = "UPDATE appointments 
            SET appointment_date = ?, 
                appointment_time = ?, 
                branch = ?, 
                status = ? 
            WHERE appointment_id = ?";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $appointmentDate,
        $appointmentTime,
        $normalizedBranch,
        $status,
        $data['appointment_id']
    ]);

    if ($status === 'Confirmed') {
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
              AND a.status = 'Pending'
              AND a.appointment_id <> ?
        ");
        $competingStmt->execute([$normalizedBranch, $appointmentDate, $appointmentTime, $data['appointment_id']]);
        $competingAppointments = $competingStmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($competingAppointments)) {
            $cancelStmt = $conn->prepare("UPDATE appointments SET status = 'Cancelled' WHERE appointment_id = ?");
            $cancelNotifStmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, redirect_url) VALUES (?, ?, ?, ?)");
            $appBaseUrl = rtrim((string) app_env('APP_BASE_URL', 'http://localhost:5173'), '/');

            foreach ($competingAppointments as $competingAppointment) {
                $cancelStmt->execute([$competingAppointment['appointment_id']]);

                $cancelledLabel = $competingAppointment['appointment_type'] ?: 'appointment';
                $cancelledMessage = "Your {$cancelledLabel} request for {$appointmentDate} at {$appointmentTime} in {$normalizedBranch} was cancelled because that slot has already been confirmed for another patient.";

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
    }

    // 2. Find the patient's User ID linked to this specific appointment
    $userSql = "SELECT p.user_id, u.email, u.first_name
                FROM appointments a 
                JOIN patients p ON a.patient_id = p.patient_id 
                JOIN users u ON p.user_id = u.user_id
                WHERE a.appointment_id = ?";
    $userStmt = $conn->prepare($userSql);
    $userStmt->execute([$data['appointment_id']]);
    $patientUser = $userStmt->fetch(PDO::FETCH_ASSOC);
    $patientUserId = $patientUser['user_id'] ?? null;

    // 3. Send the notification if the patient account is found
    if ($patientUserId) {
        $serviceLabel = $currentAppointment['appointment_type'] ?: 'appointment';

        if ($status === 'Cancelled') {
            $title = 'Appointment Cancelled';
            $message = "Your {$serviceLabel} appointment scheduled for {$appointmentDate} at {$appointmentTime} in {$normalizedBranch} has been cancelled.";
        } elseif ($status === 'Confirmed') {
            $title = 'Appointment Confirmed';
            $message = "Your {$serviceLabel} appointment is confirmed for {$appointmentDate} at {$appointmentTime} in {$normalizedBranch}.";
        } elseif ($status === 'Completed') {
            $title = 'Appointment Completed';
            $message = "Your {$serviceLabel} appointment on {$appointmentDate} at {$appointmentTime} has been marked as completed.";
        } else {
            $title = 'Appointment Updated';
            $message = "Your {$serviceLabel} appointment has been updated to {$status} for {$appointmentDate} at {$appointmentTime} in {$normalizedBranch}.";
        }
        
        $notifSql = "INSERT INTO notifications (user_id, title, message, redirect_url) VALUES (?, ?, ?, ?)";
        $notifStmt = $conn->prepare($notifSql);
        $notifStmt->execute([$patientUserId, $title, $message, '/appointment-history']);

        if (!empty($patientUser['email'])) {
            $appBaseUrl = rtrim((string) app_env('APP_BASE_URL', 'http://localhost:5173'), '/');
            $mailSent = send_vivre_email(
                $patientUser['email'],
                $patientUser['first_name'] ?? '',
                $title . " - Vivre Medical Group",
                $title,
                $message,
                $appBaseUrl . '/appointment-history',
                'View Appointment'
            );
            if (!$mailSent) {
                $mailError = get_last_mail_error();
            }
        }
    }

    $response = [
        "status" => "success",
        "message" => "Appointment updated!",
    ];

    if ($mailSent === false) {
        $response["mail_status"] = "failed";
        $response["mail_error"] = $mailError ?: 'Unable to send patient email notification.';
        $response["message"] = "Appointment updated, but the patient email could not be sent.";
    } elseif ($mailSent === true) {
        $response["mail_status"] = "sent";
    }

    echo json_encode($response);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Update failed: " . $e->getMessage()]);
}
?>
