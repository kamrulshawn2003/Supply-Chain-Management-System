import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ordersAPI } from '../../api/endpoints/orders';
import toast from 'react-hot-toast';

function OrderDetails() {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  // Only admin / warehouse managers may transition order status from this page
  const canUpdateStatus = ['admin', 'warehouse_manager'].includes(user?.role);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await ordersAPI.getById(id);
      // Matches backend {success:true, data: order} format
      setOrder(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await ordersAPI.updateStatus(id, status);
      toast.success('Status updated');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order? Stock will be restored.')) return;
    try {
      await ordersAPI.cancelOrder(id);
      toast.success('Order cancelled');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  // Customers may cancel their own pending/approved orders; staff may cancel any
  const canCancel =
    ['admin', 'warehouse_manager', 'customer'].includes(user?.role) &&
    ['pending', 'approved'].includes(order?.status);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-12">Order not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
        <Link to="/orders" className="text-primary-600 hover:text-primary-900">← Back to Orders</Link>
      </div>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Customer</h3>
            <p className="mt-1 text-sm text-gray-900">{order.User?.name || 'N/A'}</p>
            <p className="text-sm text-gray-500">{order.User?.email || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
              order.status === 'approved' ? 'bg-indigo-100 text-indigo-800' :
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Order Product</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-2 text-sm">{order.Product?.name || 'Unnamed Product'}</td>
                <td className="px-4 py-2 text-sm">{order.quantity}</td>
                <td className="px-4 py-2 text-sm">${order.Product?.price?.toFixed(2) || '0.00'}</td>
                <td className="px-4 py-2 text-sm text-right">${order.totalPrice?.toFixed(2) || '0.00'}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td colSpan="3" className="px-4 py-2 text-right">Grand Total:</td>
                <td className="px-4 py-2 text-right">${order.totalPrice?.toFixed(2) || '0.00'}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h3>
          <p className="text-sm text-gray-700">{order.shippingAddress || 'No address provided'}</p>
        </div>

        {order.status !== 'delivered' && canUpdateStatus && (
          <div className="flex space-x-3 pt-4 border-t">
            {order.status === 'pending' && (
              <button
                onClick={() => handleStatusUpdate('approved')}
                className="btn-primary"
              >
                Mark as Approved
              </button>
            )}
            {order.status === 'approved' && (
              <button
                onClick={() => handleStatusUpdate('shipped')}
                className="btn-primary bg-blue-600 hover:bg-blue-700"
              >
                Mark as Shipped
              </button>
            )}
            {order.status === 'shipped' && (
              <button
                onClick={() => handleStatusUpdate('delivered')}
                className="btn-primary bg-green-600 hover:bg-green-700"
            >
                Mark as Delivered
              </button>
            )}
          </div>
        )}

        {(canCancel || (user?.role === 'customer' && order.status === 'delivered')) && (
          <div className="flex space-x-3 pt-4 border-t">
            {canCancel && (
              <button
                onClick={handleCancel}
                className="btn-secondary border-red-300 text-red-600 hover:bg-red-50"
              >
                Cancel Order
              </button>
            )}
            {user?.role === 'customer' && order.status === 'delivered' && (
              <Link
                to={`/returns/new?orderId=${order.id}`}
                className="btn-primary bg-purple-600 hover:bg-purple-700"
              >
                Request Return
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderDetails;