<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'admin_permissions.php';

init_api_auth();
$authUser = require_roles(['Admin', 'Doctor']);
if (($authUser['role'] ?? '') === 'Admin') {
    require_admin_permission($conn, 'patients');
}

$isArchived = isset($_GET['archived']) && $_GET['archived'] == '1';

try {
    if ($isArchived) {
        $sql = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.profile_photo, u.created_at, p.patient_id, p.age, p.sex, p.address, p.phone
                FROM users u
                JOIN patients p ON u.user_id = p.user_id
                WHERE u.role = 'Patient' AND u.deleted_at IS NOT NULL
                ORDER BY u.created_at DESC, u.user_id DESC";
    } else {
        $sql = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.profile_photo, u.created_at, p.patient_id, p.age, p.sex, p.address, p.phone
                FROM users u
                JOIN patients p ON u.user_id = p.user_id
                WHERE u.role = 'Patient' AND u.deleted_at IS NULL
                ORDER BY u.created_at DESC, u.user_id DESC";
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $patients = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($patients);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>
