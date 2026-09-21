// src/pages/products/ProductList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { productsAPI } from '../../api/endpoints/products';
import Table from '../../components/Table';
import toast from 'react-hot-toast';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll({ search: searchTerm });
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productsAPI.delete(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'category', title: 'Category' },
    {
      key: 'price',
      title: 'Price',
      render: (value) => `$${value?.toFixed(2)}`,
    },
    { key: 'description', title: 'Description' },
  ];

  const actions = (row) => (
    <div className="flex space-x-2">
      <Link
        to={`/products/edit/${row.id}`}
        className="text-blue-600 hover:text-blue-900"
      >
        Edit
      </Link>
      <button
        onClick={() => handleDelete(row.id)}
        className="text-red-600 hover:text-red-900"
      >
        Delete
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          to="/products/add"
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Product
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <Table
          columns={columns}
          data={products}
          actions={actions}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default ProductList;