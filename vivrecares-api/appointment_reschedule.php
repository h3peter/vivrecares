<?php

require_once 'appointment_validation.php';

if (!function_exists('ensure_appointment_reschedule_columns')) {
    function ensure_appointment_reschedule_columns(PDO $conn)
    {
        $requiredColumns = [
            'previous_branch' => "ALTER TABLE appointments ADD COLUMN previous_branch VARCHAR(255) NULL AFTER branch",
            'previous_appointment_date' => "ALTER TABLE appointments ADD COLUMN previous_appointment_date DATE NULL AFTER appointment_date",
            'previous_appointment_time' => "ALTER TABLE appointments ADD COLUMN previous_appointment_time TIME NULL AFTER appointment_time",
            'reschedule_requested_at' => "ALTER TABLE appointments ADD COLUMN reschedule_requested_at DATETIME NULL AFTER status",
            'reschedule_responded_at' => "ALTER TABLE appointments ADD COLUMN reschedule_responded_at DATETIME NULL AFTER reschedule_requested_at",
        ];

        foreach ($requiredColumns as $columnName => $alterSql) {
            $columnStmt = $conn->query("SHOW COLUMNS FROM appointments LIKE " . $conn->quote($columnName));
            if (!$columnStmt->fetch(PDO::FETCH_ASSOC)) {
                $conn->exec($alterSql);
            }
        }
    }
}

if (!function_exists('appointment_schedule_changed')) {
    function appointment_schedule_changed(array $currentAppointment, $branch, $appointmentDate, $appointmentTime)
    {
        $currentBranch = normalize_appointment_branch($currentAppointment['branch'] ?? '');
        $nextBranch = normalize_appointment_branch($branch);
        $currentDate = trim((string) ($currentAppointment['appointment_date'] ?? ''));
        $currentTime = trim((string) ($currentAppointment['appointment_time'] ?? ''));

        return $currentBranch !== $nextBranch
            || $currentDate !== trim((string) $appointmentDate)
            || $currentTime !== trim((string) $appointmentTime);
    }
}

if (!function_exists('notify_admin_users')) {
    function notify_admin_users(PDO $conn, $title, $message, $redirectUrl = '/admin/appointments', $excludeUserId = null)
    {
        $sql = "SELECT user_id FROM users WHERE role = 'Admin' AND deleted_at IS NULL";
        $params = [];

        if ($excludeUserId !== null) {
            $sql .= " AND user_id <> ?";
            $params[] = $excludeUserId;
        }

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $adminIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (empty($adminIds)) {
            return;
        }

        $insertStmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, redirect_url) VALUES (?, ?, ?, ?)");
        foreach ($adminIds as $adminId) {
            $insertStmt->execute([(int) $adminId, $title, $message, $redirectUrl]);
        }
    }
}

if (!function_exists('clear_reschedule_metadata')) {
    function clear_reschedule_metadata(PDO $conn, $appointmentId)
    {
        $stmt = $conn->prepare("
            UPDATE appointments
            SET previous_branch = NULL,
                previous_appointment_date = NULL,
                previous_appointment_time = NULL,
                reschedule_requested_at = NULL,
                reschedule_responded_at = NULL
            WHERE appointment_id = ?
        ");
        $stmt->execute([$appointmentId]);
    }
}
