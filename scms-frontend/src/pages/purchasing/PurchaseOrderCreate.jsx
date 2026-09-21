// src/pages/purchasing/PurchaseOrderCreate.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { purchaseOrdersAPI } from '../../api/endpoints/purchaseOrders';
import { suppliersAPI } from '../../api/endpoints/suppliers';
import { warehousesAPI } from '../../api/endpoints/warehouses';
import { productsAPI } from '../../api/endpoints/products';
import toast from 'react-hot-toast';

function extractList(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (responseData?.data && Array.isArray(responseData.data)) return responseData.data;
  return [];
}

function PurchaseOrderCreate() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitPrice: '' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(extractList(response.data));
    } catch (error) {
      toast.error('Failed to fetch suppliers');
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesAPI.getAll();
      setWarehouses(extractList(response.data));
    } catch (error) {
      toast.error('Failed to fetch warehouses');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(extractList(response.data));
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  // Only products belonging to the selected supplier are valid options
  const supplierProducts = products.filter(
    (p) => !supplierId || Number(p.SupplierId) === Number(supplierId)
  );

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, unitPrice: '' }]);
  };

  const removeItem = (index) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const lineTotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return qty * price;
  };

  const grandTotal = items.reduce((sum, item) => sum + lineTotal(item), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!supplierId || !warehouseId) {
      toast.error('Please select supplier and warehouse');
      return;
    }

    const validItems = items.filter((item) => item.productId && Number(item.quantity) > 0);
    if (!validItems.length) {
      toast.error('Add at least one item with quantity');
      return;
    }

    try {
      setSubmitting(true);
      await purchaseOrdersAPI.create({
        supplierId: Number(supplierId),
        warehouseId: Number(warehouseId),
        expectedDate: expectedDate || null,
        notes: notes || null,
        items: validItems.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });
      toast.success('Purchase order created');
      navigate('/purchase-orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Purchase Order</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                setItems((prev) => prev.map((item) => ({ ...item, productId: '' })));
              }}
              className="input-field"
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Expected Delivery Date</label>
            <input
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              placeholder="Optional notes"
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">Line Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary text-sm">
              <PlusIcon className="h-4 w-4 mr-1 inline" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-500">Product</label>
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select product</option>
                    {supplierProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (${product.price})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-700 pb-2">
                  ${lineTotal(item).toFixed(2)}
                </div>
                <div className="col-span-1 pb-2">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="text-red-500 hover:text-red-700 disabled:opacity-30"
                    title="Remove item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end text-lg font-bold mt-4 border-t pt-4">
            <span>Grand Total:</span>
            <span className="ml-3">${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => navigate('/purchase-orders')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PurchaseOrderCreate;
