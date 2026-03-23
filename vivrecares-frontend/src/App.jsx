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
import AdminLayout from './components/AdminLayout';
import PatientLayout from './components/PatientLayout';
import ManagePatients from './pages/admin/ManagePatients';
import PatientDetails from './pages/admin/PatientDetails';
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
import { getStoredUser } from './utils/session';

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
    <Route path="/billing-history" element={<ProtectedRoute allowedRole="Patient"><PatientInvoices /></ProtectedRoute>} />
    </Route>
       {/* Protected Admin Routes */}
  <Route element={<AdminLayout />}>
      <Route 
          path="/admin/patients" 
          element={
              <ProtectedRoute allowedRole="Admin">
                  <ManagePatients />
              </ProtectedRoute>
          } 
      />
      <Route 
          path="/admin/patient/:userId" 
          element={
              <ProtectedRoute allowedRole="Admin">
                  <PatientDetails />
              </ProtectedRoute>
          } 
      />
      <Route 
      path="/admin/appointments" 
      element={
          <ProtectedRoute allowedRole="Admin">
              <AppointmentLogs />
          </ProtectedRoute>
      } 
  />
        <Route 
      path="/admin/billing" 
      element={
          <ProtectedRoute allowedRole="Admin">
              <BillingAndPayments />
          </ProtectedRoute>
      } 
  />
        <Route 
      path="/admin/profile" 
      element={
          <ProtectedRoute allowedRole="Admin">
              <AdminProfile />
          </ProtectedRoute>
      } 
  />
    <Route 
        path="/admin/add-patient" 
        element={
            <ProtectedRoute allowedRole="Admin">
                <AdminAddPatient />
            </ProtectedRoute>
        } 
    />
    <Route 
    path="/admin/edit-patient/:userId" 
    element={<ProtectedRoute allowedRole="Admin">
        <AdminEditPatient />
    </ProtectedRoute>} />
    <Route 
        path="/admin/patient/:id" 
        element={
            <ProtectedRoute allowedRole="Admin">
                <AdminViewPatient />
            </ProtectedRoute>
        } 
    />
    <Route 
    path="/admin/create-invoice" 
    element={<ProtectedRoute allowedRole="Admin">
        <AdminCreateInvoice />
    </ProtectedRoute>} />
    <Route 
    path="/admin/settings" 
    element={<ProtectedRoute allowedRole="Admin">
        <AdminSettings />
    </ProtectedRoute>} />
    <Route
    path="/admin/reports"
    element={<ProtectedRoute allowedRole="Admin">
        <AdminReports />
    </ProtectedRoute>} />
  </Route>

  <Route element={<DoctorLayout />}>
    <Route
      path="/doctor/patients"
      element={<ProtectedRoute allowedRole="Doctor"><DoctorPatients /></ProtectedRoute>}
    />
    <Route
      path="/doctor/patient/:userId"
      element={<ProtectedRoute allowedRole="Doctor"><DoctorPatientRecord /></ProtectedRoute>}
    />
    <Route
      path="/doctor/appointments"
      element={<ProtectedRoute allowedRole="Doctor"><DoctorAppointments /></ProtectedRoute>}
    />
    <Route
      path="/doctor/reports"
      element={<ProtectedRoute allowedRole="Doctor"><DoctorReports /></ProtectedRoute>}
    />
    <Route
      path="/doctor/profile"
      element={<ProtectedRoute allowedRole="Doctor"><DoctorProfile /></ProtectedRoute>}
    />
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
