import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DoctorAppointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('day');
    const [anchorDate, setAnchorDate] = useState(new Date().toISOString().split('T')[0]);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await axios.get('/get_doctor_appointments.php');
                if (res.data.status === 'success') {
                    setAppointments(res.data.data || []);
                }
            } catch (error) {
                console.error('Error loading doctor appointments', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const inScope = (dateStr) => {
        if (!dateStr) return false;
        const target = new Date(`${dateStr}T00:00:00`);
        const anchor = new Date(`${anchorDate}T00:00:00`);

        if (viewMode === 'day') {
            return target.toDateString() === anchor.toDateString();
        }

        if (viewMode === 'week') {
            const first = new Date(anchor);
            const day = first.getDay();
            first.setDate(anchor.getDate() - day);
            const last = new Date(first);
            last.setDate(first.getDate() + 6);
            return target >= first && target <= last;
        }

        return target.getMonth() === anchor.getMonth() && target.getFullYear() === anchor.getFullYear();
    };

    const scopedAppointments = useMemo(
        () => appointments
            .filter((appt) => inScope(appt.date))
            .filter((appt) => `${appt.first_name} ${appt.last_name} ${appt.appointment_type || ''} ${appt.concerns || ''}`.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => {
                const aKey = `${a.date} ${a.time}`;
                const bKey = `${b.date} ${b.time}`;
                return aKey.localeCompare(bKey);
            }),
        [appointments, anchorDate, viewMode, search]
    );

    const totalPages = Math.max(1, Math.ceil(scopedAppointments.length / rowsPerPage));
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = scopedAppointments.slice(indexOfFirstRow, indexOfLastRow);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, viewMode, anchorDate, rowsPerPage]);

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <div className="mb-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d]">Doctor Workspace</p>
                <h1 className="text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">Appointment Schedule</h1>
                <p className="mt-2 text-sm text-gray-500">View your consultation queue by day, week, or month and open patient records quickly.</p>
            </div>

            <div className="mb-8 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:p-8">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Anchor Date</label>
                        <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-700 outline-none focus:border-[#c4ba9d]" />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">View</label>
                        <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-700 outline-none focus:border-[#c4ba9d]">
                            <option value="day">Daily</option>
                            <option value="week">Weekly</option>
                            <option value="month">Monthly</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Search</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Patient, topic, or concern"
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-700 outline-none focus:border-[#c4ba9d]"
                        />
                    </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{loading ? '...' : scopedAppointments.length}</span> appointments in selected view.
                </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:p-8">
                <div className="mb-6 hidden grid-cols-12 gap-4 border-b border-gray-50 px-4 pb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d] lg:grid">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Time</div>
                    <div className="col-span-3">Patient</div>
                    <div className="col-span-3">Consultation Topic</div>
                    <div className="col-span-1">Branch</div>
                    <div className="col-span-1 text-right">Open</div>
                </div>

                <div className="space-y-3">
                    {loading ? Array.from({ length: Math.max(3, Math.min(rowsPerPage, 5)) }).map((_, index) => (
                        <AppointmentRowSkeleton key={index} />
                    )) : currentRows.map((appt) => (
                        <div key={appt.appointment_id}>
                            <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 lg:hidden">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-base font-bold text-gray-800">{appt.first_name} {appt.last_name}</p>
                                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d]">
                                            {appt.appointment_type || 'Consultation'}
                                        </p>
                                    </div>
                                    <button onClick={() => setSelected(appt)} className="rounded-full border border-[#c4ba9d]/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f8167] transition hover:border-[#c4ba9d] hover:text-[#6f624c]">
                                        View
                                    </button>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
                                    <InfoBlock label="Date" value={appt.date} />
                                    <InfoBlock label="Time" value={appt.time} />
                                    <InfoBlock label="Branch" value={appt.branch || 'N/A'} />
                                    <InfoBlock label="Status" value={appt.status || 'Pending'} />
                                </div>

                                <div className="mt-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Concern</p>
                                    <p className="mt-1 text-sm text-gray-600">{appt.concerns || 'No concerns supplied'}</p>
                                </div>
                            </div>

                            <div className="hidden grid-cols-12 items-center gap-4 rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 lg:grid">
                                <div className="col-span-2 text-sm text-gray-700">{appt.date}</div>
                                <div className="col-span-2 text-sm text-gray-700">{appt.time}</div>
                                <div className="col-span-3 text-base font-bold text-gray-800">{appt.first_name} {appt.last_name}</div>
                                <div className="col-span-3">
                                    <p className="text-sm font-medium text-gray-700">{appt.appointment_type || 'Consultation'}</p>
                                    <p className="truncate text-xs text-gray-400">{appt.concerns || 'No concerns supplied'}</p>
                                </div>
                                <div className="col-span-1 text-xs uppercase tracking-[0.18em] text-gray-500">{appt.branch || 'N/A'}</div>
                                <div className="col-span-1 text-right">
                                    <button onClick={() => setSelected(appt)} className="text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d] transition hover:text-[#8f8167]">View</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!loading && scopedAppointments.length === 0 && (
                        <p className="py-10 text-center italic text-gray-400">No appointments for this view.</p>
                    )}
                </div>
            </div>

            {!loading && scopedAppointments.length > 0 && (
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

            {selected && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8 lg:p-10">
                        <button onClick={() => setSelected(null)} className="absolute right-5 top-5 text-gray-300 transition hover:text-[#555555] sm:right-6 sm:top-6">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h3 className="text-2xl font-bold text-gray-800">Consultation Intake</h3>
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d]">{selected.date} {selected.time}</p>

                        <div className="mt-6 space-y-3 text-sm text-gray-700">
                            <p><span className="font-bold">Patient:</span> {selected.first_name} {selected.last_name}</p>
                            <p><span className="font-bold">Topic:</span> {selected.appointment_type || 'Consultation'}</p>
                            <p><span className="font-bold">Branch:</span> {selected.branch || 'N/A'}</p>
                            <p><span className="font-bold">Status:</span> {selected.status}</p>
                            <p><span className="font-bold">Concern:</span> {selected.concerns || 'No concern specified'}</p>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => navigate(`/doctor/patient/${selected.user_id}`)}
                                className="rounded-xl bg-[#555555] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#c4ba9d] transition hover:bg-black"
                            >
                                Open Patient Record
                            </button>
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

const AppointmentRowSkeleton = () => (
    <div>
        <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 lg:hidden animate-pulse">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                    <div className="h-4 w-40 rounded-full bg-gray-200" />
                    <div className="h-3 w-28 rounded-full bg-gray-100" />
                </div>
                <div className="h-8 w-16 rounded-full bg-gray-200" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index}>
                        <div className="h-3 w-16 rounded-full bg-gray-200" />
                        <div className="mt-2 h-4 w-24 rounded-full bg-gray-100" />
                    </div>
                ))}
            </div>

            <div className="mt-4 space-y-2">
                <div className="h-3 w-20 rounded-full bg-gray-200" />
                <div className="h-4 w-full rounded-full bg-gray-100" />
                <div className="h-4 w-2/3 rounded-full bg-gray-100" />
            </div>
        </div>

        <div className="hidden grid-cols-12 items-center gap-4 rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 lg:grid animate-pulse">
            <div className="col-span-2">
                <div className="h-4 w-24 rounded-full bg-gray-100" />
            </div>
            <div className="col-span-2">
                <div className="h-4 w-16 rounded-full bg-gray-100" />
            </div>
            <div className="col-span-3">
                <div className="h-4 w-36 rounded-full bg-gray-200" />
            </div>
            <div className="col-span-3 space-y-2">
                <div className="h-4 w-28 rounded-full bg-gray-200" />
                <div className="h-3 w-full rounded-full bg-gray-100" />
            </div>
            <div className="col-span-1">
                <div className="h-4 w-12 rounded-full bg-gray-100" />
            </div>
            <div className="col-span-1 flex justify-end">
                <div className="h-4 w-10 rounded-full bg-gray-200" />
            </div>
        </div>
    </div>
);

export default DoctorAppointments;
