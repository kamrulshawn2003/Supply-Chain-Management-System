// src/pages/admin/AdminUsers.jsx
import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { usersAPI } from '../../api/endpoints/users';
import { warehousesAPI } from '../../api/endpoints/warehouses';
import { suppliersAPI } from '../../api/endpoints/suppliers';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

function extractList(responseData) {
  if (Array.isArray(responseData)) return responseData;
  if (responseData?.data && Array.isArray(responseData.data)) return responseData.data;
  return [];
}

const ROLES = ['admin', 'supplier', 'warehouse_manager', 'customer', 'driver'];
const emptyForm = { name: '', email: '', password: '', role: 'customer', warehouseId: '', supplierId: '' };

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      setUsers(extractList(response.data));
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [wh, sp] = await Promise.all([
        warehousesAPI.getAll(),
        suppliersAPI.getAll(),
      ]);
      setWarehouses(extractList(wh.data));
      setSuppliers(extractList(sp.data));
    } catch (error) {
      // Options are non-critical
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'customer',
      warehouseId: user.warehouseId || '',
      supplierId: user.supplierId || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      warehouseId: form.warehouseId ? Number(form.warehouseId) : null,
      supplierId: form.supplierId ? Number(form.supplierId) : null,
    };
    if (form.password) payload.password = form.password;

    try {
      setSaving(true);
      if (editing) {
        await usersAPI.update(editing.id, payload);
        toast.success('User updated');
      } else {
        await usersAPI.create(payload);
        toast.success('User created');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(id);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const roleStyles = {
    admin: 'bg-purple-100 text-purple-800',
    supplier: 'bg-indigo-100 text-indigo-800',
    warehouse_manager: 'bg-blue-100 text-blue-800',
    customer: 'bg-green-100 text-green-800',
    driver: 'bg-orange-100 text-orange-800',
  };

  const columns = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' },
    {
      key: 'role',
      title: 'Role',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[value] || 'bg-gray-100 text-gray-800'}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'Warehouse',
      title: 'Warehouse',
      render: (value) => value?.name || '—',
    },
    {
      key: 'Supplier',
      title: 'Supplier',
      render: (value) => value?.name || '—',
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
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button onClick={openCreate} className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <Table columns={columns} data={users} actions={actions} loading={loading} />
      </div>

      <Modal open={modalOpen} setOpen={setModalOpen} title={editing ? 'Edit User' : 'Add User'}>
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
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password {editing && '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              required={!editing}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={inputClass}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          {form.role === 'warehouse_manager' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Warehouse</label>
              <select
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                className={inputClass}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    #{warehouse.id} - {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {form.role === 'supplier' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className={inputClass}
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
          )}
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

export default AdminUsers;
