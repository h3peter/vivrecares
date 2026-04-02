import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import PasswordInput from '../../components/PasswordInput';

const defaultServiceForm = {
    service_id: null,
    service_name: '',
    category_name: '',
    description: '',
    base_price: '',
    sort_order: 0,
    is_active: true,
};

const defaultStaffForm = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'Doctor',
};

const branches = ['Pasay Branch', 'Valenzuela Branch'];

const getSlotKey = (slot) => {
    if (slot.slot_id) return `slot-${slot.slot_id}`;
    if (slot.local_id) return `slot-local-${slot.local_id}`;
    return `slot-${slot.branch}-${slot.slot_time}-${slot.slot_label}`;
};

const AdminSettings = () => {
    const [services, setServices] = useState([]);
    const [staffUsers, setStaffUsers] = useState([]);
    const [serviceForm, setServiceForm] = useState(defaultServiceForm);
    const [staffForm, setStaffForm] = useState(defaultStaffForm);
    const [selectedBranch, setSelectedBranch] = useState(branches[0]);
    const [availability, setAvailability] = useState([]);
    const [slots, setSlots] = useState([]);
    const [savingSchedule, setSavingSchedule] = useState(false);
    const [savingService, setSavingService] = useState(false);
    const [savingStaff, setSavingStaff] = useState(false);
    const [serviceView, setServiceView] = useState('active');
    const [highlightedServiceId, setHighlightedServiceId] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (type, message) => {
        setToast({ type, message });
    };

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(timer);
    }, [toast]);

    const fetchAll = async () => {
        try {
            const [serviceRes, appointmentRes, staffRes] = await Promise.all([
                axios.get('/get_services.php'),
                axios.get('/get_appointment_settings.php'),
                axios.get('/get_staff_users.php'),
            ]);

            setServices(Array.isArray(serviceRes.data) ? serviceRes.data : []);

            if (appointmentRes.data.status === 'success') {
                setAvailability(appointmentRes.data.availability || []);
                setSlots((appointmentRes.data.slots || []).map((slot) => ({ ...slot, is_new: false })));
            }

            if (staffRes.data.status === 'success') {
                setStaffUsers(staffRes.data.data || []);
            }
        } catch (error) {
            console.error('Failed to load settings', error);
            showToast('error', 'Failed to load full settings data.');
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const visibleServices = useMemo(() => {
        if (serviceView === 'active') return services.filter((service) => Number(service.is_active) === 1);
        if (serviceView === 'inactive') return services.filter((service) => Number(service.is_active) === 0);
        return services;
    }, [services, serviceView]);

    const groupedServices = useMemo(() => {
        return visibleServices.reduce((acc, service) => {
            const key = service.category_name || 'Uncategorized';
            acc[key] = acc[key] || [];
            acc[key].push(service);
            return acc;
        }, {});
    }, [visibleServices]);

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

    const handleSaveService = async (e) => {
        e.preventDefault();
        setSavingService(true);
        try {
            const payload = {
                ...serviceForm,
                base_price: Number(serviceForm.base_price || 0),
                sort_order: Number(serviceForm.sort_order || 0),
                is_active: serviceForm.is_active ? 1 : 0,
            };
            const res = await axios.post('/save_service.php', payload);
            if (res.data.status === 'success') {
                setServiceForm(defaultServiceForm);
                setHighlightedServiceId(Number(res.data.service_id));
                await fetchAll();
                showToast('success', res.data.message || 'Service saved.');
                setTimeout(() => setHighlightedServiceId(null), 2600);
            } else {
                showToast('error', res.data.message || 'Unable to save service.');
            }
        } catch (error) {
            showToast('error', 'Unable to save service.');
        } finally {
            setSavingService(false);
        }
    };

    const toggleServiceStatus = async (service, nextActive) => {
        if (Number(service.is_active) === 1 && nextActive === 0) {
            const confirmed = window.confirm(`Move "${service.service_name}" to inactive services? Existing records will be kept.`);
            if (!confirmed) return;
        }

        try {
            const payload = {
                ...service,
                is_active: nextActive,
            };
            const res = await axios.post('/save_service.php', payload);
            if (res.data.status === 'success') {
                setHighlightedServiceId(Number(service.service_id));
                await fetchAll();
                showToast('success', nextActive ? 'Service restored to active list.' : 'Service moved to inactive services.');
                setTimeout(() => setHighlightedServiceId(null), 2600);
            } else {
                showToast('error', res.data.message || 'Unable to update service status.');
            }
        } catch (error) {
            showToast('error', 'Unable to update service status.');
        }
    };

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
        showToast('success', 'New slot draft added. Click Save Schedule to apply.');
    };

    const removeBranchSlot = (slotKey) => {
        setSlots((prev) => prev.filter((slot) => !(slot.branch === selectedBranch && getSlotKey(slot) === slotKey)));
    };

    const handleSaveSchedule = async () => {
        setSavingSchedule(true);
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
                await fetchAll();
                showToast('success', 'Appointment schedule saved.');
            } else {
                showToast('error', res.data.message || 'Unable to save schedule.');
            }
        } catch (error) {
            showToast('error', 'Unable to save schedule.');
        } finally {
            setSavingSchedule(false);
        }
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setSavingStaff(true);
        try {
            const res = await axios.post('/save_staff_user.php', staffForm);
            if (res.data.status === 'success') {
                setStaffForm(defaultStaffForm);
                await fetchAll();
                showToast('success', res.data.message || 'Staff user created.');
            } else {
                showToast('error', res.data.message || 'Unable to create staff user.');
            }
        } catch (error) {
            showToast('error', 'Unable to create staff user.');
        } finally {
            setSavingStaff(false);
        }
    };

    const handleToggleStaffStatus = async (staff) => {
        const isActive = !staff.deleted_at;
        const nextActive = isActive ? 0 : 1;
        const confirmed = window.confirm(
            nextActive ? `Reactivate ${staff.first_name} ${staff.last_name}?` : `Archive ${staff.first_name} ${staff.last_name}?`
        );
        if (!confirmed) return;

        try {
            const res = await axios.post('/toggle_staff_status.php', {
                user_id: staff.user_id,
                is_active: nextActive,
            });
            if (res.data.status === 'success') {
                await fetchAll();
                showToast('success', res.data.message || 'Staff account updated.');
            } else {
                showToast('error', res.data.message || 'Unable to update staff status.');
            }
        } catch (error) {
            showToast('error', 'Unable to update staff status.');
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f4f4] p-4 sm:p-6 lg:p-12">
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-50 rounded-2xl px-5 py-4 shadow-xl border text-sm font-semibold transition-opacity ${
                        toast.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-600'
                    }`}
                >
                    {toast.message}
                </div>
            )}

            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Clinic Control</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Settings</h1>
                <p className="text-sm text-gray-500 mt-2">Manage users, services, and appointment availability in one place.</p>
            </div>

            <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.2fr_0.8fr]">
                <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="border-b border-gray-100 bg-[#faf9f6] px-5 py-6 sm:px-8">
                        <h2 className="text-2xl font-bold text-gray-800">Service Catalog</h2>
                        <p className="text-sm text-gray-500 mt-2">Archive services to inactive instead of deleting records.</p>
                    </div>

                    <div className="space-y-8 p-5 sm:p-8">
                        <form onSubmit={handleSaveService} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input label="Service Name" value={serviceForm.service_name} onChange={(value) => setServiceForm((prev) => ({ ...prev, service_name: value }))} />
                            <Input label="Category" value={serviceForm.category_name} onChange={(value) => setServiceForm((prev) => ({ ...prev, category_name: value }))} />
                            <Input label="Base Price" type="number" value={serviceForm.base_price} onChange={(value) => setServiceForm((prev) => ({ ...prev, base_price: value }))} />
                            <Input label="Display Order" type="number" value={serviceForm.sort_order} onChange={(value) => setServiceForm((prev) => ({ ...prev, sort_order: value }))} />
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 block mb-2">Description</label>
                                <textarea value={serviceForm.description} onChange={(e) => setServiceForm((prev) => ({ ...prev, description: e.target.value }))} rows="3" className="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]" />
                            </div>
                            <label className="flex items-center gap-3 text-sm text-gray-600">
                                <input type="checkbox" checked={serviceForm.is_active} onChange={(e) => setServiceForm((prev) => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 accent-[#c4ba9d]" />
                                Active service
                            </label>
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button type="button" onClick={() => setServiceForm(defaultServiceForm)} className="w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-gray-600 sm:w-auto">Clear</button>
                                <button type="submit" disabled={savingService} className="w-full rounded-xl bg-[#555555] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#c4ba9d] shadow-lg transition hover:bg-[#404040] sm:w-auto">
                                    {savingService ? 'Saving...' : serviceForm.service_id ? 'Update Service' : 'Add Service'}
                                </button>
                            </div>
                        </form>

                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                                { value: 'all', label: 'All' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setServiceView(opt.value)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-[0.18em] border ${
                                        serviceView === opt.value
                                            ? 'bg-[#555555] text-[#c4ba9d] border-[#555555]'
                                            : 'bg-white text-gray-600 border-gray-200'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-6">
                            {Object.entries(groupedServices).map(([category, categoryServices]) => (
                                <div key={category}>
                                    <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#b2a58d] mb-3">{category}</h3>
                                    <div className="space-y-3">
                                        {categoryServices.map((service) => (
                                            <div
                                                key={service.service_id}
                                                className={`rounded-2xl border px-4 py-4 transition sm:px-5 ${
                                                    highlightedServiceId === Number(service.service_id)
                                                        ? 'border-[#d4af37] bg-[#fffdf5] shadow-md'
                                                        : 'border-gray-100 bg-[#faf9f6]'
                                                }`}
                                            >
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-base font-bold text-gray-800">{service.service_name}</p>
                                                    <p className="text-sm text-gray-500">PHP {Number(service.base_price || 0).toLocaleString()} - Order {service.sort_order}</p>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.18em] ${Number(service.is_active) === 1 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {Number(service.is_active) === 1 ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <button onClick={() => setServiceForm({ ...service, base_price: service.base_price || '', is_active: Number(service.is_active) === 1 })} className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-600">Edit</button>
                                                    {Number(service.is_active) === 1 ? (
                                                        <button onClick={() => toggleServiceStatus(service, 0)} className="rounded-xl bg-[#555555] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#c4ba9d]">
                                                            Archive
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => toggleServiceStatus(service, 1)} className="rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                                                            Restore
                                                        </button>
                                                    )}
                                                </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {Object.keys(groupedServices).length === 0 && (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8 text-sm text-gray-500 text-center">
                                    No services in this view yet.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-[#faf9f6]">
                        <h2 className="text-2xl font-bold text-gray-800">Appointment Availability</h2>
                        <p className="text-sm text-gray-500 mt-2">Set valid weekdays and time slots per branch.</p>
                    </div>

                    <div className="p-8 space-y-8">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 block mb-2">Branch</label>
                            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]">
                                {branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}
                            </select>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#b2a58d] mb-3">Valid Weekdays</h3>
                            <div className="space-y-3">
                                {branchAvailability.map((day) => (
                                    <label key={`${day.branch}-${day.weekday}`} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#faf9f6] px-4 py-3">
                                        <span className="text-base font-medium text-gray-700">{day.weekday_name}</span>
                                        <input type="checkbox" checked={Number(day.is_active) === 1} onChange={(e) => updateBranchDay(day.weekday, e.target.checked)} className="w-4 h-4 accent-[#c4ba9d]" />
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#b2a58d]">Valid Time Slots</h3>
                                <button onClick={addBranchSlot} className="text-xs font-bold uppercase tracking-[0.18em] text-[#a8892d]">+ Add Slot</button>
                            </div>
                            <div className="space-y-3">
                                {branchSlots.map((slot) => {
                                    const slotKey = getSlotKey(slot);
                                    return (
                                        <div
                                            key={`${selectedBranch}-${slotKey}`}
                                            className={`rounded-2xl border p-4 space-y-3 transition ${
                                                slot.is_new ? 'border-[#d4af37] bg-[#fffdf5] shadow-md' : 'border-gray-100 bg-[#faf9f6]'
                                            }`}
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                                                <Input label="Time" type="time" value={slot.slot_time} onChange={(value) => updateBranchSlot(slotKey, 'slot_time', value)} />
                                                <Input label="Label" value={slot.slot_label} onChange={(value) => updateBranchSlot(slotKey, 'slot_label', value)} />
                                                <button onClick={() => removeBranchSlot(slotKey)} className="px-4 py-3 rounded-xl border border-red-200 text-xs font-bold uppercase tracking-[0.18em] text-red-500">Remove</button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <label className="flex items-center gap-3 text-sm text-gray-600">
                                                    <input type="checkbox" checked={Number(slot.is_active) === 1} onChange={(e) => updateBranchSlot(slotKey, 'is_active', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-[#c4ba9d]" />
                                                    Active slot
                                                </label>
                                                {slot.is_new && (
                                                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b08f30]">
                                                        New draft
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button onClick={handleSaveSchedule} disabled={savingSchedule} className="px-6 py-3 rounded-xl bg-[#555555] text-[#c4ba9d] text-sm font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition">
                                {savingSchedule ? 'Saving...' : 'Save Schedule'}
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <section className="mt-8 bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 bg-[#faf9f6]">
                    <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                    <p className="text-sm text-gray-500 mt-2">Create and manage Admin/Doctor accounts from the settings module.</p>
                </div>

                <div className="p-8 grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-8">
                    <form onSubmit={handleCreateStaff} autoComplete="off" className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input label="First Name" name="staff_first_name" autoComplete="off" value={staffForm.first_name} onChange={(value) => setStaffForm((prev) => ({ ...prev, first_name: value }))} />
                            <Input label="Last Name" name="staff_last_name" autoComplete="off" value={staffForm.last_name} onChange={(value) => setStaffForm((prev) => ({ ...prev, last_name: value }))} />
                        </div>
                        <Input label="Email" name="staff_email" type="email" autoComplete="off" value={staffForm.email} onChange={(value) => setStaffForm((prev) => ({ ...prev, email: value }))} />
                        <Input label="Temporary Password" name="staff_temp_password" type="password" autoComplete="new-password" value={staffForm.password} onChange={(value) => setStaffForm((prev) => ({ ...prev, password: value }))} />
                        <div>
                            <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 block mb-2">Role</label>
                            <select name="staff_role" autoComplete="off" value={staffForm.role} onChange={(e) => setStaffForm((prev) => ({ ...prev, role: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]">
                                <option value="Doctor">Doctor</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={savingStaff} className="px-6 py-3 rounded-xl bg-[#555555] text-[#c4ba9d] text-sm font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition">
                                {savingStaff ? 'Creating...' : 'Add User'}
                            </button>
                        </div>
                    </form>

                    <div className="rounded-2xl border border-gray-100 bg-[#faf9f6] overflow-hidden">
                        <div className="grid grid-cols-[1.1fr_1fr_0.8fr_0.7fr] gap-3 px-5 py-3 border-b border-gray-200 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                            <span>Name</span>
                            <span>Email</span>
                            <span>Role</span>
                            <span>Status</span>
                        </div>
                        <div className="max-h-[360px] overflow-auto">
                            {staffUsers.map((staff) => {
                                const isActive = !staff.deleted_at;
                                return (
                                    <div key={staff.user_id} className="grid grid-cols-[1.1fr_1fr_0.8fr_0.7fr] gap-3 items-center px-5 py-3 border-b border-gray-100 text-sm">
                                        <div className="font-semibold text-gray-800">{staff.first_name} {staff.last_name}</div>
                                        <div className="text-gray-500 truncate">{staff.email}</div>
                                        <div>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-[0.16em] ${staff.role === 'Admin' ? 'bg-blue-50 text-blue-600' : 'bg-amber-100 text-amber-700'}`}>
                                                {staff.role}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleToggleStaffStatus(staff)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.16em] ${
                                                isActive ? 'bg-red-50 text-red-600' : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                        >
                                            {isActive ? 'Archive' : 'Restore'}
                                        </button>
                                    </div>
                                );
                            })}
                            {staffUsers.length === 0 && (
                                <div className="px-5 py-8 text-center text-sm text-gray-500">No staff users yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const Input = ({ label, value, onChange, type = 'text', name, autoComplete = 'off' }) => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
        <div>
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 block mb-2">{label}</label>
            {type === 'password' ? (
                <PasswordInput
                    name={name}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    visible={passwordVisible}
                    onToggleVisibility={() => setPasswordVisible((prev) => !prev)}
                    inputClassName="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 pr-14 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]"
                    buttonClassName="absolute inset-y-0 right-0 px-4 text-gray-400 hover:text-[#b59635] transition"
                />
            ) : (
                <input
                    name={name}
                    type={type}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    autoComplete={autoComplete}
                    className="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]"
                />
            )}
        </div>
    );
};

export default AdminSettings;
