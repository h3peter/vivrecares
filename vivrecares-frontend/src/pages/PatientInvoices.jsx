import { useState, useEffect } from 'react';
import axios from 'axios';

const PatientInvoices = () => {
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                // 1. Safely get the logged-in user
                const userData = localStorage.getItem('user');
                if (!userData) return;
                
                const user = JSON.parse(userData);

                // 2. Fetch their profile to get the actual patient_id
                const profileRes = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_profile.php?user_id=${user.id}`);
                
                if (profileRes.data.status === 'success') {
                    const patientId = profileRes.data.data.patient_id;
                    
                    // 3. Fetch the invoices using that patient_id
                    if (patientId) {
                        const invRes = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_patient_invoices.php?patient_id=${patientId}`);
                        if (Array.isArray(invRes.data)) {
                            setInvoices(invRes.data);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching patient invoices", error);
            }
        };
        fetchInvoices();
    }, []);

    const handleDownload = (id) => {
        window.open(`http://localhost/vivrecares/vivrecares-api/generate_pdf.php?id=${id}`, '_blank');
    };

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen">
            <h1 className="text-2xl font-light tracking-[0.2em] text-gray-800 mb-10 uppercase">My Billing History</h1>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="grid grid-cols-12 gap-4 mb-6 text-[#b2a58d] text-[10px] uppercase tracking-[0.2em] font-bold px-6 border-b border-gray-50 pb-6">
                    <div className="col-span-2">Invoice #</div>
                    <div className="col-span-4">Main Service</div>
                    <div className="col-span-3">Date Paid</div>
                    <div className="col-span-2 text-right">Total Amount</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="space-y-3 px-2">
                    {invoices.map(inv => (
                        <div key={inv.invoice_id} className="grid grid-cols-12 gap-4 items-center text-sm text-gray-700 p-5 bg-[#faf9f6] rounded-[1.5rem] border border-gray-50 hover:border-[#c4ba9d] transition">
                            <div className="col-span-2 text-[10px] font-bold text-gray-400 tracking-widest uppercase">INV-{String(inv.invoice_id).padStart(4, '0')}</div>
                            <div className="col-span-4 font-bold text-gray-800">{inv.main_treatment || 'General Availment'}</div>
                            <div className="col-span-3 text-xs text-gray-400">{inv.payment_date}</div>
                            <div className="col-span-2 text-right font-bold text-gray-900">₱{parseFloat(inv.total_amount).toLocaleString()}</div>
                            <div className="col-span-1 text-right">
                                <button onClick={() => handleDownload(inv.invoice_id)} className="text-[#c4ba9d] hover:text-black p-2 transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {invoices.length === 0 && <p className="text-center text-gray-400 italic py-10">No transaction records found.</p>}
                </div>
            </div>
        </div>
    );
};

export default PatientInvoices;