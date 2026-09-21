// src/pages/returns/ReturnList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PlusIcon } from '@heroicons/react/24/outline';
import { returnsAPI } from '../../api/endpoints/returns';
import Table from '../../components/Table';
import toast from 'react-hot-toast';

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

function ReturnList() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const response = await returnsAPI.getAll();
      let rawList = [];
      if (Array.isArray(response.data)) rawList = response.data;
      else if (response.data.data && Array.isArray(response.data.data)) rawList = response.data.data;
      setReturns(rawList);
    } catch (error) {
      toast.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleReturn = async (id, status) => {
    const actionText = status === 'approved' ? 'Approve' : 'Reject';
    if (!window.confirm(`${actionText} this return request?`)) return;

    try {
      await returnsAPI.handle(id, status);
      toast.success(`Return request ${status}`);
      fetchReturns();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${actionText.toLowerCase()} return`);
    }
  };

  const canHandle = user?.role === 'admin' || user?.role === 'warehouse_manager';

  const columns = [
    {
      key: 'id',
      title: 'Return ID',
      render: (value) => `#${value}`,
    },
    {
      key: 'Order',
      title: 'Order',
      render: (value) => (value ? `#${value.id}` : '—'),
    },
    {
      key: 'Product',
      title: 'Product',
      render: (value) => value?.name || '—',
    },
    { key: 'quantity', title: 'Qty' },
    { key: 'reason', title: 'Reason' },
    {
      key: 'status',
      title: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'Customer',
      title: 'Requested By',
      render: (value) => value?.name || '—',
    },
  ];

  const actions = (row) => (
    <div className="flex gap-2">
      {row.status === 'pending' && canHandle && (
        <>
          <button onClick={() => handleReturn(row.id, 'approved')} className="text-green-600 hover:text-green-900">
            Approve
          </button>
          <button onClick={() => handleReturn(row.id, 'rejected')} className="text-red-600 hover:text-red-900">
            Reject
          </button>
        </>
      )}
      {row.status === 'pending' && !canHandle && (
        <span className="text-gray-400 text-sm">Awaiting review</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Returns</h1>
        {user?.role === 'customer' && (
          <Link to="/returns/new" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            Request Return
          </Link>
        )}
      </div>

      <div className="bg-white shadow rounded-lg">
        <Table columns={columns} data={returns} actions={actions} loading={loading} />
      </div>
    </div>
  );
}

export default ReturnList;
