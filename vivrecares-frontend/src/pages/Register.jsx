import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoBlack from '../assets/vivre-black.png';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal
    firstName: '', lastName: '', middleName: '', extensionName: '', nickname: '',
    age: '', sex: '', address: '', email: '', phone: '',
    toothExtraction: false, surgicalProcedures: '', aestheticProcedures: '', 
    pregnant: '', untowardReactions: '',
    // Step 2: Medical
    illnesses: [],
    otherIllness: '', medications: '', currentTreatments: '',
    // Step 3: Account
    password: '', confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCheckboxChange = (illness) => {
    setFormData(prev => {
      const illnesses = prev.illnesses.includes(illness)
        ? prev.illnesses.filter(i => i !== illness)
        : [...prev.illnesses, illness];
      return { ...prev, illnesses };
    });
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post('http://localhost/vivrecares/vivrecares-api/register.php', formData);
      if (response.data.status === 'success') {
        alert("Account created! Please login.");
        navigate('/'); 
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      alert("Registration failed. Check your connection.");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center py-12 px-4 font-sans">
      <img src={logoBlack} alt="Vivre" className="h-20 mb-8 cursor-pointer" onClick={() => navigate('/')} />
      
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-sm border border-gray-100">
        <div className="p-10 md:p-16">
          <h2 className="text-3xl tracking-[0.2em] uppercase font-light text-[#2d2a26] mb-12 text-center">Create Account</h2>

          <form onSubmit={handleSubmit}>
            {step === 1 && <StepOne formData={formData} handleChange={handleChange} />}
            {step === 2 && <StepTwo formData={formData} handleCheckboxChange={handleCheckboxChange} handleChange={handleChange} />}
            {step === 3 && <StepThree formData={formData} handleChange={handleChange} />}

            <div className="mt-16 flex flex-col items-center gap-8">
              <button 
                type="button"
                onClick={step === 3 ? handleSubmit : handleNext}
                className="w-16 h-16 bg-[#2d2a26] rounded-full flex items-center justify-center text-[#d4af37] shadow-xl hover:bg-black transition-all transform hover:scale-110 active:scale-95"
              >
                {step === 3 ? <span className="text-xs font-bold uppercase tracking-widest">Done</span> : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                )}
              </button>

              <div className="flex gap-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`w-3 h-3 rotate-45 border border-[#d4af37] transition-all duration-500 ${step === s ? 'bg-[#d4af37]' : 'bg-transparent opacity-30'}`} />
                ))}
              </div>

              {step > 1 && <button type="button" onClick={handleBack} className="text-xs uppercase tracking-widest text-gray-400 hover:text-black transition">Go Back</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* --- STEP COMPONENTS --- */

const StepOne = ({ formData, handleChange }) => (
  <div className="space-y-10 animate-fadeIn">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
      <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
      <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
      <Input label="Ext. (e.g. III)" name="extensionName" value={formData.extensionName} onChange={handleChange} />
      <Input label="Nickname" name="nickname" value={formData.nickname} onChange={handleChange} />
      <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
      <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Sex</label>
          <select name="sex" value={formData.sex} onChange={handleChange} className="w-full px-4 py-3 bg-[#f9f8f4] border border-gray-100 rounded-lg text-sm focus:outline-none focus:border-[#d4af37]">
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
          </select>
      </div>
      <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
      <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} className="lg:col-span-2" />
      <Input label="Address" name="address" value={formData.address} onChange={handleChange} className="lg:col-span-2" />
    </div>
    <div className="border-t border-gray-50 pt-10">
        <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-[#d4af37] mb-8 text-center">Initial Disclosure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Checkbox label="Recent tooth extraction?" name="toothExtraction" checked={formData.toothExtraction} onChange={handleChange} />
            <Input label="Surgical Procedures" name="surgicalProcedures" value={formData.surgicalProcedures} onChange={handleChange} />
            <Input label="Aesthetic Procedures" name="aestheticProcedures" value={formData.aestheticProcedures} onChange={handleChange} />
            <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Pregnant/Breastfeeding?</span>
                <div className="flex gap-6">
                    <Radio label="Yes" name="pregnant" value="Yes" checked={formData.pregnant === 'Yes'} onChange={handleChange} />
                    <Radio label="No" name="pregnant" value="No" checked={formData.pregnant === 'No'} onChange={handleChange} />
                </div>
            </div>
        </div>
    </div>
  </div>
);

const StepTwo = ({ formData, handleCheckboxChange, handleChange }) => (
  <div className="space-y-10 animate-fadeIn">
    <div className="text-center mb-8">
        <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-[#d4af37]">Medical History</h3>
        <p className="text-[10px] text-gray-400 mt-2 italic">Check any that apply to you</p>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
      {['Heart Disease', 'Hypertension', 'Diabetes', 'Hyperthyroidism', 'Cancer', 'Asthma'].map((item) => (
        <Checkbox key={item} label={item} checked={formData.illnesses.includes(item)} onChange={() => handleCheckboxChange(item)} />
      ))}
    </div>
    <div className="space-y-6 pt-6">
        <Input label="Others" name="otherIllness" value={formData.otherIllness} onChange={handleChange} />
        <Input label="Medications" name="medications" value={formData.medications} onChange={handleChange} />
        <Input label="Current Treatments" name="currentTreatments" value={formData.currentTreatments} onChange={handleChange} />
    </div>
  </div>
);

const StepThree = ({ formData, handleChange }) => (
  <div className="flex flex-col items-center space-y-10 animate-fadeIn max-w-md mx-auto">
    <div className="w-full space-y-6">
        <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} />
        <Input label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
    </div>
    <p className="text-[10px] text-center text-gray-400 tracking-widest uppercase">By clicking done, you agree to clinic policies.</p>
  </div>
);

/* --- UTILITIES --- */
const Input = ({ label, className = "", ...props }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">{label}</label>
    <input {...props} className="w-full px-4 py-3 bg-[#f9f8f4] border border-gray-100 rounded-lg text-sm focus:outline-none focus:border-[#d4af37] transition-all" />
  </div>
);
const Checkbox = ({ label, ...props }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <input type="checkbox" {...props} className="w-4 h-4 accent-[#d4af37]" />
    <span className="text-xs text-gray-600">{label}</span>
  </label>
);
const Radio = ({ label, ...props }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="radio" {...props} className="w-4 h-4 accent-[#d4af37]" />
    <span className="text-xs text-gray-600">{label}</span>
  </label>
);

export default Register;