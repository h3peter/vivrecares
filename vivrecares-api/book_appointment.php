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
    // Added branch to the INSERT statement
    $sql = "INSERT INTO appointments (patient_id, branch, appointment_date, appointment_time, appointment_type, concerns, status) 
            VALUES (?, ?, ?, ?, ?, ?, 'Pending')";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $data['patientId'],
        $data['branch'], // Added branch variable
        $data['date'],
        $data['time'],
        $data['type'],
        $data['concerns']
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