import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({ baseURL, withCredentials: true });

// Attach the access token from memory/localStorage on every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edgex_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize error shape so components can rely on err.code / err.message.
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const payload = err.response?.data?.error;
    return Promise.reject({
      status: err.response?.status,
      code: payload?.code || 'NETWORK_ERROR',
      message: payload?.message || 'Unable to reach the server. Check your connection and try again.',
    });
  }
);

export const endpoints = {
  // auth
  register: (body) => api.post('/auth/register', body),
  login: (body) => api.post('/auth/login', body),
  googleLogin: (idToken) => api.post('/auth/google', { idToken }),
  requestOtp: (email) => api.post('/auth/otp/request', { email }),
  verifyOtp: (email, code) => api.post('/auth/otp/verify', { email, code }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (body) => api.post('/auth/reset-password', body),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),

  // devices
  listDevices: (params) => api.get('/devices', { params }),
  getDevice: (id) => api.get(`/devices/${id}`),
  createDevice: (body) => api.post('/devices', body),
  updateDevice: (id, body) => api.put(`/devices/${id}`, body),
  deleteDevice: (id) => api.delete(`/devices/${id}`),
  listSensors: (deviceId) => api.get(`/devices/${deviceId}/sensors`),
  createSensor: (deviceId, body) => api.post(`/devices/${deviceId}/sensors`, body),

  // readings
  read: (params) => api.get('/read', { params }),

  // api keys
  listApiKeys: (params) => api.get('/api-keys', { params }),
  createApiKey: (body) => api.post('/api-keys', body),
  rotateApiKey: (id) => api.post(`/api-keys/${id}/rotate`),
  revokeApiKey: (id) => api.post(`/api-keys/${id}/revoke`),

  // alerts
  listAlerts: (params) => api.get('/alerts', { params }),
  acknowledgeAlert: (id) => api.post(`/alerts/${id}/acknowledge`),
  resolveAlert: (id) => api.post(`/alerts/${id}/resolve`),
  listAlertRules: (params) => api.get('/alert-rules', { params }),
  createAlertRule: (body) => api.post('/alert-rules', body),

  // users / admins / audit
  listUsers: (params) => api.get('/users', { params }),
  createUser: (body) => api.post('/users', body),
  listAdmins: () => api.get('/admins'),
  createAdmin: (body) => api.post('/admins', body),
  listAuditLogs: (params) => api.get('/audit-logs', { params }),
};
