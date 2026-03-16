<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';
require_once 'Encryption.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['user_id']) || !$data['user_id']) {
    echo json_encode(['status' => 'error', 'message' => 'Missing user_id.']);
    exit;
}

$user_id = intval($data['user_id']);

try {
    // ── Update users table (names, email — not sensitive enough to encrypt) ──
    $stmt = $conn->prepare("
        UPDATE users
        SET first_name = ?, middle_name = ?, last_name = ?, extension_name = ?,
            nickname = ?, email = ?
        WHERE user_id = ?
    ");
    $stmt->execute([
        $data['first_name']     ?? '',
        $data['middle_name']    ?? '',
        $data['last_name']      ?? '',
        $data['extension_name'] ?? '',
        $data['nickname']       ?? '',
        $data['email']          ?? '',
        $user_id
    ]);

    // ── Update patients table ──
    //    Sensitive text fields encrypted via Encryption::encrypt() — AES-256-CBC
    $stmt = $conn->prepare("
        UPDATE patients SET
            age                    = ?,
            sex                    = ?,
            address                = ?,
            phone                  = ?,
            tooth_extraction       = ?,
            surgical_procedures    = ?,
            allergies              = ?,
            aesthetic_procedures   = ?,
            pregnant               = ?,
            untoward_reactions     = ?,
            heart_disease          = ?,
            hypertension           = ?,
            diabetes               = ?,
            hyperthyroidism        = ?,
            autoimmune_disease     = ?,
            cancer                 = ?,
            renal_failure          = ?,
            liver_disease          = ?,
            bronchial_asthma       = ?,
            pulmonary_disease      = ?,
            infectious_disease     = ?,
            others                 = ?,
            medications            = ?,
            current_skin_treatment = ?
        WHERE user_id = ?
    ");

    $stmt->execute([
        $data['age']     ?? null,
        $data['sex']     ?? null,
        $data['address'] ?? '',
        $data['phone']   ?? '',

        !empty($data['tooth_extraction']) ? 1 : 0,

        // ✅ Encrypted at rest
        Encryption::encrypt($data['surgical_procedures']    ?? ''),
        Encryption::encrypt($data['allergies']              ?? ''),
        Encryption::encrypt($data['aesthetic_procedures']   ?? ''),
        $data['pregnant']                                   ?? 'No',
        Encryption::encrypt($data['untoward_reactions']     ?? ''),

        // Boolean illness flags — 0/1, no encryption needed
        !empty($data['heart_disease'])        ? 1 : 0,
        !empty($data['hypertension'])         ? 1 : 0,
        !empty($data['diabetes'])             ? 1 : 0,
        !empty($data['hyperthyroidism'])      ? 1 : 0,
        !empty($data['autoimmune_disease'])   ? 1 : 0,
        !empty($data['cancer'])               ? 1 : 0,
        !empty($data['renal_failure'])        ? 1 : 0,
        !empty($data['liver_disease'])        ? 1 : 0,
        !empty($data['bronchial_asthma'])     ? 1 : 0,
        !empty($data['pulmonary_disease'])    ? 1 : 0,
        !empty($data['infectious_disease'])   ? 1 : 0,

        // ✅ Encrypted at rest (cont.)
        Encryption::encrypt($data['others']                 ?? ''),
        Encryption::encrypt($data['medications']            ?? ''),
        Encryption::encrypt($data['current_skin_treatment'] ?? ''),

        $user_id
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Patient updated successfully.']);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>