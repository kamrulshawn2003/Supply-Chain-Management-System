// src/api/endpoints/inventory.js
import api from '../index';

export const inventoryAPI = {
  getStockOverview: (params) => api.get('/inventory', { params }),
  getWarehouseStock: (warehouseId) => api.get('/inventory', { params: { warehouseId } }),
  updateStock: (data) => api.post('/inventory/update', data),
  getLowStock: () => api.get('/inventory/low-stock'),
  transferStock: (data) => api.post('/inventory/transfer', data),
};