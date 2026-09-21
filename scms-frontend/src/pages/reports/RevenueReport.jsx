import { useState, useEffect } from 'react';
import { dashboardAPI } from '../../api/endpoints/dashboard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

// Backend GET /api/reports/orders returns { success, data: { count, totalRevenue, orders } }.
// This page aggregates the non-cancelled orders into monthly buckets for the yearly chart.
function RevenueReport() {
  const [revenueData, setRevenueData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      const response = await dashboardAPI.getSalesChart();
      const data = response.data?.data || {};
      const orders = Array.isArray(data.orders) ? data.orders : [];

      const monthMap = {};
      let total = 0;
      orders.forEach((order) => {
        if (order.status === 'cancelled') return;
        const revenue = Number(order.totalPrice || 0);
        total += revenue;
        const month = order.createdAt ? String(order.createdAt).slice(0, 7) : 'unknown';
        monthMap[month] = (monthMap[month] || 0) + revenue;
      });

      setRevenueData(
        Object.keys(monthMap)
          .sort()
          .map((month) => ({ month, revenue: Number(monthMap[month].toFixed(2)) }))
      );
      setTotalRevenue(total);
    } catch (error) {
      toast.error('Failed to fetch revenue data');
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
      <h1 className="text-2xl font-bold text-gray-900">Yearly Revenue Report</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-primary-600">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-gray-500">Total Yearly Revenue</p>
        </div>
        {revenueData.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No revenue data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default RevenueReport;
