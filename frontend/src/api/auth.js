import api from './axios';

export const authApi = {
  sendOtp: (payload) => api.post('/auth/send-otp', payload),
  verifyOtp: (payload) => api.post('/auth/verify-otp', payload),
  login: (payload) => api.post('/auth/login', payload),
  verifyLoginOtp: (payload) => api.post('/auth/login/verify-otp', payload),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};
