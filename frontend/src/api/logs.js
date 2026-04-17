import api from './axios';

export const logsApi = {
  list: (params) => api.get('/logs', { params }),
  stats: () => api.get('/logs/stats'),
};
