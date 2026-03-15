import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminCreateInvoice = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    
    // Added 'type' to the items state
    const [items, setItems] = useState([{ type: 'Service', description: '', quantity: 1, unit_price: 0 }]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await axios.get('http://localhost/vivrecares/vivrecares-api/get_all_patients.php?archived=0');
                if (Array.isArray(res.data)) {
                    setPatients(res.data);
                }
            } catch (error) {
                console.error("Error fetching patients", error);
            }
        };
        fetchPatients();
    }, []);

    const handleAddItem = () => setItems([...items, { type: 'Product', description: '', quantity: 1, unit_price: 0 }]);
    const handleRemoveItem = (index) => setItems(items.filter((_, i) => i !== index));
    
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        // If they switch to a Service, automatically lock quantity to 1
        if (field === 'type' && value === 'Service') {
            newItems[index].quantity = 1;
        }
        setItems(newItems);
    };

    const calculateTotal = () => items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);

    const handleSaveInvoice = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return alert("Please select a patient.");

        const total = calculateTotal();
        setLoading(true);

        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/create_invoice.php', {
                patient_id: selectedPatient,
                total_amount: total,
                items: items
            });

            if (res.data.status === 'success') {
                alert("Transaction saved to billing logs.");
                navigate('/admin/billing');
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            alert("Connection error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen flex justify-center items-start">
            <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mt-8">
                
                {/* Header Section */}
                <div className="bg-[#2d2a26] p-10 text-center">
                    <h1 className="text-2xl font-bold text-[#d4af37] tracking-widest uppercase">Create Transaction</h1>
                    <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">Record a new clinic availment</p>
                </div>

                <form onSubmit={handleSaveInvoice} className="p-10">
                    <div className="mb-10">
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Select Patient</label>
                        <select 
                            className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#d4af37] transition"
                            value={selectedPatient}
                            onChange={(e) => setSelectedPatient(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Patient --</option>
                            {patients.map(p => (
                                <option key={p.patient_id} value={p.patient_id}>
                                    {p.last_name}, {p.first_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4 mb-10">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Availments Breakdown</label>
                            <button type="button" onClick={handleAddItem} className="text-[#d4af37] text-xs font-bold uppercase tracking-widest hover:text-black transition">+ Add Item</button>
                        </div>
                        
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-4 items-center bg-[#faf9f6] p-4 rounded-xl border border-gray-50">
                                <select 
                                    className="p-2 bg-transparent text-sm outline-none border-b border-gray-200 focus:border-[#d4af37] text-gray-500"
                                    value={item.type} 
                                    onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                                >
                                    <option value="Service">Service</option>
                                    <option value="Product">Product</option>
                                </select>

                                <input type="text" placeholder="Description (e.g., IV Drip)" className="flex-1 p-2 bg-transparent border-b border-gray-200 text-sm outline-none focus:border-[#d4af37]" 
                                    value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required />
                                
                                <input type="number" placeholder="Qty" min="1"
                                    className={`w-20 p-2 border-b text-sm text-center outline-none focus:border-[#d4af37] ${item.type === 'Service' ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent' : 'bg-transparent border-gray-200'}`} 
                                    value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} required readOnly={item.type === 'Service'} />
                                
                                <input type="number" placeholder="Price" min="0" className="w-32 p-2 bg-transparent border-b border-gray-200 text-sm text-right outline-none focus:border-[#d4af37]" 
                                    value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))} required />
                                
                                <div className="w-32 text-right text-sm font-bold text-gray-800">₱{(item.quantity * item.unit_price).toLocaleString()}</div>
                                
                                {items.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="text-gray-300 hover:text-red-500 transition pl-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center bg-[#faf9f6] p-8 rounded-2xl border border-gray-100">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Amount</p>
                            <span className="text-3xl font-bold text-gray-800">₱{calculateTotal().toLocaleString()}</span>
                        </div>
                        <button type="submit" disabled={loading} className="px-10 py-4 bg-[#2d2a26] text-[#d4af37] text-xs font-bold uppercase tracking-widest rounded-full shadow-lg hover:bg-black transition transform hover:scale-105">
                            {loading ? 'Processing...' : 'Save Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminCreateInvoice;