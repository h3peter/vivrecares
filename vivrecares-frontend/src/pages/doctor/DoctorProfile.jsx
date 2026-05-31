import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ActionFeedbackModal from '../../components/ActionFeedbackModal';
import PasswordChangePanel from '../../components/PasswordChangePanel';
import { profilePhotoCandidates, profilePhotoUrl } from '../../utils/api';
import { prepareProfilePhotoUpload } from '../../utils/imageUpload';

const getSlotKey = (slot) => {
    if (slot.slot_id) return `slot-${slot.slot_id}`;
    if (slot.local_id) return `slot-local-${slot.local_id}`;
    return `slot-${slot.branch}-${slot.slot_time}-${slot.slot_label}`;
};

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
    const [feedback, setFeedback] = useState(null);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [availability, setAvailability] = useState([]);
    const [slots, setSlots] = useState([]);
    const [savingSchedule, setSavingSchedule] = useState(false);
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

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const res = await axios.get('/get_appointment_settings.php');
                if (res.data.status === 'success') {
                    const activeBranches = res.data.branches || [];
                    setBranches(activeBranches);
                    setSelectedBranch((current) => current || activeBranches[0] || '');
                    setAvailability(res.data.availability || []);
                    setSlots((res.data.slots || []).map((slot) => ({ ...slot, is_new: false })));
                }
            } catch (error) {
                console.error('Failed to fetch doctor schedule settings', error);
            }
        };

        fetchSchedule();
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
                setFeedback({
                    tone: 'error',
                    title: 'Update Failed',
                    message: res.data.message || 'Unable to update your profile.',
                });
            }
        } catch (err) {
            console.error(err);
            setFeedback({
                tone: 'error',
                title: 'Update Failed',
                message: err.message || 'Something went wrong. Please try again.',
            });
        } finally {
            setUploading(false);
        }
    };

    const initials = `${formData.first_name?.[0] ?? ''}${formData.last_name?.[0] ?? ''}`.toUpperCase();
    const branchAvailability = availability.filter((day) => day.branch === selectedBranch);
    const branchSlots = slots
        .filter((slot) => slot.branch === selectedBranch)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

    const updateBranchDay = (weekday, nextValue) => {
        setAvailability((prev) =>
            prev.map((day) =>
                day.branch === selectedBranch && Number(day.weekday) === Number(weekday)
                    ? { ...day, is_active: nextValue ? 1 : 0 }
                    : day
            )
        );
    };

    const updateBranchSlot = (slotKey, field, value) => {
        setSlots((prev) =>
            prev.map((slot) => (slot.branch === selectedBranch && getSlotKey(slot) === slotKey ? { ...slot, [field]: value } : slot))
        );
    };

    const addBranchSlot = () => {
        const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setSlots((prev) => [
            ...prev,
            {
                local_id: localId,
                branch: selectedBranch,
                slot_time: '',
                slot_label: '',
                sort_order: branchSlots.length + 1,
                is_active: 1,
                is_new: true,
            },
        ]);
    };

    const removeBranchSlot = (slotKey) => {
        setSlots((prev) => prev.filter((slot) => !(slot.branch === selectedBranch && getSlotKey(slot) === slotKey)));
    };

    const handleSaveSchedule = async () => {
        setSavingSchedule(true);
        try {
            const res = await axios.post('/save_appointment_settings.php', {
                branch: selectedBranch,
                availability: branchAvailability.map((day) => ({
                    weekday: Number(day.weekday),
                    weekday_name: day.weekday_name,
                    is_active: Number(day.is_active) === 1,
                })),
                slots: branchSlots
                    .filter((slot) => slot.slot_time && slot.slot_label)
                    .map((slot, index) => ({
                        slot_time: slot.slot_time,
                        slot_label: slot.slot_label,
                        sort_order: index + 1,
                        is_active: Number(slot.is_active) === 1,
                    })),
            });

            if (res.data.status === 'success') {
                setFeedback({ tone: 'success', title: 'Schedule Saved', message: 'Available appointment slots were updated.' });
            } else {
                setFeedback({ tone: 'error', title: 'Schedule Not Saved', message: res.data.message || 'Unable to save schedule.' });
            }
        } catch (error) {
            setFeedback({ tone: 'error', title: 'Schedule Not Saved', message: 'Unable to save schedule right now.' });
        } finally {
            setSavingSchedule(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <ActionFeedbackModal
                open={Boolean(feedback)}
                tone={feedback?.tone}
                title={feedback?.title}
                message={feedback?.message}
                onClose={() => setFeedback(null)}
            />
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

                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" className="hidden" onChange={handlePhotoPick} />

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

            <div className="max-w-6xl mx-auto mt-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:p-8">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Available Time Slots</h2>
                        <p className="mt-2 text-sm text-gray-500">Set valid clinic weekdays and appointment slots by branch.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveSchedule}
                        disabled={savingSchedule || !selectedBranch}
                        className="rounded-xl bg-[#555555] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#c4ba9d] disabled:opacity-50"
                    >
                        {savingSchedule ? 'Saving...' : 'Save Schedule'}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Branch</label>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]"
                        >
                            {branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
                        </select>

                        <div className="mt-6 space-y-3">
                            {branchAvailability.map((day) => (
                                <label key={`${day.branch}-${day.weekday}`} className="flex items-center justify-between rounded-xl border border-gray-100 bg-[#faf9f6] px-4 py-3">
                                    <span className="text-sm font-semibold text-gray-700">{day.weekday_name}</span>
                                    <input type="checkbox" checked={Number(day.is_active) === 1} onChange={(e) => updateBranchDay(day.weekday, e.target.checked)} className="h-4 w-4 accent-[#c4ba9d]" />
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Time Slots</h3>
                            <button type="button" onClick={addBranchSlot} disabled={!selectedBranch} className="text-xs font-bold uppercase tracking-[0.18em] text-[#8f6d1f] disabled:opacity-50">+ Add Slot</button>
                        </div>
                        <div className="space-y-3">
                            {branchSlots.map((slot) => {
                                const slotKey = getSlotKey(slot);
                                return (
                                    <div key={`${selectedBranch}-${slotKey}`} className="rounded-xl border border-gray-100 bg-[#faf9f6] p-4">
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                                            <InputGroup label="Time" type="time" value={slot.slot_time} onChange={(value) => updateBranchSlot(slotKey, 'slot_time', value)} />
                                            <InputGroup label="Label" value={slot.slot_label} onChange={(value) => updateBranchSlot(slotKey, 'slot_label', value)} />
                                            <button type="button" onClick={() => removeBranchSlot(slotKey)} className="rounded-xl border border-red-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-red-500">Remove</button>
                                        </div>
                                        <label className="mt-3 flex items-center gap-3 text-sm text-gray-600">
                                            <input type="checkbox" checked={Number(slot.is_active) === 1} onChange={(e) => updateBranchSlot(slotKey, 'is_active', e.target.checked ? 1 : 0)} className="h-4 w-4 accent-[#c4ba9d]" />
                                            Active slot
                                        </label>
                                    </div>
                                );
                            })}
                            {branchSlots.length === 0 && (
                                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">No slots configured for this branch.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, value, onChange, type = 'text' }) => (
    <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{label}</label>
        <input
            type={type}
            required
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-b border-gray-200 py-2 focus:border-[#b2a58d] outline-none text-gray-700 bg-transparent"
        />
    </div>
);

export default DoctorProfile;
