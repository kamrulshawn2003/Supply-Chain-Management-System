import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

import {
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

import { dashboardAPI } from '../../api/endpoints/dashboard';
import toast from 'react-hot-toast';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function DashboardHome() {
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role;

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState({ count: 0, totalRevenue: 0 });
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userRole) return;
    loadDashboard();
  }, [userRole]);

  const loadDashboard = async () => {
    setLoading(true);
    const canViewReports = ['admin', 'warehouse_manager', 'supplier'].includes(userRole);

    // Only roles with a backend dashboard endpoint can fetch stats; others get a null placeholder.
    const statsSupported = ['admin', 'warehouse_manager', 'driver'].includes(userRole);
    const apiCalls = [
      statsSupported
        ? dashboardAPI.getStats(userRole)
        : Promise.resolve({ data: { data: null } })
    ];
    if (canViewReports) {
      apiCalls.push(dashboardAPI.getSalesChart(), dashboardAPI.getInventoryChart());
    } else {
      apiCalls.push(
        Promise.resolve({ data: { data: { count: 0, totalRevenue: 0 } } }),
        Promise.resolve({ data: { data: { inventory: [] } } })
      );
    }
    apiCalls.push(dashboardAPI.getRecentOrders(5));

    const results = await Promise.allSettled(apiCalls);
    const [statsRes, salesRes, invRes, orderRes] = results;

    // Process dashboard stats
    if (statsRes.status === 'fulfilled') {
      setStats(statsRes.value?.data?.data || null);
    } else {
      toast.error('Failed to load dashboard summary stats');
    }

    // Process sales report data
    if (salesRes.status === 'fulfilled') {
      const d = salesRes.value?.data?.data || {};
      setSales({
        count: d?.count || 0,
        totalRevenue: d?.totalRevenue || 0,
      });
    }

    // Process inventory pie chart data
    if (invRes.status === 'fulfilled') {
      setInventory(invRes.value?.data?.data?.inventory || []);
    }

    // Normalize recent orders array
    if (orderRes.status === 'fulfilled') {
      const raw = orderRes.value?.data;
      let normalized = [];
      if (Array.isArray(raw)) normalized = raw;
      else if (raw?.data && Array.isArray(raw.data)) normalized = raw.data;
      setOrders(normalized);
    } else {
      setOrders([]);
      toast.error('Could not load recent orders list');
    }

    setLoading(false);
  };

  const kpis = useMemo(() => ([
    {
      label: 'Products',
      value: stats?.counts?.products ?? '—',
      icon: CubeIcon,
    },
    {
      label: 'Orders',
      value: sales.count ?? '—',
      icon: ShoppingCartIcon,
    },
    {
      label: 'Revenue',
      value: `$${Number(sales.totalRevenue || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
    },
    {
      label: 'Low Stock',
      value: stats?.lowStockCount ?? '—',
      icon: ExclamationTriangleIcon,
    },
  ]), [stats, sales]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Admin / Warehouse / Supplier Full Analytics View
  const renderAdminDashboard = () => (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-gray-500 capitalize">
          {userRole}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
            <kpi.icon className="w-6 h-6 text-gray-500" />
            <div>
              <div className="text-sm text-gray-500">{kpi.label}</div>
              <div className="text-xl font-semibold">{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Revenue Overview</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[{ name: 'Total', revenue: sales.totalRevenue }]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold mb-4">Inventory Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={inventory}
                dataKey="quantity"
                nameKey="ProductId"
                outerRadius={90}
              >
                {inventory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="p-5 border-b font-semibold">
          Recent Orders
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-3 text-left">Order ID</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-6 text-center text-gray-500">
                    No orders available
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">#{o.id}</td>
                    <td className="p-3 capitalize">{o.status}</td>
                    <td className="p-3">
                      ${Number(o.totalPrice || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // Customer Personal Dashboard
  const renderCustomerDashboard = () => {
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending').length;

    return (
      <>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <span className="text-sm text-gray-500 capitalize">{userRole}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500">My Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow">
            <p className="text-gray-500">Pending Orders</p>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="font-semibold mb-4">My Order History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 border-b">
                <tr>
                  <th className="p-2 text-left">Order ID</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-gray-500">
                      You have not placed any orders yet
                    </td>
                  </tr>
                ) : (
                  orders.slice(0,5).map(o => (
                    <tr key={o.id} className="border-t">
                      <td className="p-2">#{o.id}</td>
                      <td className="p-2 capitalize">{o.status}</td>
                      <td className="p-2">${Number(o.totalPrice).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  // Driver Delivery Dashboard
const renderDriverDashboard = () => {
  // Backend already filters orders where DriverId = user.id, no extra frontend filter needed
  const assignedOrders = orders;
  const transitCount = assignedOrders.filter(o => o.status === 'shipped').length;
  const deliveredCount = assignedOrders.filter(o => o.status === 'delivered').length;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Driver Delivery Dashboard</h1>
        <span className="text-sm text-gray-500 capitalize">{userRole}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Assigned Deliveries</p>
          <p className="text-2xl font-bold">{assignedOrders.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">In Transit</p>
          <p className="text-2xl font-bold">{transitCount}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Completed Deliveries</p>
          <p className="text-2xl font-bold">{deliveredCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-4">Your Assigned Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500 border-b">
              <tr>
                <th className="p-2 text-left">Order ID</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Shipping Address</th>
              </tr>
            </thead>
            <tbody>
              {assignedOrders.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-gray-500">
                    No deliveries assigned to you
                  </td>
                </tr>
              ) : (
                assignedOrders.map(o => (
                  <tr key={o.id} className="border-t">
                    <td className="p-2">#{o.id}</td>
                    <td className="p-2 capitalize">{o.status}</td>
                    <td className="p-2 max-w-xs truncate">{o.shippingAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

  // Role routing render switch
  return (
    <div className="space-y-6">
      {['admin', 'warehouse_manager', 'supplier'].includes(userRole)
        ? renderAdminDashboard()
        : userRole === 'customer'
        ? renderCustomerDashboard()
        : userRole === 'driver'
        ? renderDriverDashboard()
        : <div className="text-center py-12 text-gray-500">No dashboard available for your role</div>
      }
    </div>
  );
}

export default DashboardHome;