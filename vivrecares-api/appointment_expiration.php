<?php

if (!function_exists('cancel_expired_pending_appointments')) {
    function cancel_expired_pending_appointments(PDO $conn, $patientId = null)
    {
        $sql = "
            UPDATE appointments
            SET status = 'Cancelled'
            WHERE status = 'Pending'
              AND appointment_date < CURDATE()
        ";
        $params = [];

        if ($patientId !== null) {
            $sql .= " AND patient_id = ?";
            $params[] = (int) $patientId;
        }

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
    }
}

?>
