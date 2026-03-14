import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  
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
        'http://localhost/vivrecares/vivrecares-api/login.php',
        credentials,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
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
        setMessage('Login Failed: ' + response.data.message);
      }
    } catch (error) {
      console.error("System error during login:", error);
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
          onChange={handleChange} 
          required 
          style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} 
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          onChange={handleChange} 
          required 
          style={{ padding: '10px', width: '100%', boxSizing: 'border-box' }} 
        />
        <button type="submit" style={{ padding: '12px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: 'none', fontWeight: 'bold' }}>
          Sign In
        </button>
      </form>
    </div>
  );
};

export default Login;