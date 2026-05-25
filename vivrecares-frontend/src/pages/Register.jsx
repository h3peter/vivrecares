import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoBlack from '../assets/vivre-black.png';
import PasswordInput from '../components/PasswordInput';

const FRIENDLY_MAIL_SEND_ERROR = 'We could not send the code right now. Please try again in a moment.';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [developmentCode, setDevelopmentCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formAlert, setFormAlert] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '', middle_name: '', last_name: '', extension_name: '', nickname: '',
    age: '', sex: '', address: '', email: '', phone: '',
    tooth_extraction: false, surgical_procedures: '', allergies: '', aesthetic_procedures: '', 
    pregnant: 'No', untoward_reactions: '',
    heart_disease: false, hypertension: false, diabetes: false, hyperthyroidism: false,
    autoimmune_disease: false, cancer: false, renal_failure: false, liver_disease: false,
    bronchial_asthma: false, pulmonary_disease: false, infectious_disease: false,
    others: '', medications: '', current_skin_treatment: '',
    password: '', confirmPassword: ''
  });

  const resetVerificationState = () => {
    setVerificationCode('');
    setVerificationToken('');
    setDevelopmentCode('');
    setVerificationStatus('');
    setVerificationError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setFieldErrors(prev => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFormAlert('');

    if (name === 'email' || name === 'first_name') {
      resetVerificationState();
    }
  };

  const handleSendVerificationCode = async () => {
    if (!formData.email.trim()) {
      setVerificationError('Enter your email first.');
      return;
    }

    setSendingCode(true);
    setVerificationError('');
    setVerificationStatus('');

    try {
      const response = await axios.post('/send_patient_verification_code.php', {
        email: formData.email,
        first_name: formData.first_name || 'Patient',
      });

      if (response.data.status === 'success') {
        setVerificationStatus(response.data.message || 'Verification code sent.');
        setDevelopmentCode(response.data.dev_code || '');
      } else {
        setVerificationError(response.data.message || FRIENDLY_MAIL_SEND_ERROR);
      }
    } catch (error) {
      setVerificationError(error.response?.data?.message || FRIENDLY_MAIL_SEND_ERROR);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!formData.email.trim() || !verificationCode.trim()) {
      setVerificationError('Enter your email and verification code.');
      return;
    }

    setVerifyingCode(true);
    setVerificationError('');
    setVerificationStatus('');

    try {
      const response = await axios.post('/verify_patient_email_code.php', {
        email: formData.email,
        code: verificationCode,
      });

      if (response.data.status === 'success') {
        setVerificationToken(response.data.verification_token);
        setVerificationStatus(response.data.message || 'Email verified.');
      } else {
        setVerificationError(response.data.message || 'Invalid verification code.');
      }
    } catch (error) {
      setVerificationError(error.response?.data?.message || 'We could not verify the code right now. Please try again.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const validateStepOne = () => {
    const requiredFields = {
      first_name: 'First name is required.',
      last_name: 'Last name is required.',
      age: 'Age is required.',
      sex: 'Sex is required.',
      phone: 'Phone number is required.',
      email: 'Email is required.',
      address: 'Address is required.',
    };
    const nextErrors = {};

    Object.entries(requiredFields).forEach(([field, message]) => {
      if (!String(formData[field] || '').trim()) {
        nextErrors[field] = message;
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormAlert('Please complete the highlighted required fields.');
      return false;
    }

    return true;
  };

  const validateStepThree = () => {
    const nextErrors = {};

    if (!formData.password.trim()) {
      nextErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!formData.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormAlert('Please fix the highlighted account fields.');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStepOne()) {
      return;
    }
    if (step === 1 && !verificationToken) {
      setFormAlert('Please verify your email before continuing.');
      return;
    }
    setFormAlert('');
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!verificationToken) {
      setFormAlert('Please verify your email before creating an account.');
      return;
    }

    if (!validateStepThree()) {
      return;
    }

    try {
      const response = await axios.post('/register.php', {
        ...formData,
        verification_token: verificationToken,
      });

      if (response.data.status === 'success') {
        alert('Account created! Please login.');
        navigate('/');
      } else {
        alert(response.data.message || 'Registration failed.');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'We could not create your account right now. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center py-12 px-4 font-sans">
      <img src={logoBlack} alt="Vivre" className="h-20 mb-8 cursor-pointer" onClick={() => navigate('/')} />
      
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-sm border border-gray-100">
        <div className="p-10 md:p-16">
          <h2 className="text-3xl tracking-[0.2em] uppercase font-light text-[#2d2a26] mb-12 text-center">Create Account</h2>

          <form onSubmit={handleSubmit}>
            {formAlert && (
              <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                {formAlert}
              </div>
            )}
            {step === 1 && (
              <StepOne
                formData={formData}
                handleChange={handleChange}
                fieldErrors={fieldErrors}
                verificationCode={verificationCode}
                setVerificationCode={setVerificationCode}
                verificationToken={verificationToken}
                verificationStatus={verificationStatus}
                verificationError={verificationError}
                developmentCode={developmentCode}
                sendingCode={sendingCode}
                verifyingCode={verifyingCode}
                onSendVerificationCode={handleSendVerificationCode}
                onVerifyCode={handleVerifyCode}
              />
            )}
            {step === 2 && <StepTwo formData={formData} handleChange={handleChange} />}
            {step === 3 && (
              <StepThree
                formData={formData}
                handleChange={handleChange}
                fieldErrors={fieldErrors}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                onTogglePassword={() => setShowPassword((prev) => !prev)}
                onToggleConfirmPassword={() => setShowConfirmPassword((prev) => !prev)}
              />
            )}

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

const StepOne = ({
  formData,
  handleChange,
  fieldErrors,
  verificationCode,
  setVerificationCode,
  verificationToken,
  verificationStatus,
  verificationError,
  developmentCode,
  sendingCode,
  verifyingCode,
  onSendVerificationCode,
  onVerifyCode,
}) => (
  <div className="space-y-10 animate-fadeIn">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required error={fieldErrors.first_name} />
      <Input label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleChange} />
      <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required error={fieldErrors.last_name} />
      <Input label="Ext. (e.g. III)" name="extension_name" value={formData.extension_name} onChange={handleChange} />
      <Input label="Nickname" name="nickname" value={formData.nickname} onChange={handleChange} />
      <Input label="Age" name="age" type="number" value={formData.age} onChange={handleChange} required error={fieldErrors.age} />
      <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Sex <span className="text-red-400">*</span></label>
          <select name="sex" value={formData.sex} onChange={handleChange} aria-invalid={Boolean(fieldErrors.sex)} className={`w-full px-4 py-3 bg-[#f9f8f4] border rounded-lg text-sm focus:outline-none focus:border-[#d4af37] ${fieldErrors.sex ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}>
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
          </select>
          {fieldErrors.sex && <p className="text-xs font-medium text-red-500">{fieldErrors.sex}</p>}
      </div>
      <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required error={fieldErrors.phone} />
      <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} className="lg:col-span-2" required error={fieldErrors.email} />
      <Input label="Address" name="address" value={formData.address} onChange={handleChange} className="lg:col-span-2" required error={fieldErrors.address} />
    </div>

    <div className="rounded-2xl border border-[#e9dcc0] bg-[#fcfaf5] p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-[#b59643]">Email Verification</h3>
          <p className="text-xs text-gray-500 mt-2">Send a one-time code to your email, then verify it before continuing.</p>
        </div>
        {verificationToken && (
          <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-green-700">
            Verified
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mt-6">
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="Enter 6-digit verification code"
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#d4af37]"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onSendVerificationCode}
            disabled={sendingCode || !formData.email}
            className="px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#d4af37] hover:text-[#a8892d] transition disabled:opacity-50"
          >
            {sendingCode ? 'Sending...' : 'Send Code'}
          </button>
          <button
            type="button"
            onClick={onVerifyCode}
            disabled={verifyingCode || !verificationCode}
            className="px-5 py-3 rounded-xl bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition disabled:opacity-50"
          >
            {verifyingCode ? 'Verifying...' : 'Verify Email'}
          </button>
        </div>
      </div>

      {verificationStatus && <p className="mt-4 text-sm text-green-700">{verificationStatus}</p>}
      {verificationError && <p className="mt-4 text-sm text-red-600">{verificationError}</p>}
      {developmentCode && (
        <p className="mt-3 text-sm text-[#8f6d1f]">
          Development code: <span className="font-bold tracking-[0.2em]">{developmentCode}</span>
        </p>
      )}
    </div>
    
    <div className="border-t border-gray-50 pt-10">
        <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-[#d4af37] mb-8 text-center">Initial Disclosure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input label="Surgical Procedures (if any)" name="surgical_procedures" value={formData.surgical_procedures} onChange={handleChange} />
            <Input label="Allergies" name="allergies" value={formData.allergies} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            <Input label="Aesthetic Procedures (if any)" name="aesthetic_procedures" value={formData.aesthetic_procedures} onChange={handleChange} />
            <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Recent Tooth Extraction?</span>
                <div className="flex gap-6">
                    <Checkbox label="Yes" name="tooth_extraction" checked={formData.tooth_extraction} onChange={handleChange} />
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">Pregnant / Breastfeeding / Planning?</span>
                <div className="flex gap-6">
                    <Radio label="Yes" name="pregnant" value="Yes" checked={formData.pregnant === 'Yes'} onChange={handleChange} />
                    <Radio label="No" name="pregnant" value="No" checked={formData.pregnant === 'No'} onChange={handleChange} />
                </div>
            </div>
        </div>

        <div className="mt-6">
            <Input label="Have you had any untoward reactions? If yes, please specify:" name="untoward_reactions" value={formData.untoward_reactions} onChange={handleChange} />
        </div>
    </div>
  </div>
);

const StepTwo = ({ formData, handleChange }) => {
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

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="text-center mb-8">
          <h3 className="text-sm uppercase tracking-[0.2em] font-medium text-[#d4af37]">Medical History Disclosure</h3>
          <p className="text-[10px] text-gray-400 mt-2 italic">Acute or Chronic Illnesses: Have you had or is/ are suffering from any medical condition/s</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 px-4">
        {illnessOptions.map((illness) => (
          <Checkbox 
            key={illness.id} 
            label={illness.label} 
            name={illness.id} 
            checked={formData[illness.id]} 
            onChange={handleChange} 
          />
        ))}
      </div>

      <div className="space-y-6 pt-6">
          <Input label="Others:" name="others" value={formData.others} onChange={handleChange} />
          <Input label="Medications/ Treatment Regimen:" name="medications" value={formData.medications} onChange={handleChange} />
          <Input label="Are you currently on Skin/ Aesthetic Treatment such as creams/lotions/ointments/astringents:" name="current_skin_treatment" value={formData.current_skin_treatment} onChange={handleChange} />
      </div>
    </div>
  );
};

const StepThree = ({
  formData,
  handleChange,
  fieldErrors,
  showPassword,
  showConfirmPassword,
  onTogglePassword,
  onToggleConfirmPassword,
}) => (
  <div className="flex flex-col items-center space-y-10 animate-fadeIn max-w-md mx-auto">
    <div className="w-full space-y-6">
        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors.password}
          visible={showPassword}
          onToggleVisibility={onTogglePassword}
        />
        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={fieldErrors.confirmPassword}
          visible={showConfirmPassword}
          onToggleVisibility={onToggleConfirmPassword}
        />
    </div>
    <p className="text-[10px] text-center text-gray-400 tracking-widest uppercase">Use at least 8 characters. By clicking done, you agree to clinic policies.</p>
  </div>
);

const Input = ({ label, className = "", required = false, error = '', ...props }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">{label}{required && <span className="text-red-400"> *</span>}</label>
    <input {...props} aria-invalid={Boolean(error)} className={`w-full px-4 py-3 bg-[#f9f8f4] border rounded-lg text-sm focus:outline-none focus:border-[#d4af37] transition-all ${error ? 'border-red-300 bg-red-50' : 'border-gray-100'}`} />
    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
  </div>
);

const PasswordField = ({ label, visible, onToggleVisibility, error = '', ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold ml-1">{label} <span className="text-red-400">*</span></label>
    <PasswordInput
      {...props}
      visible={visible}
      onToggleVisibility={onToggleVisibility}
      minLength={8}
      required
      inputClassName={`w-full px-4 py-3 pr-14 bg-[#f9f8f4] border rounded-lg text-sm focus:outline-none focus:border-[#d4af37] transition-all ${error ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}
      buttonClassName="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-[#b59635] transition"
    />
    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
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
