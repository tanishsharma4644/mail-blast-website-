import api from './axios';

export const templatesApi = {
  list: () => api.get('/templates'),
  create: (payload) => api.post('/templates', payload),
  update: (id, payload) => api.put(`/templates/${id}`, payload),
  delete: (id) => api.delete(`/templates/${id}`),
  preview: (id) => api.get(`/templates/${id}/preview`),
};
