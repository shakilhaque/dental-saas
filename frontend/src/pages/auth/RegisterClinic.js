import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, tenantAPI } from '../../api';
import toast from 'react-hot-toast';

export default function RegisterClinic() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [form, setForm] = useState({
    clinicName: '', subdomain: '', adminFirstName: '', adminLastName: '',
    email: '', password: '', confirmPassword: '', phone: ''
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const checkSubdomain = async (val) => {
    if (!val || val.length < 3) return;
    try {
      const { data } = await tenantAPI.checkSubdomain(val);
      setSubdomainAvailable(data.available);
    } catch {}
  };

  const handleSubdomainChange = (v) => {
    const clean = v.toLowerCase().replace(/[^a-z0-9-]/g, '');
    set('subdomain', clean);
    checkSubdomain(clean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!subdomainAvailable) { toast.error('Subdomain not available'); return; }
    setLoading(true);
    try {
      await authAPI.registerClinic(form);
      toast.success('Clinic registered! Please login.');
      nav('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 48 }}>🦷</span>
          <h1 style={{ margin: '8px 0 4px', color: '#1e40af', fontSize: 28, fontWeight: 700 }}>DentalSaaS</h1>
          <p style={{ color: '#64748b', margin: 0 }}>Multi-Tenant Dental Clinic Platform</p>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 36, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          {/* Steps indicator */}
          <div style={{ display: 'flex', marginBottom: 28, gap: 8 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: step >= s ? '#1e40af' : '#e2e8f0',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>

          <h2 style={{ margin: '0 0 20px', fontSize: 20, color: '#0f172a' }}>
            {step === 1 ? '🏥 Clinic Information' : '👤 Admin Account'}
          </h2>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}>
            {step === 1 && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Clinic Name *</label>
                  <input style={inputStyle} placeholder="e.g. SmileCare Dental Clinic" value={form.clinicName}
                    onChange={e => { set('clinicName', e.target.value); if (!form.subdomain) handleSubdomainChange(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Subdomain *</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <input style={{ ...inputStyle, border: 'none', flex: 1 }} placeholder="your-clinic"
                      value={form.subdomain} onChange={e => handleSubdomainChange(e.target.value)} required />
                    <span style={{ padding: '10px 14px', background: '#f8fafc', color: '#64748b', fontSize: 13, borderLeft: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>.dentalsaas.com</span>
                  </div>
                  {form.subdomain.length > 2 && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: subdomainAvailable ? '#16a34a' : '#dc2626' }}>
                      {subdomainAvailable === null ? '⏳ Checking...' : subdomainAvailable ? '✅ Available!' : '❌ Already taken'}
                    </p>
                  )}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Clinic Phone</label>
                  <input style={inputStyle} type="tel" placeholder="+880 1234-567890" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>First Name *</label>
                    <input style={inputStyle} value={form.adminFirstName} onChange={e => set('adminFirstName', e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Last Name *</label>
                    <input style={inputStyle} value={form.adminLastName} onChange={e => set('adminLastName', e.target.value)} required />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Email *</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Password *</label>
                  <input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Confirm Password *</label>
                  <input style={inputStyle} type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
                </div>
                <div style={{ background: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#3730a3' }}>
                  🎁 14-day free trial • No credit card required
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} style={{
                  flex: 1, padding: '11px', background: '#f1f5f9', border: 'none', borderRadius: 8,
                  color: '#374151', cursor: 'pointer', fontWeight: 600
                }}>← Back</button>
              )}
              <button type="submit" disabled={loading} style={{
                flex: 1, padding: '11px', background: '#1e40af', border: 'none', borderRadius: 8,
                color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1
              }}>
                {loading ? '⏳ Creating...' : step === 1 ? 'Next →' : '🚀 Launch My Clinic'}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748b' }}>
            Already have an account? <Link to="/login" style={{ color: '#1e40af', fontWeight: 600 }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
