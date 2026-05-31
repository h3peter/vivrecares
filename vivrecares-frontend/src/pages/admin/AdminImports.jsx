import { useMemo, useState } from 'react';
import axios from 'axios';
import AdminPasswordPrompt from '../../components/AdminPasswordPrompt';
import ActionFeedbackModal from '../../components/ActionFeedbackModal';
import { downloadCsvReport } from '../../utils/reportExports';

const importModes = {
    patients: {
        title: 'Patient Import',
        description: 'Migrates patient accounts and clinical disclosure fields. Sensitive medical text is encrypted before storage.',
        endpoint: '/import_patients.php',
        fileName: 'vivre_patient_import_template.csv',
        headers: [
            'first_name',
            'middle_name',
            'last_name',
            'extension_name',
            'nickname',
            'email',
            'age',
            'sex',
            'address',
            'phone',
            'surgical_procedures',
            'aesthetic_procedures',
            'tooth_extraction',
            'allergies',
            'pregnant',
            'untoward_reactions',
            'heart_disease',
            'hypertension',
            'diabetes',
            'hyperthyroidism',
            'autoimmune_disease',
            'cancer',
            'renal_failure',
            'liver_disease',
            'bronchial_asthma',
            'pulmonary_disease',
            'infectious_disease',
            'others',
            'medications',
            'current_skin_treatment',
        ],
        sample: [
            'Maria',
            '',
            'Santos',
            '',
            'Mia',
            'maria.santos@example.com',
            '29',
            'Female',
            'Pasay City',
            '09171234567',
            'Appendectomy 2019',
            'Facial treatment 2024',
            'No',
            'None',
            'No',
            '',
            'No',
            'No',
            'No',
            'No',
            'No',
            'No',
            'No',
            'No',
            'No',
            'No',
            'No',
            '',
            '',
            '',
        ],
        notes: [
            'Required columns: first_name, last_name, email, age, sex, address, phone.',
            'Boolean columns accept Yes/No, true/false, or 1/0.',
            'Duplicate or invalid emails stop the entire import.',
        ],
    },
    invoices: {
        title: 'Invoice Import',
        description: 'Migrates historical billings and billing items for existing patients.',
        endpoint: '/import_invoices.php',
        fileName: 'vivre_invoice_import_template.csv',
        headers: [
            'invoice_key',
            'patient_email',
            'patient_id',
            'branch',
            'total_amount',
            'payment_method',
            'payment_status',
            'reference_number',
            'payment_date',
            'item_description',
            'quantity',
            'unit_price',
            'service_id',
        ],
        sample: [
            'INV-2026-001',
            'maria.santos@example.com',
            '',
            'Pasay Branch',
            '2500',
            'Cash',
            'Paid',
            '',
            '2026-05-26',
            'Facial treatment package',
            '1',
            '2500',
            '',
        ],
        notes: [
            'Use invoice_key to group multiple item rows into one invoice.',
            'patient_email or patient_id must match an existing patient.',
            'Reference number is required for paid non-cash invoices.',
        ],
    },
};

const csvEscape = (value) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
};

