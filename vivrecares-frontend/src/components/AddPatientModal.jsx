import { useState } from 'react';
import axios from 'axios';

const AddPatientModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        age: '',
        sex: 'Female', // Defaulting to Female since it's a derma clinic, but changeable
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('/add_patient.php', formData);
            if (res.data.status === 'success') {
                onSuccess(); // Triggers the table to refresh
                onClose();   // Closes the modal
            } else {
                setError(res.data.message || 'Failed to add patient.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Server error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-lg border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 tracking-wide">Register Walk-in Patient</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">First Name</label>
                            <input type="text" name="first_name" required onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b2a58d]" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Last Name</label>
                            <input type="text" name="last_name" required onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b2a58d]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Email Address</label>
                            <input type="email" name="email" required onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b2a58d]" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Phone Number</label>
                            <input type="text" name="phone" required onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b2a58d]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Age</label>
                            <input type="number" name="age" required onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b2a58d]" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Sex</label>
                            <select name="sex" onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b2a58d] bg-white">
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Complete Address</label>
                        <input type="text" name="address" required onChange={handleChange} className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b2a58d]" />
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">Cancel</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-[#2d2a26] text-[#d4af37] text-sm font-bold tracking-widest uppercase rounded-lg hover:bg-black transition disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Patient'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPatientModal;
