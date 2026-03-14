import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const navigate = useNavigate();
  // We grab the user data we saved during login
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user'); // Clear the session
    navigate('/'); // Send them back to login
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Patient Portal</h1>
      <p>Welcome to VIVRECARES. Your user ID is: {user?.id}</p>
      <button onClick={handleLogout} style={{ padding: '10px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }}>
        Log Out
      </button>
    </div>
  );
};

export default PatientDashboard;