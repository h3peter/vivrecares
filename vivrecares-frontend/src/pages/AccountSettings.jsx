import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BASE_URL = 'http://localhost/vivrecares';

const AccountSettings = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        user_id: ''
    });

    // Profile photo: holds the URL to display
    const [photoUrl, setPhotoUrl] = useState(null);
    // Holds the raw File object if user picked a new one
    const [pendingPhoto, setPendingPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchCurrentData = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;

            try {
                const res = await axios.get(`${BASE_URL}/vivrecares-api/get_profile.php?user_id=${user.id}`);
                const data = res.data.data ?? res.data; // handle both envelope shapes

                setFormData({
                    first_name: data.first_name  ?? '',
                    last_name:  data.last_name   ?? '',
                    email:      data.email        ?? '',
                    phone:      data.phone        ?? '',
                    user_id:    user.id
                });

                // Build photo URL — fall back to a generated avatar if no custom photo
                const photo = data.profile_photo;
                if (photo && photo !== 'default-avatar.png') {
                    setPhotoUrl(`${BASE_URL}/assets/uploads/${photo}`);
                } else {
                    setPhotoUrl(null); // will render initials avatar
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            }
        };
        fetchCurrentData();
    }, []);

    // When user picks a file, show a local preview immediately
    const handlePhotoPick = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPendingPhoto(file);
        setPhotoUrl(URL.createObjectURL(file)); // instant preview
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            // 1. Upload photo first (if a new one was selected)
            if (pendingPhoto) {
                const fd = new FormData();
                fd.append('photo', pendingPhoto);
                fd.append('user_id', formData.user_id);

                const photoRes = await axios.post(
                    `${BASE_URL}/vivrecares-api/upload_profile_photo.php`,
                    fd,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );

                if (photoRes.data.status === 'success') {
                    const newFilename = photoRes.data.filename;
                    setPhotoUrl(`${BASE_URL}/assets/uploads/${newFilename}`);
                    setPendingPhoto(null);

                    // Keep localStorage in sync so ProfileAvatar across the app updates
                    const stored = JSON.parse(localStorage.getItem('user')) ?? {};
                    localStorage.setItem('user', JSON.stringify({ ...stored, profile_photo: newFilename }));
                }
            }

            // 2. Save text fields
            const res = await axios.post(
                `${BASE_URL}/vivrecares-api/update_profile.php`,
                formData
            );

            if (res.data.status === 'success') {
                // Keep name in localStorage too
                const stored = JSON.parse(localStorage.getItem('user')) ?? {};
                localStorage.setItem('user', JSON.stringify({
                    ...stored,
                    first_name: formData.first_name,
                    last_name:  formData.last_name,
                    email:      formData.email
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
        <div className="flex-1 p-12 bg-[#f4f4f4] min-h-screen">
            <h2 className="text-3xl font-light text-[#b2a58d] mb-12">Account Settings</h2>

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

                {/* ── Left Card: Avatar Preview ── */}
                <div className="w-full md:w-1/3 bg-white p-12 rounded-lg shadow-sm flex flex-col items-center text-center">

                    {/* Clickable avatar */}
                    <div
                        className="relative w-32 h-32 rounded-full mb-6 cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                        title="Change profile photo"
                    >
                        {/* Photo or initials */}
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

                        {/* Hover overlay */}
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-white text-[10px] uppercase tracking-widest font-bold">Change</span>
                        </div>

                        {/* Pending badge */}
                        {pendingPhoto && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#d4af37] rounded-full flex items-center justify-center shadow-md">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoPick}
                    />

                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-6">
                        {pendingPhoto ? `New photo selected — save to apply` : 'Click photo to change'}
                    </p>

                    <h3 className="text-xl font-bold text-gray-800">{formData.first_name} {formData.last_name}</h3>
                    <p className="text-sm text-gray-500 mt-2">{formData.email}</p>
                    <p className="text-sm text-gray-500">{formData.phone}</p>
                </div>

                {/* ── Right Card: Edit Form ── */}
                <div className="flex-1 bg-white p-12 rounded-lg shadow-sm">
                    <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-8">

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
                        <div className="col-span-2">
                            <InputGroup
                                label="Email"
                                value={formData.email}
                                onChange={(v) => setFormData({ ...formData, email: v })}
                            />
                        </div>
                        <div className="col-span-2">
                            <InputGroup
                                label="Contact Number"
                                value={formData.phone}
                                onChange={(v) => setFormData({ ...formData, phone: v })}
                            />
                        </div>

                        <div className="col-span-2 flex justify-end items-center gap-4 mt-8">
                            {/* Success feedback */}
                            {saveSuccess && (
                                <span className="text-xs text-green-600 font-bold uppercase tracking-widest animate-pulse">
                                    ✓ Saved
                                </span>
                            )}

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-16 h-16 bg-[#c4ba9d] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b2a58d] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, value, onChange }) => (
    <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{label}</label>
        <input
            type="text"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-b border-gray-200 py-2 focus:border-[#b2a58d] outline-none text-gray-700"
        />
    </div>
);

export default AccountSettings;