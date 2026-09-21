// src/api/endpoints/returns.js
import api from '../index';

export const returnsAPI = {
  getAll: (params) => api.get('/returns', { params }),
  create: (data) => api.post('/returns', data),
  handle: (id, status) => api.patch(`/returns/${id}`, { status }),
};
