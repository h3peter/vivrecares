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

    // 1. Update the appointment (Your original working code)
    $sql = "UPDATE appointments 
            SET appointment_date = ?, 
                appointment_time = ?, 
                branch = ?, 
                status = ? 
            WHERE appointment_id = ?";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $data['date'],
        $data['time'],
        $data['branch'],
        $data['status'],
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
        $normalizedBranch = $data['branch'] === 'Main Branch' ? 'Pasay Branch' : $data['branch'];
        $serviceLabel = $currentAppointment['appointment_type'] ?: 'appointment';
        $status = (string) $data['status'];

        if ($status === 'Cancelled') {
            $title = 'Appointment Cancelled';
            $message = "Your {$serviceLabel} appointment scheduled for {$data['date']} at {$data['time']} in {$normalizedBranch} has been cancelled.";
        } elseif ($status === 'Confirmed') {
            $title = 'Appointment Confirmed';
            $message = "Your {$serviceLabel} appointment is confirmed for {$data['date']} at {$data['time']} in {$normalizedBranch}.";
        } elseif ($status === 'Completed') {
            $title = 'Appointment Completed';
            $message = "Your {$serviceLabel} appointment on {$data['date']} at {$data['time']} has been marked as completed.";
        } else {
            $title = 'Appointment Updated';
            $message = "Your {$serviceLabel} appointment has been updated to {$status} for {$data['date']} at {$data['time']} in {$normalizedBranch}.";
        }
        
        $notifSql = "INSERT INTO notifications (user_id, title, message, redirect_url) VALUES (?, ?, ?, ?)";
        $notifStmt = $conn->prepare($notifSql);
        $notifStmt->execute([$patientUserId, $title, $message, '/appointment-history']);

        if (!empty($patientUser['email'])) {
            $appBaseUrl = rtrim((string) app_env('APP_BASE_URL', 'http://localhost:5173'), '/');
            send_vivre_email(
                $patientUser['email'],
                $patientUser['first_name'] ?? '',
                $title . " - Vivre Medical Group",
                $title,
                $message,
                $appBaseUrl . '/appointment-history',
                'View Appointment'
            );
        }
    }

    echo json_encode(["status" => "success", "message" => "Appointment updated!"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Update failed: " . $e->getMessage()]);
}
?>
