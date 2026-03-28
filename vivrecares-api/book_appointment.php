<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'appointment_validation.php';
require_once 'mail_helper.php';

init_api_auth();
$authenticatedUser = require_roles(['Patient', 'Admin']);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Empty booking data."]);
    exit;
}

try {
    $rawBranch = trim($data['branch'] ?? '');
    $appointmentDate = $data['date'] ?? '';
    $appointmentTime = $data['time'] ?? '';
    $serviceId = !empty($data['service_id']) ? (int) $data['service_id'] : null;
    $appointmentType = trim($data['type'] ?? '');

    $branch = normalize_appointment_branch($rawBranch);

    if (!$branch || !$appointmentDate || !$appointmentTime) {
        throw new Exception('Branch, date, and time are required.');
    }

    $requestedPatientId = !empty($data['patientId']) ? (int) $data['patientId'] : 0;
    if ($requestedPatientId <= 0) {
        throw new Exception('Patient profile is missing. Please refresh and try again.');
    }

    $patientScopeStmt = $conn->prepare("SELECT patient_id FROM patients WHERE user_id = ? LIMIT 1");
    $patientScopeStmt->execute([(int) $authenticatedUser['user_id']]);
    $sessionPatientId = (int) $patientScopeStmt->fetchColumn();

    if ($authenticatedUser['role'] === 'Patient') {
        if ($sessionPatientId <= 0) {
            throw new Exception('No patient profile is linked to this account.');
        }
        if ($sessionPatientId !== $requestedPatientId) {
            throw new Exception('You can only request appointments for your own account.');
        }
    } elseif ($authenticatedUser['role'] === 'Admin' && $requestedPatientId <= 0) {
        throw new Exception('A valid patient profile is required.');
    }

    if ($serviceId) {
        $serviceStmt = $conn->prepare("SELECT service_name, is_active FROM services WHERE service_id = ? LIMIT 1");
        $serviceStmt->execute([$serviceId]);
        $service = $serviceStmt->fetch(PDO::FETCH_ASSOC);

        if (!$service || (int) $service['is_active'] !== 1) {
            throw new Exception('The selected service is no longer available.');
        }

        if ($appointmentType === '') {
            $appointmentType = $service['service_name'];
        }
    }

    if ($appointmentType === '') {
        $appointmentType = 'General Inquiry';
    }

    $schedule = validate_appointment_schedule($conn, $branch, $appointmentDate, $appointmentTime, null, ['Confirmed']);
    $branch = $schedule['branch'];
    $slotLabel = $schedule['slot_label'];

    $sql = "INSERT INTO appointments (patient_id, service_id, branch, appointment_date, appointment_time, appointment_type, concerns, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $requestedPatientId,
        $serviceId,
        $branch,
        $appointmentDate,
        $appointmentTime,
        $appointmentType,
        $data['concerns'] ?? ''
    ]);

    $patientNameStmt = $conn->prepare("SELECT u.user_id, u.first_name, u.last_name, u.email
                                       FROM patients p
                                       JOIN users u ON p.user_id = u.user_id
                                       WHERE p.patient_id = ?
                                       LIMIT 1");
    $patientNameStmt->execute([$requestedPatientId]);
    $patientName = $patientNameStmt->fetch(PDO::FETCH_ASSOC);
    $fullName = trim(($patientName['first_name'] ?? 'Patient') . ' ' . ($patientName['last_name'] ?? ''));
    $patientUserId = $patientName['user_id'] ?? null;

    $staffStmt = $conn->query("SELECT user_id, role, first_name, email FROM users WHERE role IN ('Admin', 'Doctor') AND deleted_at IS NULL");
    $staffRows = $staffStmt->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($staffRows)) {
        $notifMessage = $fullName . " requested an appointment for " . $appointmentDate . " at " . $slotLabel . ".";
        $notifSql = "INSERT INTO notifications (user_id, title, message, redirect_url) VALUES (?, 'New Appointment', ?, ?)";
        $notifStmt = $conn->prepare($notifSql);
        $appBaseUrl = rtrim((string) app_env('APP_BASE_URL', 'http://localhost:5173'), '/');
        foreach ($staffRows as $staff) {
            $redirect = $staff['role'] === 'Doctor'
                ? ($patientUserId ? "/doctor/patient/" . $patientUserId : "/doctor/appointments")
                : "/admin/appointments";
            $notifStmt->execute([$staff['user_id'], $notifMessage, $redirect]);

            if (!empty($staff['email'])) {
                send_vivre_email(
                    $staff['email'],
                    $staff['first_name'] ?? '',
                    'New Appointment Request - Vivre Medical Group',
                    'New Appointment Request',
                    $notifMessage,
                    $appBaseUrl . $redirect,
                    'View Appointment'
                );
            }
        }
    }

    if ($patientUserId) {
        $patientMessage = "Your appointment request for " . $appointmentDate . " at " . $slotLabel . " has been submitted.";
        $patientNotifStmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, redirect_url) VALUES (?, ?, ?, ?)");
        $patientNotifStmt->execute([$patientUserId, 'Appointment Requested', $patientMessage, '/appointment-history']);

        if (!empty($patientName['email'])) {
            $appBaseUrl = rtrim((string) app_env('APP_BASE_URL', 'http://localhost:5173'), '/');
            send_vivre_email(
                $patientName['email'],
                $patientName['first_name'] ?? '',
                'Appointment Request Submitted - Vivre Medical Group',
                'Appointment Request Submitted',
                $patientMessage,
                $appBaseUrl . '/appointment-history',
                'View Appointment'
            );
        }
    }

    echo json_encode(["status" => "success", "message" => "Appointment requested!"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Booking failed: " . $e->getMessage()]);
}
?>
