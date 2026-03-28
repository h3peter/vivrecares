import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RequestAppointment = () => {
    const navigate = useNavigate();
    const [appointmentType, setAppointmentType] = useState('');
    const [branch, setBranch] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [concerns, setConcerns] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [patientId, setPatientId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [availability, setAvailability] = useState([]);
    const [slots, setSlots] = useState([]);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    useEffect(() => {
        const fetchInitialData = async () => {
            const userData = localStorage.getItem('user');
            if (!userData) {
                setInitialLoading(false);
                return;
            }

            const user = JSON.parse(userData);

            try {
                const [profileRes, settingsRes] = await Promise.all([
                    axios.get(`/get_profile.php?user_id=${user.id}`),
                    axios.get('/get_appointment_settings.php'),
                ]);

                if (profileRes.data.status === 'success') {
                    setPatientId(profileRes.data.data.patient_id);
                }

                if (settingsRes.data.status === 'success') {
                    setAvailability(settingsRes.data.availability || []);
                    setSlots(settingsRes.data.slots || []);
                }
            } catch (error) {
                console.error('Error loading appointment request data:', error);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const branchOptions = ['Pasay Branch', 'Valenzuela Branch'];

    const branchAvailability = useMemo(
        () => availability.filter((day) => day.branch === branch && Number(day.is_active) === 1),
        [availability, branch]
    );

    const validWeekdays = useMemo(
        () => branchAvailability.map((day) => Number(day.weekday)),
        [branchAvailability]
    );

    const branchSlots = useMemo(
        () => slots
            .filter((slot) => slot.branch === branch && Number(slot.is_active) === 1)
            .sort((a, b) => Number(a.sort_order) - Number(b.sort_order)),
        [slots, branch]
    );

    const getWeekday = (selectedDate) => {
        if (!selectedDate) return null;
        return new Date(`${selectedDate}T12:00:00`).getDay();
    };

    const validateSelectedDate = (selectedDate) => {
        if (!selectedDate || !branch) return true;
        return validWeekdays.includes(getWeekday(selectedDate));
    };

    const handleDateChange = (value) => {
        if (value && branch && !validateSelectedDate(value)) {
            alert('That day is not available for the selected branch.');
            setDate('');
            return;
        }
        setDate(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!patientId) {
            alert('Profile is still loading or invalid. Please try again.');
            return;
        }

        if (!appointmentType) {
            alert('Please select an appointment purpose first.');
            return;
        }

        if (!validateSelectedDate(date)) {
            alert('Please choose a valid available date for the selected branch.');
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post('/book_appointment.php', {
                patientId,
                branch,
                type: appointmentType,
                date,
                time,
                concerns,
            });

            if (res.data.status === 'success') {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    navigate('/appointment-history');
                }, 3000);
            } else {
                alert(res.data.message);
            }
        } catch (error) {
            alert('Connection error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen flex justify-center items-start relative">
            {showSuccess && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
                    <div className="bg-white p-12 rounded-[2rem] shadow-2xl flex flex-col items-center text-center transform scale-100 animate-fadeIn">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Request Sent!</h3>
                        <p className="text-sm text-gray-500 max-w-xs">Your appointment request has been forwarded to the clinic. Redirecting you to your history shortly...</p>
                    </div>
                </div>
            )}

            <div className="w-full max-w-4xl">
                <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Patient Portal</p>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Request Appointment</h1>
                    <p className="text-sm text-gray-500 mt-2">Choose the purpose of your visit, then submit your preferred branch, date, and clinic slot for review.</p>
                </div>

                <div className="w-full bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#faf9f6] p-10 border-b border-gray-50">
                        <h2 className="text-2xl font-bold text-gray-800">Appointment Request</h2>
                        <p className="text-xs text-[#c4ba9d] font-bold uppercase tracking-[0.2em] mt-2">Submit your preferred clinic schedule</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-3">Appointment Purpose</label>
                                <select
                                    className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-base outline-none focus:border-[#c4ba9d] transition text-gray-700"
                                    value={appointmentType}
                                    onChange={(e) => setAppointmentType(e.target.value)}
                                    disabled={initialLoading}
                                    required
                                >
                                    <option value="">Choose purpose</option>
                                    <option value="Initial Consultation">Initial Consultation</option>
                                    <option value="Follow-up Checkup">Follow-up Checkup</option>
                                    <option value="Routine Maintenance">Routine Skin Maintenance</option>
                                    <option value="Doctor-Advised Procedure">Procedure (Doctor Advised)</option>
                                    <option value="Other">Other / General Inquiry</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-3">Select Branch</label>
                                <select
                                    required
                                    className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-base outline-none focus:border-[#c4ba9d] transition text-gray-700"
                                    value={branch}
                                    onChange={(e) => {
                                        setBranch(e.target.value);
                                        setDate('');
                                        setTime('');
                                    }}
                                    disabled={initialLoading}
                                >
                                    <option value="">Choose branch</option>
                                    {branchOptions.map((branchOption) => (
                                        <option key={branchOption} value={branchOption}>{branchOption}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-3">Preferred Date</label>
                                <input
                                    type="date"
                                    min={minDate}
                                    required
                                    className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-base outline-none focus:border-[#c4ba9d] transition text-gray-700"
                                    value={date}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    disabled={!branch || initialLoading}
                                />
                                {branch && (
                                    <p className="text-xs text-gray-400 mt-2">
                                        Valid weekdays: {branchAvailability.map((day) => day.weekday_name).join(', ') || 'No active weekdays configured'}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-3">Preferred Time</label>
                                <select
                                    required
                                    className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-base outline-none focus:border-[#c4ba9d] transition text-gray-700"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    disabled={!branch || branchSlots.length === 0 || initialLoading}
                                >
                                    <option value="">Select a time slot</option>
                                    {branchSlots.map((slot) => (
                                        <option key={`${slot.branch}-${slot.slot_time}`} value={slot.slot_time}>
                                            {slot.slot_label}
                                        </option>
                                    ))}
                                </select>
                                {branch && branchSlots.length === 0 && (
                                    <p className="text-xs text-red-400 mt-2">No active time slots are configured for this branch yet.</p>
                                )}
                                {branch && branchSlots.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-2">Submitting this form sends a request. The clinic still needs to review and confirm it.</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-3">Chief Complaint / Concerns</label>
                            <textarea
                                required
                                rows="5"
                                placeholder="Please briefly describe your skin concern or anything the clinic should prepare for..."
                                className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-base outline-none focus:border-[#c4ba9d] transition text-gray-700 resize-none"
                                value={concerns}
                                onChange={(e) => setConcerns(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading || showSuccess || initialLoading || !patientId}
                                className="px-10 py-4 bg-[#555555] text-[#c4ba9d] text-sm font-bold uppercase tracking-[0.18em] rounded-full shadow-lg hover:bg-black transition disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? 'Submitting...' : initialLoading ? 'Loading...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestAppointment;
