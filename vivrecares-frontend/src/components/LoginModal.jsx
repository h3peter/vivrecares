import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logoBlack from '../assets/vivre-black.png';
import PasswordInput from './PasswordInput';
import { clearStoredSession, rememberStoredToken, rememberStoredUser } from '../utils/session';

const REMEMBERED_EMAIL_KEY = 'rememberedLoginEmail';

const LoginModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [credentials, setCredentials] = useState(() => ({
    email: localStorage.getItem(REMEMBERED_EMAIL_KEY) || '',
    password: '',
  }));
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY)));
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
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
    setSigningIn(true);
    try {
      const response = await axios.post('/login.php', credentials);
      if (response.data.status === 'success') {
        const authToken = response.data?.token;
        if (rememberMe && credentials.email.trim()) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, credentials.email.trim());
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        if (!authToken) {
          throw new Error('Login succeeded, but no authentication token was returned.');
        }

        rememberStoredToken(authToken);

        const sessionStatusResponse = await axios.get('/session_status.php');
        const confirmedUser = sessionStatusResponse?.data?.status === 'success'
          ? sessionStatusResponse.data.user
          : null;

        if (!confirmedUser) {
          clearStoredSession();
          setCredentials((prev) => ({ ...prev, password: '' }));
          showError('Login succeeded, but your session could not be restored on this browser. Try again or use a browser that allows cookies.');
          return;
        }

        rememberStoredUser(confirmedUser, authToken);

        if (confirmedUser.role === 'Admin') {
          navigate('/admin/patients');
        } else if (confirmedUser.role === 'Doctor') {
          navigate('/doctor/appointments');
        } else {
          navigate('/profile');
        }

        window.location.reload();

      } else {
        setCredentials((prev) => ({ ...prev, password: '' }));
        showError(response.data.message);
      }
    } catch (error) {
      setCredentials((prev) => ({ ...prev, password: '' }));
      showError(error.response?.data?.message || 'Network Error. Check your connection.');
    } finally {
      setSigningIn(false);
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
      const response = await axios.post('/send_forgot_password_code.php', {
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
      const response = await axios.post('/verify_forgot_password_code.php', {
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
      const response = await axios.post('/reset_forgot_password.php', {
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
      <div className="relative w-full max-w-xl overflow-y-auto rounded-sm bg-white p-6 shadow-2xl max-h-[calc(100vh-2rem)] sm:p-8 lg:p-12">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 transition hover:text-black sm:right-6 sm:top-6">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col items-center">
          {/* Logo matches wireframe scale */}
          <img src={logoBlack} alt="Vivre" className="mb-6 h-16 object-contain sm:mb-8 sm:h-20 lg:mb-12 lg:h-28" />

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
                <PasswordInput
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  visible={showLoginPassword}
                  onToggleVisibility={() => setShowLoginPassword((prev) => !prev)}
                  placeholder="Password"
                  required
                  inputClassName="w-full px-4 py-3 pr-14 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                  buttonClassName="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-[#b59635] transition"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 accent-[#d4af37]" />
                  <span className="text-sm text-gray-600">Remember Me</span>
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
                  disabled={signingIn}
                  className="flex w-2/3 items-center justify-center gap-3 rounded-full bg-[#d4af37] py-4 text-2xl text-white shadow-lg transition duration-300 hover:bg-[#c4a030] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {signingIn ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="w-full space-y-4 sm:space-y-5">
              <div className="mb-1 text-center sm:mb-2">
                <h2 className="text-xl font-light uppercase tracking-[0.16em] text-gray-800 sm:text-2xl sm:tracking-[0.18em]">Forgot Password</h2>
                <p className="mt-2 text-sm text-gray-500 sm:mt-3">Verify your email first, then set a new password for your account.</p>
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

              <div className="flex justify-stretch sm:justify-end">
                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={sendingCode}
                  className="w-full rounded-full border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-600 transition hover:border-[#d4af37] hover:text-[#a8892d] disabled:opacity-50 sm:w-auto"
                >
                  {sendingCode ? 'Sending...' : 'Send Code'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Verification Code</label>
                <div className="flex flex-col gap-3 sm:flex-row">
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
                    className="w-full rounded-md bg-[#555555] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] disabled:opacity-50 sm:w-auto"
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

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">New Password</label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    visible={showNewPassword}
                    onToggleVisibility={() => setShowNewPassword((prev) => !prev)}
                    placeholder="New password"
                    required
                    inputClassName="w-full px-4 py-3 pr-14 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                    buttonClassName="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-[#b59635] transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    visible={showConfirmPassword}
                    onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
                    placeholder="Confirm password"
                    required
                    inputClassName="w-full px-4 py-3 pr-14 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                    buttonClassName="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-[#b59635] transition"
                  />
                </div>
              </div>

              {message && (
                <p className={`text-xs text-center ${messageType === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {message}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    resetFeedback();
                    setDevelopmentCode('');
                    setMode('login');
                  }}
                  className="text-left text-sm text-gray-500 transition hover:text-gray-700"
                >
                  Back to login
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="w-full rounded-full bg-[#d4af37] px-8 py-3 text-white shadow-lg transition duration-300 hover:bg-[#c4a030] disabled:opacity-50 sm:w-auto"
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
