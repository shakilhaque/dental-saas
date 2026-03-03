import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [tenant, setTenant] = useState(null);

  const login = useCallback(async (email, password, subdomain) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password, subdomain });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (subdomain) localStorage.setItem('subdomain', subdomain);
      setUser(data.user);
      toast.success('Welcome back!');
      return { success: true, role: data.user.role };
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('subdomain');
    setUser(null);
    setTenant(null);
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  const isRole = (...roles) => user && roles.includes(user.role);
  const isClinicAdmin = () => isRole('clinic_admin');
  const isDentist = () => isRole('dentist');
  const isReceptionist = () => isRole('receptionist');
  const isPatient = () => isRole('patient');
  const isSuperAdmin = () => isRole('super_admin');

  return (
    <AuthContext.Provider value={{
      user, loading, tenant, setTenant,
      login, logout, updateUser,
      isRole, isClinicAdmin, isDentist, isReceptionist, isPatient, isSuperAdmin,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
