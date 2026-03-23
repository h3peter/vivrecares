import { useState, useEffect } from 'react';
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
                const res = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_patient_appointments.php?user_id=${user.id}`);
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
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Patient Portal</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Appointment History</h1>
                <p className="text-sm text-gray-500 mt-2">Track your past and upcoming appointments in one place.</p>
            </div>

            <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="grid grid-cols-12 gap-4 mb-6 text-[#b2a58d] text-xs uppercase tracking-[0.2em] font-bold px-6 border-b border-gray-50 pb-6">
                    <div className="col-span-3">Type & Branch</div>
                    <div className="col-span-3">Date & Time</div>
                    <div className="col-span-4">Your Concerns</div>
                    <div className="col-span-2 text-right">Status</div>
                </div>

                <div className="space-y-3 px-2">
                    {loading ? (
                        <p className="text-center text-base text-gray-400 italic py-10">Loading records...</p>
                    ) : appointments.length > 0 ? (
                        currentRows.map((apt) => (
                            <div key={apt.appointment_id} className="grid grid-cols-12 gap-4 items-center text-base text-gray-700 p-5 bg-[#faf9f6] rounded-[1.5rem] border border-gray-50 hover:border-[#c4ba9d] transition">
                                <div className="col-span-3 flex flex-col">
                                    <span className="font-bold text-gray-800">{apt.appointment_type || 'General Inquiry'}</span>
                                    <span className="text-xs text-gray-400 uppercase tracking-[0.18em] mt-1">{apt.branch || 'Unassigned'}</span>
                                </div>

                                <div className="col-span-3 flex flex-col">
                                    <span className="font-medium">{apt.date}</span>
                                    <span className="text-sm text-gray-500 mt-1">{formatTime(apt.time)}</span>
                                </div>

                                <div className="col-span-4 pr-4">
                                    <p className="text-sm text-gray-500 truncate" title={apt.concerns}>
                                        {apt.concerns || 'No details provided.'}
                                    </p>
                                </div>

                                <div className={`col-span-2 text-right uppercase text-xs font-bold tracking-[0.18em] ${getStatusColor(apt.status)}`}>
                                    {apt.status}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-base text-gray-400 italic py-10">You have no appointment history.</p>
                    )}
                </div>
            </div>

            {appointments.length > 0 && !loading && (
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
        </div>
    );
};

export default AppointmentHistory;
