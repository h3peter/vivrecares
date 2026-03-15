<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['appointment_id'])) {
    echo json_encode(["status" => "error", "message" => "Missing appointment ID."]);
    exit;
}

try {
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
    $userSql = "SELECT p.user_id 
                FROM appointments a 
                JOIN patients p ON a.patient_id = p.patient_id 
                WHERE a.appointment_id = ?";
    $userStmt = $conn->prepare($userSql);
    $userStmt->execute([$data['appointment_id']]);
    $patientUserId = $userStmt->fetchColumn();

    // 3. Send the notification if the patient account is found
    if ($patientUserId) {
        $title = "Appointment " . $data['status'];
        $message = "Your appointment on " . $data['date'] . " has been marked as " . $data['status'] . ".";
        
        $notifSql = "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)";
        $notifStmt = $conn->prepare($notifSql);
        $notifStmt->execute([$patientUserId, $title, $message]);
    }

    echo json_encode(["status" => "success", "message" => "Appointment updated!"]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Update failed: " . $e->getMessage()]);
}
?>