import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/auth/Login';
import RegisterClinic from './pages/auth/RegisterClinic';
import AdminDashboard from './pages/admin/AdminDashboard';
import AppointmentsPage from './pages/admin/AppointmentsPage';
import AppLayout from './components/layout/AppLayout';
import ChatBot from './components/chatbot/ChatBot';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/unauthorized" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    const routes = { super_admin: '/super-admin/dashboard', clinic_admin: '/admin/dashboard', dentist: '/dentist/dashboard', receptionist: '/receptionist/appointments', patient: '/patient/appointments' };
    return <Navigate to={routes[user?.role] || '/'} replace />;
  }
  return children;
};

// Placeholder page
const Placeholder = ({ title, icon = '🚧' }) => (
  <div style={{ textAlign: 'center', padding: 60 }}>
    <span style={{ fontSize: 48 }}>{icon}</span>
    <h2 style={{ color: '#374151', marginTop: 12 }}>{title}</h2>
    <p style={{ color: '#94a3b8' }}>This section is being built. Backend APIs are fully functional.</p>
  </div>
);

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterClinic /></PublicRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['clinic_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/appointments" element={<ProtectedRoute roles={['clinic_admin', 'receptionist']}><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/admin/patients" element={<ProtectedRoute roles={['clinic_admin']}><Placeholder title="Patient Management" icon="👥" /></ProtectedRoute>} />
        <Route path="/admin/dentists" element={<ProtectedRoute roles={['clinic_admin']}><Placeholder title="Dentist Management" icon="👨‍⚕️" /></ProtectedRoute>} />
        <Route path="/admin/billing" element={<ProtectedRoute roles={['clinic_admin', 'receptionist']}><Placeholder title="Billing & Invoices" icon="💳" /></ProtectedRoute>} />
        <Route path="/admin/services" element={<ProtectedRoute roles={['clinic_admin']}><Placeholder title="Services & Pricing" icon="🔬" /></ProtectedRoute>} />
        <Route path="/admin/chat-logs" element={<ProtectedRoute roles={['clinic_admin']}><Placeholder title="AI Chat Logs" icon="💬" /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['clinic_admin']}><Placeholder title="Clinic Settings" icon="⚙️" /></ProtectedRoute>} />

        {/* Dentist Routes */}
        <Route path="/dentist/dashboard" element={<ProtectedRoute roles={['dentist']}><Placeholder title="Dentist Dashboard" icon="👨‍⚕️" /></ProtectedRoute>} />
        <Route path="/dentist/appointments" element={<ProtectedRoute roles={['dentist']}><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/dentist/patients" element={<ProtectedRoute roles={['dentist']}><Placeholder title="My Patients" icon="👥" /></ProtectedRoute>} />
        <Route path="/dentist/treatments" element={<ProtectedRoute roles={['dentist']}><Placeholder title="Treatment Records" icon="📋" /></ProtectedRoute>} />

        {/* Receptionist Routes */}
        <Route path="/receptionist/appointments" element={<ProtectedRoute roles={['receptionist']}><AppointmentsPage /></ProtectedRoute>} />
        <Route path="/receptionist/patients" element={<ProtectedRoute roles={['receptionist']}><Placeholder title="Patient Management" icon="👥" /></ProtectedRoute>} />
        <Route path="/receptionist/billing" element={<ProtectedRoute roles={['receptionist']}><Placeholder title="Billing" icon="💳" /></ProtectedRoute>} />

        {/* Patient Routes */}
        <Route path="/patient/appointments" element={<ProtectedRoute roles={['patient']}><Placeholder title="My Appointments" icon="📅" /></ProtectedRoute>} />
        <Route path="/patient/records" element={<ProtectedRoute roles={['patient']}><Placeholder title="My Records" icon="📋" /></ProtectedRoute>} />
        <Route path="/patient/invoices" element={<ProtectedRoute roles={['patient']}><Placeholder title="My Invoices" icon="💳" /></ProtectedRoute>} />
        <Route path="/patient/chat" element={<ProtectedRoute roles={['patient']}><Placeholder title="AI Dental Assistant" icon="💬" /></ProtectedRoute>} />

        {/* 401/404 */}
        <Route path="/unauthorized" element={<div style={{textAlign:'center',padding:80}}><span style={{fontSize:64}}>🚫</span><h2>Not Authorized</h2></div>} />
        <Route path="*" element={<div style={{textAlign:'center',padding:80}}><span style={{fontSize:64}}>🔍</span><h2>Page Not Found</h2></div>} />
      </Routes>

      {/* Floating Chatbot (shown to patients and public) */}
      {user && ['patient'].includes(user.role) && (
        <ChatBot tenantName="Your Dental Clinic" />
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
