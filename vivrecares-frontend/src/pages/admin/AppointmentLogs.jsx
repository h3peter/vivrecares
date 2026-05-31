import { useState, useEffect } from 'react';
import axios from 'axios';
import ActionFeedbackModal from '../../components/ActionFeedbackModal';
import { TableRowsSkeleton } from '../../components/PageSkeleton';
import { downloadCsvReport } from '../../utils/reportExports';

const normalizeStatus = (status) => (status || '').toString().trim().toLowerCase();

const getStatusLabel = (status) => {
    const normalized = normalizeStatus(status);

    switch (normalized) {
        case 'pending':
            return 'Pending';
        case 'confirmed':
            return 'Confirmed';
        case 'rescheduled':
            return 'Rescheduled';
        case 'completed':
            return 'Completed';
        case 'cancelled':
            return 'Cancelled';
        default:
            return status || 'Unknown';
    }
};

const getStatusBadgeClass = (status) => {
    switch (normalizeStatus(status)) {
        case 'completed':
            return 'bg-green-50 text-green-600';
        case 'pending':
            return 'bg-orange-50 text-orange-500';
        case 'confirmed':
            return 'bg-blue-50 text-blue-600';
        case 'rescheduled':
            return 'bg-amber-50 text-amber-700';
        case 'cancelled':
            return 'bg-red-50 text-red-600';
        default:
            return 'bg-[#faf4dd] text-[#a8892d]';
    }
};

