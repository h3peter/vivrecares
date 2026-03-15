<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once 'config.php';

$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "User ID is required"]);
    exit;
}

try {
    $sql = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$user_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Count unread alerts for the red badge
    $unreadSql = "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0";
    $unreadStmt = $conn->prepare($unreadSql);
    $unreadStmt->execute([$user_id]);
    $unreadCount = $unreadStmt->fetchColumn();

    echo json_encode([
        "status" => "success", 
        "data" => $notifications, 
        "unread_count" => $unreadCount
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error"]);
}
?>