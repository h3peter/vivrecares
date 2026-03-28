import { useEffect, useState } from 'react';
import axios from 'axios';
import { apiUrl } from '../utils/api';

const PatientInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const userData = localStorage.getItem('user');
                if (!userData) return;

                const user = JSON.parse(userData);
                const profileRes = await axios.get(`/get_profile.php?user_id=${user.id}`);

                if (profileRes.data.status === 'success') {
                    const patientId = profileRes.data.data.patient_id;
                    if (patientId) {
                        const invRes = await axios.get(`/get_patient_invoices.php?patient_id=${patientId}`);
                        if (Array.isArray(invRes.data)) {
                            setInvoices(invRes.data);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching patient invoices', error);
            }
        };
        fetchInvoices();
    }, []);

    const handleDownload = (id) => {
        window.open(apiUrl(`generate_pdf.php?id=${id}`), '_blank');
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(Number(amount || 0));

    const filteredInvoices = invoices.filter((invoice) => statusFilter === 'All' || invoice.payment_status === statusFilter);

    const getStatusBadge = (status) => {
        if (status === 'Paid') return 'bg-green-50 text-green-600';
        if (status === 'Overdue') return 'bg-amber-50 text-amber-600';
        return 'bg-red-50 text-red-600';
    };

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d]">Patient Portal</p>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">My Billing History</h1>
                    <p className="mt-2 text-sm text-gray-500">Review your invoices, payment status, and payment references.</p>
                </div>
                <div className="w-full lg:w-auto">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Filter Status</label>
                    <select className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-700 outline-none focus:border-[#c4ba9d] lg:w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="All">All statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-5 shadow-sm lg:p-8">
                <div className="mb-6 hidden grid-cols-14 gap-4 border-b border-gray-50 px-6 pb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#b2a58d] lg:grid">
                    <div className="col-span-2">Invoice #</div>
                    <div className="col-span-3">Main Service</div>
                    <div className="col-span-2">Date Paid</div>
                    <div className="col-span-2">Method</div>
                    <div className="col-span-2">Reference</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">Total</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="space-y-3 px-0 lg:px-2">
                    {filteredInvoices.map((invoice) => (
                        <div key={invoice.invoice_id}>
                            <div className="rounded-[1.5rem] border border-gray-100 bg-[#faf9f6] p-4 sm:p-5 lg:hidden">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">INV-{String(invoice.invoice_id).padStart(4, '0')}</p>
                                        <p className="mt-2 text-base font-bold text-gray-800">{invoice.main_treatment || 'General Availment'}</p>
                                    </div>
                                    <button onClick={() => handleDownload(invoice.invoice_id)} className="rounded-full border border-[#c4ba9d]/40 p-2 text-[#c4ba9d] transition hover:border-[#c4ba9d] hover:text-black">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" /></svg>
                                    </button>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
                                    <InfoBlock label="Date Paid" value={invoice.payment_date || 'Not yet paid'} />
                                    <InfoBlock label="Method" value={invoice.payment_method || 'N/A'} />
                                    <InfoBlock label="Reference" value={invoice.reference_number || 'N/A'} />
                                    <InfoBlock label="Total" value={formatCurrency(invoice.total_amount)} />
                                </div>

                                <div className="mt-4">
                                    <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${getStatusBadge(invoice.payment_status)}`}>
                                        {invoice.payment_status}
                                    </span>
                                </div>
                            </div>

                            <div className="hidden grid-cols-14 items-center gap-4 rounded-[1.5rem] border border-gray-50 bg-[#faf9f6] p-5 text-base text-gray-700 transition hover:border-[#c4ba9d] lg:grid">
                                <div className="col-span-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">INV-{String(invoice.invoice_id).padStart(4, '0')}</div>
                                <div className="col-span-3 font-bold text-gray-800">{invoice.main_treatment || 'General Availment'}</div>
                                <div className="col-span-2 text-sm text-gray-500">{invoice.payment_date || 'Not yet paid'}</div>
                                <div className="col-span-2 text-sm text-gray-500">{invoice.payment_method || 'N/A'}</div>
                                <div className="col-span-2 text-sm text-gray-500">{invoice.reference_number || 'N/A'}</div>
                                <div className="col-span-1 text-center">
                                    <span className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${getStatusBadge(invoice.payment_status)}`}>
                                        {invoice.payment_status}
                                    </span>
                                </div>
                                <div className="col-span-1 text-right font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</div>
                                <div className="col-span-1 text-right">
                                    <button onClick={() => handleDownload(invoice.invoice_id)} className="p-2 text-[#c4ba9d] transition hover:text-black">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredInvoices.length === 0 && <p className="py-10 text-center text-base italic text-gray-400">No transaction records found for this filter.</p>}
                </div>
            </div>
        </div>
    );
};

const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
        <p className="mt-1 text-sm text-gray-700 break-words">{value}</p>
    </div>
);

export default PatientInvoices;
