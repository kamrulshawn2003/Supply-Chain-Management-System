// src/pages/returns/ReturnRequest.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ordersAPI } from '../../api/endpoints/orders';
import { returnsAPI } from '../../api/endpoints/returns';
import toast from 'react-hot-toast';

function extractList(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (responseData?.data && Array.isArray(responseData.data)) return responseData.data;
  return [];
}

function ReturnRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      const allOrders = extractList(response.data);
      // Only delivered orders are returnable
      setOrders(allOrders.filter((order) => order.status === 'delivered'));
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const selectedOrder = orders.find((order) => Number(order.id) === Number(orderId));

  useEffect(() => {
    if (selectedOrder) setQuantity(1);
  }, [orderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrder) {
      toast.error('Please select a delivered order');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please provide a return reason');
      return;
    }

    try {
      setSubmitting(true);
      await returnsAPI.create({
        orderId: Number(selectedOrder.id),
        productId: selectedOrder.ProductId,
        quantity: Number(quantity),
        reason: reason.trim(),
      });
      toast.success('Return request submitted');
      navigate('/returns');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Request Return</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Delivered Order</label>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select a delivered order</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                Order #{order.id} — {order.Product?.name || 'Product'} × {order.quantity} (${order.totalPrice})
              </option>
            ))}
          </select>
          {!orders.length && (
            <p className="mt-1 text-sm text-gray-500">You have no delivered orders eligible for return.</p>
          )}
        </div>

        {selectedOrder && (
          <div className="rounded-md bg-gray-50 p-4 text-sm">
            <p className="text-gray-900 font-medium">{selectedOrder.Product?.name || 'Product'}</p>
            <p className="text-gray-500">
              Purchased quantity: {selectedOrder.quantity} — you may return up to {selectedOrder.quantity}.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity to Return</label>
          <input
            type="number"
            min="1"
            max={selectedOrder?.quantity || 1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Return Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="input-field"
            placeholder="e.g. defective unit, wrong item, no longer needed"
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => navigate('/returns')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Return Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReturnRequest;
