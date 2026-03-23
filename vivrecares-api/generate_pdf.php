<?php
require 'vendor/autoload.php';
require_once 'config.php';

use Dompdf\Dompdf;
use Dompdf\Options;

$invoice_id = $_GET['id'] ?? null;

if (!$invoice_id) {
    die("Invoice ID is required.");
}

$sqlMaster = "SELECT b.total_amount, b.payment_date, b.payment_status, b.payment_method, b.reference_number, u.first_name, u.last_name
              FROM billings b
              LEFT JOIN appointments a ON b.appointment_id = a.appointment_id
              LEFT JOIN patients p ON p.patient_id = COALESCE(b.patient_id, a.patient_id)
              LEFT JOIN users u ON p.user_id = u.user_id
              WHERE b.invoice_id = ?";
$stmt1 = $conn->prepare($sqlMaster);
$stmt1->execute([$invoice_id]);
$master = $stmt1->fetch(PDO::FETCH_ASSOC);

if (!$master) {
    die("Invoice not found.");
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
