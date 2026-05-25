<?php

require_once 'config.php';

if (!function_exists('ensure_branch_schema')) {
    function ensure_branch_schema(PDO $conn)
    {
        static $initialized = false;
        if ($initialized) {
            return;
        }

        $conn->exec("
            CREATE TABLE IF NOT EXISTS clinic_branches (
                branch_id INT AUTO_INCREMENT PRIMARY KEY,
                branch_name VARCHAR(120) NOT NULL UNIQUE,
                address VARCHAR(255) NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        $seedStmt = $conn->prepare("
            INSERT INTO clinic_branches (branch_name, is_active)
            VALUES (?, 1)
            ON DUPLICATE KEY UPDATE branch_name = VALUES(branch_name)
        ");
        $seedStmt->execute(['Pasay Branch']);
        $seedStmt->execute(['Valenzuela Branch']);

        $initialized = true;
    }
}

if (!function_exists('normalize_clinic_branch_name')) {
    function normalize_clinic_branch_name($rawBranch)
    {
        $branch = trim((string) $rawBranch);
        if ($branch === '') {
            return '';
        }

        $legacyMap = [
            'main branch' => 'Pasay Branch',
            'pasay branch' => 'Pasay Branch',
            'valenzuela branch' => 'Valenzuela Branch',
        ];

        $key = strtolower($branch);
        return $legacyMap[$key] ?? preg_replace('/\s+/', ' ', $branch);
    }
}

if (!function_exists('get_active_clinic_branches')) {
    function get_active_clinic_branches(PDO $conn)
    {
        ensure_branch_schema($conn);
        $stmt = $conn->query("SELECT branch_name FROM clinic_branches WHERE is_active = 1 ORDER BY branch_name ASC");
        return array_map(function ($row) {
            return $row['branch_name'];
        }, $stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

if (!function_exists('clinic_branch_exists')) {
    function clinic_branch_exists(PDO $conn, $branchName, $activeOnly = true)
    {
        ensure_branch_schema($conn);
        $branchName = normalize_clinic_branch_name($branchName);
        $sql = "SELECT branch_id FROM clinic_branches WHERE branch_name = ?";
        if ($activeOnly) {
            $sql .= " AND is_active = 1";
        }
        $sql .= " LIMIT 1";

        $stmt = $conn->prepare($sql);
        $stmt->execute([$branchName]);
        return (bool) $stmt->fetchColumn();
    }
}

if (!function_exists('ensure_branch_schedule_defaults')) {
    function ensure_branch_schedule_defaults(PDO $conn, $branchName)
    {
        $branchName = normalize_clinic_branch_name($branchName);
        if ($branchName === '') {
            return;
        }

        $weekdays = [
            0 => 'Sunday',
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday',
        ];

        $stmt = $conn->prepare("
            INSERT INTO appointment_availability (branch, weekday, weekday_name, is_active)
            VALUES (?, ?, ?, 0)
            ON DUPLICATE KEY UPDATE weekday_name = VALUES(weekday_name)
        ");

        foreach ($weekdays as $weekday => $weekdayName) {
            $stmt->execute([$branchName, $weekday, $weekdayName]);
        }
    }
}

?>
