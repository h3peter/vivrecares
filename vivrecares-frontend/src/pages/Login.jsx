import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const REMEMBERED_EMAIL_KEY = 'rememberedLoginEmail';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: localStorage.getItem(REMEMBERED_EMAIL_KEY) || '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(Boolean(localStorage.getItem(REMEMBERED_EMAIL_KEY)));
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Verifying credentials...');

    try {
      const response = await axios.post(
        '/login.php',
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        if (rememberMe && credentials.email.trim()) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, credentials.email.trim());
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        setMessage('Login Successful! Welcome back.');
        
        // Save the user data locally so React remembers they are logged in
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // The Traffic Cop Logic: Check the role and redirect
        if (response.data.user.role === 'Admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/patient-dashboard');
        }
        
      } else {
        setCredentials((prev) => ({ ...prev, password: '' }));
        setMessage('Login Failed: ' + response.data.message);
      }
    } catch (error) {
      console.error("System error during login:", error);
      setCredentials((prev) => ({ ...prev, password: '' }));
      setMessage("Network Error. Please verify your backend server is running.");
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', fontFamily: 'Arial, sans-serif', border: '1px solid #ccc' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>VIVRECARES Login</h2>
      
      {message && (
        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
          <strong>Status:</strong> {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          name="email" 
          placeholder="Email Address" 
          value={credentials.email}
          onChange={handleChange} 
          required 
          style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} 
        />
        <div style={{ position: 'relative' }}>
          <input 
            type={showPassword ? 'text' : 'password'} 
            name="password" 
            placeholder="Password" 
            value={credentials.password}
            onChange={handleChange} 
            required 
            style={{ padding: '10px', width: '100%', boxSizing: 'border-box', paddingRight: '70px' }} 
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold', color: '#8c7a2b' }}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#555' }}>
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          <span>Remember Me</span>
        </label>
        <button type="submit" style={{ padding: '12px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: 'none', fontWeight: 'bold' }}>
          Sign In
        </button>
      </form>
    </div>
  );
};

export default Login;
