<?php

require_once 'appointment_validation.php';
require_once 'branch_helper.php';

if (!function_exists('normalize_billing_branch')) {
    function normalize_billing_branch($rawBranch)
    {
        $normalized = normalize_appointment_branch($rawBranch);
        return $normalized ? $normalized : null;
    }
}

if (!function_exists('validate_billing_branch')) {
    function validate_billing_branch(PDO $conn, $rawBranch)
    {
        $branch = normalize_billing_branch($rawBranch);
        if (!$branch || !clinic_branch_exists($conn, $branch, true)) {
            throw new Exception('Branch is required and must be active.');
        }
        return $branch;
    }
}

if (!function_exists('ensure_billings_branch_column')) {
    function ensure_billings_branch_column(PDO $conn)
    {
        static $checked = false;

        if ($checked) {
            return;
        }

        $checked = true;
        $stmt = $conn->query("SHOW COLUMNS FROM billings LIKE 'branch'");
        $column = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : false;

        if (!$column) {
            $conn->exec("ALTER TABLE billings ADD COLUMN branch VARCHAR(255) NULL AFTER appointment_id");
        }
    }
}
