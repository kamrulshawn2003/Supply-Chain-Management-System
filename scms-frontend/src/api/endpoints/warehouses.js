// src/api/endpoints/warehouses.js
import api from '../index';

export const warehousesAPI = {
  getAll: (params) => api.get('/warehouses', { params }),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (warehouseData) => api.post('/warehouses', warehouseData),
  update: (id, warehouseData) => api.put(`/warehouses/${id}`, warehouseData),
  delete: (id) => api.delete(`/warehouses/${id}`),
};
