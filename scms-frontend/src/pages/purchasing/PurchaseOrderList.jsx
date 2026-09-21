// src/pages/purchasing/PurchaseOrderList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PlusIcon } from '@heroicons/react/24/outline';
import { purchaseOrdersAPI } from '../../api/endpoints/purchaseOrders';
import Table from '../../components/Table';
import toast from 'react-hot-toast';

const statusStyles = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

function PurchaseOrderList() {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  const fetchPos = async () => {
    try {
      setLoading(true);
      const response = await purchaseOrdersAPI.getAll();
      let rawList = [];
      if (Array.isArray(response.data)) rawList = response.data;
      else if (response.data.data && Array.isArray(response.data.data)) rawList = response.data.data;
      setPos(rawList);
    } catch (error) {
      toast.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPos();
  }, []);

  const handleAction = async (id, action) => {
    const confirmText =
      action === 'cancel' ? 'Cancel this purchase order?' :
      action === 'receive' ? 'Receive this purchase order? Stock will be added to the warehouse.' :
      'Approve this purchase order?';
    if (!window.confirm(confirmText)) return;

    try {
      if (action === 'approve') await purchaseOrdersAPI.approve(id);
      if (action === 'receive') await purchaseOrdersAPI.receive(id);
      if (action === 'cancel') await purchaseOrdersAPI.cancel(id);
      toast.success(`Purchase order ${action}d`);
      fetchPos();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} purchase order`);
    }
  };

  const columns = [
    {
      key: 'poNumber',
      title: 'PO Number',
      render: (value) => <span className="font-medium text-gray-900">{value}</span>,
    },
    {
      key: 'Supplier',
      title: 'Supplier',
      render: (value) => value?.name || '—',
    },
    {
      key: 'Warehouse',
      title: 'Warehouse',
      render: (value) => value?.name || '—',
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'totalPrice',
      title: 'Total',
      render: (value) => `$${Number(value || 0).toFixed(2)}`,
    },
    {
      key: 'expectedDate',
      title: 'Expected',
      render: (value) => value || '—',
    },
    {
      key: 'PurchaseOrderItems',
      title: 'Items',
      render: (value) => (Array.isArray(value) ? value.length : 0),
    },
  ];

  const canManage = user?.role === 'admin' || user?.role === 'warehouse_manager';

  const actions = (row) => (
    <div className="flex gap-2">
      {row.status === 'pending' && user?.role === 'admin' && (
        <button onClick={() => handleAction(row.id, 'approve')} className="text-blue-600 hover:text-blue-900">
          Approve
        </button>
      )}
      {row.status === 'approved' && canManage && (
        <button onClick={() => handleAction(row.id, 'receive')} className="text-green-600 hover:text-green-900">
          Receive
        </button>
      )}
      {['draft', 'pending', 'approved'].includes(row.status) && user?.role === 'admin' && (
        <button onClick={() => handleAction(row.id, 'cancel')} className="text-red-600 hover:text-red-900">
          Cancel
        </button>
      )}
      {['draft', 'pending', 'approved'].includes(row.status) && !canManage && !(user?.role === 'admin') && (
        <span className="text-gray-400 text-sm">Waiting on admin</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        {user?.role === 'admin' && (
          <Link to="/purchase-orders/create" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Purchase Order
          </Link>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <Table columns={columns} data={pos} actions={actions} loading={loading} />
      </div>
    </div>
  );
}

export default PurchaseOrderList;
