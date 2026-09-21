import { useState, useEffect } from 'react';
import { inventoryAPI } from '../../api/endpoints/inventory';
import Table from '../../components/Table';
import toast from 'react-hot-toast';

function StockOverview() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.getStockOverview();
      const rawList = response.data.data;
      // Transform nested backend data to flat table fields
      const formattedData = rawList.map((item) => ({
        productName: item.Product?.name || 'Unnamed Product',
        totalStock: item.quantity,
        warehouse: item.Warehouse?.name || 'No Warehouse',
        status: item.quantity > item.lowStockThreshold ? 'In Stock' : 'Low Stock'
      }));
      setInventory(formattedData);
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'productName', title: 'Product' },
    { key: 'totalStock', title: 'Total Stock' },
    { key: 'warehouse', title: 'Warehouse' },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'In Stock' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Stock Overview</h1>
      <div className="bg-white shadow rounded-lg">
        <Table columns={columns} data={inventory} loading={loading} />
      </div>
    </div>
  );
}

export default StockOverview;