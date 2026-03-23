import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logoBlack from '../assets/vivre-black.png';

const LoginModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [developmentCode, setDevelopmentCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');

  const resetFeedback = () => {
    setMessage('');
    setMessageType('error');
  };

  const showError = (text) => {
    setMessage(text);
    setMessageType('error');
  };

  const showSuccess = (text) => {
    setMessage(text);
    setMessageType('success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetFeedback();
    try {
      const response = await axios.post('http://localhost/vivrecares/vivrecares-api/login.php', credentials);
      if (response.data.status === 'success') {
        // Save the user data to browser storage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // --- THIS IS THE PART WE CHANGED ---
        // We now route them to the correct, existing pages
        if (response.data.user.role === 'Admin') {
            navigate('/admin/patients');
        } else if (response.data.user.role === 'Doctor') {
            navigate('/doctor/appointments');
        } else {
            navigate('/profile');
        }
        
        // This forces the page to refresh so the layout updates properly
        window.location.reload(); 
        // -----------------------------------

      } else {
        showError(response.data.message);
      }
    } catch (error) {
      showError("Network Error. Check your connection.");
    }
  };

  const resetForgotPasswordState = () => {
    setResetCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setDevelopmentCode('');
    resetFeedback();
  };

  const handleSendResetCode = async () => {
    if (!resetEmail.trim()) {
      showError('Enter your email address first.');
      return;
    }

    setSendingCode(true);
    resetFeedback();

    try {
      const response = await axios.post('http://localhost/vivrecares/vivrecares-api/send_forgot_password_code.php', {
        email: resetEmail.trim(),
      });

      if (response.data.status === 'success') {
        setDevelopmentCode(response.data.dev_code || '');
        showSuccess(response.data.message || 'Verification code sent.');
      } else {
        showError(response.data.mail_error ? `${response.data.message} (${response.data.mail_error})` : response.data.message);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Unable to send a reset code right now.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyResetCode = async () => {
    if (!resetEmail.trim() || !resetCode.trim()) {
      showError('Enter your email and verification code first.');
      return;
    }

    setVerifyingCode(true);
    resetFeedback();

    try {
      const response = await axios.post('http://localhost/vivrecares/vivrecares-api/verify_forgot_password_code.php', {
        email: resetEmail.trim(),
        code: resetCode.trim(),
      });

      if (response.data.status === 'success') {
        setResetToken(response.data.verification_token || '');
        showSuccess(response.data.message || 'Email verified.');
      } else {
        showError(response.data.message || 'Unable to verify code.');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Unable to verify the reset code right now.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!resetToken) {
      showError('Verify your email before resetting the password.');
      return;
    }

    if (newPassword.length < 8) {
      showError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    setResettingPassword(true);
    resetFeedback();

    try {
      const response = await axios.post('http://localhost/vivrecares/vivrecares-api/reset_forgot_password.php', {
        email: resetEmail.trim(),
        verification_token: resetToken,
        new_password: newPassword,
      });

      if (response.data.status === 'success') {
        showSuccess(response.data.message || 'Password reset successfully.');
        setCredentials((prev) => ({ ...prev, email: resetEmail.trim(), password: '' }));
        setMode('login');
        setResetCode('');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
        setDevelopmentCode('');
      } else {
        showError(response.data.message || 'Unable to reset password.');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Unable to reset password right now.');
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-sm shadow-2xl overflow-hidden relative p-12">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col items-center">
          {/* Logo matches wireframe scale */}
          <img src={logoBlack} alt="Vivre" className="h-28 mb-12 object-contain" />

          {mode === 'login' ? (
            <form onSubmit={handleSubmit} className="w-full space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={credentials.email}
                  className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={credentials.password}
                  className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#d4af37]" />
                  <span className="text-sm text-gray-600">Remember Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(credentials.email);
                    resetForgotPasswordState();
                    setMode('forgot');
                  }}
                  className="text-sm text-[#b59635] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <p className="text-sm text-gray-500">
                New to VIVRE? <span onClick={() => navigate('/register')} className="text-[#d4af37] cursor-pointer hover:underline">Register here.</span>
              </p>

              {message && (
                <p className={`text-xs text-center ${messageType === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {message}
                </p>
              )}

              <div className="flex justify-center pt-4">
                <button 
                  type="submit" 
                  className="w-2/3 py-4 bg-[#d4af37] hover:bg-[#c4a030] text-white text-2xl rounded-full transition duration-300 shadow-lg"
                >
                  Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="w-full space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-light tracking-[0.18em] text-gray-800 uppercase">Forgot Password</h2>
                <p className="text-sm text-gray-500 mt-3">Verify your email first, then set a new password for your account.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={sendingCode}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#d4af37] hover:text-[#a8892d] transition disabled:opacity-50"
                >
                  {sendingCode ? 'Sending...' : 'Send Code'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Verification Code</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter verification code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyResetCode}
                    disabled={verifyingCode}
                    className="px-4 py-3 rounded-md bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition disabled:opacity-50"
                  >
                    {verifyingCode ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>

              {resetToken && (
                <div className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-green-700">
                  Email verified for password reset
                </div>
              )}

              {developmentCode && (
                <p className="text-sm text-[#8f6d1f]">
                  Development code: <span className="font-bold tracking-[0.2em]">{developmentCode}</span>
                </p>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                  />
                </div>
              </div>

              {message && (
                <p className={`text-xs text-center ${messageType === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {message}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetFeedback();
                    setDevelopmentCode('');
                    setMode('login');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  Back to login
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="px-8 py-3 bg-[#d4af37] hover:bg-[#c4a030] text-white rounded-full transition duration-300 shadow-lg disabled:opacity-50"
                >
                  {resettingPassword ? 'Updating...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
