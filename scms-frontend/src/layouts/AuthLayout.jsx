// src/layouts/AuthLayout.jsx
import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600">SCMS</h1>
          <p className="mt-2 text-gray-600">Supply Chain Management System</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;