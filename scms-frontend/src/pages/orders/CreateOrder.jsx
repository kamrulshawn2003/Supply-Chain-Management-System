import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../api/endpoints/orders';
import { productsAPI } from '../../api/endpoints/products';
import { warehousesAPI } from '../../api/endpoints/warehouses';
import toast from 'react-hot-toast';

function CreateOrder() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    productId: '',
    warehouseId: '',
    quantity: 1,
    shippingAddress: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  // Safe fetch for products, auto detect response shape
  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      console.log("Product API raw response:", response.data);
      let data = [];
      if (Array.isArray(response.data)) data = response.data;
      else if (response.data.data && Array.isArray(response.data.data)) data = response.data.data;
      setProducts(data);
    } catch (error) {
      console.error("Fetch product error:", error);
      toast.error('Failed to fetch products');
    }
  };

  // Safe fetch for warehouses
  const fetchWarehouses = async () => {
    try {
      const response = await warehousesAPI.getAll();
      console.log("Warehouse API raw response:", response.data);
      let data = [];
      if (Array.isArray(response.data)) data = response.data;
      else if (response.data.data && Array.isArray(response.data.data)) data = response.data.data;
      setWarehouses(data);
    } catch (error) {
      console.error("Fetch warehouse error:", error);
      toast.error('Failed to fetch warehouse list');
    }
  };

  const calculateTotal = () => {
    const product = products.find(p => p.id === parseInt(formData.productId));
    return product ? product.price * formData.quantity : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productId || !formData.warehouseId) {
      toast.error('Please select product and warehouse');
      return;
    }

    try {
      setSubmitting(true);
      await ordersAPI.create({
        productId: parseInt(formData.productId),
        warehouseId: parseInt(formData.warehouseId),
        quantity: parseInt(formData.quantity),
        shippingAddress: formData.shippingAddress,
      });
      toast.success('Order created successfully');
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Order</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product</label>
          <select
            value={formData.productId}
            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - ${product.price}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Warehouse</label>
          <select
            value={formData.warehouseId}
            onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
            className="input-field"
            required
          >
            <option value="">Select warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                #{warehouse.id} - {warehouse.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Shipping Address</label>
          <textarea
            value={formData.shippingAddress}
            onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
            rows={3}
            className="input-field"
            required
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Estimated Total:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => navigate('/orders')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateOrder;