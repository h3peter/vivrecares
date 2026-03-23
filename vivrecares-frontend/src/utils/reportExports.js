const escapeCsvValue = (value) => {
    const normalized = value == null ? '' : String(value);
    if (/[",\n]/.test(normalized)) {
        return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
};

export const downloadCsvReport = ({ filename, columns, rows }) => {
    const headerRow = columns.map((column) => escapeCsvValue(column.label)).join(',');
    const dataRows = rows.map((row) =>
        columns.map((column) => escapeCsvValue(row[column.key])).join(',')
    );

    const csvContent = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

const escapeHtml = (value) =>
    String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const buildMetaRows = (meta) => {
    if (!meta.length) return '';

    const cells = meta
        .map(
            (item) => `
                <td class="detail-label">${escapeHtml(item.label)}</td>
                <td class="detail-value">${escapeHtml(item.value)}</td>
            `
        )
        .join('');

    return `
        <table class="details-table">
            <tr>${cells}</tr>
        </table>
    `;
};

const buildPrintableHtml = ({ title, subtitle = '', columns, rows, meta = [] }) => {
    const generatedAt = new Date().toLocaleString();
    const tableHead = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
    const tableRows = rows.length
        ? rows
              .map(
                  (row) => `
                    <tr>
                        ${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join('')}
                    </tr>
                `
              )
              .join('')
        : `<tr><td colspan="${columns.length}" class="empty">No report data available.</td></tr>`;

    return `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <title>${escapeHtml(title)}</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 18mm;
                    }
                    body {
                        font-family: Helvetica, Arial, sans-serif;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .header-table {
                        width: 100%;
                        border: none;
                        margin-bottom: 24px;
                    }
                    .header-table td {
                        border: none;
                        padding: 0;
                        vertical-align: top;
                    }
                    .brand-title {
                        font-size: 26px;
                        font-weight: bold;
                        color: #b8a16b;
                        letter-spacing: 0.06em;
                    }
                    .company-info {
                        font-size: 11px;
                        color: #666;
                        margin-top: 14px;
                        line-height: 1.6;
                    }
                    .report-title {
                        font-size: 30px;
                        font-weight: bold;
                        color: #b8a16b;
                        text-transform: uppercase;
                        letter-spacing: 0.12em;
                        text-align: right;
                    }
                    .report-subtitle {
                        font-size: 12px;
                        color: #666;
                        margin-top: 10px;
                        text-align: right;
                        line-height: 1.5;
                    }
                    .generated-at {
                        font-size: 11px;
                        color: #999;
                        margin-top: 12px;
                        text-align: right;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                    }
                    .details-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 0 0 22px;
                        table-layout: fixed;
                    }
                    .details-table td {
                        border: 1px solid #eee;
                        padding: 10px 12px;
                    }
                    .detail-label {
                        background: #faf9f6;
                        color: #b8a16b;
                        font-size: 10px;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        width: 16%;
                    }
                    .detail-value {
                        color: #555;
                        font-size: 13px;
                        font-weight: bold;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .items-table th {
                        background: #faf9f6;
                        color: #b8a16b;
                        padding: 12px 10px;
                        text-align: left;
                        font-size: 10px;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        border-top: 1px solid #eee;
                        border-bottom: 2px solid #b8a16b;
                    }
                    .items-table td {
                        padding: 12px 10px;
                        font-size: 12px;
                        border-bottom: 1px solid #eee;
                        vertical-align: top;
                        color: #444;
                        word-break: break-word;
                    }
                    .empty {
                        text-align: center;
                        color: #888;
                        font-style: italic;
                        padding: 22px;
                    }
                    .footer-note {
                        text-align: center;
                        margin-top: 40px;
                        font-size: 11px;
                        font-style: italic;
                        color: #888;
                    }
                </style>
            </head>
            <body>
                <table class="header-table">
                    <tr>
                        <td style="width: 52%;">
                            <div class="brand-title">VIVRE MEDICAL GROUP</div>
                            <div class="company-info">
                                Reports and Records Office<br>
                                Valenzuela Branch and Pasay Branch<br>
                                Internal clinic-generated report
                            </div>
                        </td>
                        <td style="width: 48%;">
                            <div class="report-title">${escapeHtml(title)}</div>
                            ${subtitle ? `<div class="report-subtitle">${escapeHtml(subtitle)}</div>` : ''}
                            <div class="generated-at">Generated ${escapeHtml(generatedAt)}</div>
                        </td>
                    </tr>
                </table>

                ${buildMetaRows(meta)}

                <table class="items-table">
                    <thead>
                        <tr>${tableHead}</tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>

                <div class="footer-note">Prepared from the Vivre Medical Group system.</div>
            </body>
        </html>
    `;
};

export const printTableReport = ({ title, subtitle = '', columns, rows, meta = [] }) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');

    const cleanup = () => {
        window.setTimeout(() => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        }, 300);
    };

    iframe.onload = () => {
        const frameWindow = iframe.contentWindow;
        if (!frameWindow) {
            cleanup();
            return;
        }

        const handleAfterPrint = () => {
            frameWindow.removeEventListener('afterprint', handleAfterPrint);
            cleanup();
        };

        frameWindow.addEventListener('afterprint', handleAfterPrint);

        window.setTimeout(() => {
            frameWindow.focus();
            frameWindow.print();
            window.setTimeout(cleanup, 1500);
        }, 250);
    };

    document.body.appendChild(iframe);

    const frameDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDocument) {
        cleanup();
        return;
    }

    frameDocument.open();
    frameDocument.write(buildPrintableHtml({ title, subtitle, columns, rows, meta }));
    frameDocument.close();
};
