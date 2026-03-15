import { useState, useEffect } from 'react';
import axios from 'axios';

const BillingAndPayments = () => {
    const [billings, setBillings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filtering States
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // View Modal States
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
    // Add Invoice Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    // unit_price initialized as '' to fix the leading zero bug
    const [items, setItems] = useState([{ type: 'Service', description: '', quantity: 1, unit_price: '' }]);
    const [loadingAdd, setLoadingAdd] = useState(false);

    const fetchData = async () => {
        try {
            const billRes = await axios.get('http://localhost/vivrecares/vivrecares-api/get_billings.php');
            if (Array.isArray(billRes.data)) setBillings(billRes.data);
            
            const patRes = await axios.get('http://localhost/vivrecares/vivrecares-api/get_all_patients.php?archived=0');
            if (Array.isArray(patRes.data)) setPatients(patRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Filter Logic
    const filteredBillings = billings.filter(b => {
        const matchesSearch = `${b.first_name} ${b.last_name} ${b.invoice_id}`.toLowerCase().includes(searchTerm.toLowerCase());
        const billDate = new Date(b.payment_date);
        const matchesStart = startDate ? billDate >= new Date(startDate) : true;
        const matchesEnd = endDate ? billDate <= new Date(endDate) : true;
        return matchesSearch && matchesStart && matchesEnd;
    });

    const totalRevenue = filteredBillings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const uniqueClients = new Set(filteredBillings.map(b => `${b.first_name} ${b.last_name}`)).size;

    // --- VIEW INVOICE LOGIC ---
    const viewInvoiceDetails = async (invoiceId) => {
        try {
            const res = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_invoice_items.php?id=${invoiceId}`);
            if (res.data.status === 'success') {
                setSelectedInvoice({ ...res.data, invoice_id: invoiceId });
                setIsViewModalOpen(true);
            }
        } catch (error) {
            alert("Could not load details.");
        }
    };

    const handleExportPDF = () => {
        if (!selectedInvoice) return;
        const pdfUrl = `http://localhost/vivrecares/vivrecares-api/generate_pdf.php?id=${selectedInvoice.invoice_id}`;
        window.open(pdfUrl, '_blank');
    };

    const handleMarkAsPaid = async (invoiceId) => {
        if (!window.confirm("Mark this invoice as Paid?")) return;
        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/update_payment_status.php', {
                invoice_id: invoiceId, status: 'Paid'
            });
            if (res.data.status === 'success') {
                setIsViewModalOpen(false);
                fetchData();
            }
        } catch (error) {
            alert("Error updating status.");
        }
    };

    // --- ADD INVOICE LOGIC ---
    const handleAddItem = () => setItems([...items, { type: 'Product', description: '', quantity: 1, unit_price: '' }]);
    const handleRemoveItem = (index) => setItems(items.filter((_, i) => i !== index));
    
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'type' && value === 'Service') newItems[index].quantity = 1;
        setItems(newItems);
    };

    const calculateTotal = () => items.reduce((total, item) => {
        const price = parseFloat(item.unit_price) || 0;
        return total + (item.quantity * price);
    }, 0);

    const handleSaveInvoice = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return alert("Please select a patient.");

        setLoadingAdd(true);
        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/create_invoice.php', {
                patient_id: selectedPatient,
                total_amount: calculateTotal(),
                payment_method: paymentMethod,
                items: items.map(item => ({
                    ...item,
                    unit_price: parseFloat(item.unit_price) || 0 // Ensure clean numbers hit the DB
                }))
            });

            if (res.data.status === 'success') {
                setIsAddModalOpen(false);
                setItems([{ type: 'Service', description: '', quantity: 1, unit_price: '' }]);
                setSelectedPatient('');
                setPaymentMethod('Cash');
                fetchData(); 
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            alert("Connection error.");
        } finally {
            setLoadingAdd(false);
        }
    };

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen">
            {/* Metrics Section */}
            <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Total Revenue</p>
                    <h2 className="text-5xl font-bold text-[#c4ba9d]">₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                </div>
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Clients in Range</p>
                    <h2 className="text-5xl font-bold text-[#c4ba9d]">{uniqueClients}</h2>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-wrap items-end justify-between gap-6">
                <div className="flex gap-6 items-end">
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 block">Start Date</label>
                        <input type="date" className="p-2 border border-gray-100 rounded-lg text-xs outline-none focus:border-[#d4af37]" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 block">End Date</label>
                        <input type="date" className="p-2 border border-gray-100 rounded-lg text-xs outline-none focus:border-[#d4af37]" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 block">Search</label>
                        <input type="text" placeholder="Name or Invoice ID..." className="p-2 border border-gray-100 rounded-lg text-xs outline-none focus:border-[#d4af37] w-48" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                {/* Changed this button to open the modal instead of navigating */}
                <button onClick={() => setIsAddModalOpen(true)} className="bg-[#555555] text-[#c4ba9d] px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-[#404040] transition">+ Add Invoice</button>
            </div>

            {/* Table Section */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-12 gap-4 mb-6 text-[#b2a58d] text-[10px] uppercase tracking-[0.2em] font-bold px-4 border-b border-gray-50 pb-6">
                    <div className="col-span-1">ID</div>
                    <div className="col-span-2">Patient</div>
                    <div className="col-span-3">Context & Date</div>
                    <div className="col-span-2">Method</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-2 text-right">Amount</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                <div className="space-y-3">
                    {filteredBillings.map(b => (
                        <div key={b.invoice_id} className="grid grid-cols-12 gap-4 items-center text-sm text-gray-700 p-4 hover:bg-[#faf9f6] rounded-2xl transition border border-transparent hover:border-gray-100">
                            <div className="col-span-1 uppercase text-[10px] font-bold tracking-widest text-gray-400">
                                INV-{String(b.invoice_id).padStart(4, '0')}
                            </div>
                            <div className="col-span-2 font-bold text-gray-800 truncate">
                                {b.last_name}, {b.first_name}
                            </div>
                            
                            {/* Stacking the Treatment and Date for clean UX */}
                            <div className="col-span-3 flex flex-col">
                                <span className="font-medium text-gray-800 truncate">
                                    {b.main_treatment || "Clinic Availment"} 
                                    {b.item_count > 1 && <span className="text-[#c4ba9d] text-[10px] ml-1 uppercase font-bold tracking-widest">(+{b.item_count - 1} more)</span>}
                                </span>
                                <span className="text-[10px] text-gray-400 mt-0.5">
                                    {b.payment_date ? new Date(b.payment_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Pending'}
                                </span>
                            </div>

                            <div className="col-span-2 text-xs font-medium text-gray-500">
                                {b.payment_method || 'N/A'}
                            </div>

                            <div className="col-span-1 text-center">
                                <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${b.payment_status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {b.payment_status}
                                </span>
                            </div>
                            <div className="col-span-2 text-right font-bold text-gray-900">
                                ₱{parseFloat(b.total_amount).toLocaleString()}
                            </div>
                            <div className="col-span-1 text-right">
                                <button onClick={() => viewInvoiceDetails(b.invoice_id)} className="text-[#c4ba9d] hover:text-[#555555] transition text-[10px] font-bold uppercase tracking-widest">View</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- ADD INVOICE MODAL --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-12 animate-fadeIn relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button onClick={() => setIsAddModalOpen(false)} className="absolute top-8 right-8 text-gray-300 hover:text-[#555555] transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="mb-8 text-center">
                            <h3 className="text-2xl font-bold text-gray-800">New Transaction</h3>
                            <p className="text-[10px] text-[#c4ba9d] font-bold uppercase tracking-[0.2em] mt-1">Record Clinic Availment</p>
                        </div>

                        <form onSubmit={handleSaveInvoice}>
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Select Patient</label>
                                    <select className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d]" value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} required>
                                        <option value="">-- Choose Patient --</option>
                                        {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.last_name}, {p.first_name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Payment Method</label>
                                    <select className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d]" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                        <option value="Cash">Cash</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="GCash">GCash / Maya</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Availments</label>
                                    <button type="button" onClick={handleAddItem} className="text-[#c4ba9d] hover:text-[#555555] text-[10px] font-bold uppercase tracking-widest transition">+ Add Line</button>
                                </div>
                                
                                {items.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-center bg-[#faf9f6] p-3 rounded-xl border border-gray-50">
                                        <select className="p-2 bg-transparent text-sm outline-none focus:text-[#c4ba9d] text-gray-500 font-medium" value={item.type} onChange={(e) => handleItemChange(index, 'type', e.target.value)}>
                                            <option value="Service">Service</option>
                                            <option value="Product">Product</option>
                                        </select>

                                        <input type="text" placeholder="Description" className="flex-1 p-2 bg-transparent border-b border-gray-200 text-sm outline-none focus:border-[#c4ba9d]" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required />
                                        
                                        {/* Hides the quantity box completely if it's a Service */}
                                        {item.type === 'Product' ? (
                                            <input type="number" placeholder="Qty" min="1" className="w-16 p-2 bg-transparent border-b border-gray-200 text-sm text-center outline-none focus:border-[#c4ba9d]" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} required />
                                        ) : (
                                            <div className="w-16 text-center text-[10px] text-gray-300 uppercase tracking-widest font-bold">N/A</div>
                                        )}
                                        
                                        <input type="number" placeholder="Price" min="0" step="any" className="w-24 p-2 bg-transparent border-b border-gray-200 text-sm text-right outline-none focus:border-[#c4ba9d]" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} required />
                                        
                                        <div className="w-24 text-right text-sm font-bold text-gray-800">₱{((parseFloat(item.unit_price) || 0) * item.quantity).toLocaleString()}</div>
                                        
                                        {items.length > 1 ? (
                                            <button type="button" onClick={() => handleRemoveItem(index)} className="text-gray-300 hover:text-red-400 transition pl-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        ) : <div className="w-5"></div>}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-100 pt-8">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Amount</p>
                                    <span className="text-3xl font-bold text-gray-900">₱{calculateTotal().toLocaleString()}</span>
                                </div>
                                <button type="submit" disabled={loadingAdd} className="px-8 py-4 bg-[#555555] text-[#c4ba9d] text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg hover:bg-[#404040] transition">
                                    {loadingAdd ? 'Saving...' : 'Save Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- VIEW INVOICE MODAL (Retained exactly as before, updated colors) --- */}
            {isViewModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-12 animate-fadeIn relative">
                        <button onClick={() => setIsViewModalOpen(false)} className="absolute top-8 right-8 text-gray-300 hover:text-[#555555] transition">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <div className="mb-8 text-center border-b border-gray-50 pb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Billing Summary</h3>
                            <p className="text-[12px] text-[#c4ba9d] font-bold uppercase tracking-[0.2em] mt-2">{selectedInvoice.patient_name}</p>
                            
                            {/* Added Modal Context: Date and Payment Method */}
                            <div className="flex justify-center gap-6 mt-4 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                <span>Date: {selectedInvoice.date ? new Date(selectedInvoice.date).toLocaleDateString() : 'N/A'}</span>
                                <span>•</span>
                                <span>Method: {selectedInvoice.payment_method || 'N/A'}</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 mb-2">
                                <div className="col-span-2">Service/Item</div>
                                <div className="text-center">Qty</div>
                                <div className="text-right">Price</div>
                            </div>
                            {selectedInvoice.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-4 text-sm text-gray-600 bg-[#faf9f6] p-4 rounded-xl border border-gray-50">
                                    <div className="col-span-2 font-medium">{item.description}</div>
                                    <div className="text-center text-gray-400">{item.quantity}</div>
                                    <div className="text-right font-bold text-gray-800">₱{parseFloat(item.total_price).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-8 mt-4">
                            <div className="flex flex-col">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Grand Total</p>
                                <p className="text-3xl font-bold text-gray-900">₱{parseFloat(selectedInvoice.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {(selectedInvoice.payment_status?.toUpperCase() === 'UNPAID') && (
                                    <button onClick={() => handleMarkAsPaid(selectedInvoice.invoice_id)} className="px-6 py-4 bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-green-700 transition shadow-lg">Mark as Paid</button>
                                )}
                                <button onClick={handleExportPDF} className="px-6 py-4 bg-[#555555] text-[#c4ba9d] text-[10px] font-bold uppercase tracking-widest rounded-full shadow-xl hover:bg-[#404040] transition">Export to PDF</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BillingAndPayments;