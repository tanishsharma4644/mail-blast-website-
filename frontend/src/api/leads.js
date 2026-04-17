import api from './axios';

export const leadsApi = {
  list: (params) => api.get('/leads', { params }),
  create: (payload) => api.post('/leads', payload),
  update: (id, payload) => api.put(`/leads/${id}`, payload),
  delete: (id) => api.delete(`/leads/${id}`),
  bulk: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/leads/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  bulkPaste: (text) => api.post('/leads/bulk-paste', { text }),
};
