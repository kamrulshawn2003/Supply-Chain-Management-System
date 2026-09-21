import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ordersAPI } from '../../api/endpoints/orders';
import Table from '../../components/Table';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      // Debug log to check backend response shape
      console.log("Raw orders API response.data:", response.data);

      // Auto detect which format backend returns
      let rawList = [];
      if (Array.isArray(response.data)) {
        rawList = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        rawList = response.data.data;
      } else if (response.data.orders && Array.isArray(response.data.orders)) {
        rawList = response.data.orders;
      }

      // Normalize data to flat fields for Table columns
      const formattedOrders = rawList.map((order) => ({
        id: order.id,
        status: order.status,
        quantity: order.quantity || 0,
        totalPrice: order.totalPrice || 0,
        rawOrder: order
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Fetch orders error:", error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await ordersAPI.updateStatus(id, status);
      toast.success('Status updated successfully');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this order? Stock will be restored.')) return;
    try {
      await ordersAPI.cancelOrder(id);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const canCancel = ['admin', 'warehouse_manager', 'customer'].includes(user?.role);

  const columns = [
    {
      key: 'id',
      title: 'Order ID',
      render: (value) => `#${value}`
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'delivered' ? 'bg-green-100 text-green-800' :
          value === 'approved' || value === 'shipped' ? 'bg-blue-100 text-blue-800' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          value === 'cancelled' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      ),
    },
    { key: 'quantity', title: 'Quantity' },
    {
      key: 'totalPrice',
      title: 'Total',
      render: (value) => `$${value?.toFixed(2)}`
    },
  ];

  const actions = (row) => (
    <div className="flex gap-2">
      <Link
        to={`/orders/${row.id}`}
        className="text-blue-600"
      >
        View
      </Link>

      {(user?.role === "warehouse_manager" || user?.role === "admin") && (
        <>
          {row.status === 'pending' && (
            <button
              onClick={() => handleStatusUpdate(row.id, 'approved')}
              className="text-green-600"
            >
              Approve
            </button>
          )}
          {row.status === 'approved' && (
            <button
              onClick={() => handleStatusUpdate(row.id, 'shipped')}
              className="text-indigo-600"
            >
              Ship
            </button>
          )}
          {row.status === 'shipped' && (
            <button
              onClick={() => handleStatusUpdate(row.id, 'delivered')}
              className="text-purple-600"
            >
              Deliver
            </button>
          )}
        </>
      )}

      {canCancel && ['pending', 'approved'].includes(row.status) && (
        <button
          onClick={() => handleCancel(row.id)}
          className="text-red-600"
        >
          Cancel
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

        {user?.role === "customer" && (
          <Link to="/orders/create" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Order
          </Link>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <Table columns={columns} data={orders} actions={actions} loading={loading} />
      </div>
    </div>
  );
}

export default OrderList;