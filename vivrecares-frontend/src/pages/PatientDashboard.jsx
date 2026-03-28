import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../components/ProfileAvatar';
import { getStoredUser } from '../utils/session';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const user = getStoredUser();
        if (!user) {
            navigate('/');
            return;
        }

        const fetchDashboardData = async () => {
            try {
                const [profileRes, appointmentsRes] = await Promise.all([
                    axios.get(`/get_profile.php?user_id=${user.id}`),
                    axios.get(`/get_patient_appointments.php?user_id=${user.id}`),
                ]);

                if (profileRes.data.status === 'success') {
                    setProfile(profileRes.data.data);
                } else {
                    setError(profileRes.data.message || 'Unable to load your dashboard.');
                }

                if (Array.isArray(appointmentsRes.data)) {
                    setAppointments(appointmentsRes.data);
                }
            } catch (fetchError) {
                console.error('Dashboard fetch error:', fetchError);
                setError('Unable to load your dashboard right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const upcomingAppointments = appointments
        .filter((appointment) => ['pending', 'confirmed'].includes((appointment.status || '').toLowerCase()))
        .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

    const latestAppointment = upcomingAppointments[0] || null;
    const completedCount = appointments.filter((appointment) => (appointment.status || '').toLowerCase() === 'completed').length;
    const pendingCount = appointments.filter((appointment) => (appointment.status || '').toLowerCase() === 'pending').length;
    const confirmedCount = appointments.filter((appointment) => (appointment.status || '').toLowerCase() === 'confirmed').length;

    if (loading) {
        return <div className="p-6 sm:p-8 lg:p-12 text-base text-gray-500 font-medium tracking-[0.18em] uppercase">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="p-6 sm:p-8 lg:p-12 text-base text-red-600">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">
                    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-8 xl:w-[42%]">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Patient Portal</p>
                        <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Patient Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-3 max-w-xl">
                            Keep track of your appointment requests, clinic updates, and personal records from one place.
                        </p>

                        <div className="mt-8 flex items-center gap-4 rounded-[1.5rem] border border-gray-100 bg-[#faf9f6] p-4 sm:p-5">
                            <ProfileAvatar user={profile} className="h-16 w-16 rounded-full flex-shrink-0 sm:h-20 sm:w-20" textSize="text-2xl sm:text-3xl" />
                            <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Patient</p>
                                <h2 className="truncate text-xl font-bold text-gray-800 sm:text-2xl">
                                    {profile?.first_name} {profile?.last_name}
                                </h2>
                                <p className="text-sm text-gray-500 truncate">{profile?.email || 'No email on file'}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate('/request-appointment')}
                                className="px-6 py-3 bg-[#2d2a26] text-[#d4af37] text-xs uppercase tracking-[0.2em] font-bold rounded-full hover:bg-black transition"
                            >
                                Request Appointment
                            </button>
                            <button
                                onClick={() => navigate('/appointment-history')}
                                className="px-6 py-3 border border-gray-200 text-gray-700 text-xs uppercase tracking-[0.2em] font-bold rounded-full hover:border-[#c4ba9d] hover:text-[#8f8167] transition"
                            >
                                View History
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:flex-1">
                        <MetricCard label="Pending Requests" value={pendingCount} tone="text-orange-400" />
                        <MetricCard label="Confirmed Visits" value={confirmedCount} tone="text-blue-500" />
                        <MetricCard label="Completed Visits" value={completedCount} tone="text-green-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.9fr] gap-8">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex flex-col gap-3 border-b border-gray-50 bg-[#faf9f6] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-[#c4ba9d] font-bold">Next Appointment</p>
                                <h2 className="text-2xl font-bold text-gray-800 mt-2">Your latest active request</h2>
                            </div>
                            <button
                                onClick={() => navigate('/appointment-history')}
                                className="text-xs uppercase tracking-[0.18em] font-bold text-gray-500 hover:text-[#8f8167] transition"
                            >
                                Open History
                            </button>
                        </div>

                        <div className="p-5 sm:p-8">
                            {latestAppointment ? (
                                <div className="rounded-[1.5rem] border border-gray-100 bg-[#faf9f6] p-5 sm:p-6">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">Appointment Type</p>
                                            <h3 className="mt-2 text-xl font-bold text-gray-800 sm:text-2xl">
                                                {latestAppointment.appointment_type || 'General Inquiry'}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-2">
                                                {latestAppointment.branch || 'Branch to be assigned'}
                                            </p>
                                        </div>
                                        <span className={`text-xs uppercase tracking-[0.18em] font-bold ${getStatusColor(latestAppointment.status)}`}>
                                            {latestAppointment.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                        <DetailCard label="Preferred Date" value={formatDate(latestAppointment.date)} />
                                        <DetailCard label="Preferred Time" value={formatTime(latestAppointment.time)} />
                                    </div>

                                    <div className="mt-6">
                                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold mb-2">Concerns Submitted</p>
                                        <p className="text-sm leading-relaxed text-gray-600">
                                            {latestAppointment.concerns || 'No additional concerns provided.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                    <div className="rounded-[1.5rem] border border-dashed border-gray-200 bg-[#fcfbf8] p-6 text-center sm:p-8">
                                        <p className="text-xs uppercase tracking-[0.18em] font-bold text-[#b2a58d]">No active request</p>
                                        <h3 className="mt-3 text-xl font-bold text-gray-800 sm:text-2xl">You do not have an upcoming appointment yet.</h3>
                                        <p className="text-sm text-gray-500 mt-3 max-w-md mx-auto">
                                            Start a new request and the clinic can review your preferred branch, date, and time.
                                        </p>
                                    <button
                                        onClick={() => navigate('/request-appointment')}
                                        className="mt-6 px-6 py-3 bg-[#555555] text-[#c4ba9d] text-xs uppercase tracking-[0.18em] font-bold rounded-full hover:bg-black transition"
                                    >
                                        Start Request
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-50 bg-[#faf9f6] px-5 py-5 sm:px-8">
                            <p className="text-xs uppercase tracking-[0.2em] text-[#c4ba9d] font-bold">Quick Access</p>
                            <h2 className="text-2xl font-bold text-gray-800 mt-2">What you can do next</h2>
                        </div>

                        <div className="space-y-4 p-5 sm:p-6">
                            <QuickAction
                                title="Submit a new request"
                                description="Choose a branch, preferred date, and clinic slot for review."
                                onClick={() => navigate('/request-appointment')}
                            />
                            <QuickAction
                                title="Review profile"
                                description="Check your personal details and medical history before your visit."
                                onClick={() => navigate('/profile')}
                            />
                            <QuickAction
                                title="Check appointment history"
                                description="See pending, confirmed, completed, and cancelled appointments."
                                onClick={() => navigate('/appointment-history')}
                            />
                            <QuickAction
                                title="Open billing history"
                                description="Review invoices and payment records connected to your care."
                                onClick={() => navigate('/billing-history')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ label, value, tone }) => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col justify-between min-h-[10rem]">
        <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">{label}</p>
        <p className={`text-5xl font-bold tracking-tight mt-6 ${tone}`}>{value}</p>
    </div>
);

const DetailCard = ({ label, value }) => (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-bold">{label}</p>
        <p className="text-base font-medium text-gray-700 mt-2">{value}</p>
    </div>
);

const QuickAction = ({ title, description, onClick }) => (
    <button
        onClick={onClick}
        className="w-full text-left rounded-[1.5rem] border border-gray-100 bg-[#faf9f6] px-5 py-5 hover:border-[#c4ba9d] hover:bg-[#fcfaf5] transition"
    >
        <p className="text-base font-bold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>
    </button>
);

const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
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

const formatDate = (value) => {
    if (!value) return 'Date unavailable';
    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        weekday: 'long',
    });
};

const formatTime = (timeString) => {
    if (!timeString) return 'Time unavailable';
    const [hour, minute] = timeString.split(':');
    const h = parseInt(hour, 10);
    return `${h % 12 || 12}:${minute} ${h >= 12 ? 'PM' : 'AM'}`;
};

export default PatientDashboard;
