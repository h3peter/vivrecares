import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { downloadCsvReport } from '../../utils/reportExports';

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getSlotKey = (slot) => {
    if (slot.slot_id) return `slot-${slot.slot_id}`;
    if (slot.local_id) return `slot-local-${slot.local_id}`;
    return `slot-${slot.branch}-${slot.slot_time}-${slot.slot_label}`;
};

const DoctorAvailability = () => {
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [availability, setAvailability] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/get_appointment_settings.php');
            if (res.data.status === 'success') {
                const activeBranches = res.data.branches || [];
                setBranches(activeBranches);
                setSelectedBranch((current) => current || activeBranches[0] || '');
                setAvailability(res.data.availability || []);
                setSlots((res.data.slots || []).map((slot) => ({ ...slot, is_new: false })));
            } else {
                setMessage({ type: 'error', text: res.data.message || 'Unable to load availability.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Unable to load availability right now.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const branchAvailability = useMemo(
        () => availability.filter((day) => day.branch === selectedBranch),
        [availability, selectedBranch]
    );

    const branchSlots = useMemo(
        () =>
            slots
                .filter((slot) => slot.branch === selectedBranch)
                .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
        [slots, selectedBranch]
    );

    const updateDay = (weekday, isActive) => {
        setAvailability((prev) =>
            prev.map((day) =>
                day.branch === selectedBranch && Number(day.weekday) === Number(weekday)
                    ? { ...day, is_active: isActive ? 1 : 0 }
                    : day
            )
        );
    };

    const updateSlot = (slotKey, field, value) => {
        setSlots((prev) =>
            prev.map((slot) =>
                slot.branch === selectedBranch && getSlotKey(slot) === slotKey
                    ? { ...slot, [field]: value }
                    : slot
            )
        );
    };

    const addSlot = () => {
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

    const removeSlot = (slotKey) => {
        setSlots((prev) => prev.filter((slot) => !(slot.branch === selectedBranch && getSlotKey(slot) === slotKey)));
    };

    const saveAvailability = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const payload = {
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
            };

            const res = await axios.post('/save_appointment_settings.php', payload);
            if (res.data.status === 'success') {
                await loadSettings();
                setMessage({ type: 'success', text: 'Availability saved.' });
            } else {
                setMessage({ type: 'error', text: res.data.message || 'Unable to save availability.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Unable to save availability right now.' });
        } finally {
            setSaving(false);
        }
    };

    const handleExport = () => {
        downloadCsvReport({
            filename: `doctor_availability_${selectedBranch || 'branch'}.csv`,
            columns: [
                { key: 'type', label: 'Type' },
                { key: 'branch', label: 'Branch' },
                { key: 'day_or_time', label: 'Day / Time' },
                { key: 'label', label: 'Label' },
                { key: 'status', label: 'Status' },
            ],
            rows: [
                ...branchAvailability.map((day) => ({
                    type: 'Weekday',
                    branch: selectedBranch,
                    day_or_time: weekdays[Number(day.weekday)] || day.weekday_name,
                    label: day.weekday_name,
                    status: Number(day.is_active) === 1 ? 'Active' : 'Inactive',
                })),
                ...branchSlots.map((slot) => ({
                    type: 'Time Slot',
                    branch: selectedBranch,
                    day_or_time: slot.slot_time,
                    label: slot.slot_label,
                    status: Number(slot.is_active) === 1 ? 'Active' : 'Inactive',
                })),
            ],
        });
    };

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            <div className="mb-8">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d]">Doctor Workspace</p>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-800 lg:text-4xl">Availability</h1>
                        <p className="mt-2 text-sm text-gray-500">Set the clinic weekdays and time slots available for appointment requests.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={!selectedBranch}
                        className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-gray-700 transition hover:border-gray-500 disabled:opacity-50 lg:w-auto"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm lg:p-8">
                {message && (
                    <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                        message.type === 'success'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-red-200 bg-red-50 text-red-600'
                    }`}>
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <p className="py-12 text-center text-sm text-gray-500">Loading availability...</p>
                ) : (
                    <div className="space-y-8">
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Branch</label>
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-800 outline-none focus:border-[#c4ba9d] lg:w-96"
                            >
                                {branches.map((branch) => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.8fr_1.2fr]">
                            <div>
                                <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#8f8167]">Available Weekdays</h2>
                                <div className="space-y-3 readable-data-table">
                                    {branchAvailability.map((day) => (
                                        <label key={`${day.branch}-${day.weekday}`} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3">
                                            <span className="text-base font-semibold text-gray-800">{day.weekday_name}</span>
                                            <input
                                                type="checkbox"
                                                checked={Number(day.is_active) === 1}
                                                onChange={(e) => updateDay(day.weekday, e.target.checked)}
                                                className="h-4 w-4 accent-[#c4ba9d]"
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#8f8167]">Available Time Slots</h2>
                                    <button type="button" onClick={addSlot} className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-700">
                                        Add Slot
                                    </button>
                                </div>

                                <div className="space-y-3 readable-data-table">
                                    {branchSlots.map((slot) => {
                                        const slotKey = getSlotKey(slot);
                                        return (
                                            <div key={`${selectedBranch}-${slotKey}`} className="rounded-2xl border border-gray-200 bg-white p-4">
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-[0.75fr_1fr_auto] md:items-end">
                                                    <Field label="Time" type="time" value={slot.slot_time} onChange={(value) => updateSlot(slotKey, 'slot_time', value)} />
                                                    <Field label="Label" value={slot.slot_label} onChange={(value) => updateSlot(slotKey, 'slot_label', value)} />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSlot(slotKey)}
                                                        className="rounded-xl border border-red-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-red-600"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                                <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={Number(slot.is_active) === 1}
                                                        onChange={(e) => updateSlot(slotKey, 'is_active', e.target.checked ? 1 : 0)}
                                                        className="h-4 w-4 accent-[#c4ba9d]"
                                                    />
                                                    Active slot
                                                </label>
                                            </div>
                                        );
                                    })}
                                    {branchSlots.length === 0 && (
                                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center text-sm text-gray-500">
                                            No time slots configured for this branch.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={saveAvailability}
                                disabled={saving || !selectedBranch}
                                className="rounded-xl bg-[#555555] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Availability'}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

const Field = ({ label, value, onChange, type = 'text' }) => (
    <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">{label}</label>
        <input
            type={type}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#c4ba9d]"
        />
    </div>
);

export default DoctorAvailability;
