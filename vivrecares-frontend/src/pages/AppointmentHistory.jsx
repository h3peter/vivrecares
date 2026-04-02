import { useEffect, useState } from 'react';
import axios from 'axios';

const AppointmentHistory = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const fetchHistory = async () => {
            const userData = localStorage.getItem('user');
            if (!userData) return;

            const user = JSON.parse(userData);

            try {
                const res = await axios.get(`/get_patient_appointments.php?user_id=${user.id}`);
                if (Array.isArray(res.data)) {
                    setAppointments(res.data);
                }
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

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

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-green-50 text-green-600';
            case 'pending':
                return 'bg-orange-50 text-orange-500';
            case 'confirmed':
                return 'bg-blue-50 text-blue-600';
            case 'cancelled':
                return 'bg-red-50 text-red-600';
            default:
                return 'bg-[#faf4dd] text-[#a8892d]';
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const h = parseInt(hour, 10);
        return `${h % 12 || 12}:${minute} ${h >= 12 ? 'PM' : 'AM'}`;
    };

    const totalPages = Math.max(1, Math.ceil(appointments.length / rowsPerPage));
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = appointments.slice(indexOfFirstRow, indexOfLastRow);

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, appointments.length]);

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <div className="mb-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d]">Patient Portal</p>
                <h1 className="text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">Appointment History</h1>
                <p className="mt-2 text-sm text-gray-500">Track your past and upcoming appointments in one place.</p>
            </div>

            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-5 shadow-sm lg:p-8">
                <div className="mb-6 hidden grid-cols-12 gap-4 border-b border-gray-50 px-6 pb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#b2a58d] lg:grid">
                    <div className="col-span-3">Type & Branch</div>
                    <div className="col-span-3">Date & Time</div>
                    <div className="col-span-4">Your Concerns</div>
                    <div className="col-span-2 text-right">Status</div>
                </div>

                <div className="space-y-3 px-0 lg:px-2">
                    {loading ? (
                        Array.from({ length: Math.max(3, Math.min(rowsPerPage, 5)) }).map((_, index) => (
                            <AppointmentHistorySkeleton key={index} />
                        ))
                    ) : appointments.length > 0 ? (
                        currentRows.map((apt) => (
                            <div key={apt.appointment_id}>
                                <div className="rounded-[1.5rem] border border-gray-100 bg-[#faf9f6] p-4 sm:p-5 lg:hidden">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-base font-bold text-gray-800">{apt.appointment_type || 'General Inquiry'}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">{apt.branch || 'Unassigned'}</p>
                                        </div>
                                        <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${getStatusBadge(apt.status)}`}>
                                            {apt.status}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
                                        <InfoBlock label="Date" value={apt.date || 'No date'} />
                                        <InfoBlock label="Time" value={formatTime(apt.time) || 'No time'} />
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Your Concerns</p>
                                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{apt.concerns || 'No details provided.'}</p>
                                    </div>
                                </div>

                                <div className="hidden grid-cols-12 items-center gap-4 rounded-[1.5rem] border border-gray-50 bg-[#faf9f6] p-5 text-base text-gray-700 transition hover:border-[#c4ba9d] lg:grid">
                                    <div className="col-span-3 flex flex-col">
                                        <span className="font-bold text-gray-800">{apt.appointment_type || 'General Inquiry'}</span>
                                        <span className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">{apt.branch || 'Unassigned'}</span>
                                    </div>

                                    <div className="col-span-3 flex flex-col">
                                        <span className="font-medium">{apt.date}</span>
                                        <span className="mt-1 text-sm text-gray-500">{formatTime(apt.time)}</span>
                                    </div>

                                    <div className="col-span-4 pr-4">
                                        <p className="truncate text-sm text-gray-500" title={apt.concerns}>
                                            {apt.concerns || 'No details provided.'}
                                        </p>
                                    </div>

                                    <div className={`col-span-2 text-right text-xs font-bold uppercase tracking-[0.18em] ${getStatusColor(apt.status)}`}>
                                        {apt.status}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="py-10 text-center text-base italic text-gray-400">You have no appointment history.</p>
                    )}
                </div>
            </div>

            {appointments.length > 0 && !loading && (
                <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            className="rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]"
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
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#c4ba9d] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#c4ba9d] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#c4ba9d] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="rounded-lg bg-[#faf9f6] p-2 text-gray-500 shadow-sm transition hover:text-[#c4ba9d] disabled:opacity-50"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
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

const AppointmentHistorySkeleton = () => (
    <div>
        <div className="rounded-[1.5rem] border border-gray-100 bg-[#faf9f6] p-4 sm:p-5 lg:hidden animate-pulse">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                    <div className="h-4 w-40 rounded-full bg-gray-200" />
                    <div className="h-3 w-24 rounded-full bg-gray-100" />
                </div>
                <div className="h-7 w-20 rounded-full bg-gray-200" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index}>
                        <div className="h-3 w-12 rounded-full bg-gray-200" />
                        <div className="mt-2 h-4 w-24 rounded-full bg-gray-100" />
                    </div>
                ))}
            </div>

            <div className="mt-4 space-y-2">
                <div className="h-3 w-24 rounded-full bg-gray-200" />
                <div className="h-4 w-full rounded-full bg-gray-100" />
                <div className="h-4 w-5/6 rounded-full bg-gray-100" />
            </div>
        </div>

        <div className="hidden grid-cols-12 items-center gap-4 rounded-[1.5rem] border border-gray-50 bg-[#faf9f6] p-5 lg:grid animate-pulse">
            <div className="col-span-3 space-y-2">
                <div className="h-4 w-36 rounded-full bg-gray-200" />
                <div className="h-3 w-20 rounded-full bg-gray-100" />
            </div>
            <div className="col-span-3 space-y-2">
                <div className="h-4 w-24 rounded-full bg-gray-100" />
                <div className="h-3 w-20 rounded-full bg-gray-100" />
            </div>
            <div className="col-span-4 space-y-2 pr-4">
                <div className="h-4 w-full rounded-full bg-gray-100" />
                <div className="h-4 w-4/5 rounded-full bg-gray-100" />
            </div>
            <div className="col-span-2 flex justify-end">
                <div className="h-4 w-16 rounded-full bg-gray-200" />
            </div>
        </div>
    </div>
);

export default AppointmentHistory;
