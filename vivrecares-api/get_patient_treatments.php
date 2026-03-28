<?php
require_once 'auth.php';
require_once 'config.php';

init_api_auth();

$patient_id = $_GET['patient_id'] ?? null;

if (!$patient_id) {
    echo json_encode(["status" => "error", "message" => "Patient ID is required"]);
    exit;
}

$patientUserStmt = $conn->prepare("SELECT user_id FROM patients WHERE patient_id = ? LIMIT 1");
$patientUserStmt->execute([$patient_id]);
$patientUserId = $patientUserStmt->fetchColumn();

if (!$patientUserId) {
    echo json_encode(["status" => "error", "message" => "Patient not found."]);
    exit;
}

require_same_user_or_roles($patientUserId, ['Admin', 'Doctor']);

try {
    // We use COALESCE again just in case the bill is tied to an appointment instead of the patient directly
    $sql = "SELECT bi.description, bi.quantity, bi.total_price, b.payment_date, b.payment_status, b.invoice_id
            FROM billing_items bi
            JOIN billings b ON bi.invoice_id = b.invoice_id
            LEFT JOIN appointments a ON b.appointment_id = a.appointment_id
            WHERE COALESCE(b.patient_id, a.patient_id) = ?
            ORDER BY b.payment_date DESC";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([$patient_id]);
    $treatments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $treatments]);

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
