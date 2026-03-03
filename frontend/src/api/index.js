import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const subdomain = localStorage.getItem('subdomain');
  if (subdomain) config.headers['X-Tenant-Subdomain'] = subdomain;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  registerClinic: d => api.post('/auth/register-clinic', d),
  login: d => api.post('/auth/login', d),
  getMe: () => api.get('/auth/me'),
  updateProfile: d => api.put('/auth/profile', d),
  changePassword: d => api.put('/auth/change-password', d),
  forgotPassword: e => api.post('/auth/forgot-password', { email: e }),
  resetPassword: (t, p) => api.put(`/auth/reset-password/${t}`, { password: p }),
  registerStaff: d => api.post('/auth/register-staff', d),
};
export const tenantAPI = {
  checkSubdomain: s => api.get(`/tenants/check-subdomain/${s}`),
  getBySubdomain: s => api.get(`/tenants/by-subdomain/${s}`),
  getMyTenant: () => api.get('/tenants/me'),
  updateTenant: d => api.put('/tenants/me', d),
  getAllTenants: () => api.get('/tenants'),
};
export const patientAPI = {
  getAll: p => api.get('/patients', { params: p }),
  getById: id => api.get(`/patients/${id}`),
  create: d => api.post('/patients', d),
  update: (id, d) => api.put(`/patients/${id}`, d),
  delete: id => api.delete(`/patients/${id}`),
};
export const appointmentAPI = {
  getAll: p => api.get('/appointments', { params: p }),
  getAvailableSlots: (dentistId, date) => api.get('/appointments/available-slots', { params: { dentistId, date } }),
  create: d => api.post('/appointments', d),
  updateStatus: (id, d) => api.put(`/appointments/${id}/status`, d),
  reschedule: (id, d) => api.post(`/appointments/${id}/reschedule`, d),
};
export const invoiceAPI = {
  getAll: p => api.get('/invoices', { params: p }),
  create: d => api.post('/invoices', d),
  update: (id, d) => api.put(`/invoices/${id}`, d),
  downloadPDF: id => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getRevenue: m => api.get('/analytics/revenue', { params: { months: m } }),
  getAppointmentStats: () => api.get('/analytics/appointments'),
};
export const serviceAPI = {
  getAll: () => api.get('/services'),
  create: d => api.post('/services', d),
  update: (id, d) => api.put(`/services/${id}`, d),
};
export const userAPI = {
  getDentists: () => api.get('/users?role=dentist'),
};
export const chatAPI = {
  sendMessage: d => api.post('/chat/message', d),
  getChatLogs: p => api.get('/chat/logs', { params: p }),
};
export default api;
