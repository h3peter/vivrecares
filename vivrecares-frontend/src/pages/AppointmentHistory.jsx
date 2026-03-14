import { useEffect, useState } from 'react';
import axios from 'axios';

const AppointmentHistory = () => {
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.patient_id) {
                try {
                    const res = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_appointments.php?patient_id=${user.patient_id}`);
                    setAppointments(res.data);
                } catch (err) {
                    console.error("Error fetching history:", err);
                }
            }
        };
        fetchHistory();
    }, []);

    return (
        <div className="flex-1 p-12 bg-[#f4f4f4] min-h-screen">
            <h2 className="text-3xl font-light text-[#b2a58d] mb-12">Appointment History</h2>
            
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#fcfaf5] border-b border-gray-100">
                            <th className="p-6 text-[10px] uppercase tracking-widest text-[#b2a58d] font-bold">Remarks</th>
                            <th className="p-6 text-[10px] uppercase tracking-widest text-[#b2a58d] font-bold">Service</th>
                            <th className="p-6 text-[10px] uppercase tracking-widest text-[#b2a58d] font-bold">Date</th>
                            <th className="p-6 text-[10px] uppercase tracking-widest text-[#b2a58d] font-bold">Price</th>
                            <th className="p-6 text-[10px] uppercase tracking-widest text-[#b2a58d] font-bold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 text-sm">
                        {appointments.length > 0 ? appointments.map((apt, index) => (
                            <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                <td className="p-6 uppercase text-[10px] text-[#d4af37] font-bold">{apt.remarks || 'N/A'}</td>
                                <td className="p-6 font-light">{apt.service}</td>
                                <td className="p-6 font-light">{apt.date}</td>
                                <td className="p-6 font-light">₱{parseFloat(apt.price).toLocaleString()}</td>
                                <td className="p-6 italic text-xs text-gray-400">{apt.status}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-gray-400 italic">No appointments found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AppointmentHistory;