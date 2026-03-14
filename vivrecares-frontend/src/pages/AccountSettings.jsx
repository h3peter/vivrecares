import { useState, useEffect } from 'react';
import axios from 'axios';

const AccountSettings = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        user_id: ''
    });

    useEffect(() => {
        const fetchCurrentData = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                const res = await axios.get(`http://localhost/vivrecares/vivrecares-api/get-profile.php?user_id=${user.id}`);
                setFormData({
                    first_name: res.data.first_name,
                    last_name: res.data.last_name,
                    email: res.data.email,
                    phone: res.data.phone,
                    user_id: user.id
                });
            }
        };
        fetchCurrentData();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/update_profile.php', formData);
            if (res.data.status === 'success') {
                alert("Changes saved successfully!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex-1 p-12 bg-[#f4f4f4] min-h-screen">
            <h2 className="text-3xl font-light text-[#b2a58d] mb-12">Account Settings</h2>
            
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
                {/* Left Card: Preview */}
                <div className="w-full md:w-1/3 bg-white p-12 rounded-lg shadow-sm flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full bg-gray-100 mb-6 overflow-hidden">
                        <img src={`http://localhost/vivrecares/assets/default.png`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{formData.first_name} {formData.last_name}</h3>
                    <p className="text-sm text-gray-500 mt-4">{formData.email}</p>
                    <p className="text-sm text-gray-500">{formData.phone}</p>
                </div>

                {/* Right Card: Edit Form */}
                <div className="flex-1 bg-white p-12 rounded-lg shadow-sm">
                    <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-8">
                        <InputGroup label="First Name" value={formData.first_name} onChange={(v) => setFormData({...formData, first_name: v})} />
                        <InputGroup label="Last Name" value={formData.last_name} onChange={(v) => setFormData({...formData, last_name: v})} />
                        <div className="col-span-2">
                            <InputGroup label="Email" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} />
                        </div>
                        <div className="col-span-2">
                            <InputGroup label="Contact Number" value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} />
                        </div>
                        <div className="col-span-2 flex justify-end mt-8">
                            <button className="w-16 h-16 bg-[#c4ba9d] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b2a58d] transition">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
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
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-b border-gray-200 py-2 focus:border-[#b2a58d] outline-none text-gray-700" 
        />
    </div>
);

export default AccountSettings;