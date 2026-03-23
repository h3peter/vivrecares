import { useState, useEffect } from 'react';
import axios from 'axios';

const AppointmentLogs = () => {
    const [appointments, setAppointments] = useState([]);
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

    const fetchAppointments = async () => {
        try {
            const res = await axios.get('http://localhost/vivrecares/vivrecares-api/get_all_appointments.php');
            if (Array.isArray(res.data)) {
                setAppointments(res.data);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    useEffect(() => {
        fetchAppointments();
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
        const matchesStatus = statusFilter === 'All' || apt.status === statusFilter;
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
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'text-green-500';
            case 'pending':
                return 'text-orange-400';
            case 'confirmed':
                return 'text-blue-500';
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
        setSelectedApt({ ...apt });
        setIsModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/update_appointment.php', selectedApt);
            if (res.data.status === 'success') {
                setIsModalOpen(false);
                fetchAppointments();
            }
        } catch (error) {
            console.error('Update error:', error);
        }
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setBranchFilter('All');
        setTypeFilter('All');
        setStartDate('');
        setEndDate('');
    };

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen relative">
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
                            Showing <span className="font-semibold text-gray-700">{filteredLogs.length}</span> of {appointments.length} appointments
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                        <div className="xl:col-span-2">
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
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-[0.18em] mb-2 block">From</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#b2a58d] text-gray-700" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-[0.18em] mb-2 block">To</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#b2a58d] text-gray-700" />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={clearFilters} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#b2a58d] hover:text-[#8f8167] transition">
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-12 gap-4 mb-6 text-[#b2a58d] text-xs uppercase tracking-[0.18em] font-bold px-4 border-b border-gray-50 pb-4">
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Patient</div>
                    <div className="col-span-3">Type / Branch</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Time Slot</div>
                    <div className="col-span-1 text-center">Action</div>
                </div>

                <div className="space-y-4 px-4 pb-4">
                    {paginatedLogs.map((apt) => (
                        <div key={apt.appointment_id} className="grid grid-cols-12 gap-4 items-center text-base text-gray-700 hover:bg-[#faf9f6] p-4 rounded-2xl transition">
                            <div className={`col-span-2 uppercase text-xs font-bold tracking-[0.18em] ${getStatusColor(apt.status)}`}>
                                {apt.status}
                            </div>
                            <div className="col-span-2 font-bold text-gray-800">{apt.first_name} {apt.last_name}</div>
                            <div className="col-span-3 flex flex-col">
                                <span className="font-medium">{apt.appointment_type || 'General'}</span>
                                <span className="text-xs text-gray-400 uppercase tracking-[0.18em] mt-1">{apt.branch || 'Unassigned'}</span>
                            </div>
                            <div className="col-span-2 text-gray-600">{apt.date}</div>
                            <div className="col-span-2 text-gray-600">{formatTime(apt.time)}</div>
                            <div className="col-span-1 flex justify-center text-gray-400">
                                <button onClick={() => handleEditClick(apt)} className="hover:text-[#b2a58d] transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredLogs.length === 0 && <p className="text-center text-base text-gray-400 italic py-6">No appointments found.</p>}
                </div>
            </div>

            {filteredLogs.length > 0 && (
                <div className="mt-8 flex justify-between items-center">
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

                    <div className="flex items-center gap-6">
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

            {isModalOpen && selectedApt && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-10 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-300 hover:text-gray-800 transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="mb-8 border-b border-gray-50 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Manage Appointment</h2>
                            <p className="text-xs text-[#b2a58d] font-bold uppercase tracking-[0.18em] mt-1">{selectedApt.appointment_type}</p>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Patient and Concerns</label>
                                <input type="text" disabled value={`${selectedApt.first_name} ${selectedApt.last_name}`} className="w-full border-b border-gray-100 py-2 bg-transparent text-gray-800 font-medium outline-none" />
                                <textarea disabled rows="2" className="w-full bg-[#faf9f6] p-3 rounded-lg text-sm text-gray-500 mt-2 resize-none" value={selectedApt.concerns || 'No specific concerns provided.'}></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Date</label>
                                    <input type="date" value={selectedApt.date} onChange={(e) => setSelectedApt({ ...selectedApt, date: e.target.value })} className="w-full border-b border-gray-200 py-2 outline-none text-gray-700" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Time</label>
                                    <input type="time" value={selectedApt.time} onChange={(e) => setSelectedApt({ ...selectedApt, time: e.target.value })} className="w-full border-b border-gray-200 py-2 outline-none text-gray-700" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Branch</label>
                                    <select value={selectedApt.branch} onChange={(e) => setSelectedApt({ ...selectedApt, branch: e.target.value })} className="w-full border-b border-gray-200 py-2 outline-none bg-white text-gray-700">
                                        <option value="Pasay Branch">Pasay Branch</option>
                                        <option value="Valenzuela Branch">Valenzuela Branch</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Status</label>
                                    <select value={selectedApt.status} onChange={(e) => setSelectedApt({ ...selectedApt, status: e.target.value })} className="w-full border-b border-gray-200 py-2 outline-none bg-white text-gray-700 font-medium">
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-center pt-6">
                                <button type="submit" className="w-16 h-16 bg-[#555555] rounded-full flex items-center justify-center text-[#c4ba9d] shadow-lg hover:bg-black transition transform hover:scale-105">
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

export default AppointmentLogs;
