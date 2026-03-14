import { useState, useEffect } from 'react';
import axios from 'axios';

const AppointmentLogs = () => {
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApt, setSelectedApt] = useState(null);

    const fetchAppointments = async () => {
        try {
            const res = await axios.get('http://localhost/vivrecares/vivrecares-api/get_all_appointments.php');
            if (Array.isArray(res.data)) {
                setAppointments(res.data);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const filteredLogs = appointments.filter(apt => 
        `${apt.first_name} ${apt.last_name} ${apt.service}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Colorize status
    const getStatusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'completed': return 'text-green-500';
            case 'pending': return 'text-orange-400';
            case 'confirmed': return 'text-blue-500';
            case 'cancelled': return 'text-red-500';
            default: return 'text-[#d4af37]';
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return '';
        const [hour, minute] = timeString.split(':');
        const h = parseInt(hour, 10);
        return `${h % 12 || 12}:${minute} ${h >= 12 ? 'PM' : 'AM'}`;
    };

    // Open modal and set the data
    const handleEditClick = (apt) => {
        setSelectedApt({ ...apt }); // Clone the object so we can edit it safely
        setIsModalOpen(true);
    };

    // Submit updates to the backend
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/update_appointment.php', selectedApt);
            if (res.data.status === 'success') {
                setIsModalOpen(false); // Close modal
                fetchAppointments(); // Refresh the table
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen relative">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <label className="text-sm text-gray-800 mb-2 block">Search:</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            className="pl-10 pr-4 py-2 rounded-full border border-gray-300 w-64 outline-none focus:border-[#b2a58d]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-12 gap-4 mb-6 text-[#b2a58d] text-[10px] uppercase tracking-widest font-bold px-4 border-b border-gray-100 pb-4">
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Patient</div>
                    <div className="col-span-3">Service</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Time Slot</div>
                    <div className="col-span-1 text-center">Action</div>
                </div>

                <div className="space-y-6 px-4 pb-4">
                    {filteredLogs.map(apt => (
                        <div key={apt.appointment_id} className="grid grid-cols-12 gap-4 items-center text-sm text-gray-700">
                            <div className={`col-span-2 uppercase text-[10px] font-bold tracking-widest ${getStatusColor(apt.status)}`}>
                                {apt.status}
                            </div>
                            <div className="col-span-2 font-medium">{apt.first_name} {apt.last_name}</div>
                            <div className="col-span-3 font-light">{apt.service}</div>
                            <div className="col-span-2 font-light">{apt.date}</div>
                            <div className="col-span-2 font-light">{formatTime(apt.time)}</div>
                            <div className="col-span-1 flex justify-center text-gray-400">
                                {/* Edit Button */}
                                <button onClick={() => handleEditClick(apt)} className="hover:text-[#b2a58d] transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* The Modal Overlay */}
            {isModalOpen && selectedApt && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-10 relative">
                        {/* Close Button */}
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <h2 className="text-2xl font-bold text-[#b2a58d] mb-8">Appointment</h2>
                        
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Patient</label>
                                <input type="text" disabled value={`${selectedApt.first_name} ${selectedApt.last_name}`} className="w-full border-b border-gray-200 py-2 bg-transparent text-gray-500 outline-none" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Date</label>
                                    <input type="date" value={selectedApt.date} onChange={(e) => setSelectedApt({...selectedApt, date: e.target.value})} className="w-full border-b border-gray-200 py-2 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Time</label>
                                    <input type="time" value={selectedApt.time} onChange={(e) => setSelectedApt({...selectedApt, time: e.target.value})} className="w-full border-b border-gray-200 py-2 outline-none" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Branch</label>
                                <select value={selectedApt.branch} onChange={(e) => setSelectedApt({...selectedApt, branch: e.target.value})} className="w-full border-b border-gray-200 py-2 outline-none bg-white">
                                    <option>MOA Branch</option>
                                    <option>Evia Branch</option>
                                    <option>Biñan Branch</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Status</label>
                                <select value={selectedApt.status} onChange={(e) => setSelectedApt({...selectedApt, status: e.target.value})} className="w-full border-b border-gray-200 py-2 outline-none bg-white">
                                    <option value="Pending">Pending</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="flex justify-center pt-6">
                                <button type="submit" className="w-16 h-16 bg-[#c4ba9d] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b2a58d] transition">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentLogs;