<?php
require 'vendor/autoload.php';
require_once 'config.php';
require_once 'auth.php';
require_once 'billing_branch.php';

use Dompdf\Dompdf;
use Dompdf\Options;

init_api_auth();

$invoice_id = (int) ($_GET['id'] ?? 0);
$authUser = require_auth();

if ($invoice_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invoice ID is required."]);
    exit;
}

$invoiceBranch = 'Not set';
ensure_billings_branch_column($conn);

$accessSql = "SELECT b.invoice_id, COALESCE(b.patient_id, a.patient_id) AS patient_id, p.user_id
              FROM billings b
              LEFT JOIN appointments a ON b.appointment_id = a.appointment_id
              LEFT JOIN patients p ON p.patient_id = COALESCE(b.patient_id, a.patient_id)
              WHERE b.invoice_id = ?
              LIMIT 1";
$accessStmt = $conn->prepare($accessSql);
$accessStmt->execute([$invoice_id]);
$invoiceAccess = $accessStmt->fetch(PDO::FETCH_ASSOC);

if (!$invoiceAccess) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Invoice not found."]);
    exit;
}

$authRole = $authUser['role'] ?? '';
if ($authRole === 'Patient') {
    $invoiceUserId = (int) ($invoiceAccess['user_id'] ?? 0);
    if ($invoiceUserId !== (int) ($authUser['user_id'] ?? 0)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "You are not allowed to access this invoice."]);
        exit;
    }
} elseif (!in_array($authRole, ['Admin', 'Doctor'], true)) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "You are not allowed to access this invoice."]);
    exit;
}

$sqlMaster = "SELECT b.total_amount, b.payment_date, b.payment_status, b.payment_method, b.reference_number, u.first_name, u.last_name,
                 CASE
                     WHEN b.branch = 'Main Branch' THEN 'Pasay Branch'
                     WHEN b.branch IS NOT NULL AND b.branch <> '' THEN b.branch
                     WHEN a.branch = 'Main Branch' THEN 'Pasay Branch'
                     ELSE a.branch
                 END AS branch
              FROM billings b
              LEFT JOIN appointments a ON b.appointment_id = a.appointment_id
              LEFT JOIN patients p ON p.patient_id = COALESCE(b.patient_id, a.patient_id)
              LEFT JOIN users u ON p.user_id = u.user_id
              WHERE b.invoice_id = ?";
$stmt1 = $conn->prepare($sqlMaster);
$stmt1->execute([$invoice_id]);
$master = $stmt1->fetch(PDO::FETCH_ASSOC);

if (!$master) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Invoice not found."]);
    exit;
}

$sqlItems = "SELECT * FROM billing_items WHERE invoice_id = ?";
$stmt2 = $conn->prepare($sqlItems);
$stmt2->execute([$invoice_id]);
$items = $stmt2->fetchAll(PDO::FETCH_ASSOC);

$patient_name = $master['first_name'] . " " . $master['last_name'];
$payment_date = $master['payment_date'] ? date("F j, Y", strtotime($master['payment_date'])) : 'Not yet paid';
$payment_method = $master['payment_method'] ?? 'N/A';
$payment_status = $master['payment_status'] ?? 'Unpaid';
$reference_number = $master['reference_number'] ?? '';
$invoice_branch = $master['branch'] ?? 'Not set';
$total_amount = $master['total_amount'];

$logo_path = 'vivre-black.png';
$logo_base64 = '';
if (file_exists($logo_path)) {
    $logo_data = file_get_contents($logo_path);
    $logo_base64 = 'data:image/png;base64,' . base64_encode($logo_data);
}

ob_start();
include 'invoice_template.php';
$html = ob_get_clean();

$options = new Options();
$options->set('isRemoteEnabled', true);

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

$logo_path = __DIR__ . '/vivre-black.png';
$logo_base64 = '';
$has_gd = extension_loaded('gd');

if ($has_gd && file_exists($logo_path)) {
    $type = pathinfo($logo_path, PATHINFO_EXTENSION);
    $logo_data = file_get_contents($logo_path);
    $logo_base64 = 'data:image/' . $type . ';base64,' . base64_encode($logo_data);
}

$dompdf->stream("Invoice_INV" . str_pad($invoice_id, 4, '0', STR_PAD_LEFT) . "_" . str_replace(' ', '_', $patient_name) . ".pdf", ["Attachment" => false]);
?>
