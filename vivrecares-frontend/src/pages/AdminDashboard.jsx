import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Administrator Dashboard</h1>
      <p>System overview and clinic management.</p>
      <button onClick={handleLogout} style={{ padding: '10px', background: 'red', color: 'white', border: 'none', cursor: 'pointer' }}>
        Log Out
      </button>
    </div>
  );
};

export default AdminDashboard;