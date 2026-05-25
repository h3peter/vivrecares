import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PasswordChangePanel from '../components/PasswordChangePanel';
import ActionFeedbackModal from '../components/ActionFeedbackModal';
import { profilePhotoCandidates, profilePhotoUrl } from '../utils/api';
import { prepareProfilePhotoUpload } from '../utils/imageUpload';

const AccountSettings = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        user_id: ''
    });
    const [photoUrl, setPhotoUrl] = useState(null);
    const [photoFilename, setPhotoFilename] = useState('');
    const [hasRetriedPhoto, setHasRetriedPhoto] = useState(false);
    const [pendingPhoto, setPendingPhoto] = useState(null);
    const [originalEmail, setOriginalEmail] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [emailVerification, setEmailVerification] = useState({
        open: false,
        code: '',
        sending: false,
        verifying: false,
        status: '',
        error: '',
        devCode: '',
    });

    const fileInputRef = useRef(null);

    const applyPersistedPhoto = (filename) => {
        setPhotoFilename(filename);
        setHasRetriedPhoto(false);
        setPhotoUrl(filename ? profilePhotoUrl(filename) : null);
    };

    useEffect(() => {
        const fetchCurrentData = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;

            try {
                const res = await axios.get(`/get_profile.php?user_id=${user.id}`);
                const data = res.data.data ?? res.data;

                setFormData({
                    first_name: data.first_name ?? '',
                    last_name: data.last_name ?? '',
                    email: data.email ?? '',
                    phone: data.phone ?? '',
                    user_id: user.id
                });
                setOriginalEmail(data.email ?? '');

                const photo = data.profile_photo;
                if (photo && photo !== 'default-avatar.png') {
                    applyPersistedPhoto(photo);
                } else {
                    setPhotoFilename('');
                    setPhotoUrl(null);
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            }
        };
        fetchCurrentData();
    }, []);

    const handlePhotoPick = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const preparedFile = await prepareProfilePhotoUpload(file);
            setPendingPhoto(preparedFile);
            setPhotoFilename('');
            setHasRetriedPhoto(false);
            setPhotoUrl(URL.createObjectURL(preparedFile));
        } catch (err) {
            console.error('Photo preparation failed:', err);
            setFeedback({
                tone: 'error',
                title: 'Photo Not Accepted',
                message: err.message || 'We could not prepare that photo for upload.',
            });
            e.target.value = '';
        }
    };

    const emailHasChanged = formData.email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();

    const openEmailVerification = () => {
        setEmailVerification({
            open: true,
            code: '',
            sending: false,
            verifying: false,
            status: '',
            error: '',
            devCode: '',
        });
    };

    const closeEmailVerification = () => {
        setEmailVerification((prev) => ({ ...prev, open: false }));
    };

    const sendEmailVerificationCode = async () => {
        setEmailVerification((prev) => ({ ...prev, sending: true, error: '', status: '', devCode: '' }));

        try {
            const res = await axios.post('/send_profile_email_change_code.php', {
                user_id: formData.user_id,
                email: formData.email.trim(),
                first_name: formData.first_name,
            });

            if (res.data.status !== 'success') {
                throw new Error(res.data.message || 'Unable to send verification code.');
            }

            setEmailVerification((prev) => ({
                ...prev,
                status: res.data.message || 'Verification code sent.',
                devCode: res.data.dev_code || '',
            }));
        } catch (err) {
            setEmailVerification((prev) => ({
                ...prev,
                error: err.response?.data?.message || err.message || 'Unable to send verification code.',
            }));
        } finally {
            setEmailVerification((prev) => ({ ...prev, sending: false }));
        }
    };

    const verifyEmailAndSave = async () => {
        if (!emailVerification.code.trim()) {
            setEmailVerification((prev) => ({ ...prev, error: 'Enter the verification code first.' }));
            return;
        }

        setEmailVerification((prev) => ({ ...prev, verifying: true, error: '', status: '' }));

        try {
            const res = await axios.post('/verify_profile_email_change_code.php', {
                user_id: formData.user_id,
                email: formData.email.trim(),
                code: emailVerification.code.trim(),
            });

            if (res.data.status !== 'success' || !res.data.verification_token) {
                throw new Error(res.data.message || 'Unable to verify code.');
            }

            setEmailVerification((prev) => ({ ...prev, open: false, verifying: false }));
            await saveProfile(res.data.verification_token);
        } catch (err) {
            setEmailVerification((prev) => ({
                ...prev,
                verifying: false,
                error: err.response?.data?.message || err.message || 'Unable to verify code.',
            }));
        }
    };

    const saveProfile = async (emailVerificationToken = '') => {
        setUploading(true);

        try {
            if (pendingPhoto) {
                const fd = new FormData();
                fd.append('photo', pendingPhoto);
                fd.append('user_id', formData.user_id);

                const photoRes = await axios.post(
                    '/upload_profile_photo.php',
                    fd,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );

                if (photoRes.data?.status !== 'success') {
                    throw new Error(photoRes.data?.message || 'Profile photo upload failed.');
                }

                const newFilename = photoRes.data?.filename;
                if (!newFilename) {
                    throw new Error('Profile photo upload did not return a filename.');
                }

                applyPersistedPhoto(newFilename);
                setPendingPhoto(null);

                const stored = JSON.parse(localStorage.getItem('user')) ?? {};
                localStorage.setItem('user', JSON.stringify({ ...stored, profile_photo: newFilename }));
            }

            const res = await axios.post('/update_profile.php', {
                ...formData,
                email: formData.email.trim(),
                email_verification_token: emailVerificationToken,
            });

            if (res.data.status === 'success') {
                const stored = JSON.parse(localStorage.getItem('user')) ?? {};
                localStorage.setItem('user', JSON.stringify({
                    ...stored,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email.trim()
                }));

                setOriginalEmail(formData.email.trim());
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2500);
            } else if (res.data.status === 'verification_required') {
                openEmailVerification();
            } else {
                throw new Error(res.data.message || 'Unable to update your profile right now.');
            }
        } catch (err) {
            console.error('Update failed:', err);
            setFeedback({
                tone: 'error',
                title: 'Update Failed',
                message: err.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (emailHasChanged) {
            openEmailVerification();
            return;
        }

        await saveProfile();
    };

    const initials = `${formData.first_name?.[0] ?? ''}${formData.last_name?.[0] ?? ''}`.toUpperCase();

    return (
        <div className="flex-1 p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <ActionFeedbackModal
                open={Boolean(feedback)}
                tone={feedback?.tone}
                title={feedback?.title}
                message={feedback?.message}
                onClose={() => setFeedback(null)}
            />
            {emailVerification.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl">
                        <div className="mb-6">
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#b2a58d]">Email Verification</p>
                            <h2 className="text-2xl font-bold text-gray-800">Confirm your new email</h2>
                            <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                We need to verify access to {formData.email.trim()} before changing the email on your account.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={sendEmailVerificationCode}
                                disabled={emailVerification.sending || emailVerification.verifying}
                                className="w-full rounded-xl bg-[#555555] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] disabled:opacity-50"
                            >
                                {emailVerification.sending ? 'Sending...' : 'Send Verification Code'}
                            </button>

                            <input
                                type="text"
                                inputMode="numeric"
                                value={emailVerification.code}
                                onChange={(e) => setEmailVerification((prev) => ({ ...prev, code: e.target.value, error: '' }))}
                                placeholder="Enter verification code"
                                className="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-base text-gray-700 outline-none focus:border-[#b2a58d]"
                            />

                            {emailVerification.status && <p className="text-sm text-green-700">{emailVerification.status}</p>}
                            {emailVerification.devCode && (
                                <p className="text-sm text-[#8f6d1f]">
                                    Development code: <span className="font-bold tracking-[0.2em]">{emailVerification.devCode}</span>
                                </p>
                            )}
                            {emailVerification.error && <p className="text-sm text-red-600">{emailVerification.error}</p>}
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeEmailVerification}
                                disabled={emailVerification.verifying}
                                className="rounded-xl border border-gray-200 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={verifyEmailAndSave}
                                disabled={emailVerification.verifying || emailVerification.sending || !emailVerification.code.trim()}
                                className="rounded-xl bg-[#c4ba9d] px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lg transition hover:bg-[#b2a58d] disabled:opacity-50"
                            >
                                {emailVerification.verifying ? 'Verifying...' : 'Verify and Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Patient Portal</p>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Account Settings</h1>
                    <p className="text-sm text-gray-500 mt-2">Update your contact details and profile photo here.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-1/3 bg-white p-10 rounded-[2rem] shadow-sm flex flex-col items-center text-center border border-gray-100">
                        <div
                            className="relative w-32 h-32 rounded-full mb-6 cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                            title="Change profile photo"
                        >
                            {photoUrl ? (
                                <img
                                    src={photoUrl}
                                    alt="Profile"
                                    className="w-full h-full rounded-full object-cover border-2 border-gray-100"
                                    onError={() => {
                                        if (!pendingPhoto && photoFilename) {
                                            const nextCandidate = profilePhotoCandidates(photoFilename).find((src) => src && src !== photoUrl);
                                            if (nextCandidate) {
                                                setHasRetriedPhoto(true);
                                                setPhotoUrl(nextCandidate);
                                                return;
                                            }

                                            setPhotoUrl(null);
                                            return;
                                        }

                                        setPhotoUrl(null);
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-[#d4af37]/20 border-2 border-[#d4af37]/40 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-[#b2a58d]">{initials || '?'}</span>
                                </div>
                            )}

                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-white text-[10px] uppercase tracking-widest font-bold">Change</span>
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                            className="hidden"
                            onChange={handlePhotoPick}
                        />

                        <p className="text-xs text-gray-400 uppercase tracking-[0.18em] mb-6">
                            {pendingPhoto ? 'New photo selected. Save to apply.' : 'Click photo to change'}
                        </p>

                        <h3 className="text-2xl font-bold text-gray-800">{formData.first_name} {formData.last_name}</h3>
                        <p className="text-base text-gray-500 mt-2">{formData.email}</p>
                        <p className="text-base text-gray-500">{formData.phone}</p>
                    </div>

                    <div className="flex-1 bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100">
                        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InputGroup
                                label="First Name"
                                value={formData.first_name}
                                onChange={(v) => setFormData({ ...formData, first_name: v })}
                            />
                            <InputGroup
                                label="Last Name"
                                value={formData.last_name}
                                onChange={(v) => setFormData({ ...formData, last_name: v })}
                            />
                            <div className="md:col-span-2">
                                <InputGroup
                                    label="Email"
                                    value={formData.email}
                                    type="email"
                                    onChange={(v) => setFormData({ ...formData, email: v })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <InputGroup
                                    label="Contact Number"
                                    value={formData.phone}
                                    onChange={(v) => setFormData({ ...formData, phone: v })}
                                />
                            </div>

                            <div className="md:col-span-2 flex justify-end items-center gap-4 mt-4">
                                {saveSuccess && (
                                    <span className="text-xs text-green-600 font-bold uppercase tracking-[0.18em] animate-pulse">
                                        Saved
                                    </span>
                                )}

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="px-8 py-4 bg-[#c4ba9d] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b2a58d] transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-[0.18em]"
                                >
                                    {uploading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="mt-8">
                    <PasswordChangePanel roleLabel="Patient" />
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, value, onChange, type = 'text' }) => (
    <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">{label}</label>
        <input
            type={type}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-[#b2a58d] outline-none text-base text-gray-700 bg-[#faf9f6]"
        />
    </div>
);

export default AccountSettings;
