import { useEffect, useState } from 'react';
import axios from 'axios';
import PasswordInput from './PasswordInput';

const AdminSecurityPanel = () => {
    const [isSet, setIsSet] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationToken, setVerificationToken] = useState('');
    const [developmentCode, setDevelopmentCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadStatus = async () => {
        try {
            const res = await axios.get('/get_admin_password_status.php');
            if (res.data.status === 'success') {
                setIsSet(Boolean(res.data.is_set));
            }
        } catch (error) {
            setErrorMessage('Unable to load admin password status.');
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    const resetFeedback = () => {
        setStatusMessage('');
        setErrorMessage('');
    };

    const sendCode = async () => {
        setSending(true);
        resetFeedback();
        try {
            const res = await axios.post('/send_admin_password_code.php');
            if (res.data.status === 'success') {
                setStatusMessage(res.data.message || 'Verification code sent.');
                setDevelopmentCode(res.data.dev_code || '');
            } else {
                setErrorMessage(res.data.message || 'Unable to send verification code.');
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to send verification code.');
        } finally {
            setSending(false);
        }
    };

    const verifyCode = async () => {
        if (!verificationCode.trim()) {
            setErrorMessage('Enter the verification code first.');
            return;
        }

        setVerifying(true);
        resetFeedback();
        try {
            const res = await axios.post('/verify_admin_password_code.php', { code: verificationCode });
            if (res.data.status === 'success') {
                setVerificationToken(res.data.verification_token);
                setStatusMessage(res.data.message || 'Email verified.');
            } else {
                setErrorMessage(res.data.message || 'Invalid verification code.');
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to verify code.');
        } finally {
            setVerifying(false);
        }
    };

    const savePassword = async () => {
        if (!verificationToken) {
            setErrorMessage('Verify your email before setting the admin password.');
            return;
        }
        if (newPassword.length < 8) {
            setErrorMessage('Admin password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMessage('Admin passwords do not match.');
            return;
        }

        setSaving(true);
        resetFeedback();
        try {
            const res = await axios.post('/change_admin_password.php', {
                verification_token: verificationToken,
                new_password: newPassword,
            });
            if (res.data.status === 'success') {
                setStatusMessage(res.data.message || 'Admin password updated.');
                setVerificationCode('');
                setVerificationToken('');
                setDevelopmentCode('');
                setNewPassword('');
                setConfirmPassword('');
                await loadStatus();
            } else {
                setErrorMessage(res.data.message || 'Unable to update admin password.');
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Unable to update admin password.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-8 rounded-[2rem] border border-gray-100 bg-white p-8 shadow-sm lg:p-10">
            <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Admin Security</p>
                    <h3 className="mt-2 text-2xl font-bold text-gray-800">Admin Password</h3>
                    <p className="mt-2 max-w-2xl text-sm text-gray-500">
                        Used only for protected actions such as staff account changes and bulk data imports.
                    </p>
                </div>
                <span className={`w-fit rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${isSet ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {isSet ? 'Set' : 'Not Set'}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto]">
                <input
                    type="text"
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    placeholder="Enter verification code"
                    className="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-sm outline-none focus:border-[#d4af37]"
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={sendCode} disabled={sending} className="rounded-xl border border-gray-200 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-600 transition hover:border-[#d4af37] hover:text-[#a8892d] disabled:opacity-50">
                        {sending ? 'Sending...' : 'Send Code'}
                    </button>
                    <button type="button" onClick={verifyCode} disabled={verifying || !verificationCode} className="rounded-xl bg-[#555555] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] disabled:opacity-50">
                        {verifying ? 'Verifying...' : 'Verify Email'}
                    </button>
                </div>
            </div>

            {verificationToken && <p className="mt-4 text-sm font-semibold text-green-700">Email verified for admin password change.</p>}
            {statusMessage && <p className="mt-4 text-sm text-green-700">{statusMessage}</p>}
            {errorMessage && <p className="mt-4 text-sm text-red-600">{errorMessage}</p>}
            {developmentCode && <p className="mt-3 text-sm text-[#8f6d1f]">Development code: <span className="font-bold tracking-[0.2em]">{developmentCode}</span></p>}

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <PasswordField label="New Admin Password" value={newPassword} onChange={setNewPassword} visible={showNewPassword} onToggleVisibility={() => setShowNewPassword((prev) => !prev)} />
                <PasswordField label="Confirm Admin Password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirmPassword} onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)} />
            </div>

            <div className="mt-8 flex justify-end">
                <button type="button" onClick={savePassword} disabled={saving} className="rounded-full bg-[#c4ba9d] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-[#b2a58d] disabled:opacity-50">
                    {saving ? 'Saving...' : isSet ? 'Change Admin Password' : 'Set Admin Password'}
                </button>
            </div>
        </div>
    );
};

const PasswordField = ({ label, value, onChange, visible, onToggleVisibility }) => (
    <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{label}</label>
        <PasswordInput
            value={value}
            onChange={(event) => onChange(event.target.value)}
            visible={visible}
            onToggleVisibility={onToggleVisibility}
            inputClassName="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 pr-14 text-base text-gray-700 outline-none focus:border-[#b2a58d]"
            buttonClassName="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-[#b59635] transition"
        />
    </div>
);

export default AdminSecurityPanel;
