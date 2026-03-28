<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'mail_helper.php';

init_api_auth();
$authenticatedUser = require_roles(['Doctor', 'Admin']);

$data = json_decode(file_get_contents("php://input"), true);

if (
    !$data ||
    empty($data['patient_id']) ||
    empty($data['doctor_user_id']) ||
    (empty(trim($data['diagnosis'] ?? '')) && empty(trim($data['treatment_plan'] ?? '')) && empty(trim($data['consultation_notes'] ?? '')))
) {
    echo json_encode(["status" => "error", "message" => "Missing required consultation note fields."]);
    exit;
}

try {
    if ((int) $authenticatedUser['user_id'] !== (int) $data['doctor_user_id'] && $authenticatedUser['role'] !== 'Admin') {
        throw new Exception('You cannot save consultation notes on behalf of another doctor.');
    }

    $doctorStmt = $conn->prepare("SELECT role, first_name FROM users WHERE user_id = ? AND deleted_at IS NULL LIMIT 1");
    $doctorStmt->execute([$data['doctor_user_id']]);
    $doctor = $doctorStmt->fetch(PDO::FETCH_ASSOC);

    if (!$doctor || !in_array($doctor['role'], ['Doctor', 'Admin'], true)) {
        throw new Exception('Only Doctor or Admin users can save consultation notes.');
    }

    $sql = "INSERT INTO consultation_notes
            (patient_id, doctor_user_id, appointment_id, diagnosis, treatment_plan, prescriptions, consultation_notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        $data['patient_id'],
        $data['doctor_user_id'],
        !empty($data['appointment_id']) ? $data['appointment_id'] : null,
        trim($data['diagnosis'] ?? ''),
        trim($data['treatment_plan'] ?? ''),
        trim($data['prescriptions'] ?? ''),
        trim($data['consultation_notes'] ?? ''),
    ]);

    $patientUserStmt = $conn->prepare("SELECT p.user_id, u.email, u.first_name
                                       FROM patients p
                                       JOIN users u ON p.user_id = u.user_id
                                       WHERE p.patient_id = ? LIMIT 1");
    $patientUserStmt->execute([$data['patient_id']]);
    $patientUser = $patientUserStmt->fetch(PDO::FETCH_ASSOC);
    $patientUserId = $patientUser['user_id'] ?? null;

    if ($patientUserId) {
        $message = trim(($doctor['first_name'] ?? 'Doctor') . " added a consultation note to your record.");
        $notifStmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, redirect_url) VALUES (?, ?, ?, ?)");
        $notifStmt->execute([
            $patientUserId,
            'Consultation Update',
            $message,
            '/profile'
        ]);

        if (!empty($patientUser['email'])) {
            $appBaseUrl = rtrim((string) app_env('APP_BASE_URL', 'http://localhost:5173'), '/');
            send_vivre_email(
                $patientUser['email'],
                $patientUser['first_name'] ?? '',
                'Consultation Record Updated - Vivre Medical Group',
                'Consultation Record Updated',
                $message,
                $appBaseUrl . '/profile',
                'View Profile'
            );
        }
    }

    echo json_encode(["status" => "success", "message" => "Consultation note saved."]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
