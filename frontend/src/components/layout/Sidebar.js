import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const menuItems = {
  clinic_admin: [
    { icon: '📊', label: 'Dashboard',    path: '/admin/dashboard' },
    { icon: '👥', label: 'Patients',     path: '/admin/patients' },
    { icon: '📅', label: 'Appointments', path: '/admin/appointments' },
    { icon: '👨‍⚕️', label: 'Dentists',    path: '/admin/dentists' },
    { icon: '💳', label: 'Billing',      path: '/admin/billing' },
    { icon: '🔬', label: 'Services',     path: '/admin/services' },
    { icon: '💬', label: 'AI Chat Logs', path: '/admin/chat-logs' },
    { icon: '⚙️', label: 'Settings',     path: '/admin/settings' },
  ],
  dentist: [
    { icon: '📊', label: 'Dashboard',    path: '/dentist/dashboard' },
    { icon: '📅', label: 'My Schedule',  path: '/dentist/appointments' },
    { icon: '👥', label: 'My Patients',  path: '/dentist/patients' },
    { icon: '📋', label: 'Treatments',   path: '/dentist/treatments' },
  ],
  receptionist: [
    { icon: '📅', label: 'Appointments', path: '/receptionist/appointments' },
    { icon: '👥', label: 'Patients',     path: '/receptionist/patients' },
    { icon: '💳', label: 'Billing',      path: '/receptionist/billing' },
  ],
  patient: [
    { icon: '📅', label: 'My Appointments', path: '/patient/appointments' },
    { icon: '📋', label: 'My Records',      path: '/patient/records' },
    { icon: '💳', label: 'Invoices',        path: '/patient/invoices' },
    { icon: '💬', label: 'AI Assistant',    path: '/patient/chat' },
  ],
};

export default function Sidebar({ collapsed }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const items = menuItems[user?.role] || [];
  const W = collapsed ? 64 : 240;

  return (
    <aside style={{
      width: W, minHeight: '100vh', transition: 'width 0.3s ease',
      background: 'linear-gradient(180deg, #0f2952 0%, #1e40af 100%)',
      display: 'flex', flexDirection: 'column', position: 'fixed',
      left: 0, top: 0, zIndex: 100, boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
    }}>
      <div style={{ padding: collapsed ? '20px 12px' : '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24 }}>🦷</span>
        {!collapsed && <span style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>DentalSaaS</span>}
      </div>

      {!collapsed && (
        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ color: 'white', fontWeight: 600, fontSize: 14 }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{user?.role?.replace('_', ' ')}</div>
        </div>
      )}

      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {items.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <div className={`sidebar-item ${active ? 'active' : ''}`} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '12px 20px' : '10px 16px',
                borderRadius: 8, margin: '2px 0',
                background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: active ? 'white' : 'rgba(255,255,255,0.68)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                borderLeft: `3px solid ${active ? 'rgba(255,255,255,0.7)' : 'transparent'}`,
                transition: 'all 0.15s', cursor: 'pointer'
              }}>
                <span style={{ fontSize: 15, minWidth: 20, textAlign: 'center' }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={logout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: collapsed ? '10px 20px' : '10px 16px',
          background: 'rgba(239,68,68,0.15)', border: 'none', borderRadius: 8,
          color: '#fca5a5', cursor: 'pointer', fontSize: 13
        }}>
          <span>🚪</span>{!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
