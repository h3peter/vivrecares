<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['action']) || !isset($data['user_ids'])) {
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
    exit;
}

$action = $data['action']; // This will be either 'archive' or 'restore'

// Ensure we are working with an array, even if only one ID is sent
$userIds = is_array($data['user_ids']) ? $data['user_ids'] : [$data['user_ids']];

if (empty($userIds)) {
    echo json_encode(["status" => "error", "message" => "No users selected."]);
    exit;
}

try {
    $conn->beginTransaction();

    // Dynamically create the correct number of question marks for the SQL query
    $placeholders = implode(',', array_fill(0, count($userIds), '?'));

    if ($action === 'archive') {
        // Stamp the current date to soft delete
        $sql = "UPDATE users SET deleted_at = NOW() WHERE user_id IN ($placeholders)";
    } else if ($action === 'restore') {
        // Remove the stamp to restore the account
        $sql = "UPDATE users SET deleted_at = NULL WHERE user_id IN ($placeholders)";
    } else {
        throw new Exception("Invalid action.");
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute($userIds);

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Records updated successfully."]);

} catch (Exception $e) {
    $conn->rollBack();
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}
?>