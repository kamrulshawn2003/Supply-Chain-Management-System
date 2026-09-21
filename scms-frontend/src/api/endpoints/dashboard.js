// src/api/endpoints/dashboard.js
import api from '../index';

export const dashboardAPI = {
  getStats: (role) => {
    switch (role) {
      case 'admin':
        return api.get('/dashboard/admin');
      case 'warehouse_manager':
        return api.get('/dashboard/warehouse');
      case 'driver':
        return api.get('/dashboard/driver');
      default:
        return Promise.reject(new Error('Invalid role'));
    }
  },
  getSalesChart: (period) => api.get('/reports/orders', { params: { period } }),
  getInventoryChart: () => api.get('/reports/inventory'),
  getRecentOrders: (limit = 5) => api.get('/orders', { params: { limit } }),
};