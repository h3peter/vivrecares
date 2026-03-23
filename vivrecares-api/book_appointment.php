<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "message" => "Empty booking data."]);
    exit;
}

try {
    $branch = $data['branch'] ?? '';
    $appointmentDate = $data['date'] ?? '';
    $appointmentTime = $data['time'] ?? '';
    $serviceId = !empty($data['service_id']) ? (int) $data['service_id'] : null;
    $appointmentType = trim($data['type'] ?? '');

    if (!$branch || !$appointmentDate || !$appointmentTime) {
        throw new Exception('Branch, date, and time are required.');
    }

    if (empty($data['patientId'])) {
        throw new Exception('Patient profile is missing. Please refresh and try again.');
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

    $weekday = (int) date('w', strtotime($appointmentDate));

    $availabilityStmt = $conn->prepare("SELECT is_active FROM appointment_availability WHERE branch = ? AND weekday = ? LIMIT 1");
    $availabilityStmt->execute([$branch, $weekday]);
    $isDayActive = $availabilityStmt->fetchColumn();

    if ((int) $isDayActive !== 1) {
        throw new Exception('The selected date is not available for this branch.');
    }

    $slotStmt = $conn->prepare("SELECT slot_label FROM appointment_slots WHERE branch = ? AND slot_time = ? AND is_active = 1 LIMIT 1");
    $slotStmt->execute([$branch, $appointmentTime]);
    $slotLabel = $slotStmt->fetchColumn();

    if (!$slotLabel) {
        throw new Exception('The selected time slot is not available.');
    }

    $sql = "INSERT INTO appointments (patient_id, service_id, branch, appointment_date, appointment_time, appointment_type, concerns, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $data['patientId'],
        $serviceId,
        $branch,
        $appointmentDate,
        $appointmentTime,
        $appointmentType,
        $data['concerns'] ?? ''
    ]);

    $adminSql = "SELECT user_id FROM users WHERE role = 'admin' LIMIT 1";
    $adminStmt = $conn->prepare($adminSql);
    $adminStmt->execute();
    $adminId = $adminStmt->fetchColumn();

    if ($adminId) {
        $notifSql = "INSERT INTO notifications (user_id, title, message) VALUES (?, 'New Appointment', 'A patient requested a new appointment.')";
        $notifStmt = $conn->prepare($notifSql);
        $notifStmt->execute([$adminId]);
    }

    echo json_encode(["status" => "success", "message" => "Appointment requested!"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Booking failed: " . $e->getMessage()]);
}
?>
