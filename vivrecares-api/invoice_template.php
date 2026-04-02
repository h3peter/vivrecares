<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; margin: 0; padding: 20px; }
        
        /* Layout for the top section */
        .header-table { width: 100%; border: none; margin-bottom: 40px; }
        .header-table td { border: none; padding: 0; vertical-align: top; }
        
        .logo-text { font-size: 28px; font-weight: bold; color: #b8a16b; }
        .company-info { font-size: 11px; color: #555; margin-top: 15px; line-height: 1.6; }
        
        .invoice-title { font-size: 32px; font-weight: bold; color: #b8a16b; text-transform: uppercase; letter-spacing: 2px; }
        
        /* Mini table for invoice details on the right */
        .details-table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-left: auto; table-layout: fixed; }
        .details-table th { background-color: #faf9f6; color: #b8a16b; padding: 8px 10px; font-size: 11px; text-transform: uppercase; text-align: center; border: 1px solid #eee; }
        .details-table td { background-color: #ffffff; padding: 8px 10px; font-size: 12px; text-align: center; border: 1px solid #eee; font-weight: bold; color: #555; word-wrap: break-word; overflow-wrap: break-word; }
        .details-table .wide-value { text-align: left; font-size: 11px; padding: 10px 12px; }
        
        /* Main items table */
        .items-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        .items-table th { background-color: #faf9f6; color: #b8a16b; padding: 12px 10px; text-align: left; font-size: 11px; text-transform: uppercase; border-top: 1px solid #eee; border-bottom: 2px solid #b8a16b; }
        .items-table td { padding: 12px 10px; font-size: 13px; border-bottom: 1px solid #eee; vertical-align: top; color: #444; }
        
        /* Invisible row to push the totals down */
        .spacer-row td { height: 200px; border-bottom: 1px solid #eee; }
        
        /* Totals block */
        .total-table { width: 40%; float: right; border-collapse: collapse; margin-top: 15px; }
        .total-table td { padding: 12px 10px; font-size: 14px; border-bottom: 1px solid #eee; }
        .total-table .label-cell { color: #888; font-weight: bold; text-align: left; font-size: 12px; text-transform: uppercase; }
        
        /* Grand Total gets a clean, light treatment */
        .grand-total { font-weight: bold; background-color: #faf9f6; color: #333; font-size: 16px; }
        .text-right { text-align: right; }
        .clear { clear: both; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 50%;">
                <?php if (!empty($logo_base64)): ?>
                    <img src="<?php echo $logo_base64; ?>" alt="Vivre Logo" style="width: 160px; height: auto;">
                <?php else: ?>
                    <div class="logo-text">VIVRE MEDICAL GROUP</div>
                <?php endif; ?>
                
                <div class="company-info">
                    <strong>Valenzuela Branch</strong><br>
                    (0917) 558 4873<br>
                    CLOSED ON: Monday & Tuesday<br><br>
                    <strong>MOA Shore Branch</strong><br>
                    (02) 8255 5010 / (0917) 148 4873<br>
                    CLOSED ON: Monday
                </div>
            </td>
            <td style="width: 50%; text-align: right;">
                <div class="invoice-title">Invoice</div>
                
                <table class="details-table" style="width: 85%;">
                    <tr>
                        <th>Invoice #</th>
                        <th>Date</th>
                    </tr>
                    <tr>
                        <td><?php echo str_pad($invoice_id, 4, '0', STR_PAD_LEFT); ?></td>
                        <td><?php echo htmlspecialchars($payment_date); ?></td>
                    </tr>
                    <tr>
                        <th colspan="2">Patient Name</th>
                    </tr>
                    <tr>
                        <td colspan="2"><?php echo htmlspecialchars($patient_name); ?></td>
                    </tr>
                    <tr>
                        <th>Method</th>
                        <th>Status</th>
                    </tr>
                    <tr>
                        <td><?php echo htmlspecialchars($payment_method); ?></td>
                        <td><?php echo htmlspecialchars($payment_status); ?></td>
                    </tr>
                    <tr>
                        <th colspan="2">Branch</th>
                    </tr>
                    <tr>
                        <td colspan="2"><?php echo htmlspecialchars($invoice_branch); ?></td>
                    </tr>
                    <?php if (!empty($reference_number)): ?>
                    <tr>
                        <th colspan="2">Reference #</th>
                    </tr>
                    <tr>
                        <td colspan="2" class="wide-value" style="text-align: center;"><?php echo htmlspecialchars($reference_number); ?></td>
                    </tr>
                    <?php endif; ?>
                </table>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 50%;">Description</th>
                <th style="width: 15%; text-align: center;">Qty</th>
                <th class="text-right" style="width: 15%;">Unit Price</th>
                <th class="text-right" style="width: 20%;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($items as $index => $item): ?>
            <tr>
                <td><?php echo htmlspecialchars($item['description']); ?></td>
                <td style="text-align: center;"><?php echo $item['quantity']; ?></td>
                <td class="text-right"><?php echo number_format($item['unit_price'], 2); ?></td>
                <td class="text-right"><?php echo number_format($item['total_price'], 2); ?></td>
            </tr>
            <?php endforeach; ?>
            
            <tr class="spacer-row">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>
        </tbody>
    </table>

    <table class="total-table">
        <tr class="grand-total">
            <td class="label-cell" style="color: #b8a16b; border-bottom: none;">TOTAL</td>
            <td class="text-right" style="border-bottom: none;">PHP <?php echo number_format($total_amount, 2); ?></td>
        </tr>
    </table>
    
    <div class="clear"></div>

    <div style="text-align: center; margin-top: 60px; font-size: 12px; font-style: italic; color: #888;">
        Thank you for trusting Vivre Medical Group!
    </div>

</body>
</html>
