import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { inventoryAPI } from '../../api/endpoints/inventory';
import Table from '../../components/Table';
import toast from 'react-hot-toast';

function WarehouseStock() {
  const { id } = useParams();
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarehouseStock();
  }, [id]);

  const fetchWarehouseStock = async () => {
    try {
      const response = await inventoryAPI.getWarehouseStock(id);
      const rawList = response.data.data;
      // Transform nested backend data for table columns
      const formattedData = rawList.map((item) => ({
        productName: item.Product?.name || 'Unnamed Product',
        quantity: item.quantity,
        location: item.Warehouse?.location || 'No Location',
        lastUpdated: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A'
      }));
      setStock(formattedData);
    } catch (error) {
      toast.error('Failed to fetch warehouse stock');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'productName', title: 'Product' },
    { key: 'quantity', title: 'Quantity' },
    { key: 'location', title: 'Location' },
    { key: 'lastUpdated', title: 'Last Updated' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Warehouse Stock</h1>
      <div className="bg-white shadow rounded-lg">
        <Table columns={columns} data={stock} loading={loading} />
      </div>
    </div>
  );
}

export default WarehouseStock;