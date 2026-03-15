<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoice</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo-text { font-size: 24px; font-weight: bold; color: #b8a16b; } /* Vivre Gold */
        .sub-header { font-size: 12px; color: #777; margin-top: 5px; }
        .details { margin-bottom: 30px; font-size: 14px; }
        .details p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #2d2a26; color: #b8a16b; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; }
        td { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }
        .total-row { font-weight: bold; background-color: #faf9f6; }
        .text-right { text-align: right; }
    </style>
</head>
<body>

    <div class="header">
        <?php if (!empty($logo_base64)): ?>
            <img src="<?php echo $logo_base64; ?>" alt="Vivre Logo" style="width: 80px; height: auto; margin-bottom: 10px;">
        <?php else: ?>
            <div class="logo-text" style="font-size: 28px; font-weight: bold; color: #b8a16b;">VIVRE MEDICAL GROUP</div>
        <?php endif; ?>
        <div class="sub-header">Official Billing Statement</div>
    </div>

    <div class="details">
        <p><strong>Patient:</strong> <?php echo htmlspecialchars($patient_name); ?></p>
        <p><strong>Date:</strong> <?php echo htmlspecialchars($payment_date); ?></p>
        <p><strong>Invoice ID:</strong> INV-<?php echo str_pad($invoice_id, 4, '0', STR_PAD_LEFT); ?></p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($items as $item): ?>
            <tr>
                <td><?php echo htmlspecialchars($item['description']); ?></td>
                <td><?php echo $item['quantity']; ?></td>
                <td class="text-right">PHP <?php echo number_format($item['unit_price'], 2); ?></td>
                <td class="text-right">PHP <?php echo number_format($item['total_price'], 2); ?></td>
            </tr>
            <?php endforeach; ?>
            <tr class="total-row">
                <td colspan="3" class="text-right">GRAND TOTAL:</td>
                <td class="text-right">PHP <?php echo number_format($total_amount, 2); ?></td>
            </tr>
        </tbody>
    </table>

</body>
</html>