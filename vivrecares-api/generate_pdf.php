<?php
require 'vendor/autoload.php';
require_once 'config.php';

use Dompdf\Dompdf;
use Dompdf\Options;

$invoice_id = $_GET['id'] ?? null;

if (!$invoice_id) {
    die("Invoice ID is required.");
}

// 1. Fetch the data
$sqlMaster = "SELECT b.total_amount, b.payment_date, u.first_name, u.last_name 
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

// 2. Prepare variables for the HTML template
$patient_name = $master['first_name'] . " " . $master['last_name'];
$payment_date = date("F j, Y", strtotime($master['payment_date']));
$total_amount = $master['total_amount'];

// 3. Convert the logo to Base64
$logo_path = 'vivre-black.png'; // Ensure this file is inside your vivrecares-api folder
$logo_base64 = '';
if (file_exists($logo_path)) {
    $logo_data = file_get_contents($logo_path);
    $logo_base64 = 'data:image/png;base64,' . base64_encode($logo_data);
}

// 4. Capture the HTML output
ob_start();
include 'invoice_template.php';
$html = ob_get_clean();

// 5. Setup Dompdf and render
$options = new Options();
$options->set('isRemoteEnabled', true); 

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

$logo_path = __DIR__ . '/vivre-black.png';
$logo_base64 = '';
$has_gd = extension_loaded('gd'); // Checks if the server can process images

if ($has_gd && file_exists($logo_path)) {
    $type = pathinfo($logo_path, PATHINFO_EXTENSION);
    $logo_data = file_get_contents($logo_path);
    $logo_base64 = 'data:image/' . $type . ';base64,' . base64_encode($logo_data);
}

// 6. Output the PDF
// SETTING EXPLANATION:
// "Attachment" => false : Opens in a new tab (Recommended for previews/printing)
// "Attachment" => true  : Forces an immediate auto-download
$dompdf->stream("Invoice_INV" . str_pad($invoice_id, 4, '0', STR_PAD_LEFT) . "_" . str_replace(' ', '_', $patient_name) . ".pdf", ["Attachment" => false]);
?>