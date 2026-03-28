import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const AdminEditPatient = () => {
    const navigate = useNavigate();
    const { userId } = useParams();

    const [loading, setLoading]     = useState(false);
    const [fetching, setFetching]   = useState(true); // loading the existing data
    const [error, setError]         = useState('');
    const [success, setSuccess]     = useState(false);

    const [formData, setFormData] = useState({
        user_id: '',
        first_name: '', middle_name: '', last_name: '', extension_name: '',
        nickname: '', age: '', sex: 'Select...', phone: '', email: '',
        address: '',

        // Initial Disclosure
        tooth_extraction: false,
        surgical_procedures: '',
        allergies: '',
        aesthetic_procedures: '',
        pregnant: 'No',
        untoward_reactions: '',

        // Illnesses
        heart_disease: false,
        hypertension: false,
        diabetes: false,
        hyperthyroidism: false,
        autoimmune_disease: false,
        cancer: false,
        renal_failure: false,
        liver_disease: false,
        bronchial_asthma: false,
        pulmonary_disease: false,
        infectious_disease: false,

        others: '',
        medications: '',
        current_skin_treatment: ''
    });

    const illnessOptions = [
        { id: 'heart_disease',      label: 'Heart Disease' },
        { id: 'hypertension',       label: 'Hypertension' },
        { id: 'diabetes',           label: 'Diabetes mellitus' },
        { id: 'hyperthyroidism',    label: 'Hyperthyroidism' },
        { id: 'autoimmune_disease', label: 'Autoimmune Diseases' },
        { id: 'cancer',             label: 'Cancer' },
        { id: 'renal_failure',      label: 'Renal Failure' },
        { id: 'liver_disease',      label: 'Liver Disease' },
        { id: 'bronchial_asthma',   label: 'Bronchial Asthma' },
        { id: 'pulmonary_disease',  label: 'Pulmonary Disease' },
        { id: 'infectious_disease', label: 'Infectious/ Contagious Disease' },
    ];

    // ── Fetch existing patient data and pre-populate ──
    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const res = await axios.get(`/get_profile.php?user_id=${userId}`);
                const d   = res.data.data ?? res.data;

                setFormData({
                    user_id:            userId,
                    first_name:         d.first_name         ?? '',
                    middle_name:        d.middle_name        ?? '',
                    last_name:          d.last_name          ?? '',
                    extension_name:     d.extension_name     ?? '',
                    nickname:           d.nickname           ?? '',
                    age:                d.age                ?? '',
                    sex:                d.sex                ?? 'Select...',
                    phone:              d.phone              ?? '',
                    email:              d.email              ?? '',
                    address:            d.address            ?? '',

                    // tinyint 1/0 from DB → boolean
                    tooth_extraction:   !!+d.tooth_extraction,
                    surgical_procedures: d.surgical_procedures  ?? '',
                    allergies:          d.allergies           ?? '',
                    aesthetic_procedures: d.aesthetic_procedures ?? '',
                    pregnant:           d.pregnant            ?? 'No',
                    untoward_reactions: d.untoward_reactions  ?? '',

                    heart_disease:      !!+d.heart_disease,
                    hypertension:       !!+d.hypertension,
                    diabetes:           !!+d.diabetes,
                    hyperthyroidism:    !!+d.hyperthyroidism,
                    autoimmune_disease: !!+d.autoimmune_disease,
                    cancer:             !!+d.cancer,
                    renal_failure:      !!+d.renal_failure,
                    liver_disease:      !!+d.liver_disease,
                    bronchial_asthma:   !!+d.bronchial_asthma,
                    pulmonary_disease:  !!+d.pulmonary_disease,
                    infectious_disease: !!+d.infectious_disease,

                    others:                 d.others                ?? '',
                    medications:            d.medications           ?? '',
                    current_skin_treatment: d.current_skin_treatment ?? '',
                });
            } catch (err) {
                setError('Failed to load patient data.');
            } finally {
                setFetching(false);
            }
        };
        fetchPatient();
    }, [userId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.sex === 'Select...') {
            setError('Please select a biological sex.');
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post('/update_patient.php', formData);
            if (res.data.status === 'success') {
                setSuccess(true);
                setTimeout(() => navigate('/admin/patients'), 1500);
            } else {
                setError(res.data.message || 'Failed to update patient.');
            }
        } catch (err) {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Loading state while fetching ──
    if (fetching) {
        return (
            <div className="p-12 bg-[#f4f4f4] min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs uppercase tracking-widest text-gray-400">Loading patient data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-wide">Edit Patient</h1>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                        {formData.first_name} {formData.last_name}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/patients')}
                    className="text-gray-500 hover:text-[#b2a58d] transition flex items-center gap-2 text-sm font-medium"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to List
                </button>
            </div>

            {/* Feedback banners */}
            {error   && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
            {success && <div className="mb-6 p-4 bg-green-50 text-green-600 text-sm rounded-xl border border-green-100 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                Patient updated! Redirecting...
            </div>}

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-3xl shadow-sm border border-gray-100 w-full">

                {/* ── ACCOUNT INFO ── */}
                <div className="grid grid-cols-4 gap-6">
                    <Field label="First Name"   name="first_name"      value={formData.first_name}      onChange={handleChange} required />
                    <Field label="Middle Name"  name="middle_name"     value={formData.middle_name}     onChange={handleChange} />
                    <Field label="Last Name"    name="last_name"       value={formData.last_name}       onChange={handleChange} required />
                    <Field label="Ext. (E.G. III)" name="extension_name" value={formData.extension_name} onChange={handleChange} />
                    <Field label="Nickname"     name="nickname"        value={formData.nickname}        onChange={handleChange} />
                    <Field label="Age"          name="age"             value={formData.age}             onChange={handleChange} type="number" required />
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Sex</label>
                        <select
                            name="sex"
                            value={formData.sex}
                            onChange={handleChange}
                            className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition"
                        >
                            <option value="Select...">Select...</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                        </select>
                    </div>
                    <Field label="Phone Number" name="phone"  value={formData.phone}  onChange={handleChange} required />
                </div>

                <div className="grid grid-cols-4 gap-6">
                    <Field label="Email"   name="email"   value={formData.email}   onChange={handleChange} type="email" required />
                    {/* No password field on edit — admin shouldn't reset password here */}
                    <div className="col-span-2">
                        <Field label="Address" name="address" value={formData.address} onChange={handleChange} required />
                    </div>
                </div>

                {/* ── INITIAL DISCLOSURE ── */}
                <div className="border-t border-gray-50 pt-8">
                    <h2 className="text-sm font-bold text-[#d4af37] tracking-widest uppercase mb-8 text-center">Initial Disclosure</h2>

                    {/* Row 1 — all top-aligned */}
                    <div className="grid grid-cols-3 gap-8">
                        <Field label="Previous Aesthetic Procedures" name="aesthetic_procedures" value={formData.aesthetic_procedures} onChange={handleChange} placeholder="(if any)" />
                        <Field label="Previous Surgical Procedures" name="surgical_procedures" value={formData.surgical_procedures} onChange={handleChange} placeholder="(if any)" />
                        <Field label="Allergies" name="allergies" value={formData.allergies} onChange={handleChange} />
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-3 gap-8 mt-6">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Recent Tooth Extraction?</label>
                            <div className="w-full p-3  rounded-lg flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name="tooth_extraction"
                                    checked={formData.tooth_extraction}
                                    onChange={handleChange}
                                    className="w-4 h-4 accent-[#d4af37]"
                                />
                                <span className="text-sm text-gray-600">Yes</span>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Pregnant / Breastfeeding / Planning?</label>
                            <div className="w-full p-3  rounded-lg flex items-center gap-8">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="radio" name="pregnant" value="Yes" checked={formData.pregnant === 'Yes'} onChange={handleChange} className="w-4 h-4 accent-[#d4af37]" /> Yes
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="radio" name="pregnant" value="No"  checked={formData.pregnant === 'No'}  onChange={handleChange} className="w-4 h-4 accent-[#d4af37]" /> No
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className="mt-6">
                        <Field label="Have you had any untoward reactions? If yes, please specify:" name="untoward_reactions" value={formData.untoward_reactions} onChange={handleChange} />
                    </div>
                </div>

                {/* ── MEDICAL HISTORY ── */}
                <div className="border-t border-gray-50 pt-8">
                    <h2 className="text-sm font-bold text-[#d4af37] tracking-widest uppercase mb-2 text-center">Medical History Disclosure</h2>
                    <p className="text-xs text-gray-400 italic text-center mb-8">Acute or Chronic Illnesses: Have you had or is/ are suffering from any medical condition/s (Check any that apply)</p>

                    <div className="grid grid-cols-3 gap-y-4 gap-x-8 mb-8 px-8">
                        {illnessOptions.map(({ id, label }) => (
                            <div key={id} className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    name={id}
                                    checked={formData[id]}
                                    onChange={handleChange}
                                    className="w-4 h-4 accent-[#d4af37]"
                                />
                                <label className="text-sm text-gray-600">{label}</label>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <Field label="Others"                         name="others"                  value={formData.others}                  onChange={handleChange} />
                        <Field label="Medications / Treatment Regimen" name="medications"             value={formData.medications}             onChange={handleChange} />
                        <Field label="Currently on Skin / Aesthetic Treatment (creams/lotions/ointments/astringents)" name="current_skin_treatment" value={formData.current_skin_treatment} onChange={handleChange} />
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center pt-8">
                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-16 h-16 bg-[#2d2a26] text-[#d4af37] rounded-full flex items-center justify-center hover:bg-black transition disabled:opacity-50 shadow-lg hover:scale-105 transform duration-300"
                        title="Save changes"
                    >
                        {loading ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Reusable labeled input
const Field = ({ label, name, value, onChange, type = 'text', required = false, placeholder = '' }) => (
    <div>
        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">{label}</label>
        <input
            type={type}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition"
        />
    </div>
);

export default AdminEditPatient;
