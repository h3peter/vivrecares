import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const defaultServiceForm = {
    service_id: null,
    service_name: '',
    category_name: '',
    description: '',
    base_price: '',
    sort_order: 0,
    is_active: true,
};

const branches = ['Pasay Branch', 'Valenzuela Branch'];

const AdminSettings = () => {
    const [services, setServices] = useState([]);
    const [serviceForm, setServiceForm] = useState(defaultServiceForm);
    const [selectedBranch, setSelectedBranch] = useState(branches[0]);
    const [availability, setAvailability] = useState([]);
    const [slots, setSlots] = useState([]);
    const [savingSchedule, setSavingSchedule] = useState(false);

    const fetchAll = async () => {
        try {
            const [serviceRes, appointmentRes] = await Promise.all([
                axios.get('http://localhost/vivrecares/vivrecares-api/get_services.php'),
                axios.get('http://localhost/vivrecares/vivrecares-api/get_appointment_settings.php'),
            ]);

            setServices(Array.isArray(serviceRes.data) ? serviceRes.data : []);

            if (appointmentRes.data.status === 'success') {
                setAvailability(appointmentRes.data.availability || []);
                setSlots(appointmentRes.data.slots || []);
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    const groupedServices = useMemo(() => {
        return services.reduce((acc, service) => {
            const key = service.category_name || 'Uncategorized';
            acc[key] = acc[key] || [];
            acc[key].push(service);
            return acc;
        }, {});
    }, [services]);

    const branchAvailability = useMemo(
        () => availability.filter((day) => day.branch === selectedBranch),
        [availability, selectedBranch]
    );

    const branchSlots = useMemo(
        () => slots.filter((slot) => slot.branch === selectedBranch).sort((a, b) => a.sort_order - b.sort_order),
        [slots, selectedBranch]
    );

    const handleSaveService = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...serviceForm,
                base_price: Number(serviceForm.base_price || 0),
                sort_order: Number(serviceForm.sort_order || 0),
                is_active: serviceForm.is_active ? 1 : 0,
            };
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/save_service.php', payload);
            if (res.data.status === 'success') {
                setServiceForm(defaultServiceForm);
                fetchAll();
            } else {
                alert(res.data.message || 'Unable to save service.');
            }
        } catch (error) {
            alert('Unable to save service.');
        }
    };

    const toggleServiceStatus = async (service) => {
        try {
            const payload = {
                ...service,
                is_active: service.is_active ? 0 : 1,
            };
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/save_service.php', payload);
            if (res.data.status === 'success') fetchAll();
        } catch (error) {
            alert('Unable to update service status.');
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

    const updateBranchSlot = (index, field, value) => {
        const scoped = branchSlots;
        const target = scoped[index];
        if (!target) return;

        setSlots((prev) =>
            prev.map((slot) =>
                slot.branch === selectedBranch && slot.slot_time === target.slot_time
                    ? { ...slot, [field]: value }
                    : slot
            )
        );
    };

    const addBranchSlot = () => {
        setSlots((prev) => [
            ...prev,
            {
                branch: selectedBranch,
                slot_time: '',
                slot_label: '',
                sort_order: branchSlots.length + 1,
                is_active: 1,
            },
        ]);
    };

    const removeBranchSlot = (index) => {
        const target = branchSlots[index];
        setSlots((prev) => prev.filter((slot) => !(slot.branch === selectedBranch && slot.slot_time === target.slot_time && slot.slot_label === target.slot_label)));
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

            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/save_appointment_settings.php', payload);
            if (res.data.status === 'success') {
                fetchAll();
            } else {
                alert(res.data.message || 'Unable to save schedule.');
            }
        } catch (error) {
            alert('Unable to save schedule.');
        } finally {
            setSavingSchedule(false);
        }
    };

    return (
        <div className="p-8 lg:p-12 bg-[#f4f4f4] min-h-screen">
            <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b2a58d] mb-2">Clinic Control</p>
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Settings</h1>
                <p className="text-sm text-gray-500 mt-2">Manage the live service catalog and the valid appointment dates and time slots per branch.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
                <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-[#faf9f6]">
                        <h2 className="text-2xl font-bold text-gray-800">Service Catalog</h2>
                        <p className="text-sm text-gray-500 mt-2">Add, update, or deactivate services without losing historical records.</p>
                    </div>

                    <div className="p-8 space-y-8">
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
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setServiceForm(defaultServiceForm)} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold uppercase tracking-[0.18em] text-gray-600">Clear</button>
                                <button type="submit" className="px-6 py-3 rounded-xl bg-[#555555] text-[#c4ba9d] text-sm font-bold uppercase tracking-[0.18em] shadow-lg hover:bg-[#404040] transition">
                                    {serviceForm.service_id ? 'Update Service' : 'Add Service'}
                                </button>
                            </div>
                        </form>

                        <div className="space-y-6">
                            {Object.entries(groupedServices).map(([category, categoryServices]) => (
                                <div key={category}>
                                    <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#b2a58d] mb-3">{category}</h3>
                                    <div className="space-y-3">
                                        {categoryServices.map((service) => (
                                            <div key={service.service_id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-[#faf9f6] px-5 py-4">
                                                <div>
                                                    <p className="text-base font-bold text-gray-800">{service.service_name}</p>
                                                    <p className="text-sm text-gray-500">PHP {Number(service.base_price || 0).toLocaleString()} · Order {service.sort_order}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.18em] ${Number(service.is_active) === 1 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {Number(service.is_active) === 1 ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <button onClick={() => setServiceForm({ ...service, base_price: service.base_price || '', is_active: Number(service.is_active) === 1 })} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold uppercase tracking-[0.18em] text-gray-600">Edit</button>
                                                    <button onClick={() => toggleServiceStatus(service)} className="px-4 py-2 rounded-xl bg-[#555555] text-[#c4ba9d] text-xs font-bold uppercase tracking-[0.18em]">
                                                        {Number(service.is_active) === 1 ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-[#faf9f6]">
                        <h2 className="text-2xl font-bold text-gray-800">Appointment Availability</h2>
                        <p className="text-sm text-gray-500 mt-2">Control which weekdays and time slots patients can pick for each branch.</p>
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
                                {branchSlots.map((slot, index) => (
                                    <div key={`${selectedBranch}-${index}-${slot.slot_time}-${slot.slot_label}`} className="rounded-2xl border border-gray-100 bg-[#faf9f6] p-4 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                                            <Input label="Time" type="time" value={slot.slot_time} onChange={(value) => updateBranchSlot(index, 'slot_time', value)} />
                                            <Input label="Label" value={slot.slot_label} onChange={(value) => updateBranchSlot(index, 'slot_label', value)} />
                                            <button onClick={() => removeBranchSlot(index)} className="px-4 py-3 rounded-xl border border-red-200 text-xs font-bold uppercase tracking-[0.18em] text-red-500">Remove</button>
                                        </div>
                                        <label className="flex items-center gap-3 text-sm text-gray-600">
                                            <input type="checkbox" checked={Number(slot.is_active) === 1} onChange={(e) => updateBranchSlot(index, 'is_active', e.target.checked ? 1 : 0)} className="w-4 h-4 accent-[#c4ba9d]" />
                                            Active slot
                                        </label>
                                    </div>
                                ))}
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
        </div>
    );
};

const Input = ({ label, value, onChange, type = 'text' }) => (
    <div>
        <label className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 block mb-2">{label}</label>
        <input
            type={type}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-[#faf9f6] px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#c4ba9d]"
        />
    </div>
);

export default AdminSettings;
