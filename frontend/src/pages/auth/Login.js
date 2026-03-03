import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', subdomain: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password, form.subdomain);
    if (result.success) {
      const routes = {
        super_admin: '/super-admin/dashboard',
        clinic_admin: '/admin/dashboard',
        dentist: '/dentist/dashboard',
        receptionist: '/receptionist/appointments',
        patient: '/patient/appointments'
      };
      nav(routes[result.role] || '/');
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', display: 'flex' }}>
      {/* Left Panel */}
      <div style={{ display: 'none', flex: 1, background: 'linear-gradient(160deg, #1e3a5f 0%, #1e40af 100%)', padding: 60, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}
        className="hidden-mobile">
        <span style={{ fontSize: 56 }}>🦷</span>
        <h1 style={{ color: 'white', fontSize: 36, margin: '16px 0 8px', fontWeight: 800 }}>DentalSaaS</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, maxWidth: 400 }}>
          The complete multi-tenant dental clinic management platform
        </p>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['🏥 Multi-clinic tenant isolation', '🤖 AI-powered chatbot assistant', '📊 Advanced analytics & reporting', '💳 Integrated billing & invoicing'].map(f => (
            <div key={f} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }}>{f}</div>
          ))}
        </div>
      </div>

      {/* Login Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 44 }}>🦷</span>
            <h1 style={{ margin: '8px 0 4px', color: '#1e40af', fontWeight: 700, fontSize: 26 }}>Welcome Back</h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Sign in to your clinic dashboard</p>
          </div>

          <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Clinic Subdomain</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  <input style={{ ...inputStyle, border: 'none', flex: 1 }} placeholder="your-clinic"
                    value={form.subdomain} onChange={e => set('subdomain', e.target.value)} />
                  <span style={{ padding: '10px 12px', background: '#f8fafc', color: '#94a3b8', fontSize: 12, borderLeft: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>.dentalsaas.com</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>Leave blank for super admin login</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Email *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="admin@yourclinic.com" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Password *</label>
                <input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)} required />
                <div style={{ textAlign: 'right', marginTop: 4 }}>
                  <Link to="/forgot-password" style={{ fontSize: 12, color: '#1e40af' }}>Forgot password?</Link>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: 12, background: '#1e40af', border: 'none',
                borderRadius: 8, color: 'white', fontWeight: 600, fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
              }}>
                {loading ? '⏳ Signing in...' : '→ Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20, padding: '16px 0 0', borderTop: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                New clinic? <Link to="/register" style={{ color: '#1e40af', fontWeight: 600 }}>Register for free →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
