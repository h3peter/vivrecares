import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminAddPatient = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Fully synced with your wireframe
    const [formData, setFormData] = useState({
        // Account Info
        first_name: '', middle_name: '', last_name: '', extension_name: '',
        nickname: '', age: '', sex: 'Select...', phone: '', email: '', 
        password: 'Vivre2026!', address: '',
        
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
        
        // Treatments & Others
        others: '',
        medications: '',
        current_skin_treatment: ''
    });

    // Array for easy mapping of the 11 checkboxes
    const illnessOptions = [
        { id: 'heart_disease', label: 'Heart Disease' },
        { id: 'hypertension', label: 'Hypertension' },
        { id: 'diabetes', label: 'Diabetes mellitus' },
        { id: 'hyperthyroidism', label: 'Hyperthyroidism' },
        { id: 'autoimmune_disease', label: 'Autoimmune Diseases' },
        { id: 'cancer', label: 'Cancer' },
        { id: 'renal_failure', label: 'Renal Failure' },
        { id: 'liver_disease', label: 'Liver Disease' },
        { id: 'bronchial_asthma', label: 'Bronchial Asthma' },
        { id: 'pulmonary_disease', label: 'Pulmonary Disease' },
        { id: 'infectious_disease', label: 'Infectious/ Contagious Disease' }
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
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
            const res = await axios.post('/add_patient.php', formData);
            if (res.data.status === 'success') {
                navigate('/admin/patients'); 
            } else {
                setError(res.data.message || 'Failed to add patient.');
            }
        } catch (err) {
            setError('Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-wide">Register Walk-in Patient</h1>
                </div>
                <button 
                    onClick={() => navigate('/admin/patients')}
                    className="text-gray-500 hover:text-[#b2a58d] transition flex items-center gap-2 text-sm font-medium"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to List
                </button>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-3xl shadow-sm border border-gray-100 w-full">
                
                {/* ACCOUNT INFO */}
                <div className="grid grid-cols-4 gap-6 mb-4">
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">First Name</label>
                        <input type="text" name="first_name" required onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Middle Name</label>
                        <input type="text" name="middle_name" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Last Name</label>
                        <input type="text" name="last_name" required onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Ext. (E.G. III)</label>
                        <input type="text" name="extension_name" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-6 mb-4">
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Nickname</label>
                        <input type="text" name="nickname" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Age</label>
                        <input type="number" name="age" required onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Sex</label>
                        <select name="sex" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition">
                            <option value="Select...">Select...</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Phone Number</label>
                        <input type="text" name="phone" required onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-6 mb-12">
                    <div className="col-span-1">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Email</label>
                        <input type="email" name="email" required onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                    </div>
                    <div className="col-span-1">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block">Temp. Password</label>
                            <span className="text-[10px] text-[#d4af37] italic">Editable</span>
                        </div>
                        <input type="text" name="password" value={formData.password} required onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-[#d4af37]/30 rounded-lg focus:outline-none focus:border-[#d4af37] transition text-gray-600" />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Address</label>
                        <input type="text" name="address" required onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                    </div>
                </div>

                {/* INITIAL DISCLOSURE */}
                <div className="mb-12 border-t border-gray-50 pt-8">
                    <h2 className="text-sm font-bold text-[#d4af37] tracking-widest uppercase mb-8 text-center">Initial Disclosure</h2>
                    
                    {/* Row 1: 3 columns, all top-aligned */}
                    <div className="grid grid-cols-3 gap-8 mt-6">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Previous Aesthetic Procedures</label>
                            <input type="text" name="aesthetic_procedures" placeholder="(if any)" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Previous Surgical Procedures</label>
                            <input type="text" name="surgical_procedures" placeholder="(if any)" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Allergies</label>
                            <input type="text" name="allergies" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                        </div>
                    </div>

                    {/* Row 2: Aesthetic Procedures + Pregnant side by side */}
                        <div className="grid grid-cols-3 gap-8 mt-6">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Recent Tooth Extraction?</label>
                            {/* Matches the input height so all 3 cells are visually equal */}
                            <div className="w-full p-3  rounded-lg flex items-center gap-3">
                                <input type="checkbox" name="tooth_extraction" onChange={handleChange} className="w-4 h-4 accent-[#d4af37]" />
                                <span className="text-sm text-gray-600">Yes</span>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Pregnant / Breastfeeding / Planning?</label>
                            <div className="w-full p-3 rounded-lg flex items-center gap-8">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="radio" name="pregnant" value="Yes" onChange={handleChange} className="w-4 h-4 accent-[#d4af37]" /> Yes
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="radio" name="pregnant" value="No" defaultChecked onChange={handleChange} className="w-4 h-4 accent-[#d4af37]" /> No
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Full width */}
                    <div className="mt-6">
                        <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Have you had any untoward reactions? If yes, please specify:</label>
                        <input type="text" name="untoward_reactions" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                    </div>
                </div>

                {/* MEDICAL HISTORY DISCLOSURE */}
                <div className="mb-12 border-t border-gray-50 pt-8">
                    <h2 className="text-sm font-bold text-[#d4af37] tracking-widest uppercase mb-2 text-center">Medical History Disclosure</h2>
                    <p className="text-xs text-gray-400 italic text-center mb-8">Acute or Chronic Illnesses: Have you had or is/ are suffering from any medical condition/s (Check any that apply)</p>

                    <div className="grid grid-cols-3 gap-y-4 gap-x-8 mb-8 px-8">
                        {illnessOptions.map((illness) => (
                            <div key={illness.id} className="flex items-center gap-3">
                                <input type="checkbox" name={illness.id} onChange={handleChange} className="w-4 h-4 text-[#d4af37] bg-gray-100 border-gray-300 rounded focus:ring-[#d4af37]" />
                                <label className="text-sm text-gray-600">{illness.label}</label>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Others</label>
                            <input type="text" name="others" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Medications / Treatment Regimen</label>
                            <input type="text" name="medications" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-2">Are you currently on Skin/ Aesthetic Treatment such as creams/lotions/ointments/astringents:</label>
                            <input type="text" name="current_skin_treatment" onChange={handleChange} className="w-full p-3 bg-[#faf9f6] border border-gray-100 rounded-lg focus:outline-none focus:border-[#d4af37] transition" />
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-8">
                    <button type="submit" disabled={loading} className="w-16 h-16 bg-[#2d2a26] text-[#d4af37] rounded-full flex items-center justify-center hover:bg-black transition disabled:opacity-50 shadow-lg hover:scale-105 transform duration-300">
                        {loading ? '...' : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminAddPatient;