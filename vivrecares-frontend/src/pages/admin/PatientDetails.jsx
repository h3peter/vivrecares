import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../../components/ProfileAvatar'; 

const PatientDetails = () => {
    const { userId } = useParams(); 
    const navigate = useNavigate();
    const [patientData, setPatientData] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [treatments, setTreatments] = useState([]);
    const [consultationNotes, setConsultationNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                // 1. Fetch Profile
                const profileRes = await axios.get(`/get_profile.php?user_id=${userId}`);
                
                if (profileRes.data.status === 'success') {
                    const patientInfo = profileRes.data.data;
                    setPatientData(patientInfo);

                    if (patientInfo && patientInfo.patient_id) {
                        // 2. Fetch their Appointment History
                        const aptRes = await axios.get(`/get_appointments.php?patient_id=${patientInfo.patient_id}`);
                        setAppointments(aptRes.data);

                        // 3. Fetch their Availed Treatments (Moved inside here!)
                        const treatmentRes = await axios.get(`/get_patient_treatments.php?patient_id=${patientInfo.patient_id}`);
                        if (treatmentRes.data.status === 'success') {
                            setTreatments(treatmentRes.data.data);
                        }

                        // 4. Fetch doctor-entered consultation notes
                        const notesRes = await axios.get(`/get_consultation_notes.php?patient_id=${patientInfo.patient_id}`);
                        if (notesRes.data.status === 'success') {
                            setConsultationNotes(notesRes.data.data || []);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching patient details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [userId]);

    if (loading) return <PatientDetailsSkeleton />;
    if (!patientData) return <div className="p-12 text-gray-500">Patient details unavailable.</div>;

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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Profile Card */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
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
                        <div className="p-6 text-gray-600 text-xs leading-relaxed min-h-[120px] space-y-3">
                            {consultationNotes.length > 0 ? (
                                consultationNotes.slice(0, 4).map((note) => (
                                    <div key={note.note_id} className="rounded-xl border border-gray-100 bg-[#faf9f6] p-3">
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-[#b2a58d] font-bold">
                                            Dr. {note.doctor_first_name || 'Clinic'} {note.doctor_last_name || 'Staff'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {formatDateTime(note.created_at)}
                                        </p>
                                        <p className="text-xs text-gray-700 mt-2"><span className="font-bold">Diagnosis:</span> {note.diagnosis || 'Not specified'}</p>
                                        <p className="text-xs text-gray-700 mt-1"><span className="font-bold">Plan:</span> {note.treatment_plan || 'Not specified'}</p>
                                        <p className="text-xs text-gray-700 mt-1"><span className="font-bold">Notes:</span> {note.consultation_notes || 'Not specified'}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="italic text-gray-400">No consultation notes yet.</p>
                            )}
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
                            <InfoBlock label="Allergies" value={patientData.allergies || "None"} />
                            <InfoBlock label="Previous Surgery" value={patientData.surgical_procedures || "N/A"} />
                            <InfoBlock label="Previous Aesthetic Procedures" value={patientData.aesthetic_procedures || "None"} />
                            <InfoBlock label="Current Skin Treatment" value={patientData.current_skin_treatment || "None"} />
                        </div>
                    </div>

                    {/* Availed Treatments & Pricing */}
                    <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="bg-[#faf9f6] px-8 py-5 border-b border-gray-50">
                            <h4 className="text-[10px] text-[#c4ba9d] font-bold uppercase tracking-[0.2em]">Availed Treatments & Pricing</h4>
                        </div>
                        
                        <div className="p-8">
                            {treatments.length > 0 ? (
                                <div className="space-y-4">
                                    {treatments.map((treatment, index) => (
                                        <div key={index} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{treatment.description}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                                                    {new Date(treatment.payment_date).toLocaleDateString()} 
                                                    <span className="mx-2">•</span> 
                                                    INV-{String(treatment.invoice_id).padStart(4, '0')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 text-sm">₱{parseFloat(treatment.total_price).toLocaleString()}</p>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${treatment.payment_status === 'Paid' ? 'text-green-500' : 'text-red-400'}`}>
                                                    {treatment.payment_status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-gray-400 italic py-4">No availed treatments yet.</p>
                            )}
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

const formatDateTime = (value) => {
    if (!value) return 'Date unavailable';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Date unavailable';
    return parsed.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const PatientDetailsSkeleton = () => (
    <div className="min-h-screen bg-[#f4f4f4] p-12">
        <div className="animate-pulse">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-6 w-6 rounded-full bg-[#ebe4d9]" />
                    <div className="h-7 w-48 rounded-full bg-[#ddd2c2]" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="space-y-8">
                    <div className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                        <div className="h-24 w-24 rounded-full bg-[#ebe4d9]" />
                        <div className="mt-4 h-5 w-40 rounded-full bg-[#ddd2c2]" />
                        <div className="mt-2 h-3 w-32 rounded-full bg-[#ebe4d9]" />
                        <div className="mt-3 h-3 w-44 rounded-full bg-[#f1ece4]" />
                        <div className="mt-6 w-full space-y-2 border-t pt-4">
                            <div className="h-3 w-4/5 rounded-full bg-[#ebe4d9]" />
                            <div className="h-3 w-3/5 rounded-full bg-[#ebe4d9]" />
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 bg-[#fcfaf5] px-6 py-3">
                            <div className="h-3 w-28 rounded-full bg-[#e8dfd2]" />
                        </div>
                        <div className="space-y-3 p-6">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div key={index} className="rounded-xl border border-gray-100 bg-[#faf9f6] p-3">
                                    <div className="h-3 w-32 rounded-full bg-[#e8dfd2]" />
                                    <div className="mt-2 h-3 w-24 rounded-full bg-[#ebe4d9]" />
                                    <div className="mt-3 space-y-2">
                                        <div className="h-3 w-full rounded-full bg-[#ebe4d9]" />
                                        <div className="h-3 w-11/12 rounded-full bg-[#f1ece4]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8 lg:col-span-2">
                    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 bg-[#fcfaf5] px-6 py-3">
                            <div className="h-3 w-24 rounded-full bg-[#e8dfd2]" />
                        </div>
                        <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-8 md:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index}>
                                    <div className="mb-2 h-3 w-24 rounded-full bg-[#e8dfd2]" />
                                    <div className="h-4 w-full rounded-full bg-[#ebe4d9]" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-sm">
                        <div className="border-b border-gray-50 bg-[#faf9f6] px-8 py-5">
                            <div className="h-3 w-44 rounded-full bg-[#e8dfd2]" />
                        </div>
                        <div className="space-y-4 p-8">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-2">
                                        <div className="h-4 w-40 rounded-full bg-[#ddd2c2]" />
                                        <div className="h-3 w-32 rounded-full bg-[#ebe4d9]" />
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <div className="h-4 w-20 rounded-full bg-[#ddd2c2]" />
                                        <div className="h-3 w-12 rounded-full bg-[#ebe4d9]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default PatientDetails;
