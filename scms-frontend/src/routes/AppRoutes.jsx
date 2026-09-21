// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { lazy, Suspense } from 'react';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';

// Components
import ProtectedRoute from '../components/ProtectedRoute';
import RoleGuard from '../components/RoleGuard';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy loaded pages
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome'));
const ProductList = lazy(() => import('../pages/products/ProductList'));
const AddProduct = lazy(() => import('../pages/products/AddProduct'));
const EditProduct = lazy(() => import('../pages/products/EditProduct'));
const StockOverview = lazy(() => import('../pages/inventory/StockOverview'));
const WarehouseStock = lazy(() => import('../pages/inventory/WarehouseStock'));
const LowStockAlerts = lazy(() => import('../pages/inventory/LowStockAlerts'));
const CreateOrder = lazy(() => import('../pages/orders/CreateOrder'));
const OrderList = lazy(() => import('../pages/orders/OrderList'));
const OrderDetails = lazy(() => import('../pages/orders/OrderDetails'));
const RevenueReport = lazy(() => import('../pages/reports/RevenueReport'));
const Analytics = lazy(() => import('../pages/reports/Analytics'));
const PurchaseOrderList = lazy(() => import('../pages/purchasing/PurchaseOrderList'));
const PurchaseOrderCreate = lazy(() => import('../pages/purchasing/PurchaseOrderCreate'));
const ReturnList = lazy(() => import('../pages/returns/ReturnList'));
const ReturnRequest = lazy(() => import('../pages/returns/ReturnRequest'));
const NotificationsPage = lazy(() => import('../pages/notifications/NotificationsPage'));
const AdminSuppliers = lazy(() => import('../pages/admin/AdminSuppliers'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminWarehouses = lazy(() => import('../pages/admin/AdminWarehouses'));

function AppRoutes() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
          />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<DashboardLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardHome />} />
            
            {/* Products */}
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/products/edit/:id" element={<EditProduct />} />
            
            {/* Inventory */}
            <Route path="/inventory" element={<StockOverview />} />
            <Route path="/inventory/warehouse/:id" element={<WarehouseStock />} />
            <Route path="/inventory/low-stock" element={<LowStockAlerts />} />
            
            {/* Orders */}
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/create" element={<CreateOrder />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            
            {/* Reports (Admin only) */}
            <Route 
              path="/reports/revenue" 
              element={
                <RoleGuard roles={['admin']}>
                  <RevenueReport />
                </RoleGuard>
              } 
            />
            <Route 
              path="/reports/analytics" 
              element={
                <RoleGuard roles={['admin', 'warehouse_manager']}>
                  <Analytics />
                </RoleGuard>
              } 
            />

            {/* Purchasing */}
            <Route 
              path="/purchase-orders" 
              element={
                <RoleGuard roles={['admin', 'supplier']}>
                  <PurchaseOrderList />
                </RoleGuard>
              } 
            />
            <Route 
              path="/purchase-orders/create" 
              element={
                <RoleGuard roles={['admin']}>
                  <PurchaseOrderCreate />
                </RoleGuard>
              } 
            />

            {/* Returns */}
            <Route 
              path="/returns" 
              element={
                <RoleGuard roles={['admin', 'warehouse_manager', 'customer']}>
                  <ReturnList />
                </RoleGuard>
              } 
            />
            <Route 
              path="/returns/new" 
              element={
                <RoleGuard roles={['customer']}>
                  <ReturnRequest />
                </RoleGuard>
              } 
            />

            {/* Notifications (all authenticated roles) */}
            <Route path="/notifications" element={<NotificationsPage />} />

            {/* Admin management */}
            <Route 
              path="/admin/suppliers" 
              element={
                <RoleGuard roles={['admin']}>
                  <AdminSuppliers />
                </RoleGuard>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <RoleGuard roles={['admin']}>
                  <AdminUsers />
                </RoleGuard>
              } 
            />
            <Route 
              path="/admin/warehouses" 
              element={
                <RoleGuard roles={['admin']}>
                  <AdminWarehouses />
                </RoleGuard>
              } 
            />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;