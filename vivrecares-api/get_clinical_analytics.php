<?php
require_once 'auth.php';
require_once 'config.php';

init_api_auth();
require_roles(['Admin', 'Doctor']);

try {
    $totalVisits = (int) $conn->query("SELECT COUNT(*) FROM appointments")->fetchColumn();
    $confirmedVisits = (int) $conn->query("SELECT COUNT(*) FROM appointments WHERE status = 'Confirmed'")->fetchColumn();
    $completedVisits = (int) $conn->query("SELECT COUNT(*) FROM appointments WHERE status = 'Completed'")->fetchColumn();
    $pendingVisits = (int) $conn->query("SELECT COUNT(*) FROM appointments WHERE status = 'Pending'")->fetchColumn();

    $visitTrendStmt = $conn->query("SELECT DATE(appointment_date) AS visit_date, COUNT(*) AS visit_count
                                    FROM appointments
                                    GROUP BY DATE(appointment_date)
                                    ORDER BY DATE(appointment_date) DESC
                                    LIMIT 30");

    $typeTrendStmt = $conn->query("SELECT COALESCE(s.service_name, a.appointment_type) AS label, COUNT(*) AS total
                                   FROM appointments a
                                   LEFT JOIN services s ON a.service_id = s.service_id
                                   GROUP BY COALESCE(s.service_name, a.appointment_type)
                                   ORDER BY total DESC
                                   LIMIT 10");

    $serviceTrendStmt = $conn->query("SELECT bi.description AS label, COUNT(*) AS total
                                      FROM billing_items bi
                                      GROUP BY bi.description
                                      ORDER BY total DESC
                                      LIMIT 10");

    echo json_encode([
        "status" => "success",
        "summary" => [
            "total_visits" => $totalVisits,
            "confirmed_visits" => $confirmedVisits,
            "completed_visits" => $completedVisits,
            "pending_visits" => $pendingVisits
        ],
        "visit_trend" => $visitTrendStmt->fetchAll(PDO::FETCH_ASSOC),
        "appointment_topics" => $typeTrendStmt->fetchAll(PDO::FETCH_ASSOC),
        "service_trends" => $serviceTrendStmt->fetchAll(PDO::FETCH_ASSOC),
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