const AdminImports = () => {
    const [mode, setMode] = useState('patients');
    const [files, setFiles] = useState({ patients: null, invoices: null });
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [needsAdminPassword, setNeedsAdminPassword] = useState(false);

    const config = importModes[mode];
    const templateHref = useMemo(() => {
        const csv = `${config.headers.map(csvEscape).join(',')}\n${config.sample.map(csvEscape).join(',')}\n`;
        return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    }, [config]);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || null;
        setFiles((prev) => ({ ...prev, [mode]: file }));
        setResult(null);
    };

    const runImport = async (adminPassword) => {
        const file = files[mode];
        if (!file) {
            setFeedback({
                tone: 'error',
                title: 'No File Selected',
                message: 'Choose a CSV file before importing.',
            });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('admin_password', adminPassword);

        try {
            setImporting(true);
            setResult(null);
            const response = await axios.post(config.endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setResult(response.data);
            setFeedback({
                tone: response.data.status === 'success' ? 'success' : 'error',
                title: response.data.status === 'success' ? 'Import Complete' : 'Import Failed',
                message: response.data.message || 'Import finished.',
            });
        } catch (error) {
            const message = error.response?.data?.message || 'Unable to process the import right now.';
            setResult({ status: 'error', message });
            setFeedback({
                tone: 'error',
                title: 'Import Failed',
                message,
            });
        } finally {
            setImporting(false);
        }
    };

    const handleImport = async () => {
        if (!files[mode]) {
            setFeedback({
                tone: 'error',
                title: 'No File Selected',
                message: 'Choose a CSV file before importing.',
            });
            return;
        }
        setNeedsAdminPassword(true);
    };

    const exportValidationErrors = () => {
        if (!Array.isArray(result?.errors) || result.errors.length === 0) return;
        downloadCsvReport({
            filename: `${mode}_import_validation_errors.csv`,
            columns: [
                { key: 'line', label: 'Line' },
                { key: 'record', label: 'Record' },
                { key: 'issue', label: 'Issue' },
            ],
            rows: result.errors.map((error) => ({
                line: error.line,
                record: error.email || error.patient || 'Row',
                issue: (error.errors || []).join(', '),
            })),
        });
    };

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <ActionFeedbackModal
                open={Boolean(feedback)}
                tone={feedback?.tone}
                title={feedback?.title}
                message={feedback?.message}
                onClose={() => setFeedback(null)}
            />
            <AdminPasswordPrompt
                open={needsAdminPassword}
                title="Confirm Import"
                message="Bulk imports can create many patient or billing records. Enter your admin password to continue."
                onCancel={() => setNeedsAdminPassword(false)}
                onConfirm={(adminPassword) => {
                    setNeedsAdminPassword(false);
                    runImport(adminPassword);
                }}
            />

            <div className="mb-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d]">Migration Tools</p>
                <h1 className="text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">Data Import</h1>
                <p className="mt-2 max-w-3xl text-sm text-gray-500">
                    Import patient and invoice CSV files with validation before records are committed.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="grid gap-3">
                        {Object.entries(importModes).map(([key, item]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    setMode(key);
                                    setResult(null);
                                }}
                                className={`rounded-2xl px-4 py-4 text-left transition ${
                                    mode === key
                                        ? 'bg-[#555555] text-[#c4ba9d] shadow-lg'
                                        : 'bg-[#faf9f6] text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <span className="block text-xs font-bold uppercase tracking-[0.18em]">{item.title}</span>
                                <span className={`mt-2 block text-xs leading-relaxed ${mode === key ? 'text-[#eee4c9]' : 'text-gray-400'}`}>
                                    {item.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </aside>

                <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{config.title}</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">{config.description}</p>
                        </div>
                        <a
                            href={templateHref}
                            download={config.fileName}
                            className="rounded-xl border border-[#c4ba9d] px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#8f7a45] transition hover:bg-[#faf9f0]"
                        >
                            Download Template
                        </a>
                    </div>

                    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-[#faf9f6] p-6">
                            <label className="block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">CSV File</label>
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleFileChange}
                                className="mt-4 block w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#555555] file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.16em] file:text-[#c4ba9d]"
                            />
                            <p className="mt-3 text-xs text-gray-400">
                                Selected: {files[mode]?.name || 'No file selected'}
                            </p>

                            <button
                                type="button"
                                onClick={handleImport}
                                disabled={importing}
                                className="mt-6 w-full rounded-xl bg-[#555555] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] disabled:opacity-50 sm:w-auto"
                            >
                                {importing ? 'Importing...' : `Import ${mode}`}
                            </button>
                        </div>

                        <div className="rounded-2xl border border-gray-100 p-5">
                            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Validation Rules</h3>
                            <div className="mt-4 space-y-3">
                                {config.notes.map((note) => (
                                    <p key={note} className="text-sm leading-relaxed text-gray-500">{note}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {result && (
                        <div className={`mt-8 rounded-2xl border p-5 ${
                            result.status === 'success'
                                ? 'border-green-200 bg-green-50'
                                : 'border-red-200 bg-red-50'
                        }`}>
                            <h3 className={`text-sm font-bold uppercase tracking-[0.18em] ${
                                result.status === 'success' ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {result.status === 'success' ? 'Import Summary' : 'Validation Errors'}
                            </h3>
                            <p className={`mt-2 text-sm ${result.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                                {result.message}
                            </p>

                            {Array.isArray(result.errors) && result.errors.length > 0 && (
                                <div className="mt-4">
                                    <div className="mb-3 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={exportValidationErrors}
                                            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-700"
                                        >
                                            Export CSV
                                        </button>
                                    </div>
                                    <div className="max-h-96 overflow-auto rounded-xl bg-white readable-data-table">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-red-100 text-xs uppercase tracking-[0.16em] text-red-800">
                                            <tr>
                                                <th className="p-3">Line</th>
                                                <th className="p-3">Record</th>
                                                <th className="p-3">Issue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.errors.map((error, index) => (
                                                <tr key={`${error.line}-${index}`} className="border-t border-red-50">
                                                    <td className="p-3 font-semibold text-gray-700">{error.line}</td>
                                                    <td className="p-3 text-gray-500">{error.email || error.patient || 'Row'}</td>
                                                    <td className="p-3 text-red-600">{(error.errors || []).join(', ')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default AdminImports;
