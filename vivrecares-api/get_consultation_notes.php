<?php
require_once 'auth.php';
require_once 'config.php';

init_api_auth();

$patientId = $_GET['patient_id'] ?? null;

if (!$patientId) {
    echo json_encode(["status" => "error", "message" => "Patient ID is required."]);
    exit;
}

$patientUserStmt = $conn->prepare("SELECT user_id FROM patients WHERE patient_id = ? LIMIT 1");
$patientUserStmt->execute([$patientId]);
$patientUserId = $patientUserStmt->fetchColumn();

if (!$patientUserId) {
    echo json_encode(["status" => "error", "message" => "Patient not found."]);
    exit;
}

require_same_user_or_roles($patientUserId, ['Admin', 'Doctor']);

try {
    $sql = "SELECT cn.note_id, cn.patient_id, cn.doctor_user_id, cn.appointment_id,
                   cn.diagnosis, cn.treatment_plan, cn.prescriptions, cn.consultation_notes,
                   cn.created_at, cn.updated_at,
                   u.first_name AS doctor_first_name, u.last_name AS doctor_last_name
            FROM consultation_notes cn
            LEFT JOIN users u ON cn.doctor_user_id = u.user_id
            WHERE cn.patient_id = ?
            ORDER BY cn.created_at DESC, cn.note_id DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$patientId]);
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
