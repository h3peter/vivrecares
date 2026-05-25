<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'admin_security.php';
require_once 'branch_helper.php';

init_api_auth();

$data = json_decode(file_get_contents("php://input"), true);
require_admin_password($conn, is_array($data) ? $data : []);

$branchId = isset($data['branch_id']) ? (int) $data['branch_id'] : 0;
$branchName = normalize_clinic_branch_name($data['branch_name'] ?? '');
$address = trim((string) ($data['address'] ?? ''));
$isActive = !empty($data['is_active']) ? 1 : 0;

if ($branchName === '') {
    echo json_encode(["status" => "error", "message" => "Branch name is required."]);
    exit;
}

try {
    ensure_branch_schema($conn);
    $conn->beginTransaction();

    if ($branchId > 0) {
        $stmt = $conn->prepare("UPDATE clinic_branches SET branch_name = ?, address = ?, is_active = ? WHERE branch_id = ?");
        $stmt->execute([$branchName, $address !== '' ? $address : null, $isActive, $branchId]);
    } else {
        $stmt = $conn->prepare("INSERT INTO clinic_branches (branch_name, address, is_active) VALUES (?, ?, ?)");
        $stmt->execute([$branchName, $address !== '' ? $address : null, $isActive]);
        $branchId = (int) $conn->lastInsertId();
    }

    ensure_branch_schedule_defaults($conn, $branchName);

    $conn->commit();
    echo json_encode([
        "status" => "success",
        "message" => $isActive ? "Branch saved." : "Branch archived for new selections.",
        "branch_id" => $branchId,
    ]);
} catch (PDOException $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    $errorCode = $e->errorInfo[1] ?? null;
    if ((string) $e->getCode() === '23000' || (int) $errorCode === 1062) {
        echo json_encode(["status" => "error", "message" => "Branch name already exists."]);
        exit;
    }

    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
