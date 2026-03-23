import { useState } from 'react';
import axios from 'axios';
import { getStoredUser } from '../utils/session';

const BASE_URL = 'http://localhost/vivrecares';

const PasswordChangePanel = ({ roleLabel = 'Account' }) => {
    const user = getStoredUser();
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationToken, setVerificationToken] = useState('');
    const [developmentCode, setDevelopmentCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [saving, setSaving] = useState(false);

    const resetFeedback = () => {
        setStatusMessage('');
        setErrorMessage('');
    };

    const handleSendCode = async () => {
        if (!user?.id) {
            setErrorMessage('Your session was not found. Please log in again.');
            return;
        }

        setSending(true);
        resetFeedback();

        try {
            const res = await axios.post(`${BASE_URL}/vivrecares-api/send_password_change_code.php`, {
                user_id: user.id,
            });

            if (res.data.status === 'success') {
                setStatusMessage(res.data.message || 'Verification code sent.');
                setDevelopmentCode(res.data.dev_code || '');
            } else {
                setErrorMessage(res.data.mail_error ? `${res.data.message} (${res.data.mail_error})` : (res.data.message || 'Unable to send verification code.'));
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to send verification code right now.');
        } finally {
            setSending(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode.trim()) {
            setErrorMessage('Enter the verification code first.');
            return;
        }

        setVerifying(true);
        resetFeedback();

        try {
            const res = await axios.post(`${BASE_URL}/vivrecares-api/verify_password_change_code.php`, {
                user_id: user.id,
                code: verificationCode,
            });

            if (res.data.status === 'success') {
                setVerificationToken(res.data.verification_token);
                setStatusMessage(res.data.message || 'Email verified.');
            } else {
                setErrorMessage(res.data.message || 'Invalid verification code.');
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to verify the code right now.');
        } finally {
            setVerifying(false);
        }
    };

    const handleChangePassword = async () => {
        if (!verificationToken) {
            setErrorMessage('Verify your email before changing the password.');
            return;
        }

        if (newPassword.length < 8) {
            setErrorMessage('Password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        setSaving(true);
        resetFeedback();

        try {
            const res = await axios.post(`${BASE_URL}/vivrecares-api/change_password.php`, {
                user_id: user.id,
                verification_token: verificationToken,
                new_password: newPassword,
            });

            if (res.data.status === 'success') {
                setStatusMessage(res.data.message || 'Password updated successfully.');
                setVerificationCode('');
                setVerificationToken('');
                setDevelopmentCode('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setErrorMessage(res.data.message || 'Unable to update password.');
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to update password right now.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white p-8 lg:p-10 rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex flex-col gap-2 mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d]">{roleLabel} Security</p>
                <h3 className="text-2xl font-bold text-gray-800">Change Password</h3>
                <p className="text-sm text-gray-500">Verify your email first, then update your password with a fresh credential.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-4">
                <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter verification code"
                    className="w-full px-4 py-3 bg-[#faf9f6] border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#d4af37]"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={sending}
                        className="px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-[0.18em] text-gray-600 hover:border-[#d4af37] hover:text-[#a8892d] transition disabled:opacity-50"
                    >
                        {sending ? 'Sending...' : 'Send Code'}
                    </button>
                    <button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verifying || !verificationCode}
                        className="px-5 py-3 rounded-xl bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition disabled:opacity-50"
                    >
                        {verifying ? 'Verifying...' : 'Verify Email'}
                    </button>
                </div>
            </div>

            {verificationToken && (
                <div className="mt-4 inline-flex items-center rounded-full bg-green-50 border border-green-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-green-700">
                    Email verified for password change
                </div>
            )}

            {statusMessage && <p className="mt-4 text-sm text-green-700">{statusMessage}</p>}
            {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}
            {developmentCode && (
                <p className="mt-3 text-sm text-[#8f6d1f]">
                    Development code: <span className="font-bold tracking-[0.2em]">{developmentCode}</span>
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} />
                <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} />
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="px-8 py-4 bg-[#c4ba9d] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b2a58d] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-[0.18em]"
                >
                    {saving ? 'Saving...' : 'Update Password'}
                </button>
            </div>
        </div>
    );
};

const PasswordField = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">{label}</label>
        <input
            type="password"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-[#b2a58d] outline-none text-base text-gray-700 bg-[#faf9f6]"
        />
    </div>
);

export default PasswordChangePanel;
