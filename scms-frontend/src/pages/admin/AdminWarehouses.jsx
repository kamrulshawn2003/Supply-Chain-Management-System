// src/pages/admin/AdminWarehouses.jsx
import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { warehousesAPI } from '../../api/endpoints/warehouses';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

function extractList(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (responseData?.data && Array.isArray(responseData.data)) return responseData.data;
  return [];
}

const emptyForm = { name: '', location: '', manager: '', isActive: true };

function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehousesAPI.getAll();
      setWarehouses(extractList(response.data));
    } catch (error) {
      toast.error('Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (warehouse) => {
    setEditing(warehouse);
    setForm({
      name: warehouse.name || '',
      location: warehouse.location || '',
      manager: warehouse.manager || '',
      isActive: warehouse.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) {
        await warehousesAPI.update(editing.id, form);
        toast.success('Warehouse updated');
      } else {
        await warehousesAPI.create(form);
        toast.success('Warehouse created');
      }
      setModalOpen(false);
      fetchWarehouses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save warehouse');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this warehouse?')) return;
    try {
      await warehousesAPI.delete(id);
      toast.success('Warehouse deleted');
      fetchWarehouses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete warehouse');
    }
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'location', title: 'Location' },
    { key: 'manager', title: 'Manager' },
    {
      key: 'isActive',
      title: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {value !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const actions = (row) => (
    <div className="flex gap-2">
      <button onClick={() => openEdit(row)} className="text-blue-600 hover:text-blue-900">
        Edit
      </button>
      <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-900">
        Delete
      </button>
    </div>
  );

  const inputClass = 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Warehouse
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <Table columns={columns} data={warehouses} actions={actions} loading={loading} />
      </div>

      <Modal open={modalOpen} setOpen={setModalOpen} title={editing ? 'Edit Warehouse' : 'Add Warehouse'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Manager</label>
            <input
              type="text"
              value={form.manager}
              onChange={(e) => setForm({ ...form, manager: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AdminWarehouses;
