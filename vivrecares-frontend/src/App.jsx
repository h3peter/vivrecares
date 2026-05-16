import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { clearStoredSession, getStoredToken, getStoredUser, rememberStoredUser } from './utils/session';
import { lazy, Suspense, useEffect, useState } from 'react';
import axios from 'axios';
import AppLoadingScreen from './components/AppLoadingScreen';

const Login = lazy(() => import('./pages/Login'));
const EvaluationGuide = lazy(() => import('./pages/EvaluationGuide'));
const Register = lazy(() => import('./pages/Register'));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PatientProfile = lazy(() => import('./pages/PatientProfile'));
const RequestAppointment = lazy(() => import('./pages/RequestAppointment'));
const AppointmentHistory = lazy(() => import('./pages/AppointmentHistory'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const PatientLayout = lazy(() => import('./components/PatientLayout'));
const ManagePatients = lazy(() => import('./pages/admin/ManagePatients'));
const AppointmentLogs = lazy(() => import('./pages/admin/AppointmentLogs'));
const BillingAndPayments = lazy(() => import('./pages/admin/BillingAndPayments'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const AdminAddPatient = lazy(() => import('./pages/admin/AdminAddPatient'));
const AdminViewPatient = lazy(() => import('./pages/admin/AdminViewPatient'));
const AdminCreateInvoice = lazy(() => import('./pages/admin/AdminCreateInvoice'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const PatientInvoices = lazy(() => import('./pages/PatientInvoices'));
const AdminEditPatient = lazy(() => import('./pages/admin/AdminEditPatient'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const DoctorLayout = lazy(() => import('./components/DoctorLayout'));
const DoctorPatients = lazy(() => import('./pages/doctor/DoctorPatients'));
const DoctorPatientRecord = lazy(() => import('./pages/doctor/DoctorPatientRecord'));
const DoctorAppointments = lazy(() => import('./pages/doctor/DoctorAppointments'));
const DoctorReports = lazy(() => import('./pages/doctor/DoctorReports'));
const DoctorProfile = lazy(() => import('./pages/doctor/DoctorProfile'));

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
  const [isChecking, setIsChecking] = useState(() => Boolean(getStoredUser() && getStoredToken()));

  useEffect(() => {
    let isMounted = true;
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();

    if (!storedUser || !storedToken) {
      clearStoredSession();
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
      <Suspense fallback={<AppLoadingScreen label="Loading page" />}>
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
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
      />
      <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
      />
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
      </Suspense>
      </SessionBootstrap>
    </Router>
  );
}

export default App;
