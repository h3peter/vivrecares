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

export const printTableReport = ({ title, subtitle = '', columns, rows, meta = [] }) => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=800');
    if (!printWindow) return;

    const generatedAt = new Date().toLocaleString();
    const metaMarkup = meta.length
        ? `
            <div class="meta-grid">
                ${meta
                    .map(
                        (item) => `
                            <div class="meta-card">
                                <div class="meta-label">${escapeHtml(item.label)}</div>
                                <div class="meta-value">${escapeHtml(item.value)}</div>
                            </div>
                        `
                    )
                    .join('')}
            </div>
        `
        : '';

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

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8" />
                <title>${escapeHtml(title)}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        color: #222;
                        margin: 32px;
                    }
                    .header {
                        border-bottom: 2px solid #d6c39d;
                        padding-bottom: 16px;
                        margin-bottom: 24px;
                    }
                    h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    .subtitle {
                        margin-top: 8px;
                        color: #666;
                        font-size: 14px;
                    }
                    .generated-at {
                        margin-top: 10px;
                        font-size: 12px;
                        color: #888;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                    }
                    .meta-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 12px;
                        margin-bottom: 20px;
                    }
                    .meta-card {
                        border: 1px solid #ece7db;
                        background: #faf8f2;
                        border-radius: 12px;
                        padding: 12px 14px;
                    }
                    .meta-label {
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 0.12em;
                        color: #8a7f68;
                        margin-bottom: 6px;
                    }
                    .meta-value {
                        font-size: 18px;
                        font-weight: bold;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        border: 1px solid #e7e2d6;
                        text-align: left;
                        padding: 10px 12px;
                        font-size: 13px;
                        vertical-align: top;
                    }
                    th {
                        background: #f3eee4;
                        text-transform: uppercase;
                        letter-spacing: 0.08em;
                        font-size: 11px;
                        color: #6e6552;
                    }
                    .empty {
                        text-align: center;
                        color: #888;
                        font-style: italic;
                        padding: 18px;
                    }
                    @media print {
                        body {
                            margin: 18px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${escapeHtml(title)}</h1>
                    ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ''}
                    <div class="generated-at">Generated ${escapeHtml(generatedAt)}</div>
                </div>
                ${metaMarkup}
                <table>
                    <thead>
                        <tr>${tableHead}</tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
};
