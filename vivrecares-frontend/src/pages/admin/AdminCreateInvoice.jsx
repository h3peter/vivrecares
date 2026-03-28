import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminCreateInvoice = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentStatus, setPaymentStatus] = useState('Paid');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [items, setItems] = useState([{ type: 'Service', service_id: null, description: '', quantity: 1, unit_price: 0 }]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const [patientRes, serviceRes] = await Promise.all([
                    axios.get('/get_all_patients.php?archived=0'),
                    axios.get('/get_services.php?active_only=1'),
                ]);
                if (Array.isArray(patientRes.data)) {
                    setPatients(patientRes.data);
                }
                if (Array.isArray(serviceRes.data)) {
                    setServices(serviceRes.data);
                }
            } catch (error) {
                console.error('Error fetching patients', error);
            }
        };
        fetchPatients();
    }, []);

    const sortedPatients = useMemo(
        () =>
            [...patients].sort((a, b) =>
                `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, undefined, { sensitivity: 'base' })
            ),
        [patients]
    );

    const handleAddItem = () => setItems([...items, { type: 'Product', service_id: null, description: '', quantity: 1, unit_price: 0 }]);
    const handleRemoveItem = (index) => setItems(items.filter((_, i) => i !== index));

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'type' && value === 'Service') {
            newItems[index].quantity = 1;
        }
        if (field === 'type' && value === 'Product') {
            newItems[index].service_id = null;
            newItems[index].description = '';
        }
        setItems(newItems);
    };

    const handleServiceSelect = (index, serviceId) => {
        const service = services.find((entry) => Number(entry.service_id) === Number(serviceId)) || null;
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            service_id: service?.service_id ?? null,
            description: service?.service_name ?? '',
            quantity: 1,
            unit_price: Number(service?.base_price ?? 0),
        };
        setItems(newItems);
    };

    const calculateTotal = () => items.reduce((total, item) => total + (item.quantity * item.unit_price), 0);

    const handleSaveInvoice = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return alert('Please select a patient.');
        if (items.some((item) => item.type === 'Service' && !item.service_id)) {
            return alert('Please choose a valid service for every service line.');
        }
        if (items.some((item) => !String(item.description || '').trim())) {
            return alert('Please complete every invoice line description.');
        }
        if (paymentMethod !== 'Cash' && paymentStatus === 'Paid' && !referenceNumber.trim()) {
            return alert('Reference number is required for non-cash paid invoices.');
        }

        const total = calculateTotal();
        setLoading(true);

        try {
            const res = await axios.post('/create_invoice.php', {
                patient_id: selectedPatient,
                total_amount: total,
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                reference_number: paymentMethod === 'Cash' ? '' : referenceNumber.trim(),
                items: items.map((item) => ({
                    ...item,
                    service_id: item.type === 'Service' ? item.service_id : null,
                })),
            });

            if (res.data.status === 'success') {
                alert('Transaction saved to billing logs.');
                navigate('/admin/billing');
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            alert('Connection error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen flex justify-center items-start">
            <div className="w-full max-w-4xl bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mt-8">
                <div className="bg-[#2d2a26] p-10 text-center">
                    <h1 className="text-2xl font-bold text-[#d4af37] tracking-widest uppercase">Create Transaction</h1>
                    <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">Record a new clinic availment</p>
                </div>

                <form onSubmit={handleSaveInvoice} className="p-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className="md:col-span-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Select Patient</label>
                            <select
                                className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#d4af37] transition"
                                value={selectedPatient}
                                onChange={(e) => setSelectedPatient(e.target.value)}
                                required
                            >
                                <option value="">-- Choose Patient --</option>
                                {sortedPatients.map((p) => (
                                    <option key={p.patient_id} value={p.patient_id}>
                                        {String(p.patient_id).padStart(3, '0')} - {p.last_name}, {p.first_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Payment Status</label>
                            <select className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#d4af37] transition" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                                <option value="Paid">Paid</option>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Payment Method</label>
                            <select className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#d4af37] transition" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                <option value="Cash">Cash</option>
                                <option value="GCash">GCash</option>
                                <option value="Maya">Maya</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Reference Number</label>
                            <input
                                type="text"
                                placeholder={paymentMethod === 'Cash' ? 'Not required for cash payments' : 'Enter payment reference'}
                                className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#d4af37] transition text-gray-700"
                                value={referenceNumber}
                                onChange={(e) => setReferenceNumber(e.target.value)}
                                disabled={paymentMethod === 'Cash'}
                            />
                        </div>
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

                                <div className="flex-1">
                                    {item.type === 'Service' ? (
                                        <select
                                            className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-[#d4af37] text-gray-700"
                                            value={item.service_id ?? ''}
                                            onChange={(e) => handleServiceSelect(index, e.target.value)}
                                            required
                                        >
                                            <option value="">Choose service</option>
                                            {services.map((service) => (
                                                <option key={service.service_id} value={service.service_id}>
                                                    {service.category_name ? `${service.category_name} - ` : ''}{service.service_name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="text" placeholder="Product description" className="w-full p-2 bg-transparent border-b border-gray-200 text-sm outline-none focus:border-[#d4af37]" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required />
                                    )}
                                </div>

                                <input type="number" placeholder="Qty" min="1"
                                    className={`w-20 p-2 border-b text-sm text-center outline-none focus:border-[#d4af37] ${item.type === 'Service' ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent' : 'bg-transparent border-gray-200'}`}
                                    value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} required readOnly={item.type === 'Service'} />

                                <input type="number" placeholder="Price" min="0" className="w-32 p-2 bg-transparent border-b border-gray-200 text-sm text-right outline-none focus:border-[#d4af37]"
                                    value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))} required />

                                <div className="w-32 text-right text-sm font-bold text-gray-800">PHP {(item.quantity * item.unit_price).toLocaleString()}</div>

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
                            <span className="text-3xl font-bold text-gray-800">PHP {calculateTotal().toLocaleString()}</span>
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
