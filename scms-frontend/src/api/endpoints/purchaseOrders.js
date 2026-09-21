// src/api/endpoints/purchaseOrders.js
import api from '../index';

export const purchaseOrdersAPI = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  approve: (id) => api.patch(`/purchase-orders/${id}/approve`),
  receive: (id) => api.post(`/purchase-orders/${id}/receive`),
  cancel: (id) => api.patch(`/purchase-orders/${id}/cancel`),
};
