import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PasswordChangePanel from '../../components/PasswordChangePanel';
import { profilePhotoCandidates, profilePhotoUrl } from '../../utils/api';

const DoctorProfile = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        user_id: ''
    });
    const [photoUrl, setPhotoUrl] = useState(null);
    const [photoFilename, setPhotoFilename] = useState('');
    const [hasRetriedPhoto, setHasRetriedPhoto] = useState(false);
    const [pendingPhoto, setPendingPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
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
                const d = res.data.data ?? res.data;

                setFormData({
                    first_name: d.first_name ?? '',
                    last_name: d.last_name ?? '',
                    email: d.email ?? '',
                    user_id: user.id
                });

                const photo = d.profile_photo;
                if (photo && photo !== 'default-avatar.png') {
                    applyPersistedPhoto(photo);
                }
            } catch (error) {
                console.error('Failed to fetch doctor profile', error);
            }
        };
        fetchCurrentData();
    }, []);

    const handlePhotoPick = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPendingPhoto(file);
        setPhotoFilename('');
        setHasRetriedPhoto(false);
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
                const photoRes = await axios.post('/upload_profile_photo.php', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
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
            } else {
                alert("Error: " + res.data.message);
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const initials = `${formData.first_name?.[0] ?? ''}${formData.last_name?.[0] ?? ''}`.toUpperCase();

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <div className="mx-auto mb-8 max-w-6xl">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d]">Doctor Workspace</p>
                <h1 className="text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">My Profile</h1>
                <p className="mt-2 text-sm text-gray-500">Manage your account details, profile photo, and password from one place.</p>
            </div>

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 bg-white p-12 rounded-xl shadow-sm flex flex-col items-center text-center border border-gray-100">
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
                            <div className="w-full h-full rounded-full bg-[#c4ba9d]/40 border-2 border-[#c4ba9d]/60 flex items-center justify-center">
                                <span className="text-3xl font-bold text-[#8c7f6a]">{initials || '?'}</span>
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

                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoPick} />

                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">
                        {pendingPhoto ? 'New photo selected - save to apply' : 'Click photo to change'}
                    </p>

                    <h3 className="text-xl font-bold text-gray-800">{formData.first_name} {formData.last_name}</h3>
                    <p className="text-sm text-[#b2a58d] font-bold tracking-widest uppercase mt-2">Doctor</p>
                    <p className="text-sm text-gray-500 mt-3">{formData.email}</p>
                </div>

                <div className="flex-1 bg-white p-12 rounded-xl shadow-sm border border-gray-100">
                    <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-8">
                        <InputGroup label="First Name" value={formData.first_name} onChange={(v) => setFormData({ ...formData, first_name: v })} />
                        <InputGroup label="Last Name" value={formData.last_name} onChange={(v) => setFormData({ ...formData, last_name: v })} />
                        <div className="col-span-2">
                            <InputGroup label="Email Address" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
                        </div>

                        <div className="col-span-2 flex justify-end items-center gap-4 mt-8">
                            {saveSuccess && <span className="text-xs text-green-600 font-bold uppercase tracking-widest animate-pulse">Saved</span>}
                            <button type="submit" disabled={uploading} className="w-16 h-16 bg-[#c4ba9d] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b2a58d] transition disabled:opacity-50">
                                {uploading ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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

            <div className="max-w-6xl mx-auto mt-8">
                <PasswordChangePanel roleLabel="Doctor" />
            </div>
        </div>
    );
};

const InputGroup = ({ label, value, onChange }) => (
    <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{label}</label>
        <input
            type="text"
            required
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-b border-gray-200 py-2 focus:border-[#b2a58d] outline-none text-gray-700 bg-transparent"
        />
    </div>
);

export default DoctorProfile;
