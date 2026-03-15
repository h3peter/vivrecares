import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../../components/ProfileAvatar';

const AdminViewPatient = () => {
    const { id } = useParams(); // Grabs the ID from the URL
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPatientDetails = async () => {
            try {
                const res = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_profile.php?user_id=${id}`);
                if (res.data.status === 'success') {
                    setPatient(res.data.data);
                } else {
                    setError(res.data.message);
                }
            } catch (err) {
                setError("Failed to connect to the server.");
            } finally {
                setLoading(false);
            }
        };
        fetchPatientDetails();
    }, [id]);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading patient data...</div>;
    if (error) return <div className="p-12 text-center text-red-500">{error}</div>;
    if (!patient) return <div className="p-12 text-center text-gray-500">Patient not found.</div>;

    // Helper to format conditions
    const checkCondition = (value) => value === 1 || value === '1' ? 'Yes' : 'No';

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-wide">Patient Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">Detailed medical and personal record</p>
                </div>
                <button 
                    onClick={() => navigate('/admin/patients')}
                    className="text-gray-500 hover:text-[#b2a58d] transition flex items-center gap-2 text-sm font-medium"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to List
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Personal Info Card */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        <ProfileAvatar user={patient} className="w-32 h-32 rounded-full border-4 border-[#f4f1eb] mb-4" textSize="text-4xl" />
                        <h2 className="text-xl font-bold text-gray-800">
                            {patient.first_name} {patient.last_name} {patient.extension_name}
                        </h2>
                        <p className="text-xs text-[#d4af37] font-bold tracking-widest uppercase mt-1">Patient ID: {patient.patient_id}</p>
                        
                        <div className="w-full mt-8 space-y-4 text-left">
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Email</p>
                                <p className="text-sm text-gray-700">{patient.email}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Phone</p>
                                <p className="text-sm text-gray-700">{patient.phone || 'N/A'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Age</p>
                                    <p className="text-sm text-gray-700">{patient.age} yrs</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sex</p>
                                    <p className="text-sm text-gray-700">{patient.sex}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Address</p>
                                <p className="text-sm text-gray-700">{patient.address || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Medical History */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Initial Disclosure */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-[#d4af37] tracking-widest uppercase mb-6 border-b border-gray-50 pb-4">Initial Disclosure</h3>
                        <div className="grid grid-cols-2 gap-6">
                            <InfoBlock label="Recent Tooth Extraction" value={checkCondition(patient.tooth_extraction)} />
                            <InfoBlock label="Pregnant / Breastfeeding" value={patient.pregnant} />
                            <InfoBlock label="Allergies" value={patient.allergies} />
                            <InfoBlock label="Untoward Reactions" value={patient.untoward_reactions} />
                            <InfoBlock label="Surgical Procedures" value={patient.surgical_procedures} />
                            <InfoBlock label="Aesthetic Procedures" value={patient.aesthetic_procedures} />
                        </div>
                    </div>

                    {/* Medical Conditions */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-[#d4af37] tracking-widest uppercase mb-6 border-b border-gray-50 pb-4">Medical Conditions</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 mb-6">
                            <Badge label="Heart Disease" active={patient.heart_disease} />
                            <Badge label="Hypertension" active={patient.hypertension} />
                            <Badge label="Diabetes" active={patient.diabetes} />
                            <Badge label="Hyperthyroidism" active={patient.hyperthyroidism} />
                            <Badge label="Autoimmune Disease" active={patient.autoimmune_disease} />
                            <Badge label="Cancer" active={patient.cancer} />
                            <Badge label="Renal Failure" active={patient.renal_failure} />
                            <Badge label="Liver Disease" active={patient.liver_disease} />
                            <Badge label="Bronchial Asthma" active={patient.bronchial_asthma} />
                            <Badge label="Pulmonary Disease" active={patient.pulmonary_disease} />
                            <Badge label="Infectious Disease" active={patient.infectious_disease} />
                        </div>
                        <div className="space-y-4 border-t border-gray-50 pt-6">
                            <InfoBlock label="Other Conditions" value={patient.others} />
                            <InfoBlock label="Medications / Treatments" value={patient.medications} />
                            <InfoBlock label="Current Skin Routine" value={patient.current_skin_treatment} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* Helper Components for clean UI */
const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm text-gray-800">{value || <span className="text-gray-300 italic">None reported</span>}</p>
    </div>
);

const Badge = ({ label, active }) => {
    const isActive = active === 1 || active === '1';
    return (
        <div className={`flex items-center gap-2 text-sm ${isActive ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500' : 'bg-gray-200'}`}></div>
            {label}
        </div>
    );
};

export default AdminViewPatient;