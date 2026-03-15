import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../../components/ProfileAvatar'; // Added this!

const PatientDetails = () => {
    const { userId } = useParams(); 
    const navigate = useNavigate();
    const [patientData, setPatientData] = useState(null);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                // 1. Fetch Profile
                const profileRes = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_profile.php?user_id=${userId}`);
                
                // Fixed: Checking for success and grabbing the .data payload
                if (profileRes.data.status === 'success') {
                    const patientInfo = profileRes.data.data;
                    setPatientData(patientInfo);

                    // 2. Fetch their Appointment History
                    if (patientInfo && patientInfo.patient_id) {
                        const aptRes = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_appointments.php?patient_id=${patientInfo.patient_id}`);
                        setAppointments(aptRes.data);
                    }
                }
            } catch (error) {
                console.error("Error fetching patient details:", error);
            }
        };
        fetchDetails();
    }, [userId]);

    if (!patientData) return <div className="p-12 text-gray-500">Loading details...</div>;

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="hover:text-[#d4af37] transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h2 className="text-2xl font-light tracking-widest text-gray-800">Patient Details</h2>
                </div>
                <div className="flex gap-4 text-gray-400">
                    <button className="hover:text-[#d4af37] transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                    <button className="hover:text-red-500 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Profile Card */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        {/* Fixed: Now using ProfileAvatar instead of a broken img tag */}
                        <ProfileAvatar user={patientData} className="w-24 h-24 rounded-full mb-4 mx-auto" textSize="text-3xl" />
                        
                        <h4 className="font-bold text-gray-800">{patientData.first_name} {patientData.last_name}</h4>
                        <p className="text-xs text-gray-400 uppercase tracking-tighter mb-4">{patientData.sex} • {patientData.age} years old</p>
                        <p className="text-xs text-gray-500 mb-6">{patientData.address}</p>
                        <div className="text-[10px] text-gray-400 border-t pt-4 w-full">
                            <p>{patientData.email}</p>
                            <p>{patientData.phone}</p>
                        </div>
                    </div>

                    {/* Consultation Notes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-[#fcfaf5] px-6 py-3 border-b border-gray-100">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#b2a58d] font-bold">Consultation Notes</span>
                        </div>
                        <div className="p-6 text-gray-600 text-xs leading-relaxed min-h-[120px]">
                            <ul className="list-disc ml-4 space-y-1">
                                <li>Limit alcohol and strenuous exercise</li>
                                <li>Resume normal activities after 24 to 48 hours</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Medical History */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-[#fcfaf5] px-6 py-3 border-b border-gray-100">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#b2a58d] font-bold">Medical History</span>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            {/* Fixed: Updated database column variables */}
                            <InfoBlock label="Allergies" value={patientData.allergies || "None"} />
                            <InfoBlock label="Previous Surgery" value={patientData.surgical_procedures || "N/A"} />
                            <InfoBlock label="Previous Aesthetic Procedures" value={patientData.aesthetic_procedures || "None"} />
                            <InfoBlock label="Current Skin Treatment" value={patientData.current_skin_treatment || "None"} />
                        </div>
                    </div>

                    {/* Availed Treatments & Pricing */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-[#fcfaf5] px-6 py-3 border-b border-gray-100">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#b2a58d] font-bold">Availed Treatments & Pricing</span>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {appointments.length > 0 ? appointments.map((apt, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{apt.service}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">{apt.remarks || "No remarks"}</p>
                                        </div>
                                        <div className="text-center text-xs text-gray-500">
                                            {apt.date}
                                        </div>
                                        <div className="text-sm text-gray-700 font-medium">
                                            ₱{parseFloat(apt.price).toLocaleString()}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-xs text-gray-400 italic text-center py-4">No availed treatments yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-[10px] uppercase tracking-widest text-[#b2a58d] font-bold mb-1">{label}</p>
        <p className="text-sm text-gray-600 font-light">{value}</p>
    </div>
);

export default PatientDetails;