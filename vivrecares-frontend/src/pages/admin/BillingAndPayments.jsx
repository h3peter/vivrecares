import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { apiUrl } from '../../utils/api';

const BillingAndPayments = () => {
    const [billings, setBillings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [methodFilter, setMethodFilter] = useState('All');
    const [serviceFilter, setServiceFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [patients, setPatients] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentStatus, setPaymentStatus] = useState('Paid');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [viewPaymentStatus, setViewPaymentStatus] = useState('Paid');
    const [markPaidReferenceNumber, setMarkPaidReferenceNumber] = useState('');
    const [items, setItems] = useState([{ type: 'Service', service_id: null, description: '', quantity: 1, unit_price: '' }]);
    const [loadingAdd, setLoadingAdd] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const fetchData = async () => {
        try {
            const [billRes, patRes, serviceRes] = await Promise.all([
                axios.get('/get_billings.php'),
                axios.get('/get_all_patients.php?archived=0'),
                axios.get('/get_services.php?active_only=1'),
            ]);

            if (Array.isArray(billRes.data)) setBillings(billRes.data);
            if (Array.isArray(patRes.data)) setPatients(patRes.data);
            if (Array.isArray(serviceRes.data)) setServices(serviceRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
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

    const paymentMethods = ['All', ...new Set(billings.map((billing) => billing.payment_method).filter(Boolean))];
    const serviceNames = [
        'All',
        ...new Set(
            billings
                .map((billing) => billing.main_treatment || 'Clinic Availment')
                .filter(Boolean)
        ),
    ];
    const sortedPatients = useMemo(
        () =>
            [...patients].sort((a, b) =>
                `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, undefined, { sensitivity: 'base' })
            ),
        [patients]
    );

    const filteredBillings = billings.filter((billing) => {
        const matchesSearch = `${billing.first_name} ${billing.last_name} ${billing.invoice_id} ${billing.main_treatment || ''} ${billing.reference_number || ''}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const billDate = normalizeDate(billing.payment_date);
        const matchesStart = startDate ? (billDate && billDate >= normalizeDate(startDate)) : true;
        const matchesEnd = endDate ? (billDate && billDate <= normalizeDate(endDate)) : true;
        const matchesStatus = statusFilter === 'All' || billing.payment_status === statusFilter;
        const matchesMethod = methodFilter === 'All' || billing.payment_method === methodFilter;
        const normalizedService = billing.main_treatment || 'Clinic Availment';
        const matchesService = serviceFilter === 'All' || normalizedService === serviceFilter;
        return matchesSearch && matchesStart && matchesEnd && matchesStatus && matchesMethod && matchesService;
    });

    const totalRevenue = filteredBillings
        .filter((billing) => billing.payment_status === 'Paid')
        .reduce((sum, billing) => sum + parseFloat(billing.total_amount || 0), 0);
    const uniqueClients = new Set(filteredBillings.map((billing) => `${billing.first_name} ${billing.last_name}`)).size;

    const totalPages = Math.max(1, Math.ceil(filteredBillings.length / rowsPerPage));
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const paginatedBillings = filteredBillings.slice(indexOfFirstRow, indexOfLastRow);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, methodFilter, serviceFilter, startDate, endDate, rowsPerPage]);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setMethodFilter('All');
        setServiceFilter('All');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const resetAddInvoiceForm = () => {
        setItems([{ type: 'Service', service_id: null, description: '', quantity: 1, unit_price: '' }]);
        setSelectedPatient('');
        setPaymentMethod('Cash');
        setPaymentStatus('Paid');
        setReferenceNumber('');
    };

    const viewInvoiceDetails = async (invoiceId) => {
        try {
            const res = await axios.get(`/get_invoice_items.php?id=${invoiceId}`);
            if (res.data.status === 'success') {
                setSelectedInvoice({ ...res.data, invoice_id: invoiceId });
                setViewPaymentStatus(res.data.payment_status || 'Unpaid');
                setMarkPaidReferenceNumber(res.data.reference_number || '');
                setIsViewModalOpen(true);
            }
        } catch (error) {
            alert('Could not load details.');
        }
    };

    const handleExportPDF = () => {
        if (!selectedInvoice) return;
        const pdfUrl = apiUrl(`generate_pdf.php?id=${selectedInvoice.invoice_id}`);
        window.open(pdfUrl, '_blank');
    };

    const handleUpdatePaymentStatus = async (invoiceId) => {
        if (!selectedInvoice) return;
        if (!window.confirm(`Update this invoice status to ${viewPaymentStatus}?`)) return;

        if (selectedInvoice.payment_method !== 'Cash' && viewPaymentStatus === 'Paid' && !markPaidReferenceNumber.trim()) {
            alert('Reference number is required for non-cash paid invoices.');
            return;
        }

        try {
            const res = await axios.post('/update_payment_status.php', {
                invoice_id: invoiceId,
                payment_method: selectedInvoice.payment_method,
                payment_status: viewPaymentStatus,
                reference_number: selectedInvoice.payment_method === 'Cash' ? '' : markPaidReferenceNumber.trim(),
            });
            if (res.data.status === 'success') {
                setIsViewModalOpen(false);
                fetchData();
            } else {
                alert(res.data.message || 'Error updating status.');
            }
        } catch (error) {
            alert('Error updating status.');
        }
    };

    const handleAddItem = () => setItems([...items, { type: 'Product', service_id: null, description: '', quantity: 1, unit_price: '' }]);
    const handleRemoveItem = (index) => setItems(items.filter((_, itemIndex) => itemIndex !== index));

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
            unit_price: service?.base_price ?? '',
        };
        setItems(newItems);
    };

    const calculateTotal = () => items.reduce((total, item) => {
        const price = parseFloat(item.unit_price) || 0;
        return total + (item.quantity * price);
    }, 0);

    const handleSaveInvoice = async (e) => {
        e.preventDefault();
        if (!selectedPatient) return alert('Please select a patient.');
        if (items.some((item) => item.type === 'Service' && !item.service_id)) {
            return alert('Please choose a valid service for every service line.');
        }
        if (items.some((item) => !String(item.description || '').trim())) {
            return alert('Please complete every invoice line description.');
        }

        const trimmedReference = referenceNumber.trim();
        if (paymentMethod !== 'Cash' && paymentStatus === 'Paid' && !trimmedReference) {
            return alert('Reference number is required for non-cash paid invoices.');
        }

        setLoadingAdd(true);
        try {
            const res = await axios.post('/create_invoice.php', {
                patient_id: selectedPatient,
                total_amount: calculateTotal(),
                payment_method: paymentMethod,
                payment_status: paymentStatus,
                reference_number: paymentMethod === 'Cash' ? '' : trimmedReference,
                items: items.map((item) => ({
                    ...item,
                    service_id: item.type === 'Service' ? item.service_id : null,
                    unit_price: parseFloat(item.unit_price) || 0,
                })),
            });

            if (res.data.status === 'success') {
                setIsAddModalOpen(false);
                resetAddInvoiceForm();
                fetchData();
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            alert('Connection error.');
        } finally {
            setLoadingAdd(false);
        }
    };

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Payments Console</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Billing and Payments</h1>
                <p className="text-sm text-gray-500 mt-2">Filter by payment status, method, service, date range, and patient to review transactions faster.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-[0.18em] mb-3">Collected Revenue</p>
                    <h2 className="text-4xl lg:text-5xl font-bold text-[#c4ba9d]">{formatCurrency(totalRevenue)}</h2>
                </div>
                <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-[0.18em] mb-3">Clients in Range</p>
                    <h2 className="text-4xl lg:text-5xl font-bold text-[#c4ba9d]">{uniqueClients}</h2>
                </div>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
                <div className="mb-4 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setShowMobileFilters((prev) => !prev)}
                        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-left"
                    >
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Filters</p>
                            <p className="mt-1 text-sm text-gray-500">Tap to refine billing records</p>
                        </div>
                        <svg className={`h-5 w-5 text-gray-400 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                <div className={`${showMobileFilters ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4 items-end lg:grid`}>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">Start Date</label>
                        <input type="date" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] text-gray-700" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">End Date</label>
                        <input type="date" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] text-gray-700" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">Search</label>
                        <input type="text" placeholder="Name, invoice ID, treatment, or reference" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] text-gray-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">Status</label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] bg-white text-gray-700" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="All">All statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">Method</label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] bg-white text-gray-700" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                            {paymentMethods.map((method) => (
                                <option key={method} value={method}>
                                    {method === 'All' ? 'All methods' : method}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">Service</label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] bg-white text-gray-700" value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
                            {serviceNames.map((serviceName) => (
                                <option key={serviceName} value={serviceName}>
                                    {serviceName === 'All' ? 'All services' : serviceName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2 xl:justify-end xl:pl-3">
                        <button onClick={clearFilters} className="px-2 py-3 rounded-xl border border-gray-200 text-sm font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#d4af37] hover:text-[#a8892d] transition">Clear</button>
                        <button onClick={() => setIsAddModalOpen(true)} className="bg-[#555555] text-[#c4ba9d] px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition">+ Add Invoice</button>
                    </div>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{filteredBillings.length}</span> of {billings.length} transactions
                </div>
                <div className="mt-4 lg:hidden">
                    <button onClick={() => setIsAddModalOpen(true)} className="w-full rounded-xl bg-[#555555] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040]">
                        + Add Invoice
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="hidden grid-cols-14 gap-4 mb-6 text-[#b2a58d] text-xs uppercase tracking-[0.18em] font-bold px-4 border-b border-gray-50 pb-6 xl:grid">
                    <div className="col-span-2">ID</div>
                    <div className="col-span-2">Patient</div>
                    <div className="col-span-3">Context & Date</div>
                    <div className="col-span-2">Method</div>
                    <div className="col-span-2">Reference</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">Amount</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                <div className="space-y-3">
                    {paginatedBillings.map((billing) => (
                        <div key={billing.invoice_id}>
                            <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 sm:p-5 xl:hidden">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                                            INV-{String(billing.invoice_id).padStart(4, '0')}
                                        </p>
                                        <p className="mt-2 text-base font-bold text-gray-800">
                                            {billing.last_name}, {billing.first_name}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${
                                        billing.payment_status === 'Paid'
                                            ? 'bg-green-50 text-green-600'
                                            : billing.payment_status === 'Overdue'
                                                ? 'bg-amber-50 text-amber-600'
                                                : 'bg-red-50 text-red-600'
                                    }`}>
                                        {billing.payment_status}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
                                    <InfoBlock
                                        label="Context"
                                        value={`${billing.main_treatment || 'Clinic Availment'}${billing.item_count > 1 ? ` (+${billing.item_count - 1} more)` : ''}`}
                                    />
                                    <InfoBlock
                                        label="Date"
                                        value={billing.payment_date ? new Date(billing.payment_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not yet paid'}
                                    />
                                    <InfoBlock label="Method" value={billing.payment_method || 'N/A'} />
                                    <InfoBlock label="Reference" value={billing.reference_number || 'N/A'} />
                                    <InfoBlock label="Amount" value={formatCurrency(billing.total_amount)} />
                                </div>

                                <button onClick={() => viewInvoiceDetails(billing.invoice_id)} className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-[#c4ba9d]/40 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#8f8167] transition hover:border-[#c4ba9d] hover:text-[#6f624c]">
                                    View Invoice
                                </button>
                            </div>

                            <div className="hidden grid-cols-14 gap-4 items-center text-base text-gray-700 p-4 hover:bg-[#faf9f6] rounded-2xl transition border border-transparent hover:border-gray-100 xl:grid">
                                <div className="col-span-2 uppercase text-xs font-bold tracking-[0.18em] text-gray-400">
                                    INV-{String(billing.invoice_id).padStart(4, '0')}
                                </div>
                                <div className="col-span-2 font-bold text-gray-800 truncate">
                                    {billing.last_name}, {billing.first_name}
                                </div>
                                <div className="col-span-3 flex flex-col">
                                    <span className="font-medium text-gray-800 truncate">
                                        {billing.main_treatment || 'Clinic Availment'}
                                        {billing.item_count > 1 && <span className="text-[#c4ba9d] text-xs ml-1 uppercase font-bold tracking-[0.18em]">(+{billing.item_count - 1} more)</span>}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        {billing.payment_date ? new Date(billing.payment_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not yet paid'}
                                    </span>
                                </div>
                                <div className="col-span-2 text-sm font-medium text-gray-500">
                                    {billing.payment_method || 'N/A'}
                                </div>
                                <div className="col-span-2 text-sm text-gray-500">
                                    {billing.reference_number || 'N/A'}
                                </div>
                                <div className="col-span-1 text-center">
                                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.18em] ${
                                        billing.payment_status === 'Paid'
                                            ? 'bg-green-50 text-green-600'
                                            : billing.payment_status === 'Overdue'
                                                ? 'bg-amber-50 text-amber-600'
                                                : 'bg-red-50 text-red-600'
                                    }`}>
                                        {billing.payment_status}
                                    </span>
                                </div>
                                <div className="col-span-1 text-right font-bold text-gray-900">
                                    {formatCurrency(billing.total_amount)}
                                </div>
                                <div className="col-span-1 text-right">
                                    <button onClick={() => viewInvoiceDetails(billing.invoice_id)} className="text-[#c4ba9d] hover:text-[#555555] transition text-xs font-bold uppercase tracking-[0.18em]">View</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {filteredBillings.length > 0 && (
                <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            className="bg-white border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#d4af37] text-sm text-gray-700"
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                        <span className="text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                        </div>
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-5 sm:p-8 lg:p-12 animate-fadeIn relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button onClick={() => { setIsAddModalOpen(false); resetAddInvoiceForm(); }} className="absolute right-5 top-5 text-gray-300 transition hover:text-[#555555] sm:right-8 sm:top-8">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="mb-8 text-center">
                            <h3 className="text-2xl font-bold text-gray-800">New Transaction</h3>
                            <p className="text-xs text-[#c4ba9d] font-bold uppercase tracking-[0.2em] mt-1">Record Clinic Availment</p>
                        </div>

                        <form onSubmit={handleSaveInvoice}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-2">Select Patient</label>
                                    <select className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d]" value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} required>
                                        <option value="">-- Choose Patient --</option>
                                        {sortedPatients.map((patient) => (
                                            <option key={patient.patient_id} value={patient.patient_id}>
                                                {String(patient.patient_id).padStart(3, '0')} - {patient.last_name}, {patient.first_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-2">Payment Status</label>
                                    <select className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d]" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                                        <option value="Paid">Paid</option>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-2">Payment Method</label>
                                    <select className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d]" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                        <option value="Cash">Cash</option>
                                        <option value="GCash">GCash</option>
                                        <option value="Maya">Maya</option>
                                        <option value="Credit Card">Credit Card</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-2">Reference Number</label>
                                    <input
                                        type="text"
                                        placeholder={paymentMethod === 'Cash' ? 'Not required for cash' : 'Enter payment reference'}
                                        className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d] text-gray-700"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        disabled={paymentMethod === 'Cash'}
                                    />
                                    {paymentMethod !== 'Cash' && paymentStatus === 'Paid' && (
                                        <p className="text-xs text-gray-400 mt-2">Required for non-cash paid invoices.</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Availments</label>
                                    <button type="button" onClick={handleAddItem} className="text-[#c4ba9d] hover:text-[#555555] text-xs font-bold uppercase tracking-[0.18em] transition">+ Add Line</button>
                                </div>

                                {items.map((item, index) => (
                                    <div key={index} className="rounded-xl border border-gray-50 bg-[#faf9f6] p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <select className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-500 outline-none focus:border-[#c4ba9d]" value={item.type} onChange={(e) => handleItemChange(index, 'type', e.target.value)}>
                                                <option value="Service">Service</option>
                                                <option value="Product">Product</option>
                                            </select>

                                            {items.length > 1 ? (
                                                <button type="button" onClick={() => handleRemoveItem(index)} className="rounded-full p-2 text-gray-300 transition hover:bg-white hover:text-red-400">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            ) : <div className="h-8 w-8" />}
                                        </div>

                                        <div className="mt-3">
                                            {item.type === 'Service' ? (
                                                <select
                                                    className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]"
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
                                                <input type="text" placeholder="Product description" className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required />
                                            )}
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Quantity</p>
                                                {item.type === 'Product' ? (
                                                    <input type="number" placeholder="Qty" min="1" className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} required />
                                                ) : (
                                                    <div className="mt-2 rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-gray-300">N/A</div>
                                                )}
                                            </div>

                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Price</p>
                                                <input type="number" placeholder="Price" min="0" step="any" className="mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-right text-gray-700 outline-none focus:border-[#c4ba9d]" value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} required />
                                            </div>

                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Line Total</p>
                                                <div className="mt-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-right text-sm font-bold text-gray-800">
                                                    {formatCurrency((parseFloat(item.unit_price) || 0) * item.quantity)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-4 border-t border-gray-100 pt-8 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em]">Total Amount</p>
                                    <span className="text-3xl font-bold text-gray-900">{formatCurrency(calculateTotal())}</span>
                                </div>
                                <button type="submit" disabled={loadingAdd} className="w-full rounded-full bg-[#555555] px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] sm:w-auto">
                                    {loadingAdd ? 'Saving...' : 'Save Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isViewModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-12 animate-fadeIn relative">
                        <button onClick={() => setIsViewModalOpen(false)} className="absolute top-8 right-8 text-gray-300 hover:text-[#555555] transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="mb-8 text-center border-b border-gray-50 pb-6">
                            <h3 className="text-2xl font-bold text-gray-800">Billing Summary</h3>
                            <p className="text-sm text-[#c4ba9d] font-bold uppercase tracking-[0.2em] mt-2">{selectedInvoice.patient_name}</p>
                            <div className="flex justify-center gap-6 mt-4 text-xs text-gray-400 uppercase tracking-[0.18em] font-bold">
                                <span>Date: {selectedInvoice.date ? new Date(selectedInvoice.date).toLocaleDateString() : 'Not yet paid'}</span>
                                <span>|</span>
                                <span>Method: {selectedInvoice.payment_method || 'N/A'}</span>
                                <span>|</span>
                                <span>Status: {viewPaymentStatus || selectedInvoice.payment_status || 'Unpaid'}</span>
                            </div>
                            <div className="mt-3 text-sm text-gray-500">
                                Reference: {selectedInvoice.reference_number || 'N/A'}
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-4 text-xs font-bold uppercase tracking-[0.18em] text-gray-400 px-4 mb-2">
                                <div className="col-span-2">Service/Item</div>
                                <div className="text-center">Qty</div>
                                <div className="text-right">Price</div>
                            </div>
                            {selectedInvoice.items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-4 text-sm text-gray-600 bg-[#faf9f6] p-4 rounded-xl border border-gray-50">
                                    <div className="col-span-2 font-medium">{item.description}</div>
                                    <div className="text-center text-gray-400">{item.quantity}</div>
                                    <div className="text-right font-bold text-gray-800">{formatCurrency(item.total_price)}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-8 mt-4">
                            <div className="flex flex-col">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em]">Grand Total</p>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(selectedInvoice.total || 0)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                {viewPaymentStatus === 'Paid' && selectedInvoice.payment_method !== 'Cash' && (
                                    <input
                                        type="text"
                                        value={markPaidReferenceNumber}
                                        onChange={(e) => setMarkPaidReferenceNumber(e.target.value)}
                                        placeholder="Reference number"
                                        className="w-56 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#c4ba9d] text-gray-700"
                                    />
                                )}
                                <div className="flex items-center gap-3">
                                    <select
                                        value={viewPaymentStatus}
                                        onChange={(e) => setViewPaymentStatus(e.target.value)}
                                        className="px-4 py-3 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-[0.18em] text-gray-700 bg-white outline-none focus:border-[#c4ba9d]"
                                    >
                                        <option value="Paid">Paid</option>
                                        <option value="Unpaid">Unpaid</option>
                                        <option value="Overdue">Overdue</option>
                                    </select>
                                    <button onClick={() => handleUpdatePaymentStatus(selectedInvoice.invoice_id)} className="px-6 py-4 bg-green-600 text-white text-xs font-bold uppercase tracking-[0.18em] rounded-full hover:bg-green-700 transition shadow-lg">Save Status</button>
                                    <button onClick={handleExportPDF} className="px-6 py-4 bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em] rounded-full shadow-xl hover:bg-[#404040] transition">Export to PDF</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
        <p className="mt-1 break-words text-sm text-gray-700">{value}</p>
    </div>
);

export default BillingAndPayments;
