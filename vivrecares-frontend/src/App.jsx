import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PatientProfile from './pages/PatientProfile';
import RequestAppointment from './pages/RequestAppointment';
import AppointmentHistory from './pages/AppointmentHistory';
import AccountSettings from './pages/AccountSettings';

import PatientLayout from './components/PatientLayout';

// This acts as a security guard for your routes
const ProtectedRoute = ({ children, allowedRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  // If they are not logged in at all, kick them to the login screen
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If they are logged in but have the wrong role (e.g., a patient trying to access admin), kick them out
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  // If they pass the checks, let them see the page
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />          {/* This is the new front door */}
        <Route path="/login" element={<Login />} />            {/* Moved login to its own route */}
        <Route path="/register" element={<Register />} />
        {/* Protected Patient Route */}
       <Route element={<PatientLayout />}>
    <Route path="/profile" element={<ProtectedRoute allowedRole="Patient"><PatientProfile /></ProtectedRoute>} />
    <Route path="/request-appointment" element={<ProtectedRoute allowedRole="Patient"><RequestAppointment /></ProtectedRoute>} />
    <Route path="/appointment-history" element={<ProtectedRoute allowedRole="Patient"><AppointmentHistory /></ProtectedRoute>} />
    <Route path="/account-settings" element={<ProtectedRoute allowedRole="Patient"><AccountSettings /></ProtectedRoute>} />
    </Route>
        {/* Protected Admin Route */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;