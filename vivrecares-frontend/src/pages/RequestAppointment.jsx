import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RequestAppointment = () => {
    const navigate = useNavigate();
    
    const [appointmentType, setAppointmentType] = useState('');
    const [branch, setBranch] = useState(''); // New Branch State
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [concerns, setConcerns] = useState('');
    const [loading, setLoading] = useState(false);
    const [patientId, setPatientId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    useEffect(() => {
        const fetchPatientId = async () => {
            const userData = localStorage.getItem('user');
            if (userData) {
                const user = JSON.parse(userData);
                try {
                    const profileRes = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_profile.php?user_id=${user.id}`);
                    if (profileRes.data.status === 'success') {
                        setPatientId(profileRes.data.data.patient_id);
                    }
                } catch (error) {
                    console.error("Error fetching patient ID:", error);
                }
            }
        };
        fetchPatientId();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!patientId) {
            alert("Profile is still loading or invalid. Please try again.");
            return;
        }

        setLoading(true);

        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/book_appointment.php', {
                patientId: patientId, 
                branch: branch, // Send Branch to backend
                type: appointmentType, 
                date: date,
                time: time,
                concerns: concerns
            });

            if (res.data.status === 'success') {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    navigate('/patient/appointments'); 
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
        <div className="p-12 bg-[#f4f4f4] min-h-screen flex justify-center items-start relative">
            
            {showSuccess && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
                    <div className="bg-white p-12 rounded-[2rem] shadow-2xl flex flex-col items-center text-center transform scale-100 animate-fadeIn">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Request Sent!</h3>
                        <p className="text-sm text-gray-500 max-w-xs">Your appointment request has been forwarded to the clinic. Redirecting you to your logs shortly...</p>
                    </div>
                </div>
            )}

            <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mt-4">
                <div className="bg-[#faf9f6] p-10 text-center border-b border-gray-50">
                    <h2 className="text-2xl font-light tracking-widest text-gray-800 uppercase">Book Appointment</h2>
                    <p className="text-[10px] text-[#c4ba9d] font-bold uppercase tracking-[0.2em] mt-2">Schedule your clinic visit</p>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Appointment Type</label>
                            <select required className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d] transition text-gray-700" value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)}>
                                <option value="">-- Choose Purpose --</option>
                                <option value="Initial Consultation">Initial Consultation</option>
                                <option value="Follow-up Checkup">Follow-up Checkup</option>
                                <option value="Routine Maintenance">Routine Skin Maintenance</option>
                                <option value="Doctor-Advised Procedure">Procedure (Doctor Advised)</option>
                                <option value="Other">Other / General Inquiry</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Select Branch</label>
                            <select required className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d] transition text-gray-700" value={branch} onChange={(e) => setBranch(e.target.value)}>
                                <option value="">-- Choose Branch --</option>
                                <option value="Pasay Branch">Pasay Branch</option>
                                <option value="Valenzuela Branch">Valenzuela Branch</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Preferred Date</label>
                            <input type="date" min={minDate} required className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d] transition text-gray-700" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Preferred Time</label>
                            <select required className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d] transition text-gray-700" value={time} onChange={(e) => setTime(e.target.value)}>
                                <option value="">-- Select a Time Slot --</option>
                                <option value="09:00 AM">09:00 AM</option>
                                <option value="10:30 AM">10:30 AM</option>
                                <option value="01:00 PM">01:00 PM</option>
                                <option value="02:30 PM">02:30 PM</option>
                                <option value="04:00 PM">04:00 PM</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3">Chief Complaint / Concerns</label>
                        <textarea required rows="4" placeholder="Please briefly describe your skin concern..." className="w-full p-4 bg-[#faf9f6] border border-gray-100 rounded-xl text-sm outline-none focus:border-[#c4ba9d] transition text-gray-700 resize-none" value={concerns} onChange={(e) => setConcerns(e.target.value)}></textarea>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex justify-end">
                        <button type="submit" disabled={loading || showSuccess} className="px-10 py-4 bg-[#555555] text-[#c4ba9d] text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg hover:bg-black transition">
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestAppointment;