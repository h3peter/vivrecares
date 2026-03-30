import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import ProfileAvatar from '../../components/ProfileAvatar';

const DoctorPatientRecord = () => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const user = JSON.parse(localStorage.getItem('user'));

    const [patient, setPatient] = useState(null);
    const [treatments, setTreatments] = useState([]);
    const [notes, setNotes] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        appointment_id: '',
        diagnosis: '',
        treatment_plan: '',
        prescriptions: '',
        consultation_notes: '',
    });

    const loadAll = async () => {
        try {
            const profileRes = await axios.get(`/get_profile.php?user_id=${userId}`);
            if (profileRes.data.status !== 'success') return;
            const patientInfo = profileRes.data.data;
            setPatient(patientInfo);

            const patientId = patientInfo.patient_id;
            const [treatmentRes, noteRes, visitRes] = await Promise.all([
                axios.get(`/get_patient_treatments.php?patient_id=${patientId}`),
                axios.get(`/get_consultation_notes.php?patient_id=${patientId}`),
                axios.get(`/get_patient_visit_summary.php?patient_id=${patientId}`),
            ]);

            setTreatments(treatmentRes.data?.data || []);
            setNotes(noteRes.data?.data || []);
            setAppointments(visitRes.data?.data || []);
        } catch (error) {
            console.error('Error loading patient record', error);
        }
    };

    useEffect(() => {
        loadAll();
    }, [userId]);

    const appointmentOptions = useMemo(
        () => appointments.map((appointment) => ({
            id: appointment.appointment_id,
            label: `${appointment.appointment_date} ${appointment.appointment_time} - ${appointment.appointment_type || 'Consultation'}`,
        })),
        [appointments]
    );

    const handleSaveNote = async (e) => {
        e.preventDefault();
        if (!patient?.patient_id) return;
        setSaving(true);
        try {
            const res = await axios.post('/save_consultation_note.php', {
                patient_id: patient.patient_id,
                doctor_user_id: user?.id,
                appointment_id: form.appointment_id || null,
                diagnosis: form.diagnosis,
                treatment_plan: form.treatment_plan,
                prescriptions: form.prescriptions,
                consultation_notes: form.consultation_notes,
            });

            if (res.data.status === 'success') {
                setForm({
                    appointment_id: '',
                    diagnosis: '',
                    treatment_plan: '',
                    prescriptions: '',
                    consultation_notes: '',
                });
                loadAll();
            } else {
                alert(res.data.message || 'Unable to save note.');
            }
        } catch (error) {
            alert('Unable to save consultation note.');
        } finally {
            setSaving(false);
        }
    };

    if (!patient) {
        return <div className="p-12 text-gray-500">Loading patient record...</div>;
    }

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="mb-8 flex items-start justify-between gap-6">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Doctor Workspace</p>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Clinical Record</h1>
                    <p className="text-sm text-gray-500 mt-2">Review baseline history, document diagnosis, and track visit notes.</p>
                </div>
                <button
                    onClick={() => navigate('/doctor/patients')}
                    className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#c4ba9d] hover:text-[#8f8167] transition"
                >
                    Back to Patients
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-8">
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <ProfileAvatar user={patient} className="w-16 h-16 rounded-full border border-gray-100" textSize="text-xl" />
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{patient.first_name} {patient.last_name}</h2>
                            <p className="text-xs uppercase tracking-[0.18em] text-[#b2a58d] font-bold">
                                Patient ID {String(patient.patient_id).padStart(3, '0')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <Info label="Sex" value={patient.sex || 'N/A'} />
                        <Info label="Age" value={patient.age ? `${patient.age} years old` : 'N/A'} />
                        <Info label="Allergies" value={patient.allergies || 'None stated'} />
                        <Info label="Current Medication/Treatment" value={patient.medications || 'None stated'} />
                        <Info label="Surgical Procedures" value={patient.surgical_procedures || 'None stated'} />
                        <Info label="Aesthetic Procedures" value={patient.aesthetic_procedures || 'None stated'} />
                    </div>

                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#b2a58d] mb-4">Medical History Disclosure</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Initial Disclosure</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <Info label="Recent Tooth Extraction" value={toYesNo(patient.tooth_extraction)} />
                                    <Info label="Pregnant / Breastfeeding" value={patient.pregnant || 'No'} />
                                    <Info label="Untoward Reactions" value={patient.untoward_reactions || 'None stated'} />
                                    <Info label="Current Skin Treatment" value={patient.current_skin_treatment || 'None stated'} />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Declared Conditions</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <ConditionBadge label="Heart Disease" active={patient.heart_disease} />
                                    <ConditionBadge label="Hypertension" active={patient.hypertension} />
                                    <ConditionBadge label="Diabetes" active={patient.diabetes} />
                                    <ConditionBadge label="Hyperthyroidism" active={patient.hyperthyroidism} />
                                    <ConditionBadge label="Autoimmune Disease" active={patient.autoimmune_disease} />
                                    <ConditionBadge label="Cancer" active={patient.cancer} />
                                    <ConditionBadge label="Renal Failure" active={patient.renal_failure} />
                                    <ConditionBadge label="Liver Disease" active={patient.liver_disease} />
                                    <ConditionBadge label="Bronchial Asthma" active={patient.bronchial_asthma} />
                                    <ConditionBadge label="Pulmonary Disease" active={patient.pulmonary_disease} />
                                    <ConditionBadge label="Infectious Disease" active={patient.infectious_disease} />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Other Notes</p>
                                <div className="grid grid-cols-1 gap-4 text-sm">
                                    <Info label="Other Conditions" value={patient.others || 'None stated'} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#b2a58d] mb-4">Recent Treatment Entries</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {treatments.length > 0 ? treatments.map((item, index) => (
                                <div key={`${item.invoice_id}-${index}`} className="rounded-xl bg-[#faf9f6] border border-gray-100 px-4 py-3">
                                    <p className="text-sm font-semibold text-gray-800">{item.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Qty {item.quantity} | {item.payment_date ? new Date(item.payment_date).toLocaleDateString() : 'Date unavailable'}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 italic">No treatment records yet.</p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h3 className="text-2xl font-bold text-gray-800">New Consultation Note</h3>
                        <p className="text-sm text-gray-500 mt-2">Add diagnosis, treatment planning details, and session observations.</p>

                        <form className="mt-6 space-y-4" onSubmit={handleSaveNote}>
                            <div>
                                <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-2">Related Appointment</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-[#faf9f6] text-sm outline-none focus:border-[#c4ba9d]"
                                    value={form.appointment_id}
                                    onChange={(e) => setForm((prev) => ({ ...prev, appointment_id: e.target.value }))}
                                >
                                    <option value="">Standalone / General</option>
                                    {appointmentOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                </select>
                            </div>

                            <TextArea label="Diagnosis" value={form.diagnosis} onChange={(value) => setForm((prev) => ({ ...prev, diagnosis: value }))} />
                            <TextArea label="Treatment Plan" value={form.treatment_plan} onChange={(value) => setForm((prev) => ({ ...prev, treatment_plan: value }))} />
                            <TextArea label="Medications / Procedures Ordered" value={form.prescriptions} onChange={(value) => setForm((prev) => ({ ...prev, prescriptions: value }))} />
                            <TextArea label="Consultation Notes" value={form.consultation_notes} onChange={(value) => setForm((prev) => ({ ...prev, consultation_notes: value }))} />

                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-[#555555] text-[#c4ba9d] text-sm font-bold uppercase tracking-[0.18em] hover:bg-black transition disabled:opacity-60">
                                    {saving ? 'Saving...' : 'Save Clinical Note'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <h3 className="text-2xl font-bold text-gray-800">Consultation Timeline</h3>
                        <div className="mt-6 space-y-3 max-h-[26rem] overflow-y-auto">
                            {notes.length > 0 ? notes.map((note) => (
                                <div key={note.note_id} className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d]">
                                            Dr. {note.doctor_first_name || 'Staff'} {note.doctor_last_name || ''}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(note.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="mt-2 text-sm"><span className="font-bold text-gray-700">Diagnosis:</span> <span className="text-gray-600">{note.diagnosis || 'Not specified'}</span></p>
                                    <p className="mt-1 text-sm"><span className="font-bold text-gray-700">Plan:</span> <span className="text-gray-600">{note.treatment_plan || 'Not specified'}</span></p>
                                    <p className="mt-1 text-sm"><span className="font-bold text-gray-700">Orders:</span> <span className="text-gray-600">{note.prescriptions || 'Not specified'}</span></p>
                                    <p className="mt-1 text-sm"><span className="font-bold text-gray-700">Notes:</span> <span className="text-gray-600">{note.consultation_notes || 'Not specified'}</span></p>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 italic">No consultation notes yet.</p>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

const Info = ({ label, value }) => (
    <div className="rounded-xl border border-gray-100 bg-[#faf9f6] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{label}</p>
        <p className="text-sm text-gray-700 mt-1">{value}</p>
    </div>
);

const ConditionBadge = ({ label, active }) => {
    const isActive = active === 1 || active === '1' || active === true;
    return (
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${isActive ? 'border-red-100 bg-red-50 text-red-600' : 'border-gray-100 bg-[#faf9f6] text-gray-400'}`}>
            <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-red-500' : 'bg-gray-300'}`}></div>
            <span>{label}</span>
        </div>
    );
};

const toYesNo = (value) => (value === 1 || value === '1' || value === true ? 'Yes' : 'No');

const TextArea = ({ label, value, onChange }) => (
    <div>
        <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold block mb-2">{label}</label>
        <textarea
            rows="3"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 bg-[#faf9f6] text-sm text-gray-700 outline-none focus:border-[#c4ba9d] resize-none"
        />
    </div>
);

export default DoctorPatientRecord;
