import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PasswordChangePanel from '../components/PasswordChangePanel';
import { uploadAssetUrl } from '../utils/api';

const AccountSettings = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        user_id: ''
    });
    const [photoUrl, setPhotoUrl] = useState(null);
    const [pendingPhoto, setPendingPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const fileInputRef = useRef(null);

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

                const photo = data.profile_photo;
                if (photo && photo !== 'default-avatar.png') {
                    setPhotoUrl(uploadAssetUrl(`assets/uploads/${photo}`));
                } else {
                    setPhotoUrl(null);
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            }
        };
        fetchCurrentData();
    }, []);

    const handlePhotoPick = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPendingPhoto(file);
        setPhotoUrl(URL.createObjectURL(file));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
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

                setPhotoUrl(uploadAssetUrl(`assets/uploads/${newFilename}`));
                setPendingPhoto(null);

                const stored = JSON.parse(localStorage.getItem('user')) ?? {};
                localStorage.setItem('user', JSON.stringify({ ...stored, profile_photo: newFilename }));
            }

            const res = await axios.post('/update_profile.php', formData);

            if (res.data.status === 'success') {
                const stored = JSON.parse(localStorage.getItem('user')) ?? {};
                localStorage.setItem('user', JSON.stringify({
                    ...stored,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email
                }));

                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2500);
            }
        } catch (err) {
            console.error('Update failed:', err);
            alert('Something went wrong. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const initials = `${formData.first_name?.[0] ?? ''}${formData.last_name?.[0] ?? ''}`.toUpperCase();

    return (
        <div className="flex-1 p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
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
                            accept="image/jpeg,image/png,image/webp"
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

const InputGroup = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.18em] text-gray-400 font-bold">{label}</label>
        <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:border-[#b2a58d] outline-none text-base text-gray-700 bg-[#faf9f6]"
        />
    </div>
);

export default AccountSettings;
