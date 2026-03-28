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
    $sql = "SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.status,
                   CASE WHEN a.branch = 'Main Branch' THEN 'Pasay Branch' ELSE a.branch END AS branch,
                   COALESCE(s.service_name, a.appointment_type) AS appointment_type,
                   a.concerns,
                   (SELECT cn.diagnosis
                    FROM consultation_notes cn
                    WHERE cn.patient_id = a.patient_id
                      AND (cn.appointment_id = a.appointment_id OR cn.appointment_id IS NULL)
                    ORDER BY cn.created_at DESC
                    LIMIT 1) AS latest_diagnosis,
                   (SELECT cn.treatment_plan
                    FROM consultation_notes cn
                    WHERE cn.patient_id = a.patient_id
                      AND (cn.appointment_id = a.appointment_id OR cn.appointment_id IS NULL)
                    ORDER BY cn.created_at DESC
                    LIMIT 1) AS latest_treatment_plan
            FROM appointments a
            LEFT JOIN services s ON a.service_id = s.service_id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$patientId]);
    echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
