import { useState, useEffect } from 'react';
import axios from 'axios';

const AppointmentLogs = () => {
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
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

    // Filter by name or type
    const filteredLogs = appointments.filter(apt => 
        `${apt.first_name} ${apt.last_name} ${apt.appointment_type}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const handleEditClick = (apt) => {
        setSelectedApt({ ...apt }); 
        setIsModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/update_appointment.php', selectedApt);
            if (res.data.status === 'success') {
                setIsModalOpen(false); 
                fetchAppointments(); 
            }
        } catch (error) {
            console.error("Update error:", error);
        }
    };

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen relative">
            
            {/* Search Bar */}
            <div className="flex justify-between items-end mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-full flex items-center justify-between">
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 block">Search Records</label>
                        <input 
                            type="text" 
                            placeholder="Patient name or type..."
                            className="p-2 border border-gray-100 rounded-lg text-xs outline-none focus:border-[#b2a58d] w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-12 gap-4 mb-6 text-[#b2a58d] text-[10px] uppercase tracking-widest font-bold px-4 border-b border-gray-50 pb-4">
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Patient</div>
                    <div className="col-span-3">Type / Branch</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-2">Time Slot</div>
                    <div className="col-span-1 text-center">Action</div>
                </div>

                <div className="space-y-4 px-4 pb-4">
                    {filteredLogs.map(apt => (
                        <div key={apt.appointment_id} className="grid grid-cols-12 gap-4 items-center text-sm text-gray-700 hover:bg-[#faf9f6] p-3 rounded-xl transition">
                            <div className={`col-span-2 uppercase text-[10px] font-bold tracking-widest ${getStatusColor(apt.status)}`}>
                                {apt.status}
                            </div>
                            <div className="col-span-2 font-bold text-gray-800">{apt.first_name} {apt.last_name}</div>
                            
                            {/* Stacking Type and Branch for clean UI */}
                            <div className="col-span-3 flex flex-col">
                                <span className="font-medium">{apt.appointment_type || 'General'}</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">{apt.branch || 'Unassigned'}</span>
                            </div>
                            
                            <div className="col-span-2 font-light">{apt.date}</div>
                            <div className="col-span-2 font-light">{formatTime(apt.time)}</div>
                            <div className="col-span-1 flex justify-center text-gray-400">
                                <button onClick={() => handleEditClick(apt)} className="hover:text-[#b2a58d] transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredLogs.length === 0 && <p className="text-center text-gray-400 italic py-6">No appointments found.</p>}
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && selectedApt && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg p-10 relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-300 hover:text-gray-800 transition">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <div className="mb-8 border-b border-gray-50 pb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Manage Appointment</h2>
                            <p className="text-[10px] text-[#b2a58d] font-bold uppercase tracking-widest mt-1">{selectedApt.appointment_type}</p>
                        </div>
                        
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Patient & Concerns</label>
                                <input type="text" disabled value={`${selectedApt.first_name} ${selectedApt.last_name}`} className="w-full border-b border-gray-100 py-2 bg-transparent text-gray-800 font-medium outline-none" />
                                <textarea disabled rows="2" className="w-full bg-[#faf9f6] p-3 rounded-lg text-xs text-gray-500 mt-2 resize-none" value={selectedApt.concerns || "No specific concerns provided."}></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Date</label>
                                    <input type="date" value={selectedApt.date} onChange={(e) => setSelectedApt({...selectedApt, date: e.target.value})} className="w-full border-b border-gray-200 py-2 outline-none text-gray-700" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Time</label>
                                    <input type="time" value={selectedApt.time} onChange={(e) => setSelectedApt({...selectedApt, time: e.target.value})} className="w-full border-b border-gray-200 py-2 outline-none text-gray-700" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Branch</label>
                                    <select value={selectedApt.branch} onChange={(e) => setSelectedApt({...selectedApt, branch: e.target.value})} className="w-full border-b border-gray-200 py-2 outline-none bg-white text-gray-700">
                                        <option value="Pasay Branch">Pasay Branch</option>
                                        <option value="Valenzuela Branch">Valenzuela Branch</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Status</label>
                                    <select value={selectedApt.status} onChange={(e) => setSelectedApt({...selectedApt, status: e.target.value})} className="w-full border-b border-gray-200 py-2 outline-none bg-white text-gray-700 font-medium">
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-center pt-6">
                                <button type="submit" className="w-16 h-16 bg-[#555555] rounded-full flex items-center justify-center text-[#c4ba9d] shadow-lg hover:bg-black transition transform hover:scale-105">
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