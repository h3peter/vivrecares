<?php

if (!function_exists('normalize_appointment_branch')) {
    function normalize_appointment_branch($rawBranch)
    {
        $branchMap = [
            'pasay branch' => 'Pasay Branch',
            'valenzuela branch' => 'Valenzuela Branch',
            'main branch' => 'Pasay Branch',
        ];

        $branch = trim((string) $rawBranch);
        if ($branch === '') {
            return '';
        }

        $branchKey = strtolower($branch);
        return $branchMap[$branchKey] ?? $branch;
    }
}

if (!function_exists('validate_appointment_schedule')) {
    function validate_appointment_schedule(PDO $conn, $branch, $appointmentDate, $appointmentTime, $excludeAppointmentId = null, array $conflictStatuses = ['Pending', 'Confirmed'])
    {
        $normalizedBranch = normalize_appointment_branch($branch);
        $date = trim((string) $appointmentDate);
        $time = trim((string) $appointmentTime);

        if ($normalizedBranch === '' || $date === '' || $time === '') {
            throw new Exception('Branch, date, and time are required.');
        }

        $weekday = (int) date('w', strtotime($date));

        $availabilityStmt = $conn->prepare("SELECT is_active FROM appointment_availability WHERE branch = ? AND weekday = ? LIMIT 1");
        $availabilityStmt->execute([$normalizedBranch, $weekday]);
        $isDayActive = $availabilityStmt->fetchColumn();

        if ((int) $isDayActive !== 1) {
            throw new Exception('The selected date is not available for this branch.');
        }

        $slotStmt = $conn->prepare("SELECT slot_label FROM appointment_slots WHERE branch = ? AND slot_time = ? AND is_active = 1 LIMIT 1");
        $slotStmt->execute([$normalizedBranch, $time]);
        $slotLabel = $slotStmt->fetchColumn();

        if (!$slotLabel) {
            throw new Exception('The selected time slot is not available.');
        }

        if (!empty($conflictStatuses)) {
            $statusPlaceholders = implode(',', array_fill(0, count($conflictStatuses), '?'));
            $conflictSql = "
                SELECT appointment_id
                FROM appointments
                WHERE branch = ?
                  AND appointment_date = ?
                  AND appointment_time = ?
                  AND status IN ($statusPlaceholders)
            ";
            $conflictParams = array_merge([$normalizedBranch, $date, $time], $conflictStatuses);

            if ($excludeAppointmentId !== null) {
                $conflictSql .= " AND appointment_id <> ?";
                $conflictParams[] = $excludeAppointmentId;
            }

            $conflictSql .= " LIMIT 1";

            $conflictStmt = $conn->prepare($conflictSql);
            $conflictStmt->execute($conflictParams);
            if ($conflictStmt->fetchColumn()) {
                throw new Exception('The selected time slot is already reserved for that branch and day.');
            }
        }

        return [
            'branch' => $normalizedBranch,
            'slot_label' => $slotLabel,
        ];
    }
}
