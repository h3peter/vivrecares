import { useState, useEffect } from 'react';
import axios from 'axios';

const RequestAppointment = () => {
    const [services, setServices] = useState([]);
    const [bookingData, setBookingData] = useState({
        date: '',
        time: '',
        branch: 'MOA Branch', // Default based on your wireframe
        serviceId: '',
        appointmentType: 'Consultation' 
    });

    useEffect(() => {
        const fetchServices = async () => {
            const res = await axios.get('http://localhost/vivrecares/vivrecares-api/get_services.php');
            setServices(res.data);
        };
        fetchServices();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));
        const payload = { ...bookingData, patientId: user.patient_id };
        
        try {
            const response = await axios.post('http://localhost/vivrecares/vivrecares-api/book_appointment.php', payload);
            if (response.data.status === 'success') {
                alert("Appointment Created!");
            }
        } catch (error) {
            console.error("Booking error", error);
        }
    };

    return (
        <div className="flex-1 p-12 bg-[#f4f4f4] min-h-screen">
            <h2 className="text-3xl font-light text-[#b2a58d] mb-8">Create Appointment</h2>
            
            <div className="max-w-3xl mx-auto bg-white p-12 rounded-lg shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Date & Time */}
                    <FormGroup label="Date of Appointment">
                        <input type="date" className="w-full border-b border-gray-200 py-2 focus:border-[#b2a58d] outline-none" 
                               onChange={(e) => setBookingData({...bookingData, date: e.target.value})} />
                    </FormGroup>

                    <FormGroup label="Time of Appointment">
                        <select className="w-full border-b border-gray-200 py-2 outline-none"
                                onChange={(e) => setBookingData({...bookingData, time: e.target.value})}>
                            <option>10:30 AM</option>
                            <option>01:00 PM</option>
                            <option>03:30 PM</option>
                        </select>
                    </FormGroup>

                    {/* Branch & Service */}
                    <FormGroup label="Branch">
                        <select className="w-full border-b border-gray-200 py-2 outline-none"
                                onChange={(e) => setBookingData({...bookingData, branch: e.target.value})}>
                            <option>MOA Branch</option>
                            <option>Evia Branch</option>
                            <option>Biñan Branch</option>
                        </select>
                    </FormGroup>

                    <FormGroup label="Service">
                        <select className="w-full border-b border-gray-200 py-2 outline-none"
                                onChange={(e) => setBookingData({...bookingData, serviceId: e.target.value})}>
                            <option value="">Select Treatment</option>
                            {services.map(s => <option key={s.service_id} value={s.service_id}>{s.service_name}</option>)}
                        </select>
                    </FormGroup>

                    <FormGroup label="Type of Appointment">
                        <select className="w-full border-b border-gray-200 py-2 outline-none"
                                onChange={(e) => setBookingData({...bookingData, appointmentType: e.target.value})}>
                            <option>Consultation</option>
                            <option>Follow-up</option>
                            <option>Procedure</option>
                        </select>
                    </FormGroup>

                    <div className="flex justify-center pt-8">
                        <button className="w-16 h-16 bg-[#c4ba9d] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b2a58d] transition">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FormGroup = ({ label, children }) => (
    <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{label}</label>
        {children}
    </div>
);

export default RequestAppointment;