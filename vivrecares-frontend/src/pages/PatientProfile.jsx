import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileAvatar from '../components/ProfileAvatar';

const PatientProfile = () => {
    const [patientData, setPatientData] = useState(null);
    const [consultationNotes, setConsultationNotes] = useState([]);
    const [visitSummary, setVisitSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            navigate('/');
            return;
        }

        const fetchProfile = async () => {
            try {
                const response = await axios.get(`/get_profile.php?user_id=${user.id}`);
                if (response.data.status === 'success') {
                    const profile = response.data.data;
                    setPatientData(profile);

                    if (profile?.patient_id) {
                        const [noteResponse, summaryResponse] = await Promise.all([
                            axios.get(`/get_consultation_notes.php?patient_id=${profile.patient_id}`),
                            axios.get(`/get_patient_visit_summary.php?patient_id=${profile.patient_id}`),
                        ]);

                        if (noteResponse.data.status === 'success') {
                            setConsultationNotes(noteResponse.data.data || []);
                        }

                        if (summaryResponse.data.status === 'success') {
                            setVisitSummary(summaryResponse.data.data || []);
                        }
                    }

                    setError('');
                } else {
                    setError(response.data.message || 'Unable to load your profile.');
                }
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                setError('Unable to load your profile right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    if (error) {
        return <div className="p-12 text-base text-red-600">{error}</div>;
    }

    if (loading) {
        return <PatientProfileSkeleton />;
    }

    if (!patientData) {
        return <div className="p-12 text-base text-gray-500 font-medium tracking-[0.18em] uppercase">Profile unavailable.</div>;
    }

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Patient Portal</p>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">My Profile</h1>
                    <p className="text-sm text-gray-500 mt-2">Your personal details and medical history are shown here for easy review.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        <ProfileAvatar user={patientData} className="w-28 h-28 rounded-full mb-5 mx-auto" textSize="text-4xl" />
                        <h2 className="font-bold text-gray-800 text-2xl">{patientData.first_name} {patientData.last_name}</h2>
                        <p className="text-sm text-[#c4ba9d] font-bold uppercase tracking-[0.18em] mt-2">
                            {patientData.sex} | {patientData.age} years old
                        </p>
                        <div className="w-full border-t border-gray-50 pt-6 mt-6 space-y-3">
                            <p className="text-base text-gray-600">{patientData.address || 'No address on file'}</p>
                            <p className="text-sm text-gray-500">{patientData.email || 'No email on file'}</p>
                            <p className="text-sm text-gray-500">{patientData.phone || 'No phone on file'}</p>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#faf9f6] px-8 py-5 border-b border-gray-50">
                            <span className="text-xs uppercase tracking-[0.2em] text-[#c4ba9d] font-bold">Medical History</span>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-8 flex-1">
                            <InfoBlock label="Allergies" value={patientData.allergies || 'None'} />
                            <InfoBlock label="Previous Surgery" value={patientData.surgical_procedures || 'None recorded'} />
                            <InfoBlock label="Aesthetic Procedures" value={patientData.aesthetic_procedures || 'None recorded'} />
                            <InfoBlock label="Current Skin Treatment" value={patientData.current_skin_treatment || 'None recorded'} />
                            <InfoBlock label="Untoward Reactions" value={patientData.untoward_reactions || 'None recorded'} />
                            <InfoBlock label="Medications" value={patientData.medications || 'None recorded'} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#faf9f6] px-8 py-5 border-b border-gray-50">
                        <span className="text-xs uppercase tracking-[0.2em] text-[#c4ba9d] font-bold">Additional Notes</span>
                    </div>
                    <div className="p-8 min-h-[150px] text-base text-gray-600 leading-relaxed">
                        {patientData.others || 'No additional notes on file.'}
                    </div>
                </div>

                <div className="mt-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#faf9f6] px-8 py-5 border-b border-gray-50 flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.2em] text-[#c4ba9d] font-bold">Doctor Consultation Updates</span>
                        <span className="text-xs text-gray-400 uppercase tracking-[0.18em] font-bold">
                            {consultationNotes.length} note{consultationNotes.length === 1 ? '' : 's'}
                        </span>
                    </div>

                    <div className="p-8">
                        {consultationNotes.length > 0 ? (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                                    <MiniInfo label="Latest Diagnosis" value={consultationNotes[0].diagnosis || 'No diagnosis yet'} />
                                    <MiniInfo label="Latest Treatment Plan" value={consultationNotes[0].treatment_plan || 'No treatment plan yet'} />
                                    <MiniInfo label="Latest Doctor Orders" value={consultationNotes[0].prescriptions || 'No medication/procedure order yet'} />
                                </div>

                                <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                                    {consultationNotes.map((note) => {
                                        const relatedVisit = visitSummary.find(
                                            (visit) => Number(visit.appointment_id) === Number(note.appointment_id)
                                        );

                                        return (
                                            <div key={note.note_id} className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-5">
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                    <p className="text-xs uppercase tracking-[0.18em] font-bold text-[#b2a58d]">
                                                        Dr. {note.doctor_first_name || 'Clinic'} {note.doctor_last_name || 'Staff'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {formatDateTime(note.created_at)}
                                                    </p>
                                                </div>

                                                {relatedVisit && (
                                                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-gray-400">
                                                        Related Visit: {relatedVisit.appointment_date} {relatedVisit.appointment_time} | {relatedVisit.appointment_type || 'Consultation'}
                                                    </p>
                                                )}

                                                <p className="mt-3 text-sm text-gray-700"><span className="font-bold">Diagnosis:</span> {note.diagnosis || 'Not specified'}</p>
                                                <p className="mt-1 text-sm text-gray-700"><span className="font-bold">Treatment Plan:</span> {note.treatment_plan || 'Not specified'}</p>
                                                <p className="mt-1 text-sm text-gray-700"><span className="font-bold">Medication/Orders:</span> {note.prescriptions || 'Not specified'}</p>
                                                <p className="mt-1 text-sm text-gray-700"><span className="font-bold">Consultation Notes:</span> {note.consultation_notes || 'Not specified'}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <p className="text-base text-gray-500 italic">
                                No doctor consultation notes have been added yet.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

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

const InfoBlock = ({ label, value }) => (
    <div>
        <p className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold mb-2">{label}</p>
        <p className="text-base text-gray-700 font-medium leading-relaxed">{value}</p>
    </div>
);

const MiniInfo = ({ label, value }) => (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-bold">{label}</p>
        <p className="text-sm text-gray-700 font-medium mt-2 leading-relaxed">{value}</p>
    </div>
);

const PatientProfileSkeleton = () => (
    <div className="min-h-screen bg-[#f4f4f4] p-8 lg:p-12">
        <div className="mx-auto max-w-6xl animate-pulse">
            <div className="mb-8 space-y-3">
                <div className="h-3 w-28 rounded-full bg-[#e8dfd2]" />
                <div className="h-8 w-56 rounded-full bg-[#ddd2c2]" />
                <div className="h-4 w-96 max-w-full rounded-full bg-[#ebe4d9]" />
            </div>

            <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="flex flex-col items-center rounded-[2rem] border border-gray-100 bg-white p-8 text-center shadow-sm">
                    <div className="h-28 w-28 rounded-full bg-[#ebe4d9]" />
                    <div className="mt-5 h-7 w-48 rounded-full bg-[#ddd2c2]" />
                    <div className="mt-3 h-4 w-32 rounded-full bg-[#ebe4d9]" />
                    <div className="mt-6 w-full space-y-3 border-t border-gray-50 pt-6">
                        <div className="h-4 w-full rounded-full bg-[#ebe4d9]" />
                        <div className="h-4 w-4/5 rounded-full bg-[#f1ece4]" />
                        <div className="h-4 w-3/5 rounded-full bg-[#f1ece4]" />
                    </div>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm lg:col-span-2">
                    <div className="border-b border-gray-50 bg-[#faf9f6] px-8 py-5">
                        <div className="h-3 w-32 rounded-full bg-[#e8dfd2]" />
                    </div>
                    <div className="grid grid-cols-1 gap-x-8 gap-y-8 p-8 md:grid-cols-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index}>
                                <div className="mb-2 h-3 w-24 rounded-full bg-[#e8dfd2]" />
                                <div className="h-4 w-full rounded-full bg-[#ebe4d9]" />
                                <div className="mt-2 h-4 w-4/5 rounded-full bg-[#f1ece4]" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-50 bg-[#faf9f6] px-8 py-5">
                    <div className="h-3 w-32 rounded-full bg-[#e8dfd2]" />
                </div>
                <div className="space-y-2 p-8">
                    <div className="h-4 w-full rounded-full bg-[#ebe4d9]" />
                    <div className="h-4 w-11/12 rounded-full bg-[#f1ece4]" />
                    <div className="h-4 w-2/3 rounded-full bg-[#f1ece4]" />
                </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-50 bg-[#faf9f6] px-8 py-5">
                    <div className="h-3 w-44 rounded-full bg-[#e8dfd2]" />
                    <div className="h-3 w-16 rounded-full bg-[#ebe4d9]" />
                </div>
                <div className="p-8">
                    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                                <div className="h-3 w-24 rounded-full bg-[#e8dfd2]" />
                                <div className="mt-2 h-4 w-full rounded-full bg-[#ebe4d9]" />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-5">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div className="h-3 w-36 rounded-full bg-[#e8dfd2]" />
                                    <div className="h-3 w-28 rounded-full bg-[#ebe4d9]" />
                                </div>
                                <div className="mt-3 space-y-2">
                                    <div className="h-4 w-full rounded-full bg-[#ebe4d9]" />
                                    <div className="h-4 w-11/12 rounded-full bg-[#f1ece4]" />
                                    <div className="h-4 w-10/12 rounded-full bg-[#f1ece4]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default PatientProfile;
