import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoBlack from '../assets/vivre-black.png';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal
    firstName: '', lastName: '', age: '', sex: '', address: '', email: '', phone: '',
    toothExtraction: false, surgicalProcedures: '', aestheticProcedures: '', 
    pregnant: '', untowardReactions: '',
    // Step 2: Medical
    illnesses: [], // Array for checkboxes
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
    // Logic to send to register.php goes here
    console.log("Submitting Data:", formData);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center py-12 px-4 font-sans">
      {/* Top Logo */}
      <img src={logoBlack} alt="Vivre" className="h-20 mb-8 cursor-pointer" onClick={() => navigate('/')} />
      
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-10 md:p-16">
          <h2 className="text-3xl tracking-[0.2em] uppercase font-light text-[#2d2a26] mb-12 text-center">
            Create Account
          </h2>

          <form onSubmit={handleSubmit}>
            {step === 1 && <StepOne formData={formData} handleChange={handleChange} />}
            {step === 2 && <StepTwo formData={formData} handleCheckboxChange={handleCheckboxChange} handleChange={handleChange} />}
            {step === 3 && <StepThree formData={formData} handleChange={handleChange} />}

            {/* Navigation Controls */}
            <div className="mt-16 flex flex-col items-center gap-8">
              {/* The "Next/Submit" Arrow Button from wireframe */}
              <button 
                type="button"
                onClick={step === 3 ? handleSubmit : handleNext}
                className="w-16 h-16 bg-[#2d2a26] rounded-full flex items-center justify-center text-[#d4af37] shadow-xl hover:bg-black transition-all transform hover:scale-110 active:scale-95"
              >
                {step === 3 ? (
                  <span className="text-xs font-bold uppercase tracking-widest">Done</span>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>

              {/* Step Indicators (The Diamonds) */}
              <div className="flex gap-4">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s}
                    className={`w-3 h-3 rotate-45 border border-[#d4af37] transition-all duration-500 ${step === s ? 'bg-[#d4af37]' : 'bg-transparent opacity-30'}`}
                  />
                ))}
              </div>

              {step > 1 && (
                <button type="button" onClick={handleBack} className="text-xs uppercase tracking-widest text-gray-400 hover:text-black transition">
                  Go Back
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS FOR EACH PAGE --- */

const StepOne = ({ formData, handleChange }) => (
  <div className="space-y-10 animate-fadeIn">
    <div className="flex flex-col md:flex-row gap-12 items-start">
      {/* Profile Picture Placeholder */}
      <div className="w-32 flex flex-col items-center gap-4">
        <div className="w-32 h-32 bg-[#f4f1eb] rounded-full flex items-center justify-center border-2 border-dashed border-[#d4af37]">
          <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-gray-400">Profile Picture</span>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
        <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
        <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
        <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Sex</label>
            <select name="sex" value={formData.sex} onChange={handleChange} className="w-full px-4 py-3 bg-[#f9f8f4] border border-gray-100 rounded-lg text-sm focus:outline-none focus:border-[#d4af37]">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
        </div>
        <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} className="lg:col-span-2" />
        <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
        <Input label="Address" name="address" value={formData.address} onChange={handleChange} className="lg:col-span-3" />
      </div>
    </div>

    <div className="border-t border-gray-50 pt-10">
        <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-[#d4af37] mb-8 text-center">Medical History Disclosure</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Checkbox label="Have you had any tooth extraction recently?" name="toothExtraction" checked={formData.toothExtraction} onChange={handleChange} />
            <Input label="Previous Surgical Procedures (if any)" name="surgicalProcedures" value={formData.surgicalProcedures} onChange={handleChange} />
            <Input label="Previous Aesthetic Procedures (if any)" name="aestheticProcedures" value={formData.aestheticProcedures} onChange={handleChange} />
            <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Currently Pregnant/Breastfeeding?</span>
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
        <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-[#d4af37]">Acute or Chronic Illnesses</h3>
        <p className="text-[10px] text-gray-400 mt-2 italic">Please check if you have had or are suffering from any medical condition/s</p>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8">
      {['Heart Disease', 'Hypertension', 'Diabetes mellitus', 'Hyperthyroidism', 'Autoimmune Diseases', 'Cancer', 'Renal Failure', 'Liver Disease', 'Bronchial Asthma', 'Pulmonary Disease', 'Infectious/Contagious Disease'].map((item) => (
        <Checkbox 
          key={item} 
          label={item} 
          checked={formData.illnesses.includes(item)} 
          onChange={() => handleCheckboxChange(item)} 
        />
      ))}
    </div>

    <div className="space-y-6 pt-6">
        <Input label="Others" name="otherIllness" value={formData.otherIllness} onChange={handleChange} />
        <Input label="Medications/Treatment Regimen" name="medications" value={formData.medications} onChange={handleChange} />
        <Input label="Current Skin/Aesthetic Treatments (creams, lotions, etc.)" name="currentTreatments" value={formData.currentTreatments} onChange={handleChange} />
    </div>
  </div>
);

const StepThree = ({ formData, handleChange }) => (
  <div className="flex flex-col items-center space-y-10 animate-fadeIn max-w-md mx-auto">
    <div className="w-24 h-24 bg-[#f4f1eb] rounded-full flex items-center justify-center text-[#d4af37] border-2 border-gray-100">
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
    </div>
    
    <div className="w-full space-y-6">
        <Input label="Email" name="email" value={formData.email} onChange={handleChange} />
        <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} />
        <Input label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
    </div>

    <p className="text-[10px] text-center text-gray-400 tracking-widest leading-relaxed">
        *By proceeding, you consent to treatment and accept the clinic's policies.
    </p>
  </div>
);

/* --- SMALL REUSABLE UI COMPONENTS --- */

const Input = ({ label, className = "", ...props }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">{label}</label>
    <input {...props} className="w-full px-4 py-3 bg-[#f9f8f4] border border-gray-100 rounded-lg text-sm focus:outline-none focus:border-[#d4af37] transition-all" />
  </div>
);

const Checkbox = ({ label, ...props }) => (
  <label className="flex items-center gap-3 cursor-pointer group">
    <input type="checkbox" {...props} className="w-4 h-4 accent-[#d4af37] border-gray-200 rounded" />
    <span className="text-xs text-gray-600 group-hover:text-black transition">{label}</span>
  </label>
);

const Radio = ({ label, ...props }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <input type="radio" {...props} className="w-4 h-4 accent-[#d4af37]" />
    <span className="text-xs text-gray-600">{label}</span>
  </label>
);

export default Register;