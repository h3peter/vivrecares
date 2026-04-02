import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import EvaluationGuide from './pages/EvaluationGuide';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PatientProfile from './pages/PatientProfile';
import RequestAppointment from './pages/RequestAppointment';
import AppointmentHistory from './pages/AppointmentHistory';
import AccountSettings from './pages/AccountSettings';
import AdminLayout from './components/AdminLayout';
import PatientLayout from './components/PatientLayout';
import ManagePatients from './pages/admin/ManagePatients';
import AppointmentLogs from './pages/admin/AppointmentLogs';
import BillingAndPayments from './pages/admin/BillingAndPayments';
import AdminProfile from './pages/admin/AdminProfile';
import AdminAddPatient from './pages/admin/AdminAddPatient';
import AdminViewPatient from './pages/admin/AdminViewPatient';
import AdminCreateInvoice from './pages/admin/AdminCreateInvoice';
import AdminReports from './pages/admin/AdminReports';
import PatientInvoices from './pages/PatientInvoices';
import AdminEditPatient from './pages/admin/AdminEditPatient';
import AdminSettings from './pages/admin/AdminSettings';
import DoctorLayout from './components/DoctorLayout';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPatientRecord from './pages/doctor/DoctorPatientRecord';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorReports from './pages/doctor/DoctorReports';
import DoctorProfile from './pages/doctor/DoctorProfile';
import { clearStoredSession, getStoredToken, getStoredUser, rememberStoredUser } from './utils/session';
import { useEffect, useState } from 'react';
import axios from 'axios';
import AppLoadingScreen from './components/AppLoadingScreen';

// This acts as a security guard for your routes
const ProtectedRoute = ({ children, allowedRole, allowedRoles }) => {
  const user = getStoredUser();

  // If they are not logged in at all, kick them to the login screen
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If they are logged in but have the wrong role (e.g., a patient trying to access admin), kick them out
  const permittedRoles = allowedRoles || (allowedRole ? [allowedRole] : null);
  if (permittedRoles && !permittedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // If they pass the checks, let them see the page
  return children;
};

const SessionBootstrap = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();

    if (!storedUser || !storedToken) {
      clearStoredSession();
      setIsChecking(false);
      return;
    }

    axios.get('/session_status.php')
      .then((response) => {
        if (!isMounted) return;
        if (response?.data?.status === 'success' && response.data.user) {
          rememberStoredUser(response.data.user, storedToken);
        } else {
          clearStoredSession();
        }
      })
      .catch(() => {
        if (!isMounted) return;
        clearStoredSession();
      })
      .finally(() => {
        if (isMounted) {
          setIsChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return <AppLoadingScreen label="Restoring session" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <SessionBootstrap>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />          {/* This is the new front door */}
        <Route path="/evaluation-guide" element={<EvaluationGuide />} />
        <Route path="/login" element={<Login />} />            {/* Moved login to its own route */}
        <Route path="/register" element={<Register />} />
        {/* Protected Patient Route */}
       <Route element={<ProtectedRoute allowedRole="Patient"><PatientLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<PatientDashboard />} />
    <Route path="/profile" element={<PatientProfile />} />
    <Route path="/request-appointment" element={<RequestAppointment />} />
    <Route path="/appointment-history" element={<AppointmentHistory />} />
    <Route path="/account-settings" element={<AccountSettings />} />
    <Route path="/billing-history" element={<PatientInvoices />} />
    </Route>
       {/* Protected Admin Routes */}
  <Route element={<ProtectedRoute allowedRole="Admin"><AdminLayout /></ProtectedRoute>}>
      <Route 
          path="/admin/patients" 
          element={<ManagePatients />} 
      />
      <Route 
      path="/admin/appointments" 
      element={<AppointmentLogs />} 
  />
        <Route 
      path="/admin/billing" 
      element={<BillingAndPayments />} 
  />
        <Route 
      path="/admin/profile" 
      element={<AdminProfile />} 
  />
    <Route 
        path="/admin/add-patient" 
        element={<AdminAddPatient />} 
    />
    <Route 
    path="/admin/edit-patient/:userId" 
    element={<AdminEditPatient />} />
    <Route 
        path="/admin/patient/:id" 
        element={<AdminViewPatient />} 
    />
    <Route 
    path="/admin/create-invoice" 
    element={<AdminCreateInvoice />} />
    <Route 
    path="/admin/settings" 
    element={<AdminSettings />} />
    <Route
    path="/admin/reports"
    element={<AdminReports />} />
  </Route>

  <Route element={<ProtectedRoute allowedRole="Doctor"><DoctorLayout /></ProtectedRoute>}>
    <Route
      path="/doctor/patients"
      element={<DoctorPatients />}
    />
    <Route
      path="/doctor/patient/:userId"
      element={<DoctorPatientRecord />}
    />
    <Route
      path="/doctor/appointments"
      element={<DoctorAppointments />}
    />
    <Route
      path="/doctor/reports"
      element={<DoctorReports />}
    />
    <Route
      path="/doctor/profile"
      element={<DoctorProfile />}
    />
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </SessionBootstrap>
    </Router>
  );
}

export default App;
