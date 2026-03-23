import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DoctorAppointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [viewMode, setViewMode] = useState('day');
    const [anchorDate, setAnchorDate] = useState(new Date().toISOString().split('T')[0]);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get('http://localhost/vivrecares/vivrecares-api/get_doctor_appointments.php');
                if (res.data.status === 'success') {
                    setAppointments(res.data.data || []);
                }
            } catch (error) {
                console.error('Error loading doctor appointments', error);
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
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Doctor Workspace</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Appointment Schedule</h1>
                <p className="text-sm text-gray-500 mt-2">View your consultation queue by day, week, or month and open patient records quickly.</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">Anchor Date</label>
                        <input type="date" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#c4ba9d] text-gray-700" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">View</label>
                        <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#c4ba9d] bg-white text-gray-700">
                            <option value="day">Daily</option>
                            <option value="week">Weekly</option>
                            <option value="month">Monthly</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-[0.18em] mb-2 block">Search</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Patient, topic, or concern"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base outline-none focus:border-[#c4ba9d] text-gray-700"
                        />
                    </div>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                    Showing <span className="font-semibold text-gray-700">{scopedAppointments.length}</span> appointments in selected view.
                </p>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-12 gap-4 mb-6 text-[#b2a58d] text-xs uppercase tracking-[0.18em] font-bold px-4 border-b border-gray-50 pb-4">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Time</div>
                    <div className="col-span-3">Patient</div>
                    <div className="col-span-3">Consultation Topic</div>
                    <div className="col-span-1">Branch</div>
                    <div className="col-span-1 text-right">Open</div>
                </div>

                <div className="space-y-3">
                    {currentRows.map((appt) => (
                        <div key={appt.appointment_id} className="grid grid-cols-12 gap-4 items-center p-4 rounded-2xl border border-gray-100 bg-[#faf9f6]">
                            <div className="col-span-2 text-sm text-gray-700">{appt.date}</div>
                            <div className="col-span-2 text-sm text-gray-700">{appt.time}</div>
                            <div className="col-span-3 text-base font-bold text-gray-800">{appt.first_name} {appt.last_name}</div>
                            <div className="col-span-3">
                                <p className="text-sm font-medium text-gray-700">{appt.appointment_type || 'Consultation'}</p>
                                <p className="text-xs text-gray-400 truncate">{appt.concerns || 'No concerns supplied'}</p>
                            </div>
                            <div className="col-span-1 text-xs uppercase tracking-[0.18em] text-gray-500">{appt.branch || 'N/A'}</div>
                            <div className="col-span-1 text-right">
                                <button onClick={() => setSelected(appt)} className="text-[#b2a58d] text-xs font-bold uppercase tracking-[0.18em] hover:text-[#8f8167] transition">View</button>
                            </div>
                        </div>
                    ))}
                    {scopedAppointments.length === 0 && (
                        <p className="text-center text-gray-400 italic py-10">No appointments for this view.</p>
                    )}
                </div>
            </div>

            {scopedAppointments.length > 0 && (
                <div className="mt-8 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-gray-400">
                        <span>Rows per page:</span>
                        <select
                            className="bg-white border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#c4ba9d] text-sm text-gray-700"
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
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
                            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#c4ba9d] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#c4ba9d] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#c4ba9d] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg></button>
                            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-[#c4ba9d] disabled:opacity-50 transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
                        </div>
                    </div>
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl p-10 relative">
                        <button onClick={() => setSelected(null)} className="absolute top-6 right-6 text-gray-300 hover:text-[#555555] transition">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h3 className="text-2xl font-bold text-gray-800">Consultation Intake</h3>
                        <p className="text-xs uppercase tracking-[0.18em] text-[#b2a58d] font-bold mt-2">{selected.date} {selected.time}</p>

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
                                className="px-6 py-3 rounded-xl bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em] hover:bg-black transition"
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

export default DoctorAppointments;
