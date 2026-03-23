<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'mail_helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

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

    $branchMap = [
        'pasay branch' => 'Pasay Branch',
        'valenzuela branch' => 'Valenzuela Branch',
        'main branch' => 'Pasay Branch',
    ];
    $branchKey = strtolower($rawBranch);
    $normalizedBranch = $branchMap[$branchKey] ?? $rawBranch;

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

    if ($status !== 'Cancelled') {
        $weekday = (int) date('w', strtotime($appointmentDate));

        $availabilityStmt = $conn->prepare("SELECT is_active FROM appointment_availability WHERE branch = ? AND weekday = ? LIMIT 1");
        $availabilityStmt->execute([$normalizedBranch, $weekday]);
        $isDayActive = $availabilityStmt->fetchColumn();

        if ((int) $isDayActive !== 1) {
            throw new Exception('The selected date is not available for this branch.');
        }

        $slotStmt = $conn->prepare("SELECT slot_label FROM appointment_slots WHERE branch = ? AND slot_time = ? AND is_active = 1 LIMIT 1");
        $slotStmt->execute([$normalizedBranch, $appointmentTime]);
        $slotLabel = $slotStmt->fetchColumn();

        if (!$slotLabel) {
            throw new Exception('The selected time slot is not available.');
        }

        $conflictStmt = $conn->prepare("
            SELECT appointment_id
            FROM appointments
            WHERE branch = ?
              AND appointment_date = ?
              AND appointment_time = ?
              AND status IN ('Pending', 'Confirmed')
              AND appointment_id <> ?
            LIMIT 1
        ");
        $conflictStmt->execute([$normalizedBranch, $appointmentDate, $appointmentTime, $data['appointment_id']]);
        if ($conflictStmt->fetchColumn()) {
            throw new Exception('The selected time slot is already reserved for that branch and day.');
        }
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
