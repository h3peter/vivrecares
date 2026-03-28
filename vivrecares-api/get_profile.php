<?php
header("Content-Type: application/json");

require_once 'config.php';
require_once 'auth.php';
require_once 'Encryption.php';

init_api_auth();

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "No user ID provided."]);
    exit;
}

require_same_user_or_roles($user_id, ['Admin', 'Doctor']);

// Fields in the patients table that are stored encrypted
$encryptedFields = [
    'allergies',
    'surgical_procedures',
    'aesthetic_procedures',
    'untoward_reactions',
    'medications',
    'others',
    'current_skin_treatment',
];

try {
    $sql = "SELECT 
                u.first_name, u.last_name, u.middle_name, u.extension_name, u.nickname,
                u.email, u.profile_photo, u.role, u.created_at,
                p.*
            FROM users u
            LEFT JOIN patients p ON u.user_id = p.user_id
            WHERE u.user_id = ? AND u.deleted_at IS NULL";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$user_id]);
    $profile = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($profile) {
        // Decrypt each sensitive field before returning to the frontend.
        // Encryption::decrypt() will return the raw value if decryption fails,
        // so existing plain-text rows from before encryption was added are safe.
        foreach ($encryptedFields as $field) {
            if (isset($profile[$field]) && $profile[$field] !== '') {
                try {
                    $decrypted = Encryption::decrypt($profile[$field]);
                    $profile[$field] = $decrypted !== false ? $decrypted : $profile[$field];
                } catch (Exception $e) {
                    // If decryption throws (e.g. old plain-text row), leave value as-is
                }
            }
        }

        echo json_encode(["status" => "success", "data" => $profile]);
    } else {
        echo json_encode(["status" => "error", "message" => "Profile not found."]);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
