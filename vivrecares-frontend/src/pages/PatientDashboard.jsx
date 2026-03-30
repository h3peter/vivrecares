import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../components/ProfileAvatar';
import { getStoredUser } from '../utils/session';

/* ─────────────────────────────────────────────
   PatientDashboard — redesigned layout
   Direction: compact editorial · warm ivory
   Fix: metric cards no longer stretch to profile height;
        header row merges greeting + stats in one tight band
───────────────────────────────────────────── */

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [profile, setProfile]           = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState('');

    useEffect(() => {
        const user = getStoredUser();
        if (!user) { navigate('/'); return; }

        const fetchDashboardData = async () => {
            try {
                const [profileRes, appointmentsRes] = await Promise.all([
                    axios.get(`/get_profile.php?user_id=${user.id}`),
                    axios.get(`/get_patient_appointments.php?user_id=${user.id}`),
                ]);
                if (profileRes.data.status === 'success') setProfile(profileRes.data.data);
                else setError(profileRes.data.message || 'Unable to load your dashboard.');
                if (Array.isArray(appointmentsRes.data)) setAppointments(appointmentsRes.data);
            } catch (e) {
                console.error('Dashboard fetch error:', e);
                setError('Unable to load your dashboard right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const upcomingAppointments = appointments
        .filter(a => ['pending', 'confirmed'].includes((a.status || '').toLowerCase()))
        .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    const latestAppointment = upcomingAppointments[0] || null;
    const completedCount    = appointments.filter(a => (a.status || '').toLowerCase() === 'completed').length;
    const pendingCount      = appointments.filter(a => (a.status || '').toLowerCase() === 'pending').length;
    const confirmedCount    = appointments.filter(a => (a.status || '').toLowerCase() === 'confirmed').length;

    if (loading) return (
        <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center p-4">
            <p className="text-xs tracking-[0.3em] uppercase text-[#a89880] font-semibold animate-pulse">Loading dashboard…</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center p-4">
            <p className="text-sm text-red-500">{error}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-5">

                {/* ── TOP BAND: profile + stats in one row ── */}
                <div className="bg-white rounded-[1.75rem] border border-[#e8e2d9] shadow-sm overflow-hidden">

                    {/* eyebrow */}
                    <div className="px-6 pt-5 pb-0 sm:px-8">
                        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#b8a98a]">Patient Portal</p>
                    </div>

                    <div className="flex flex-col gap-4 px-5 pb-5 pt-4 sm:px-8 sm:pb-6">

                        {/* top row: identity + actions */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                            {/* profile identity — never truncates */}
                            <div className="flex items-center gap-3 flex-shrink-0 sm:gap-4">
                                <ProfileAvatar
                                    user={profile}
                                    className="h-12 w-12 rounded-full flex-shrink-0 sm:h-14 sm:w-14"
                                    textSize="text-lg sm:text-xl"
                                />
                                <div className="min-w-0">
                                    <h1 className="text-xl font-bold text-[#1e1c18] leading-tight sm:text-2xl">
                                        {profile?.first_name} {profile?.last_name}
                                    </h1>
                                    <p className="mt-0.5 truncate text-sm text-[#9e9485]">{profile?.email || 'No email on file'}</p>
                                </div>
                            </div>

                            {/* actions */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:flex lg:flex-shrink-0">
                                <button
                                    onClick={() => navigate('/request-appointment')}
                                    className="w-full rounded-full bg-[#555555] px-6 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] sm:w-auto"
                                >
                                    Request Appointment
                                </button>
                                <button
                                    onClick={() => navigate('/appointment-history')}
                                    className="w-full rounded-full border border-[#ddd8cf] px-6 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#7a7060] transition hover:border-[#b8a98a] hover:text-[#8f8167] sm:w-auto"
                                >
                                    View History
                                </button>
                            </div>
                        </div>

                        {/* bottom row: stat pills — their own line so they never squeeze the name */}
                        <div className="flex flex-wrap gap-2.5">
                            <StatPill label="Pending"   value={pendingCount}   color="bg-orange-50  text-orange-500  border-orange-100"  dot="bg-orange-400" />
                            <StatPill label="Confirmed" value={confirmedCount} color="bg-blue-50    text-blue-500    border-blue-100"    dot="bg-blue-400" />
                            <StatPill label="Completed" value={completedCount} color="bg-emerald-50 text-emerald-600 border-emerald-100" dot="bg-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* ── MAIN CONTENT: appointment + quick access ── */}
                <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-5">

                    {/* next appointment card */}
                    <div className="bg-white rounded-[1.75rem] border border-[#e8e2d9] shadow-sm overflow-hidden">
                        <div className="flex flex-col gap-3 border-b border-[#f0ebe3] bg-[#faf8f4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#b8a98a]">Next Appointment</p>
                                <h2 className="text-lg font-bold text-[#1e1c18] mt-0.5">Your latest active request</h2>
                            </div>
                            <button
                                onClick={() => navigate('/appointment-history')}
                                className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#9e9485] hover:text-[#8f8167] transition"
                            >
                                Open History →
                            </button>
                        </div>

                        <div className="p-5 sm:p-8">
                            {latestAppointment ? (
                                <div className="rounded-2xl border border-[#ede8df] bg-[#faf8f4] p-5 sm:p-6 space-y-5">
                                    {/* type + status */}
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.22em] text-[#a89880] font-bold">Appointment Type</p>
                                            <h3 className="mt-1.5 text-2xl font-bold text-[#1e1c18] leading-tight">
                                                {latestAppointment.appointment_type || 'General Inquiry'}
                                            </h3>
                                            <p className="text-sm text-[#9e9485] mt-1">{latestAppointment.branch || 'Branch to be assigned'}</p>
                                        </div>
                                        <StatusBadge status={latestAppointment.status} />
                                    </div>

                                    {/* date + time */}
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <DetailCard label="Preferred Date" value={formatDate(latestAppointment.date)} />
                                        <DetailCard label="Preferred Time" value={formatTime(latestAppointment.time)} />
                                    </div>

                                    {/* concerns */}
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#a89880] font-bold mb-2">Concerns Submitted</p>
                                        <p className="text-sm leading-relaxed text-[#6b6457]">
                                            {latestAppointment.concerns || 'No additional concerns provided.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-[#d8d0c5] bg-[#fdfcfa] p-8 text-center">
                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#f0ebe3] mb-4">
                                        <svg className="w-5 h-5 text-[#b8a98a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                        </svg>
                                    </div>
                                    <p className="text-[10px] uppercase tracking-[0.28em] font-bold text-[#b8a98a]">No active request</p>
                                    <h3 className="mt-2 text-lg font-bold text-[#1e1c18]">No upcoming appointment yet</h3>
                                    <p className="text-sm text-[#9e9485] mt-2 max-w-xs mx-auto leading-relaxed">
                                        Start a new request and the clinic can review your preferred branch, date, and time.
                                    </p>
                                    <button
                                        onClick={() => navigate('/request-appointment')}
                                        className="mt-5 rounded-full bg-[#555555] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040]"
                                    >
                                        Start Request
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* quick access */}
                    <div className="bg-white rounded-[1.75rem] border border-[#e8e2d9] shadow-sm overflow-hidden">
                        <div className="border-b border-[#f0ebe3] bg-[#faf8f4] px-6 py-4 sm:px-8">
                            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#b8a98a]">Quick Access</p>
                            <h2 className="text-lg font-bold text-[#1e1c18] mt-0.5">What you can do next</h2>
                        </div>
                        <div className="p-4 sm:p-5 space-y-2.5">
                            <QuickAction
                                icon={
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                }
                                title="Submit a new request"
                                description="Choose a branch, preferred date, and clinic slot."
                                onClick={() => navigate('/request-appointment')}
                            />
                            <QuickAction
                                icon={
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                }
                                title="Review profile"
                                description="Check personal details and medical history."
                                onClick={() => navigate('/profile')}
                            />
                            <QuickAction
                                icon={
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
                                }
                                title="Appointment history"
                                description="View pending, confirmed, and past appointments."
                                onClick={() => navigate('/appointment-history')}
                            />
                            <QuickAction
                                icon={
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                                }
                                title="Billing history"
                                description="Review invoices and payment records."
                                onClick={() => navigate('/billing-history')}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

/* ── Sub-components ─────────────────────────── */

const StatPill = ({ label, value, color, dot }) => (
    <div className={`flex items-center gap-2.5 rounded-full border px-4 py-2 ${color}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
        <span className="text-[11px] uppercase tracking-[0.18em] font-bold whitespace-nowrap">{label}</span>
        <span className="text-base font-bold leading-none">{value}</span>
    </div>
);

const StatusBadge = ({ status }) => {
    const map = {
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        pending:   'bg-orange-50  text-orange-500  border-orange-100',
        confirmed: 'bg-blue-50    text-blue-500    border-blue-100',
        cancelled: 'bg-red-50     text-red-500     border-red-100',
    };
    const cls = map[(status || '').toLowerCase()] || 'bg-amber-50 text-amber-600 border-amber-100';
    return (
        <span className={`flex-shrink-0 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-bold ${cls}`}>
            {status}
        </span>
    );
};

const DetailCard = ({ label, value }) => (
    <div className="rounded-xl border border-[#ede8df] bg-white px-4 py-3.5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#a89880] font-bold">{label}</p>
        <p className="text-sm font-semibold text-[#1e1c18] mt-1.5">{value}</p>
    </div>
);

const QuickAction = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="group w-full text-left rounded-2xl border border-[#ede8df] bg-[#faf8f4] px-4 py-4 hover:border-[#c4b99a] hover:bg-[#f5f0e8] transition flex items-start gap-3.5"
    >
        <span className="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-[#e3ddd4] group-hover:border-[#c4b99a] transition">
            <svg className="w-4 h-4 text-[#a89880]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                {icon}
            </svg>
        </span>
        <div>
            <p className="text-sm font-bold text-[#1e1c18]">{title}</p>
            <p className="text-xs text-[#9e9485] mt-0.5 leading-relaxed">{description}</p>
        </div>
    </button>
);

/* ── Utilities ──────────────────────────────── */

const formatDate = (value) => {
    if (!value) return 'Date unavailable';
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
};

const formatTime = (timeString) => {
    if (!timeString) return 'Time unavailable';
    const [hour, minute] = timeString.split(':');
    const h = parseInt(hour, 10);
    return `${h % 12 || 12}:${minute} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default PatientDashboard;
