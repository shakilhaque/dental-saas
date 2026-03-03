import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const W = collapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', background: '#f1f5f9', minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} />
      <div style={{ marginLeft: W, flex: 1, transition: 'margin-left 0.3s ease', minHeight: '100vh' }}>
        {/* Top Bar */}
        <header style={{
          background: 'white', padding: '0 24px', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 50
        }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 8, borderRadius: 8,
            color: '#64748b', display: 'flex', alignItems: 'center'
          }}>
            {collapsed ? '▶' : '◀'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>🟢 System Online</span>
          </div>
        </header>

        {/* Content */}
        <main style={{ padding: '24px', maxWidth: 1400 }}>
          {children}
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
}
