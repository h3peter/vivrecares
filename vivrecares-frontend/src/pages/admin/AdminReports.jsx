import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { downloadCsvReport, printTableReport } from '../../utils/reportExports';

const normalizeDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
};

const getMonthValue = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (value) => {
    if (!value) return 'All months';
    const [year, month] = value.split('-');
    const parsed = new Date(Number(year), Number(month) - 1, 1);
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
};

const buildFilterMeta = (items) =>
    items
        .filter((item) => item.value && item.value !== 'All')
        .map((item) => ({ label: item.label, value: item.value }));

const getTransactionBranchValue = (billing) => billing.branch || '';

const AdminReports = () => {
    const [billings, setBillings] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]);

    const [transactionSearch, setTransactionSearch] = useState('');
    const [transactionStatus, setTransactionStatus] = useState('All');
    const [transactionBranch, setTransactionBranch] = useState('All');
    const [transactionMonth, setTransactionMonth] = useState('');
    const [transactionDay, setTransactionDay] = useState('');
    const [transactionStartDate, setTransactionStartDate] = useState('');
    const [transactionEndDate, setTransactionEndDate] = useState('');

    const [visitSearch, setVisitSearch] = useState('');
    const [visitService, setVisitService] = useState('All');
    const [visitBranch, setVisitBranch] = useState('All');
    const [visitStatus, setVisitStatus] = useState('All');
    const [visitMonth, setVisitMonth] = useState('');
    const [visitDay, setVisitDay] = useState('');
    const [showTransactionFilters, setShowTransactionFilters] = useState(false);
    const [showVisitFilters, setShowVisitFilters] = useState(false);

    useEffect(() => {
        const loadReports = async () => {
            try {
                const [billingsRes, appointmentsRes, servicesRes] = await Promise.all([
                    axios.get('/get_billings.php'),
                    axios.get('/get_all_appointments.php'),
                    axios.get('/get_services.php?active_only=1'),
                ]);

                if (Array.isArray(billingsRes.data)) setBillings(billingsRes.data);
                if (Array.isArray(appointmentsRes.data)) setAppointments(appointmentsRes.data);
                if (Array.isArray(servicesRes.data)) setServices(servicesRes.data);
            } catch (error) {
                console.error('Error loading admin reports', error);
            }
        };

        loadReports();
    }, []);

    const formatCurrency = (amount) =>
        new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
        }).format(Number(amount || 0));

    const transactionBranches = useMemo(
        () => ['All', ...new Set(billings.map((billing) => billing.branch).filter(Boolean))],
        [billings]
    );

    const visitBranches = useMemo(
        () => ['All', ...new Set(appointments.map((appointment) => appointment.branch).filter(Boolean))],
        [appointments]
    );

    const serviceOptions = useMemo(
        () => [
            { value: 'All', label: 'All services' },
            ...services.map((service) => ({
                value: service.service_name,
                label: service.category_name ? `${service.category_name} - ${service.service_name}` : service.service_name,
            })),
        ],
        [services]
    );

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
                    billing.branch,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                const billingDate = normalizeDate(billing.payment_date);
                const rangeStart = normalizeDate(transactionStartDate);
                const rangeEnd = normalizeDate(transactionEndDate);

                const matchesSearch = haystack.includes(transactionSearch.toLowerCase());
                const matchesStatus = transactionStatus === 'All' || billing.payment_status === transactionStatus;
                const matchesBranch = transactionBranch === 'All' || getTransactionBranchValue(billing) === transactionBranch;
                const matchesMonth = !transactionMonth || getMonthValue(billing.payment_date) === transactionMonth;
                const matchesDay = !transactionDay || (billingDate && billingDate.getTime() === normalizeDate(transactionDay)?.getTime());
                const matchesStart = !rangeStart || (billingDate && billingDate >= rangeStart);
                const matchesEnd = !rangeEnd || (billingDate && billingDate <= rangeEnd);

                return matchesSearch && matchesStatus && matchesBranch && matchesMonth && matchesDay && matchesStart && matchesEnd;
            }),
        [billings, transactionBranch, transactionDay, transactionEndDate, transactionMonth, transactionSearch, transactionStartDate, transactionStatus]
    );

    const transactionColumns = [
        { key: 'invoice_number', label: 'Invoice #' },
        { key: 'patient_name', label: 'Patient' },
        { key: 'branch', label: 'Branch' },
        { key: 'service', label: 'Service' },
        { key: 'payment_date', label: 'Payment Date' },
        { key: 'payment_method', label: 'Method' },
        { key: 'reference_number', label: 'Reference' },
        { key: 'payment_status', label: 'Status' },
        { key: 'total_amount', label: 'Amount' },
    ];

    const transactionRows = filteredBillings.map((billing) => ({
        invoice_number: `INV-${String(billing.invoice_id).padStart(4, '0')}`,
        patient_name: `${billing.last_name || ''}, ${billing.first_name || ''}`.replace(/^,\s*/, '').trim() || 'N/A',
        branch: billing.branch || 'Not set',
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

    const filteredVisits = useMemo(
        () =>
            appointments.filter((appointment) => {
                const haystack = [
                    appointment.first_name,
                    appointment.last_name,
                    appointment.appointment_type,
                    appointment.branch,
                    appointment.status,
                    appointment.concerns,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                const appointmentDate = normalizeDate(appointment.date);
                const matchesSearch = haystack.includes(visitSearch.toLowerCase());
                const matchesService = visitService === 'All' || (appointment.appointment_type || 'Consultation') === visitService;
                const matchesBranch = visitBranch === 'All' || appointment.branch === visitBranch;
                const matchesStatus = visitStatus === 'All' || appointment.status === visitStatus;
                const matchesMonth = !visitMonth || getMonthValue(appointment.date) === visitMonth;
                const matchesDay = !visitDay || (appointmentDate && appointmentDate.getTime() === normalizeDate(visitDay)?.getTime());

                return matchesSearch && matchesService && matchesBranch && matchesStatus && matchesMonth && matchesDay;
            }),
        [appointments, visitBranch, visitDay, visitMonth, visitSearch, visitService, visitStatus]
    );

    const visitColumns = [
        { key: 'patient_name', label: 'Patient' },
        { key: 'service', label: 'Service' },
        { key: 'branch', label: 'Branch' },
        { key: 'visit_date', label: 'Visit Date' },
        { key: 'visit_time', label: 'Time' },
        { key: 'status', label: 'Status' },
        { key: 'concern', label: 'Concern' },
    ];

    const visitRows = filteredVisits.map((appointment) => ({
        patient_name: `${appointment.last_name || ''}, ${appointment.first_name || ''}`.replace(/^,\s*/, '').trim() || 'N/A',
        service: appointment.appointment_type || 'Consultation',
        branch: appointment.branch || 'N/A',
        visit_date: appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A',
        visit_time: appointment.time || 'N/A',
        status: appointment.status || 'N/A',
        concern: appointment.concerns || 'None reported',
    }));

    const uniquePatients = new Set(filteredVisits.map((appointment) => `${appointment.first_name || ''} ${appointment.last_name || ''}`.trim())).size;
    const completedVisits = filteredVisits.filter((appointment) => appointment.status === 'Completed').length;

    const handleExportTransactions = () => {
        downloadCsvReport({
            filename: 'transaction_history_report.csv',
            columns: transactionColumns,
            rows: transactionRows,
        });
    };

    const handlePrintTransactions = () => {
        printTableReport({
            title: 'Transaction History Report',
            subtitle: 'Administrative financial report for clinic billing activity',
            columns: transactionColumns,
            rows: transactionRows,
            meta: [
                { label: 'Transactions', value: filteredBillings.length },
                { label: 'Collected Revenue', value: formatCurrency(totalRevenue) },
                { label: 'Pending or Unpaid', value: unpaidTransactions },
                ...buildFilterMeta([
                    { label: 'Branch', value: transactionBranch },
                    { label: 'Month', value: transactionMonth ? formatMonthLabel(transactionMonth) : '' },
                    { label: 'Day', value: transactionDay },
                ]),
            ],
        });
    };

    const handleExportVisits = () => {
        downloadCsvReport({
            filename: 'patient_visit_summary_report.csv',
            columns: visitColumns,
            rows: visitRows,
        });
    };

    const handlePrintVisits = () => {
        printTableReport({
            title: 'Patient Visit Summary Report',
            subtitle: 'Administrative visit summary across clinic appointments',
            columns: visitColumns,
            rows: visitRows,
            meta: [
                { label: 'Visits', value: filteredVisits.length },
                { label: 'Patients', value: uniquePatients },
                { label: 'Completed Visits', value: completedVisits },
                ...buildFilterMeta([
                    { label: 'Service', value: visitService === 'All' ? '' : visitService },
                    { label: 'Branch', value: visitBranch },
                    { label: 'Status', value: visitStatus },
                    { label: 'Month', value: visitMonth ? formatMonthLabel(visitMonth) : '' },
                    { label: 'Day', value: visitDay },
                ]),
            ],
        });
    };

    const clearTransactionFilters = () => {
        setTransactionSearch('');
        setTransactionStatus('All');
        setTransactionBranch('All');
        setTransactionMonth('');
        setTransactionDay('');
        setTransactionStartDate('');
        setTransactionEndDate('');
    };

    const clearVisitFilters = () => {
        setVisitSearch('');
        setVisitService('All');
        setVisitBranch('All');
        setVisitStatus('All');
        setVisitMonth('');
        setVisitDay('');
    };

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Reports Workspace</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Administrative Reports</h1>
                <p className="text-sm text-gray-500 mt-2">Generate clean operational and financial reports with export and print actions for staff use.</p>
            </div>

            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Transaction History Report</h2>
                        <p className="text-sm text-gray-500 mt-2">Filter transactions by branch, month, exact day, date range, and status before printing or exporting.</p>
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
                    <MetricCard label="Transactions" value={filteredBillings.length} />
                    <MetricCard label="Collected Revenue" value={formatCurrency(totalRevenue)} />
                    <MetricCard label="Paid" value={paidTransactions.length} />
                    <MetricCard label="Pending or Unpaid" value={unpaidTransactions} />
                </div>

                <div className="mt-8 lg:hidden">
                    <MobileFilterToggle
                        label="Transaction Filters"
                        description="Show or hide transaction report filters"
                        isOpen={showTransactionFilters}
                        onToggle={() => setShowTransactionFilters((prev) => !prev)}
                    />
                </div>

                <div className={`${showTransactionFilters ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4 mt-8 items-end lg:grid`}>
                    <FilterSelect label="Branch" value={transactionBranch} onChange={setTransactionBranch} options={transactionBranches.map((branch) => ({ value: branch, label: branch === 'All' ? 'All branches' : branch }))} />
                    <FilterInput label="Month" type="month" value={transactionMonth} onChange={setTransactionMonth} />
                    <FilterInput label="Specific Day" type="date" value={transactionDay} onChange={setTransactionDay} />
                    <FilterInput label="From" type="date" value={transactionStartDate} onChange={setTransactionStartDate} />
                    <FilterInput label="To" type="date" value={transactionEndDate} onChange={setTransactionEndDate} />
                    <FilterSelect
                        label="Status"
                        value={transactionStatus}
                        onChange={setTransactionStatus}
                        options={[
                            { value: 'All', label: 'All statuses' },
                            { value: 'Paid', label: 'Paid' },
                            { value: 'Unpaid', label: 'Unpaid' },
                            { value: 'Overdue', label: 'Overdue' },
                        ]}
                    />
                    <FilterInput label="Search" type="text" value={transactionSearch} onChange={setTransactionSearch} placeholder="Invoice, patient, service, reference" />
                </div>

                <div className={`${showTransactionFilters ? 'flex' : 'hidden'} mt-5 justify-end lg:flex`}>
                    <button onClick={clearTransactionFilters} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#d4af37] hover:text-[#a8892d] transition">
                        Clear Filters
                    </button>
                </div>

                <PreviewTable
                    title="Transaction Preview"
                    description="Current transaction rows that will be printed or exported."
                    count={transactionRows.length}
                    columns={['Invoice', 'Patient', 'Branch', 'Service', 'Date', 'Method', 'Reference', 'Status', 'Amount']}
                    rows={transactionRows}
                    rowKey={(row) => `${row.invoice_number}-${row.reference_number}-${row.branch}`}
                    renderRow={(row) => (
                        <>
                            <div className="font-bold text-gray-800">{row.invoice_number}</div>
                            <div>{row.patient_name}</div>
                            <div>{row.branch}</div>
                            <div>{row.service}</div>
                            <div>{row.payment_date}</div>
                            <div>{row.payment_method}</div>
                            <div>{row.reference_number}</div>
                            <div>
                                <StatusBadge value={row.payment_status} />
                            </div>
                            <div className="text-right font-bold text-gray-800">{row.total_amount}</div>
                        </>
                    )}
                    renderCard={(row) => (
                        <>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{row.invoice_number}</p>
                                    <p className="mt-2 text-base font-bold text-gray-800">{row.patient_name}</p>
                                    <p className="mt-1 text-sm text-gray-500">{row.service}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-800">{row.total_amount}</p>
                                    <div className="mt-2">
                                        <StatusBadge value={row.payment_status} />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <InfoBlock label="Branch" value={row.branch} />
                                <InfoBlock label="Date" value={row.payment_date} />
                                <InfoBlock label="Method" value={row.payment_method} />
                                <InfoBlock label="Reference" value={row.reference_number} />
                            </div>
                        </>
                    )}
                    emptyMessage="No transactions match the current report filters."
                    gridClassName="grid-cols-9"
                />
            </section>

            <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Patient Visit Summary Report</h2>
                        <p className="text-sm text-gray-500 mt-2">Review clinic visits with a service filter that defaults to all services, then print or export the summary.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={handlePrintVisits} className="px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#c4ba9d] hover:text-[#8f8167] transition">
                            Print Summary
                        </button>
                        <button onClick={handleExportVisits} className="px-5 py-3 rounded-xl bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition">
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
                    <MetricCard label="Visits" value={filteredVisits.length} />
                    <MetricCard label="Patients Covered" value={uniquePatients} />
                    <MetricCard label="Completed Visits" value={completedVisits} />
                </div>

                <div className="mt-8 lg:hidden">
                    <MobileFilterToggle
                        label="Visit Filters"
                        description="Show or hide visit summary filters"
                        isOpen={showVisitFilters}
                        onToggle={() => setShowVisitFilters((prev) => !prev)}
                    />
                </div>

                <div className={`${showVisitFilters ? 'grid' : 'hidden'} grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mt-8 items-end lg:grid`}>
                    <FilterSelect label="Service" value={visitService} onChange={setVisitService} options={serviceOptions} />
                    <FilterSelect label="Branch" value={visitBranch} onChange={setVisitBranch} options={visitBranches.map((branch) => ({ value: branch, label: branch === 'All' ? 'All branches' : branch }))} />
                    <FilterSelect
                        label="Status"
                        value={visitStatus}
                        onChange={setVisitStatus}
                        options={[
                            { value: 'All', label: 'All statuses' },
                            { value: 'Pending', label: 'Pending' },
                            { value: 'Confirmed', label: 'Confirmed' },
                            { value: 'Completed', label: 'Completed' },
                            { value: 'Cancelled', label: 'Cancelled' },
                        ]}
                    />
                    <FilterInput label="Month" type="month" value={visitMonth} onChange={setVisitMonth} />
                    <FilterInput label="Specific Day" type="date" value={visitDay} onChange={setVisitDay} />
                    <FilterInput label="Search" type="text" value={visitSearch} onChange={setVisitSearch} placeholder="Patient, concern, service, branch" />
                </div>

                <div className={`${showVisitFilters ? 'flex' : 'hidden'} mt-5 justify-end lg:flex`}>
                    <button onClick={clearVisitFilters} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#d4af37] hover:text-[#a8892d] transition">
                        Clear Filters
                    </button>
                </div>

                <PreviewTable
                    title="Visit Summary Preview"
                    description="Current visit rows that will be printed or exported."
                    count={visitRows.length}
                    columns={['Patient', 'Service', 'Branch', 'Date', 'Time', 'Status', 'Concern']}
                    rows={visitRows}
                    rowKey={(row) => `${row.patient_name}-${row.visit_date}-${row.visit_time}-${row.service}`}
                    renderRow={(row) => (
                        <>
                            <div className="font-bold text-gray-800">{row.patient_name}</div>
                            <div>{row.service}</div>
                            <div>{row.branch}</div>
                            <div>{row.visit_date}</div>
                            <div>{row.visit_time}</div>
                            <div>
                                <StatusBadge value={row.status} />
                            </div>
                            <div>{row.concern}</div>
                        </>
                    )}
                    renderCard={(row) => (
                        <>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-base font-bold text-gray-800">{row.patient_name}</p>
                                    <p className="mt-1 text-sm text-gray-500">{row.service}</p>
                                </div>
                                <StatusBadge value={row.status} />
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <InfoBlock label="Branch" value={row.branch} />
                                <InfoBlock label="Date" value={row.visit_date} />
                                <InfoBlock label="Time" value={row.visit_time} />
                                <InfoBlock label="Concern" value={row.concern} />
                            </div>
                        </>
                    )}
                    emptyMessage="No visits match the current report filters."
                    gridClassName="grid-cols-7"
                />
            </section>
        </div>
    );
};

const MetricCard = ({ label, value }) => (
    <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">{label}</p>
        <h3 className="text-3xl font-bold text-gray-900 mt-3">{value}</h3>
    </div>
);

const FilterInput = ({ label, type, value, onChange, placeholder = '' }) => (
    <div>
        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] text-gray-700"
        />
    </div>
);

const FilterSelect = ({ label, value, onChange, options }) => (
    <div>
        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#d4af37] bg-white text-gray-700"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

const StatusBadge = ({ value }) => (
    <span className="inline-flex px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold uppercase tracking-[0.14em] text-gray-600">
        {value}
    </span>
);

const MobileFilterToggle = ({ label, description, isOpen, onToggle }) => (
    <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-left"
    >
        <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">{label}</p>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        <svg className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
    </button>
);

const PreviewTable = ({ title, description, count, columns, rows, rowKey, renderRow, renderCard, emptyMessage, gridClassName }) => (
    <PaginatedPreviewTable
        title={title}
        description={description}
        count={count}
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        renderRow={renderRow}
        renderCard={renderCard}
        emptyMessage={emptyMessage}
        gridClassName={gridClassName}
    />
);

const PaginatedPreviewTable = ({ title, description, count, columns, rows, rowKey, renderRow, renderCard, emptyMessage, gridClassName }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [rows, rowsPerPage, title]);

    const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const paginatedRows = rows.slice(indexOfFirstRow, indexOfLastRow);

    return (
        <div className="mt-8 border border-gray-100 rounded-3xl overflow-hidden">
            <div className="flex flex-col gap-3 bg-white px-6 py-5 border-b border-gray-50 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                </div>
                <p className="text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{count}</span> records
                </p>
            </div>

            <div className="bg-white p-4 sm:p-6 xl:hidden">
                <div className="space-y-3">
                    {paginatedRows.map((row) => (
                        <div key={rowKey(row)} className="rounded-2xl border border-gray-100 bg-[#faf9f6] px-4 py-4 text-sm text-gray-700">
                            {renderCard ? renderCard(row) : renderRow(row)}
                        </div>
                    ))}
                    {rows.length === 0 && <p className="py-8 text-center text-sm italic text-gray-400">{emptyMessage}</p>}
                </div>
            </div>

            <div className="hidden overflow-x-auto bg-white xl:block">
                <div className="min-w-[980px] p-6">
                    <div className={`grid ${gridClassName} gap-4 mb-4 text-[#b2a58d] text-xs uppercase tracking-[0.18em] font-bold px-4`}>
                        {columns.map((column) => (
                            <div key={column} className={column === 'Amount' ? 'text-right' : ''}>
                                {column}
                            </div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {paginatedRows.map((row) => (
                            <div key={rowKey(row)} className={`grid ${gridClassName} gap-4 items-center rounded-2xl border border-gray-100 bg-[#faf9f6] px-4 py-4 text-sm text-gray-700`}>
                                {renderRow(row)}
                            </div>
                        ))}
                        {rows.length === 0 && <p className="text-center text-sm text-gray-400 italic py-8">{emptyMessage}</p>}
                    </div>
                </div>
            </div>

            {rows.length > 0 && (
                <div className="flex flex-col gap-4 bg-white px-6 pb-6 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            className="bg-white border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#d4af37] text-sm text-gray-700"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
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
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#d4af37] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const InfoBlock = ({ label, value }) => (
    <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
        <p className="mt-1 break-words text-sm text-gray-700">{value}</p>
    </div>
);

export default AdminReports;
