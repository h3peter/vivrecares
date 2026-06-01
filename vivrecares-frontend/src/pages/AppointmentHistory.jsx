import { useEffect, useState } from 'react';
import axios from 'axios';
import ActionFeedbackModal from '../components/ActionFeedbackModal';
import { downloadCsvReport } from '../utils/reportExports';

const AppointmentHistory = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [actionAppointmentId, setActionAppointmentId] = useState(null);
    const [feedback, setFeedback] = useState(null);

    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;

    const fetchHistory = async () => {
        if (!user) return;

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

    useEffect(() => {
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
            case 'rescheduled':
                return 'text-amber-500';
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
            case 'rescheduled':
                return 'bg-amber-50 text-amber-600';
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

    const parseAppointmentDate = (appointment) => {
        if (!appointment?.date) return null;
        const parsed = new Date(`${appointment.date}T00:00:00`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const isPastAppointment = (appointment) => {
        const appointmentDate = parseAppointmentDate(appointment);
        if (!appointmentDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return appointmentDate < today;
    };

    const getTimelineLabel = (appointment) => {
        const appointmentDate = parseAppointmentDate(appointment);
        if (!appointmentDate) return null;
        const status = String(appointment?.status || '').toLowerCase();

        if (['cancelled', 'canceled'].includes(status)) {
            return null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (appointmentDate < today) {
            return { label: 'Past Appointment', className: 'bg-gray-100 text-gray-500' };
        }

        if (appointmentDate.getTime() === today.getTime()) {
            return { label: 'Today', className: 'bg-blue-50 text-blue-600' };
        }

        if (status === 'pending') {
            return null;
        }

        return { label: 'Upcoming', className: 'bg-green-50 text-green-600' };
    };

    const handleRescheduleResponse = async (appointmentId, action) => {
        try {
            setActionAppointmentId(appointmentId);
            const res = await axios.post('/respond_reschedule.php', {
                appointment_id: appointmentId,
                action,
            });

            if (res.data.status === 'success') {
                await fetchHistory();
                setFeedback({
                    tone: action === 'confirm' ? 'success' : 'info',
                    title: action === 'confirm' ? 'Reschedule Confirmed' : 'Reschedule Declined',
                    message: res.data.message || 'Appointment updated.',
                });
            } else {
                setFeedback({
                    tone: 'error',
                    title: 'Action Failed',
                    message: res.data.message || 'Unable to process the reschedule request.',
                });
            }
        } catch (error) {
            console.error('Reschedule response error:', error);
            setFeedback({
                tone: 'error',
                title: 'Action Failed',
                message: 'Unable to process the reschedule request right now.',
            });
        } finally {
            setActionAppointmentId(null);
        }
    };

    const canCancelAppointment = (appointment) => {
        return ['pending', 'confirmed', 'rescheduled'].includes(String(appointment?.status || '').toLowerCase()) && !isPastAppointment(appointment);
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm('Cancel this appointment? This action will notify the clinic.')) {
            return;
        }

        try {
            setActionAppointmentId(appointmentId);
            const res = await axios.post('/cancel_patient_appointment.php', {
                appointment_id: appointmentId,
            });

            if (res.data.status === 'success') {
                await fetchHistory();
                setFeedback({
                    tone: 'success',
                    title: 'Appointment Cancelled',
                    message: res.data.message || 'Your appointment has been cancelled.',
                });
            } else {
                setFeedback({
                    tone: 'error',
                    title: 'Cancellation Failed',
                    message: res.data.message || 'Unable to cancel this appointment.',
                });
            }
        } catch (error) {
            console.error('Appointment cancellation error:', error);
            setFeedback({
                tone: 'error',
                title: 'Cancellation Failed',
                message: 'Unable to cancel this appointment right now.',
            });
        } finally {
            setActionAppointmentId(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(appointments.length / rowsPerPage));
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = appointments.slice(indexOfFirstRow, indexOfLastRow);

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, appointments.length]);

    const handleExport = () => {
        downloadCsvReport({
            filename: 'appointment_history.csv',
            columns: [
                { key: 'appointment_id', label: 'Appointment ID' },
                { key: 'appointment_type', label: 'Type' },
                { key: 'branch', label: 'Branch' },
                { key: 'date', label: 'Date' },
                { key: 'time_label', label: 'Time' },
                { key: 'status', label: 'Status' },
                { key: 'concerns', label: 'Concerns' },
            ],
            rows: appointments.map((appointment) => ({
                ...appointment,
                time_label: formatTime(appointment.time),
            })),
        });
    };

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <ActionFeedbackModal
                open={Boolean(feedback)}
                tone={feedback?.tone}
                title={feedback?.title}
                message={feedback?.message}
                onClose={() => setFeedback(null)}
            />
            <div className="mb-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d]">Patient Portal</p>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">My Appointments</h1>
                        <p className="mt-2 text-sm text-gray-500">Manage active requests, reschedule responses, cancellations, and past appointment records in one place.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-gray-700 transition hover:border-gray-500 lg:w-auto"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-5 shadow-sm lg:p-8">
                <div className="mb-6 hidden grid-cols-12 gap-4 border-b border-gray-50 px-6 pb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#b2a58d] lg:grid">
                    <div className="col-span-3">Type & Branch</div>
                    <div className="col-span-2">Date & Time</div>
                    <div className="col-span-4">Your Concerns</div>
                    <div className="col-span-3 text-right">Status</div>
                </div>

                <div className="space-y-3 px-0 lg:px-2 readable-data-table">
                    {loading ? (
                        Array.from({ length: Math.max(3, Math.min(rowsPerPage, 5)) }).map((_, index) => (
                            <AppointmentHistorySkeleton key={index} />
                        ))
                    ) : appointments.length > 0 ? (
                        currentRows.map((apt) => {
                            const timeline = getTimelineLabel(apt);
                            const statusText = String(apt.status || '').trim();

                            return (
                            <div key={apt.appointment_id}>
                                <div className="rounded-[1.5rem] border border-gray-100 bg-[#faf9f6] p-4 sm:p-5 lg:hidden">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-base font-bold text-gray-800">{apt.appointment_type || 'General Inquiry'}</p>
                                            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">{apt.branch || 'Unassigned'}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 sm:justify-end">
                                            {timeline && (
                                                <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${timeline.className}`}>
                                                    {timeline.label}
                                                </span>
                                            )}
                                            {statusText && (
                                                <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${getStatusBadge(statusText)}`}>
                                                    {statusText}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2">
                                        <InfoBlock label="Date" value={apt.date || 'No date'} />
                                        <InfoBlock label="Time" value={formatTime(apt.time) || 'No time'} />
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">Your Concerns</p>
                                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{apt.concerns || 'No details provided.'}</p>
                                    </div>

                                    {apt.status === 'Rescheduled' && (
                                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Clinic Proposed a New Schedule</p>
                                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <InfoBlock
                                                    label="Previous Schedule"
                                                    value={`${apt.previous_appointment_date || 'No date'}${apt.previous_appointment_time ? ` • ${formatTime(apt.previous_appointment_time)}` : ''}${apt.previous_branch ? ` • ${apt.previous_branch}` : ''}`}
                                                />
                                                <InfoBlock
                                                    label="Proposed Schedule"
                                                    value={`${apt.date || 'No date'}${apt.time ? ` • ${formatTime(apt.time)}` : ''}${apt.branch ? ` • ${apt.branch}` : ''}`}
                                                />
                                            </div>
                                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <button
                                                    type="button"
                                                    disabled={actionAppointmentId === apt.appointment_id}
                                                    onClick={() => handleRescheduleResponse(apt.appointment_id, 'confirm')}
                                                    className="rounded-xl bg-[#555555] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] disabled:opacity-50"
                                                >
                                                    {actionAppointmentId === apt.appointment_id ? 'Processing...' : 'Confirm New Schedule'}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={actionAppointmentId === apt.appointment_id}
                                                    onClick={() => handleRescheduleResponse(apt.appointment_id, 'decline')}
                                                    className="rounded-xl border border-red-200 bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    Decline Reschedule
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {canCancelAppointment(apt) && (
                                        <button
                                            type="button"
                                            disabled={actionAppointmentId === apt.appointment_id}
                                            onClick={() => handleCancelAppointment(apt.appointment_id)}
                                            className="mt-4 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                        >
                                            {actionAppointmentId === apt.appointment_id ? 'Processing...' : 'Cancel Appointment'}
                                        </button>
                                    )}
                                </div>

                                <div className="hidden grid-cols-12 items-center gap-4 rounded-[1.5rem] border border-gray-50 bg-[#faf9f6] p-5 text-base text-gray-700 transition hover:border-[#c4ba9d] lg:grid">
                                    <div className="col-span-3 flex flex-col">
                                        <span className="font-bold text-gray-800">{apt.appointment_type || 'General Inquiry'}</span>
                                        <span className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">{apt.branch || 'Unassigned'}</span>
                                    </div>

                                    <div className="col-span-2 flex flex-col">
                                        <span className="font-medium">{apt.date}</span>
                                        <span className="mt-1 text-sm text-gray-500">{formatTime(apt.time)}</span>
                                    </div>

                                    <div className="col-span-4 pr-4">
                                        <p className="truncate text-sm text-gray-500" title={apt.concerns}>
                                            {apt.concerns || 'No details provided.'}
                                        </p>

                                        {apt.status === 'Rescheduled' && (
                                            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Reschedule Approval Needed</p>
                                                <p className="mt-2 text-sm leading-relaxed text-amber-800">
                                                    Previous: {apt.previous_appointment_date || 'No date'} at {formatTime(apt.previous_appointment_time) || 'No time'} in {apt.previous_branch || 'No branch'}
                                                </p>
                                                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                                                    Proposed: {apt.date || 'No date'} at {formatTime(apt.time) || 'No time'} in {apt.branch || 'No branch'}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={actionAppointmentId === apt.appointment_id}
                                                        onClick={() => handleRescheduleResponse(apt.appointment_id, 'confirm')}
                                                        className="rounded-full bg-[#555555] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] disabled:opacity-50"
                                                    >
                                                        {actionAppointmentId === apt.appointment_id ? 'Processing...' : 'Confirm'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={actionAppointmentId === apt.appointment_id}
                                                        onClick={() => handleRescheduleResponse(apt.appointment_id, 'decline')}
                                                        className="rounded-full border border-red-200 bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-span-3 flex flex-col items-end gap-3 text-right">
                                        <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                                            {timeline && (
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${timeline.className}`}>
                                                    {timeline.label}
                                                </span>
                                            )}
                                            {statusText && (
                                                <span className={`inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${getStatusColor(statusText)}`}>
                                                    {statusText}
                                                </span>
                                            )}
                                        </div>
                                        {canCancelAppointment(apt) && (
                                            <button
                                                type="button"
                                                disabled={actionAppointmentId === apt.appointment_id}
                                                onClick={() => handleCancelAppointment(apt.appointment_id)}
                                                className="rounded-full border border-red-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                                            >
                                                {actionAppointmentId === apt.appointment_id ? 'Processing...' : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            );
                        })
                    ) : (
                        <p className="py-10 text-center text-base italic text-gray-400">You have no appointments yet.</p>
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
