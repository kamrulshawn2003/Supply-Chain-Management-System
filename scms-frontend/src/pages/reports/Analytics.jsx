import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../api/endpoints/dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Analytics() {
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [salesRes, inventoryRes] = await Promise.all([
        dashboardAPI.getSalesChart(),
        dashboardAPI.getInventoryChart(),
      ]);

      // Sales trend: aggregate non-cancelled orders into monthly buckets.
      const salesData = salesRes.data?.data || {};
      const orders = Array.isArray(salesData.orders) ? salesData.orders : [];
      const monthMap = {};
      orders.forEach((order) => {
        if (order.status === 'cancelled') return;
        const month = order.createdAt ? String(order.createdAt).slice(0, 7) : 'unknown';
        monthMap[month] = (monthMap[month] || 0) + Number(order.totalPrice || 0);
      });
      setSalesData(
        Object.keys(monthMap)
          .sort()
          .map((month) => ({ month, revenue: Number(monthMap[month].toFixed(2)) }))
      );

      // Inventory distribution: aggregate inventory rows by product name.
      const invData = inventoryRes.data?.data || {};
      const inventory = Array.isArray(invData.inventory) ? invData.inventory : [];
      const productMap = {};
      inventory.forEach((item) => {
        const name = item.Product?.name || `Product #${item.productId}`;
        productMap[name] = (productMap[name] || 0) + Number(item.quantity || 0);
      });
      setInventoryData(
        Object.keys(productMap)
          .filter((name) => productMap[name] > 0)
          .map((name) => ({ name, value: productMap[name] }))
      );
    } catch (error) {
      toast.error('Failed to fetch analytics data');
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
      <h1 className="text-2xl font-bold text-gray-900">Analytics (Monthly Trend)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Monthly Sales Trend</h3>
          {salesData.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No sales data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Inventory Distribution</h3>
          {inventoryData.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No inventory data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;
