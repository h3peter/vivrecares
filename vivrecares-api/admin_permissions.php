<?php

require_once 'auth.php';
require_once 'config.php';

if (!function_exists('admin_permission_definitions')) {
    function admin_permission_definitions()
    {
        return [
            'dashboard' => 'Dashboard',
            'patients' => 'Manage Patients',
            'appointments' => 'Appointment Logs',
            'billing' => 'Billing & Payments',
            'reports' => 'Reports',
            'imports' => 'Import',
            'settings' => 'Settings',
        ];
    }
}

if (!function_exists('all_admin_permission_keys')) {
    function all_admin_permission_keys()
    {
        return array_keys(admin_permission_definitions());
    }
}

if (!function_exists('ensure_admin_permissions_schema')) {
    function ensure_admin_permissions_schema(PDO $conn)
    {
        static $checked = false;
        if ($checked) {
            return;
        }

        $superColumn = $conn->query("SHOW COLUMNS FROM users LIKE 'is_super_admin'")->fetch(PDO::FETCH_ASSOC);
        if (!$superColumn) {
            $conn->exec("ALTER TABLE users ADD COLUMN is_super_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER role");
        }

        $permissionsColumn = $conn->query("SHOW COLUMNS FROM users LIKE 'admin_permissions'")->fetch(PDO::FETCH_ASSOC);
        if (!$permissionsColumn) {
            $conn->exec("ALTER TABLE users ADD COLUMN admin_permissions TEXT NULL AFTER is_super_admin");
        }

        $superCount = (int) $conn->query("SELECT COUNT(*) FROM users WHERE role = 'Admin' AND is_super_admin = 1 AND deleted_at IS NULL")->fetchColumn();
        if ($superCount === 0) {
            $firstAdminId = $conn->query("SELECT user_id FROM users WHERE role = 'Admin' AND deleted_at IS NULL ORDER BY user_id ASC LIMIT 1")->fetchColumn();
            if ($firstAdminId) {
                $stmt = $conn->prepare("UPDATE users SET is_super_admin = 1 WHERE user_id = ?");
                $stmt->execute([(int) $firstAdminId]);
            }
        }

        $checked = true;
    }
}

if (!function_exists('normalize_admin_permissions')) {
    function normalize_admin_permissions($rawPermissions, $isSuperAdmin = false)
    {
        $all = all_admin_permission_keys();
        if ($isSuperAdmin) {
            return $all;
        }

        if ($rawPermissions === null || $rawPermissions === '') {
            return $all;
        }

        $decoded = is_array($rawPermissions) ? $rawPermissions : json_decode((string) $rawPermissions, true);
        if (!is_array($decoded)) {
            return $all;
        }

        return array_values(array_intersect($all, array_map('strval', $decoded)));
    }
}

if (!function_exists('get_admin_access_for_user')) {
    function get_admin_access_for_user(PDO $conn, $userId)
    {
        ensure_admin_permissions_schema($conn);

        $stmt = $conn->prepare("SELECT role, is_super_admin, admin_permissions FROM users WHERE user_id = ? AND deleted_at IS NULL LIMIT 1");
        $stmt->execute([(int) $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || ($user['role'] ?? '') !== 'Admin') {
            return [
                'is_super_admin' => false,
                'permissions' => [],
                'definitions' => admin_permission_definitions(),
            ];
        }

        $isSuperAdmin = !empty($user['is_super_admin']);
        return [
            'is_super_admin' => $isSuperAdmin,
            'permissions' => normalize_admin_permissions($user['admin_permissions'] ?? null, $isSuperAdmin),
            'definitions' => admin_permission_definitions(),
        ];
    }
}

if (!function_exists('require_admin_permission')) {
    function require_admin_permission(PDO $conn, $permission)
    {
        $authUser = require_roles(['Admin']);
        $access = get_admin_access_for_user($conn, $authUser['user_id'] ?? 0);

        if (!in_array($permission, $access['permissions'], true)) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "This admin task is not available for your account."]);
            exit;
        }

        return $authUser;
    }
}

?>
