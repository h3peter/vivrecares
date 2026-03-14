import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminProfile = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        user_id: ''
    });

    useEffect(() => {
        const fetchCurrentData = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                try {
                    // We can reuse the get_profile API since it pulls the base user data anyway
                    const res = await axios.get(`http://localhost/vivrecares/vivrecares-api/get_profile.php?user_id=${user.id}`);
                    setFormData({
                        first_name: res.data.first_name || '',
                        last_name: res.data.last_name || '',
                        email: res.data.email || '',
                        user_id: user.id
                    });
                } catch (error) {
                    console.error("Failed to fetch admin profile", error);
                }
            }
        };
        fetchCurrentData();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost/vivrecares/vivrecares-api/update_admin_profile.php', formData);
            if (res.data.status === 'success') {
                alert("Profile successfully updated!");
                
                // Update local storage so the sidebar name changes immediately without a refresh
                const currentUser = JSON.parse(localStorage.getItem('user'));
                localStorage.setItem('user', JSON.stringify({
                    ...currentUser,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email
                }));
                // Force a quick reload to update the Layout state
                window.location.reload(); 
            } else {
                alert("Error: " + res.data.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="p-12 bg-[#f4f4f4] min-h-screen">
            <h2 className="text-3xl font-light text-[#b2a58d] mb-12">My Profile</h2>
            
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
                {/* Left Card: Preview */}
                <div className="w-full md:w-1/3 bg-white p-12 rounded-xl shadow-sm flex flex-col items-center text-center border border-gray-100">
                    <div className="w-32 h-32 rounded-full bg-[#c4ba9d] flex items-center justify-center mb-6 shadow-inner text-white">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{formData.first_name} {formData.last_name}</h3>
                    <p className="text-sm text-[#b2a58d] font-bold tracking-widest uppercase mt-2">Administrator</p>
                    <p className="text-sm text-gray-500 mt-4">{formData.email}</p>
                </div>

                {/* Right Card: Edit Form */}
                <div className="flex-1 bg-white p-12 rounded-xl shadow-sm border border-gray-100">
                    <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-8">
                        <InputGroup label="First Name" value={formData.first_name} onChange={(v) => setFormData({...formData, first_name: v})} />
                        <InputGroup label="Last Name" value={formData.last_name} onChange={(v) => setFormData({...formData, last_name: v})} />
                        
                        <div className="col-span-2">
                            <InputGroup label="Email Address" value={formData.email} onChange={(v) => setFormData({...formData, email: v})} />
                        </div>
                        
                        <div className="col-span-2 flex justify-end mt-8">
                            <button type="submit" className="w-16 h-16 bg-[#c4ba9d] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#b2a58d] transition">
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
            required
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full border-b border-gray-200 py-2 focus:border-[#b2a58d] outline-none text-gray-700 bg-transparent" 
        />
    </div>
);

export default AdminProfile;