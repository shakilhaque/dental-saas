import React, { useState, useEffect, useCallback } from 'react';
import { appointmentAPI, userAPI } from '../../api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  confirmed: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  in_progress: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  completed: { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  cancelled: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  no_show: { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' }
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', dentist: '', status: '' });
  const [showBookModal, setShowBookModal] = useState(false);
  const [dentists, setDentists] = useState([]);
  const [total, setTotal] = useState(0);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.dentist) params.dentist = filters.dentist;
      if (filters.status) params.status = filters.status;
      const { data } = await appointmentAPI.getAll(params);
      setAppointments(data.data || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);
  useEffect(() => {
    userAPI.getDentists().then(r => setDentists(r.data.data || [])).catch(() => {});
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await appointmentAPI.updateStatus(id, { status });
      toast.success('Status updated');
      loadAppointments();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Appointments</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{total} total appointments</p>
        </div>
        <button onClick={() => setShowBookModal(true)} style={{
          padding: '9px 18px', background: '#1e40af', border: 'none', borderRadius: 8,
          color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: 13
        }}>+ Book Appointment</button>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 10, padding: '14px 20px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
          style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13 }} />
        <select value={filters.dentist} onChange={e => setFilters(f => ({ ...f, dentist: e.target.value }))}
          style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13 }}>
          <option value="">All Dentists</option>
          {dentists.map(d => <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>)}
        </select>
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: 13 }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        {(filters.date || filters.dentist || filters.status) && (
          <button onClick={() => setFilters({ date: '', dentist: '', status: '' })}
            style={{ padding: '8px 14px', background: '#f1f5f9', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#64748b' }}>
            Clear
          </button>
        )}
      </div>

      {/* Appointments Table */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <span style={{ fontSize: 40 }}>📅</span>
            <p style={{ color: '#94a3b8', marginTop: 8 }}>No appointments found</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['ID', 'Patient', 'Dentist', 'Date', 'Time', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt, i) => {
                const sc = STATUS_COLORS[apt.status] || STATUS_COLORS.pending;
                return (
                  <tr key={apt._id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>{apt.appointmentId}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{apt.patient?.firstName} {apt.patient?.lastName}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{apt.patient?.patientId}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>Dr. {apt.dentist?.firstName} {apt.dentist?.lastName}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{new Date(apt.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#374151' }}>{apt.startTime} – {apt.endTime}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', textTransform: 'capitalize' }}>{apt.type?.replace('_', ' ')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                        textTransform: 'capitalize'
                      }}>{apt.status.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select onChange={e => updateStatus(apt._id, e.target.value)} value={apt.status}
                        style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
                        {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
