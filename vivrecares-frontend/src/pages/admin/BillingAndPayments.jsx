import { useState, useEffect } from 'react';
import axios from 'axios';

const BillingAndPayments = () => {
    const [billings, setBillings] = useState([]);
    const [appointments, setAppointments] = useState([]); // Needed for the dropdown
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState({
        appointment_id: '',
        total_amount: '',
        payment_method: 'Cash'
    });

    const fetchData = async () => {
        try {
            // Fetch the ledger
            const billRes = await axios.get('http://localhost/vivrecares/vivrecares-api/get_billings.php');
            if (Array.isArray(billRes.data)) setBillings(billRes.data);

            // Fetch appointments so the admin can pick one to bill
            const aptRes = await axios.get('http://localhost/vivrecares/vivrecares-api/get_all_appointments.php');
            if (Array.isArray(aptRes.data)) setAppointments(aptRes.data);
            
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/add_invoice.php', invoiceData);
            if (res.data.status === 'success') {
                setIsModalOpen(false);
                setInvoiceData({ appointment_id: '', total_amount: '', payment_method: 'Cash' }); // Reset form
                fetchData(); // Refresh the numbers and table!
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            console.error("Error adding invoice:", error);
        }
    };

    const totalRevenue = billings.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount), 0);
    const uniqueClients = new Set(billings.map(b => `${b.first_name} ${b.last_name}`)).size;

    const filteredBillings = billings.filter(b => 
        `${b.first_name} ${b.last_name} ${b.invoice_id}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen relative">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-sm text-gray-400 font-bold mb-2">Total Revenue</p>
                    <h2 className="text-5xl font-bold text-[#c4ba9d]">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-sm text-gray-400 font-bold mb-2">Clients This Month</p>
                    <h2 className="text-5xl font-bold text-[#c4ba9d]">{uniqueClients}</h2>
                </div>
            </div>

            {/* Search and Action Bar */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <label className="text-sm text-gray-800 mb-2 block">Search:</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            className="pl-10 pr-4 py-2 rounded-full border border-gray-300 w-64 outline-none focus:border-[#b2a58d]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>

                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#c4ba9d] text-white px-8 py-2 rounded-md text-sm hover:bg-[#b2a58d] shadow-sm transition"
                >
                    + Add Invoice
                </button>
            </div>

            {/* Ledger Table */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-12 gap-4 mb-6 text-[#b2a58d] text-[10px] uppercase tracking-widest font-bold px-4 border-b border-gray-100 pb-4">
                    <div className="col-span-2">Invoice ID</div>
                    <div className="col-span-3">Patient</div>
                    <div className="col-span-3">Service</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-1">Total</div>
                    <div className="col-span-1 text-right">Method</div>
                </div>

                <div className="space-y-6 px-4 pb-4">
                    {filteredBillings.map(b => (
                        <div key={b.invoice_id} className="grid grid-cols-12 gap-4 items-center text-sm text-gray-700">
                            <div className="col-span-2 uppercase text-[10px] font-bold tracking-widest text-gray-500">
                                INV-{String(b.invoice_id).padStart(4, '0')}
                            </div>
                            <div className="col-span-3 font-medium">{b.first_name} {b.last_name}</div>
                            <div className="col-span-3 font-light">{b.service_name}</div>
                            <div className="col-span-2 font-light">{b.appointment_date}</div>
                            <div className="col-span-1 font-medium text-gray-800">
                                ₱{parseFloat(b.total_amount).toLocaleString()}
                            </div>
                            <div className="col-span-1 text-right font-light text-gray-500">
                                {b.payment_method}
                            </div>
                        </div>
                    ))}
                    {filteredBillings.length === 0 && (
                        <div className="text-center py-8 text-gray-400 italic">No invoices found.</div>
                    )}
                </div>
            </div>

            {/* Add Invoice Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-10 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <h2 className="text-2xl font-bold text-[#b2a58d] mb-8">Generate Invoice</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Select Appointment</label>
                                <select 
                                    required
                                    className="w-full border-b border-gray-200 py-2 outline-none bg-white text-gray-700 text-sm"
                                    value={invoiceData.appointment_id}
                                    onChange={(e) => setInvoiceData({...invoiceData, appointment_id: e.target.value})}
                                >
                                    <option value="" disabled>Choose a patient's appointment...</option>
                                    {/* We map through the appointments so the admin can select one to bill */}
                                    {appointments.map(apt => (
                                        <option key={apt.appointment_id} value={apt.appointment_id}>
                                            {apt.first_name} {apt.last_name} - {apt.service} ({apt.date})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total Amount (₱)</label>
                                    <input 
                                        type="number" 
                                        required
                                        placeholder="e.g. 51500"
                                        className="w-full border-b border-gray-200 py-2 outline-none text-gray-700" 
                                        value={invoiceData.total_amount}
                                        onChange={(e) => setInvoiceData({...invoiceData, total_amount: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Payment Method</label>
                                    <select 
                                        className="w-full border-b border-gray-200 py-2 outline-none bg-white text-gray-700"
                                        value={invoiceData.payment_method}
                                        onChange={(e) => setInvoiceData({...invoiceData, payment_method: e.target.value})}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="GCash">GCash</option>
                                        <option value="Credit Card">Credit Card</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-center pt-6">
                                <button type="submit" className="w-16 h-16 bg-[#c4ba9d] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b2a58d] transition">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingAndPayments;