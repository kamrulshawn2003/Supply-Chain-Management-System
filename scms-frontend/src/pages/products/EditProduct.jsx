import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { productsAPI } from '../../api/endpoints/products';
import toast from 'react-hot-toast';

// FIX BUG 8: Removed SKU, stock, reorderLevel from schema (not present in backend model)
const schema = yup.object({
  name: yup.string().required('Product name is required'),
  price: yup.number().positive('Price must be positive').required('Price is required'),
  category: yup.string().nullable(),
  description: yup.string().nullable(),
  SupplierId: yup.number().integer().nullable(),
});

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // FIX BUG 9: Use getById instead of getAll + local find
  const fetchProduct = async () => {
    try {
      const response = await productsAPI.getById(id);
      const product = response.data;

      // Populate only fields that exist on backend model
      setValue('name', product.name);
      setValue('price', product.price);
      setValue('category', product.category);
      setValue('description', product.description);
      setValue('SupplierId', product.SupplierId);
    } catch (error) {
      toast.error('Failed to fetch product');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      await productsAPI.update(id, data);
      toast.success('Product updated successfully');
      navigate('/products');
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input {...register('name')} type="text" className="input-field" />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input {...register('price')} type="number" step="0.01" className="input-field" />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select {...register('category')} className="input-field">
              <option value="">Select category</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="food">Food & Beverages</option>
              <option value="furniture">Furniture</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier ID</label>
            <input {...register('SupplierId')} type="number" className="input-field" />
          </div>
          {/* DELETED: SKU, Stock, Reorder Level inputs — backend model does not support them */}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea {...register('description')} rows={3} className="input-field" />
        </div>
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => navigate('/products')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
            {submitting ? 'Updating...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;