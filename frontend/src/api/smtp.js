import api from './axios';

export const smtpApi = {
  list: () => api.get('/smtp'),
  create: (payload) => api.post('/smtp', payload),
  delete: (id) => api.delete(`/smtp/${id}`),
  toggle: (id) => api.patch(`/smtp/${id}/toggle`),
  updateLimit: (id, dailyLimit) => api.patch(`/smtp/${id}/limit`, { dailyLimit }),
  resetCounter: (id) => api.patch(`/smtp/${id}/reset`),
};
