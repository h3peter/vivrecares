import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import { clearStoredSession, rememberStoredToken, rememberStoredUser } from '../utils/session';
import { firstAdminPath } from '../utils/adminAccess';

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
        const authToken = response.data?.token;
        if (rememberMe && credentials.email.trim()) {
          localStorage.setItem(REMEMBERED_EMAIL_KEY, credentials.email.trim());
        } else {
          localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        if (!authToken) {
          throw new Error('Login succeeded, but no authentication token was returned.');
        }

        rememberStoredToken(authToken);

        const sessionStatusResponse = await axios.get('/session_status.php');
        const confirmedUser = sessionStatusResponse?.data?.status === 'success'
          ? sessionStatusResponse.data.user
          : null;

        if (!confirmedUser) {
          clearStoredSession();
          throw new Error('Login succeeded, but the session could not be restored on this browser.');
        }

        setMessage('Login Successful! Welcome back.');
        rememberStoredUser(confirmedUser, authToken);
        
        // The Traffic Cop Logic: Check the role and redirect
        if (confirmedUser.role === 'Admin') {
          navigate(firstAdminPath(confirmedUser));
        } else if (confirmedUser.role === 'Doctor') {
          navigate('/doctor/appointments');
        } else {
          navigate('/dashboard');
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
        <PasswordInput
          name="password"
          placeholder="Password"
          value={credentials.password}
          onChange={handleChange}
          visible={showPassword}
          onToggleVisibility={() => setShowPassword((prev) => !prev)}
          required
          inputStyle={{ padding: '10px', width: '100%', boxSizing: 'border-box', paddingRight: '48px' }}
          buttonStyle={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#8c7a2b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        />
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
