<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'branch_helper.php';

init_api_auth();

try {
    ensure_branch_schema($conn);
    $stmt = $conn->query("SELECT branch_id, branch_name, address, is_active, created_at
                          FROM clinic_branches
                          ORDER BY is_active DESC, branch_name ASC");

    echo json_encode([
        "status" => "success",
        "branches" => $stmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