const AppointmentLogs = () => {
    const [appointments, setAppointments] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [slots, setSlots] = useState([]);
    const [branches, setBranches] = useState(['Pasay Branch', 'Valenzuela Branch']);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [branchFilter, setBranchFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApt, setSelectedApt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(true);
    const today = new Date().toISOString().split('T')[0];

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/get_all_appointments.php');
            if (Array.isArray(res.data)) {
                setAppointments(res.data);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('/get_appointment_settings.php');
                if (res.data.status === 'success') {
                    if (Array.isArray(res.data.branches) && res.data.branches.length > 0) {
                        setBranches(res.data.branches);
                    }
                    setAvailability(res.data.availability || []);
                    setSlots(res.data.slots || []);
                }
            } catch (error) {
                console.error('Error fetching appointment settings:', error);
            }
        };

        fetchSettings();
    }, []);

    const normalizeDate = (value) => {
        if (!value) return null;
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return null;
        parsed.setHours(0, 0, 0, 0);
        return parsed;
    };

    const filteredLogs = appointments.filter((apt) => {
        const haystack = [
            apt.first_name,
            apt.last_name,
            apt.appointment_type,
            apt.branch,
            apt.status,
            apt.concerns,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        const appointmentDate = normalizeDate(apt.date);
        const rangeStart = normalizeDate(startDate);
        const rangeEnd = normalizeDate(endDate);

        const matchesSearch = haystack.includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || normalizeStatus(apt.status) === normalizeStatus(statusFilter);
        const matchesBranch = branchFilter === 'All' || apt.branch === branchFilter;
        const matchesType = typeFilter === 'All' || apt.appointment_type === typeFilter;
        const matchesStart = !rangeStart || (appointmentDate && appointmentDate >= rangeStart);
        const matchesEnd = !rangeEnd || (appointmentDate && appointmentDate <= rangeEnd);

        return matchesSearch && matchesStatus && matchesBranch && matchesType && matchesStart && matchesEnd;
    });

    const uniqueTypes = ['All', ...new Set(appointments.map((apt) => apt.appointment_type).filter(Boolean))];
    const uniqueBranches = ['All', ...new Set(appointments.map((apt) => apt.branch).filter(Boolean))];

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, branchFilter, typeFilter, startDate, endDate, rowsPerPage]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const paginatedLogs = filteredLogs.slice(indexOfFirstRow, indexOfLastRow);

    const getStatusColor = (status) => {
        switch (normalizeStatus(status)) {
            case 'completed':
                return 'text-green-500';
            case 'pending':
                return 'text-orange-400';
            case 'confirmed':
                return 'text-blue-500';
            case 'rescheduled':
                return 'text-amber-700';
            case 'cancelled':
                return 'text-red-500';
            default:
                return 'text-[#d4af37]';
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const h = parseInt(hour, 10);
        return `${h % 12 || 12}:${minute} ${h >= 12 ? 'PM' : 'AM'}`;
    };

    const handleEditClick = (apt) => {
        setSelectedApt({
            ...apt,
            original_date: apt.date,
            original_time: apt.time,
            original_branch: apt.branch,
        });
        setIsModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/update_appointment.php', selectedApt);
            if (res.data.status === 'success') {
                setIsModalOpen(false);
                fetchAppointments();
                if (res.data.mail_status === 'failed') {
                    setFeedback({
                        tone: 'info',
                        title: 'Appointment Updated',
                        message: res.data.message || 'The appointment was updated, but we could not send the email notification right now.',
                    });
                } else if (res.data.appointment_status === 'Rescheduled') {
                    setFeedback({
                        tone: 'success',
                        title: 'Reschedule Request Sent',
                        message: res.data.message || 'The updated schedule is now waiting for patient confirmation.',
                    });
                } else {
                    setFeedback({
                        tone: 'success',
                        title: 'Appointment Updated',
                        message: res.data.message || 'The appointment has been updated successfully.',
                    });
                }
            } else {
                setFeedback({
                    tone: 'error',
                    title: 'Update Failed',
                    message: res.data.message || 'Unable to update appointment.',
                });
            }
        } catch (error) {
            console.error('Update error:', error);
            setFeedback({
                tone: 'error',
                title: 'Update Failed',
                message: 'Unable to update appointment right now.',
            });
        }
    };

    const selectedBranchAvailability = selectedApt
        ? availability.filter((day) => day.branch === selectedApt.branch && Number(day.is_active) === 1)
        : [];
    const selectedBranchWeekdays = selectedBranchAvailability.map((day) => Number(day.weekday));
    const selectedBranchSlots = selectedApt
        ? slots
            .filter((slot) => slot.branch === selectedApt.branch && Number(slot.is_active) === 1)
            .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
        : [];
    const selectedWeekday = selectedApt?.date ? new Date(`${selectedApt.date}T12:00:00`).getDay() : null;
    const selectedDateIsValid = selectedApt?.date
        ? selectedBranchWeekdays.includes(selectedWeekday)
        : true;
    const selectedTimeIsValid = selectedApt?.time
        ? selectedBranchSlots.some((slot) => slot.slot_time === selectedApt.time)
        : true;
    const updateBlocked = selectedApt
        ? selectedApt.status !== 'Cancelled' && (!selectedApt.date || !selectedApt.time || !selectedDateIsValid || !selectedTimeIsValid)
        : false;

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setBranchFilter('All');
        setTypeFilter('All');
        setStartDate('');
        setEndDate('');
    };

    const handleExport = () => {
        downloadCsvReport({
            filename: 'appointment_logs.csv',
            columns: [
                { key: 'appointment_id', label: 'Appointment ID' },
                { key: 'patient', label: 'Patient' },
                { key: 'appointment_type', label: 'Type' },
                { key: 'branch', label: 'Branch' },
                { key: 'date', label: 'Date' },
                { key: 'time_label', label: 'Time' },
                { key: 'status', label: 'Status' },
                { key: 'concerns', label: 'Concerns' },
            ],
            rows: filteredLogs.map((apt) => ({
                ...apt,
                patient: `${apt.first_name || ''} ${apt.last_name || ''}`.trim(),
                time_label: formatTime(apt.time),
            })),
        });
    };

    const scheduleChanged = selectedApt
        ? selectedApt.date !== selectedApt.original_date
            || selectedApt.time !== selectedApt.original_time
            || selectedApt.branch !== selectedApt.original_branch
        : false;

    return (
        <div className="min-h-screen relative bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <ActionFeedbackModal
                open={Boolean(feedback)}
                tone={feedback?.tone}
                title={feedback?.title}
                message={feedback?.message}
                onClose={() => setFeedback(null)}
            />
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Scheduling Desk</p>
                <div className="flex flex-col gap-6 bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Appointment Logs</h1>
                            <p className="text-sm text-gray-500 mt-2">
                                Review, filter, and update appointment records with standard operational filters.
                            </p>
                        </div>
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-700">{loading ? '...' : filteredLogs.length}</span> of {loading ? '...' : appointments.length} appointments
                        </div>
                        <button
                            type="button"
                            onClick={handleExport}
                            className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-gray-700 transition hover:border-gray-500 lg:w-auto"
                        >
                            Export CSV
                        </button>
                    </div>

                    <div className="lg:hidden">
                        <button
                            type="button"
                            onClick={() => setShowMobileFilters((prev) => !prev)}
                            className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-left"
                        >
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Filters</p>
                                <p className="mt-1 text-sm text-gray-500">Tap to refine appointment records</p>
                            </div>
                            <svg className={`h-5 w-5 text-gray-400 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>

                    <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block`}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr]">
                            <div>
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-[0.18em] mb-2 block">Search Records</label>
                            <input
                                type="text"
                                placeholder="Patient, concern, branch, or appointment type"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#b2a58d] text-gray-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-[0.18em] mb-2 block">Status</label>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#b2a58d] bg-white text-gray-700">
                                    <option value="All">All statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Rescheduled">Rescheduled</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-[0.18em] mb-2 block">Branch</label>
                                <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#b2a58d] bg-white text-gray-700">
                                    {uniqueBranches.map((branch) => (
                                        <option key={branch} value={branch}>
                                            {branch === 'All' ? 'All branches' : branch}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-[0.18em] mb-2 block">Type</label>
                                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#b2a58d] bg-white text-gray-700">
                                    {uniqueTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type === 'All' ? 'All types' : type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[0.7fr_0.7fr_auto] xl:items-end">
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-[0.18em] mb-2 block">From</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#b2a58d] text-gray-700" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold uppercase tracking-[0.18em] mb-2 block">To</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#b2a58d] text-gray-700" />
                            </div>
                            <div className="flex justify-start xl:justify-end">
                                <button onClick={clearFilters} className="w-full px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#b2a58d] hover:text-[#8f8167] transition md:w-auto">
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:p-8">
                <div className="mb-6 hidden grid-cols-12 gap-4 border-b border-gray-50 px-4 pb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d] lg:grid">
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Patient</div>
                    <div className="col-span-3">Type / Branch</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Time Slot</div>
                    <div className="col-span-1 text-center">Action</div>
                </div>

                <div className="space-y-4 px-0 pb-0 lg:px-4 lg:pb-4 readable-data-table">
                    {loading ? (
                        <TableRowsSkeleton rows={5} columns={6} />
                    ) : paginatedLogs.map((apt) => (
                        <div key={apt.appointment_id}>
                            <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 sm:p-5 lg:hidden">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-base font-bold text-gray-800">{apt.first_name} {apt.last_name}</p>
                                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d]">{apt.appointment_type || 'General'}</p>
                                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">{apt.branch || 'Unassigned'}</p>
                                    </div>
                                    <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${getStatusBadgeClass(apt.status)}`}>
                                        {getStatusLabel(apt.status)}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
                                    <InfoBlock label="Date" value={apt.date || 'No date'} />
                                    <InfoBlock label="Time Slot" value={formatTime(apt.time) || 'No time'} />
                                </div>

                                <button onClick={() => handleEditClick(apt)} className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-[#c4ba9d]/40 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#8f8167] transition hover:border-[#c4ba9d] hover:text-[#6f624c]">
                                    Edit Appointment
                                </button>
                            </div>

                            <div className="hidden grid-cols-12 items-center gap-4 rounded-2xl p-4 text-base text-gray-700 transition hover:bg-[#faf9f6] lg:grid">
                                <div className="col-span-2">
                                    <span className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${getStatusBadgeClass(apt.status)} ${getStatusColor(apt.status)}`}>
                                        {getStatusLabel(apt.status)}
                                    </span>
                                </div>
                                <div className="col-span-2 font-bold text-gray-800">{apt.first_name} {apt.last_name}</div>
                                <div className="col-span-3 flex flex-col">
                                    <span className="font-medium">{apt.appointment_type || 'General'}</span>
                                    <span className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">{apt.branch || 'Unassigned'}</span>
                                </div>
                                <div className="col-span-2 text-gray-600">{apt.date}</div>
                                <div className="col-span-2 text-gray-600">{formatTime(apt.time)}</div>
                                <div className="col-span-1 flex justify-center text-gray-400">
                                    <button onClick={() => handleEditClick(apt)} className="transition hover:text-[#b2a58d]">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!loading && filteredLogs.length === 0 && <p className="text-center text-base text-gray-400 italic py-6">No appointments found.</p>}
                </div>
            </div>

            {!loading && filteredLogs.length > 0 && (
                <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            className="rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-[#d4af37]"
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
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#d4af37] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && selectedApt && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex justify-end bg-white px-6 pb-0 pt-6 sm:px-8">
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-300 hover:text-gray-800 transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto px-6 pb-8 pt-3 sm:px-8 sm:pb-10">

                        <div className="mb-8 border-b border-gray-50 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Manage Appointment</h2>
                            <p className="text-xs text-[#b2a58d] font-bold uppercase tracking-[0.18em] mt-1">{selectedApt.appointment_type}</p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            {selectedApt.status === 'Rescheduled' && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Pending Patient Approval</p>
                                    <p className="mt-2 text-sm leading-relaxed text-amber-800">
                                        This appointment already has a proposed schedule change. The patient can confirm or decline it from My Appointments.
                                    </p>
                                    {(selectedApt.previous_appointment_date || selectedApt.previous_appointment_time || selectedApt.previous_branch) && (
                                        <p className="mt-3 text-xs leading-relaxed text-amber-700">
                                            Previous schedule: {selectedApt.previous_appointment_date || 'No date'} at {formatTime(selectedApt.previous_appointment_time) || 'No time'} in {selectedApt.previous_branch || 'No branch'}.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Patient and Concerns</label>
                                <input type="text" disabled value={`${selectedApt.first_name} ${selectedApt.last_name}`} className="w-full border-b border-gray-100 py-2 bg-transparent text-gray-800 font-medium outline-none" />
                                <textarea disabled rows="2" className="w-full bg-[#faf9f6] p-3 rounded-lg text-sm text-gray-500 mt-2 resize-none" value={selectedApt.concerns || 'No specific concerns provided.'}></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Date</label>
                                    <input
                                        type="date"
                                        min={today}
                                        value={selectedApt.date}
                                        onChange={(e) => setSelectedApt({ ...selectedApt, date: e.target.value })}
                                        className="w-full border-b border-gray-200 py-2 outline-none text-gray-700"
                                    />
                                    <p className="text-[11px] text-gray-400 mt-2">
                                        Active weekdays: {selectedBranchAvailability.map((day) => day.weekday_name).join(', ') || 'No active weekdays configured'}
                                    </p>
                                    {!selectedDateIsValid && (
                                        <p className="text-[11px] text-red-500 mt-2">The selected date does not match this branch&apos;s active weekdays.</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Time</label>
                                    <select
                                        value={selectedApt.time}
                                        onChange={(e) => setSelectedApt({ ...selectedApt, time: e.target.value })}
                                        className="w-full border-b border-gray-200 py-2 outline-none bg-white text-gray-700"
                                    >
                                        <option value="">Select a time slot</option>
                                        {selectedBranchSlots.map((slot) => (
                                            <option key={`${slot.branch}-${slot.slot_time}`} value={slot.slot_time}>
                                                {slot.slot_label}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedBranchSlots.length === 0 && (
                                        <p className="text-[11px] text-red-500 mt-2">No active time slots are configured for this branch.</p>
                                    )}
                                    {!selectedTimeIsValid && (
                                        <p className="text-[11px] text-red-500 mt-2">The selected time is not active for this branch.</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Branch</label>
                                    <select
                                        value={selectedApt.branch}
                                        onChange={(e) => setSelectedApt({ ...selectedApt, branch: e.target.value, date: '', time: '' })}
                                        className="w-full border-b border-gray-200 py-2 outline-none bg-white text-gray-700"
                                    >
                                        {branches.map((branch) => (
                                            <option key={branch} value={branch}>{branch}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Status</label>
                                    <select value={selectedApt.status} onChange={(e) => setSelectedApt({ ...selectedApt, status: e.target.value })} className="w-full border-b border-gray-200 py-2 outline-none bg-white text-gray-700 font-medium">
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Rescheduled">Rescheduled</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            {selectedApt.status !== 'Cancelled' && selectedApt.status !== 'Completed' && (
                                <div className="rounded-2xl border border-[#ece5d8] bg-[#faf8f4] px-4 py-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a89880]">Reschedule Behavior</p>
                                    <p className="mt-2 text-sm leading-relaxed text-[#6f675b]">
                                        If you change the branch, date, or time, the appointment will be marked as <strong>Rescheduled</strong> and the patient must confirm or decline the new schedule.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-center pt-6">
                                <button
                                    type="submit"
                                    disabled={updateBlocked}
                                    className="w-16 h-16 bg-[#555555] rounded-full flex items-center justify-center text-[#c4ba9d] shadow-lg hover:bg-black transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#555555] disabled:hover:scale-100"
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                            </div>
                            {updateBlocked && (
                                <p className="text-center text-[11px] uppercase tracking-[0.18em] text-red-500 font-bold">
                                    Choose a valid branch date and active time slot before saving.
                                </p>
                            )}
                            {!updateBlocked && scheduleChanged && selectedApt.status !== 'Cancelled' && selectedApt.status !== 'Completed' && (
                                <p className="text-center text-[11px] uppercase tracking-[0.18em] text-amber-600 font-bold">
                                    Saving this change will send a reschedule request to the patient.
                                </p>
                            )}
                        </form>
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
        <p className="mt-1 text-sm text-gray-700">{value}</p>
    </div>
);

export default AppointmentLogs;
