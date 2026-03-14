import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logoBlack from '../assets/vivre-black.png';

const LoginModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost/vivrecares/vivrecares-api/login.php', credentials);
      if (response.data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        response.data.user.role === 'Admin' ? navigate('/admin-dashboard') : navigate('/patient-dashboard');
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      setMessage("Network Error. Check your connection.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-sm shadow-2xl overflow-hidden relative p-12">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="flex flex-col items-center">
          {/* Logo matches wireframe scale */}
          <img src={logoBlack} alt="Vivre" className="h-28 mb-12 object-contain" />
          
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                placeholder="Email" 
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition"
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-[#d4af37]" />
                <span className="text-sm text-gray-600">Remember Password</span>
              </label>
            </div>

            <p className="text-sm text-gray-500">
              New to VIVRE? <span onClick={() => navigate('/register')} className="text-[#d4af37] cursor-pointer hover:underline">Register here.</span>
            </p>

            {message && <p className="text-red-500 text-xs text-center">{message}</p>}

            <div className="flex justify-center pt-4">
              <button 
                type="submit" 
                className="w-2/3 py-4 bg-[#d4af37] hover:bg-[#c4a030] text-white text-2xl rounded-full transition duration-300 shadow-lg"
              >
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;