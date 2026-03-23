import { useState, useEffect } from 'react';
import axios from 'axios';

const PatientInvoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const userData = localStorage.getItem('user');
                if (!userData) return;

                const user = JSON.parse(userData);
                const profileRes = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_profile.php?user_id=${user.id}`);

                if (profileRes.data.status === 'success') {
                    const patientId = profileRes.data.data.patient_id;
                    if (patientId) {
                        const invRes = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_patient_invoices.php?patient_id=${patientId}`);
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
        window.open(`http://localhost/vivrecares/vivrecares-api/generate_pdf.php?id=${id}`, '_blank');
    };

    const formatCurrency = (amount) =>
        new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(Number(amount || 0));

    const filteredInvoices = invoices.filter((invoice) => statusFilter === 'All' || invoice.payment_status === statusFilter);

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Patient Portal</p>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">My Billing History</h1>
                    <p className="text-sm text-gray-500 mt-2">Review your invoices, payment status, and payment references.</p>
                </div>
                <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">Filter Status</label>
                    <select className="px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#c4ba9d] bg-white text-gray-700" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="All">All statuses</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                </div>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="grid grid-cols-14 gap-4 mb-6 text-[#b2a58d] text-xs uppercase tracking-[0.2em] font-bold px-6 border-b border-gray-50 pb-6">
                    <div className="col-span-2">Invoice #</div>
                    <div className="col-span-3">Main Service</div>
                    <div className="col-span-2">Date Paid</div>
                    <div className="col-span-2">Method</div>
                    <div className="col-span-2">Reference</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">Total</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="space-y-3 px-2">
                    {filteredInvoices.map((invoice) => (
                        <div key={invoice.invoice_id} className="grid grid-cols-14 gap-4 items-center text-base text-gray-700 p-5 bg-[#faf9f6] rounded-[1.5rem] border border-gray-50 hover:border-[#c4ba9d] transition">
                            <div className="col-span-2 text-xs font-bold text-gray-400 tracking-[0.18em] uppercase">INV-{String(invoice.invoice_id).padStart(4, '0')}</div>
                            <div className="col-span-3 font-bold text-gray-800">{invoice.main_treatment || 'General Availment'}</div>
                            <div className="col-span-2 text-sm text-gray-500">{invoice.payment_date || 'Not yet paid'}</div>
                            <div className="col-span-2 text-sm text-gray-500">{invoice.payment_method || 'N/A'}</div>
                            <div className="col-span-2 text-sm text-gray-500">{invoice.reference_number || 'N/A'}</div>
                            <div className="col-span-1 text-center">
                                <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.18em] ${
                                    invoice.payment_status === 'Paid'
                                        ? 'bg-green-50 text-green-600'
                                        : invoice.payment_status === 'Overdue'
                                            ? 'bg-amber-50 text-amber-600'
                                            : 'bg-red-50 text-red-600'
                                }`}>
                                    {invoice.payment_status}
                                </span>
                            </div>
                            <div className="col-span-1 text-right font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</div>
                            <div className="col-span-1 text-right">
                                <button onClick={() => handleDownload(invoice.invoice_id)} className="text-[#c4ba9d] hover:text-black p-2 transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredInvoices.length === 0 && <p className="text-center text-base text-gray-400 italic py-10">No transaction records found for this filter.</p>}
                </div>
            </div>
        </div>
    );
};

export default PatientInvoices;
