<?php

require_once 'auth.php';
require_once 'config.php';

if (!function_exists('ensure_admin_password_schema')) {
    function ensure_admin_password_schema(PDO $conn)
    {
        static $checked = false;
        if ($checked) {
            return;
        }

        $columnStmt = $conn->query("SHOW COLUMNS FROM users LIKE 'admin_password_hash'");
        if (!$columnStmt->fetch(PDO::FETCH_ASSOC)) {
            $conn->exec("ALTER TABLE users ADD COLUMN admin_password_hash VARCHAR(255) NULL AFTER password");
        }

        $checked = true;
    }
}

if (!function_exists('require_admin_password')) {
    function require_admin_password(PDO $conn, array $data)
    {
        $authUser = require_roles(['Admin']);
        ensure_admin_password_schema($conn);

        $adminPassword = (string) ($data['admin_password'] ?? '');
        if ($adminPassword === '') {
            echo json_encode([
                "status" => "error",
                "code" => "admin_password_required",
                "message" => "Admin password is required for this action.",
            ]);
            exit;
        }

        $stmt = $conn->prepare("SELECT admin_password_hash FROM users WHERE user_id = ? AND role = 'Admin' AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([(int) ($authUser['user_id'] ?? 0)]);
        $hash = $stmt->fetchColumn();

        if (!$hash) {
            echo json_encode([
                "status" => "error",
                "code" => "admin_password_not_set",
                "message" => "Set your admin password before performing this protected action.",
            ]);
            exit;
        }

        if (!password_verify($adminPassword, (string) $hash)) {
            echo json_encode([
                "status" => "error",
                "code" => "admin_password_invalid",
                "message" => "Admin password is incorrect.",
            ]);
            exit;
        }

        return $authUser;
    }
}

?>
