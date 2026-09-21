import { useState, useEffect } from 'react';
import { inventoryAPI } from '../../api/endpoints/inventory';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function LowStockAlerts() {
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    try {
      const response = await inventoryAPI.getLowStock(10);
      // Fix 1: Extract nested data array
      setLowStockItems(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch low stock alerts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
        <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
      </div>
      
      {lowStockItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-green-600 font-medium">All products are well stocked! 🎉</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-red-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">Reorder Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {lowStockItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.Product?.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.lowStockThreshold}</td>
                  <td>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Low Stock
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LowStockAlerts;