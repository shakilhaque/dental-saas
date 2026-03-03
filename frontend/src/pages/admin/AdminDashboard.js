import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../api';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StatCard = ({ icon, label, value, sub, color = '#1e40af', trend }) => (
  <div style={{
    background: 'white', borderRadius: 12, padding: '20px 24px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)', borderTop: `3px solid ${color}`
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{value}</p>
        {sub && <p style={{ margin: '4px 0 0', fontSize: 12, color: trend >= 0 ? '#16a34a' : '#dc2626' }}>{trend >= 0 ? '↑' : '↓'} {sub}</p>}
      </div>
      <span style={{ fontSize: 32 }}>{icon}</span>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [apptStats, setApptStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.getDashboard(),
      analyticsAPI.getRevenue(6),
      analyticsAPI.getAppointmentStats()
    ]).then(([s, r, a]) => {
      setStats(s.data.data);
      setRevenue(r.data.data || []);
      setApptStats(a.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: 40 }}>⏳</span>
        <p style={{ color: '#64748b', marginTop: 8 }}>Loading dashboard...</p>
      </div>
    </div>
  );

  const statusColors = { completed: '#16a34a', confirmed: '#1e40af', pending: '#d97706', cancelled: '#dc2626', no_show: '#6b7280' };
  const PIE_COLORS = ['#1e40af', '#16a34a', '#d97706', '#dc2626', '#8b5cf6'];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Clinic Dashboard</h1>
        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon="📅" label="Today's Appointments" value={stats?.todayAppointments || 0} color="#1e40af" />
        <StatCard icon="⏳" label="Pending Approvals" value={stats?.pendingAppointments || 0} color="#d97706" />
        <StatCard icon="👥" label="Total Patients" value={(stats?.totalPatients || 0).toLocaleString()} sub={`+${stats?.newPatientsThisMonth || 0} this month`} trend={1} color="#16a34a" />
        <StatCard icon="💰" label="Monthly Revenue" value={`৳${(stats?.monthlyRevenue || 0).toLocaleString()}`} sub={`${stats?.revenueGrowth || 0}% vs last month`} trend={parseFloat(stats?.revenueGrowth)} color="#8b5cf6" />
        <StatCard icon="👨‍⚕️" label="Active Dentists" value={stats?.totalDentists || 0} color="#0891b2" />
        <StatCard icon="✅" label="Completed Today" value={stats?.completedToday || 0} color="#059669" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Revenue Chart */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#374151' }}>📈 Monthly Revenue</h3>
          {revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `৳${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => `৳${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#1e40af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No revenue data yet</div>
          )}
        </div>

        {/* Appointment by Status pie */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600, color: '#374151' }}>📊 Appointments by Status</h3>
          {apptStats?.byStatus?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={apptStats.byStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={75} label={({_id, percent}) => `${_id} ${(percent*100).toFixed(0)}%`}>
                    {apptStats.byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {apptStats.byStatus.map((s, i) => (
                  <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span style={{ color: '#64748b', textTransform: 'capitalize' }}>{s._id}: {s.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No appointment data</div>
          )}
        </div>
      </div>

      {/* Dentist performance */}
      {apptStats?.byDentist?.length > 0 && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#374151' }}>👨‍⚕️ Dentist Performance (This Month)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={apptStats.byDentist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#0891b2" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
