import api from './axios';

export const campaignsApi = {
  list: () => api.get('/campaigns'),
  create: (payload) => api.post('/campaigns', payload),
  getById: (id) => api.get(`/campaigns/${id}`),
  start: (id) => api.post(`/campaigns/${id}/start`),
  stop: (id) => api.post(`/campaigns/${id}/stop`),
  remove: (id) => api.delete(`/campaigns/${id}`),
};
