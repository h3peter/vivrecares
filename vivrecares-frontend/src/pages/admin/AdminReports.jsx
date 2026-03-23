import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { downloadCsvReport, printTableReport } from '../../utils/reportExports';

const AdminReports = () => {
    const navigate = useNavigate();
    const [billings, setBillings] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadBillings = async () => {
            try {
                const res = await axios.get('http://localhost/vivrecares/vivrecares-api/get_billings.php');
                if (Array.isArray(res.data)) {
                    setBillings(res.data);
                }
            } catch (error) {
                console.error('Error loading admin reports', error);
            }
        };

        loadBillings();
    }, []);

    const formatCurrency = (amount) =>
        new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(Number(amount || 0));

    const normalizeDate = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        parsed.setHours(0, 0, 0, 0);
        return parsed;
    };

    const filteredBillings = useMemo(
        () =>
            billings.filter((billing) => {
                const haystack = [
                    billing.invoice_id,
                    billing.first_name,
                    billing.last_name,
                    billing.main_treatment,
                    billing.reference_number,
                    billing.payment_method,
                    billing.payment_status,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                const billingDate = normalizeDate(billing.payment_date);
                const rangeStart = normalizeDate(startDate);
                const rangeEnd = normalizeDate(endDate);

                const matchesSearch = haystack.includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'All' || billing.payment_status === statusFilter;
                const matchesStart = !rangeStart || (billingDate && billingDate >= rangeStart);
                const matchesEnd = !rangeEnd || (billingDate && billingDate <= rangeEnd);

                return matchesSearch && matchesStatus && matchesStart && matchesEnd;
            }),
        [billings, endDate, searchTerm, startDate, statusFilter]
    );

    const reportColumns = [
        { key: 'invoice_number', label: 'Invoice #' },
        { key: 'patient_name', label: 'Patient' },
        { key: 'service', label: 'Service' },
        { key: 'payment_date', label: 'Payment Date' },
        { key: 'payment_method', label: 'Method' },
        { key: 'reference_number', label: 'Reference' },
        { key: 'payment_status', label: 'Status' },
        { key: 'total_amount', label: 'Amount' },
    ];

    const reportRows = filteredBillings.map((billing) => ({
        invoice_number: `INV-${String(billing.invoice_id).padStart(4, '0')}`,
        patient_name: `${billing.last_name || ''}, ${billing.first_name || ''}`.replace(/^,\s*/, '').trim() || 'N/A',
        service: billing.main_treatment || 'Clinic Availment',
        payment_date: billing.payment_date ? new Date(billing.payment_date).toLocaleDateString() : 'Not yet paid',
        payment_method: billing.payment_method || 'N/A',
        reference_number: billing.reference_number || 'N/A',
        payment_status: billing.payment_status || 'N/A',
        total_amount: formatCurrency(billing.total_amount || 0),
    }));

    const paidTransactions = filteredBillings.filter((billing) => billing.payment_status === 'Paid');
    const totalRevenue = paidTransactions.reduce((sum, billing) => sum + Number(billing.total_amount || 0), 0);
    const unpaidTransactions = filteredBillings.filter((billing) => billing.payment_status !== 'Paid').length;

    const handleExportTransactions = () => {
        downloadCsvReport({
            filename: 'transaction_history_report.csv',
            columns: reportColumns,
            rows: reportRows,
        });
    };

    const handlePrintTransactions = () => {
        printTableReport({
            title: 'Transaction History Report',
            subtitle: 'Administrative financial report for billing activity',
            columns: reportColumns,
            rows: reportRows,
            meta: [
                { label: 'Transactions', value: filteredBillings.length },
                { label: 'Collected Revenue', value: formatCurrency(totalRevenue) },
                { label: 'Pending or Unpaid', value: unpaidTransactions },
            ],
        });
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setStatusFilter('All');
        setSearchTerm('');
    };

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Reports Workspace</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Administrative Reports</h1>
                <p className="text-sm text-gray-500 mt-2">Generate printable and exportable transaction history reports while keeping invoice generation in the existing billing workflow.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8 mb-8">
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Transaction History Report</h2>
                            <p className="text-sm text-gray-500 mt-2">Use the same billing data, but package it as a formal report for printing or CSV export.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={handlePrintTransactions} className="px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#c4ba9d] hover:text-[#8f8167] transition">
                                Print Report
                            </button>
                            <button onClick={handleExportTransactions} className="px-5 py-3 rounded-xl bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition">
                                Export CSV
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">
                        <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Transactions</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-3">{filteredBillings.length}</h3>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Collected Revenue</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-3">{formatCurrency(totalRevenue)}</h3>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Paid</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-3">{paidTransactions.length}</h3>
                        </div>
                        <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-5">
                            <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Pending or Unpaid</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-3">{unpaidTransactions}</h3>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-8 items-end">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">From</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] text-gray-700" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">To</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] text-gray-700" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">Status</label>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] bg-white text-gray-700">
                                <option value="All">All statuses</option>
                                <option value="Paid">Paid</option>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>
                        <div className="xl:col-span-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">Search</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Invoice, patient, service, reference"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] text-gray-700"
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <button onClick={clearFilters} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#d4af37] hover:text-[#a8892d] transition">
                            Clear Filters
                        </button>
                    </div>
                </section>

                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-800">Service Invoice Access</h2>
                    <p className="text-sm text-gray-500 mt-2">Printable invoice PDFs remain in the billing module so the existing invoice flow stays intact.</p>

                    <div className="mt-8 rounded-3xl border border-[#efe7d4] bg-gradient-to-br from-[#fcfbf7] to-[#f5efe2] p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9f8d66]">Capstone Coverage</p>
                        <div className="mt-5 space-y-3 text-sm text-gray-700">
                            <div className="rounded-2xl bg-white/70 px-4 py-3 border border-white">Service invoices: existing PDF export in Billing and Payments</div>
                            <div className="rounded-2xl bg-white/70 px-4 py-3 border border-white">Transaction histories: printable and exportable on this page</div>
                            <div className="rounded-2xl bg-white/70 px-4 py-3 border border-white">Patient visit summaries: printable and exportable in Doctor Clinical Reports</div>
                        </div>
                        <button
                            onClick={() => navigate('/admin/billing')}
                            className="mt-6 w-full px-5 py-4 rounded-2xl bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition"
                        >
                            Open Billing and Payments
                        </button>
                    </div>
                </section>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between gap-4 mb-6 border-b border-gray-50 pb-5">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Report Preview</h2>
                        <p className="text-sm text-gray-500 mt-1">Preview of the current transaction history report output.</p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-semibold text-gray-700">{reportRows.length}</span> records
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[900px]">
                        <div className="grid grid-cols-8 gap-4 mb-4 text-[#b2a58d] text-xs uppercase tracking-[0.18em] font-bold px-4">
                            <div>Invoice</div>
                            <div>Patient</div>
                            <div>Service</div>
                            <div>Date</div>
                            <div>Method</div>
                            <div>Reference</div>
                            <div>Status</div>
                            <div className="text-right">Amount</div>
                        </div>
                        <div className="space-y-3">
                            {reportRows.map((row) => (
                                <div key={`${row.invoice_number}-${row.reference_number}`} className="grid grid-cols-8 gap-4 items-center rounded-2xl border border-gray-100 bg-[#faf9f6] px-4 py-4 text-sm text-gray-700">
                                    <div className="font-bold text-gray-800">{row.invoice_number}</div>
                                    <div>{row.patient_name}</div>
                                    <div>{row.service}</div>
                                    <div>{row.payment_date}</div>
                                    <div>{row.payment_method}</div>
                                    <div>{row.reference_number}</div>
                                    <div>
                                        <span className="inline-flex px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-[0.14em] text-gray-600">
                                            {row.payment_status}
                                        </span>
                                    </div>
                                    <div className="text-right font-bold text-gray-800">{row.total_amount}</div>
                                </div>
                            ))}
                            {reportRows.length === 0 && <p className="text-center text-sm text-gray-400 italic py-8">No transactions match the current report filters.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
