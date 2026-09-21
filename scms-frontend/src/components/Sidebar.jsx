// src/components/Sidebar.jsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ShoppingBagIcon,
  ArrowPathIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'supplier', 'warehouse_manager', 'customer', 'driver'] },
  { name: 'Products', href: '/products', icon: CubeIcon, roles: ['admin', 'supplier'] },
  { name: 'Inventory', href: '/inventory', icon: ClipboardDocumentListIcon, roles: ['admin', 'warehouse_manager', 'supplier'] },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon, roles: ['admin', 'warehouse_manager', 'customer', 'driver'] },
  { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingBagIcon, roles: ['admin', 'supplier'] },
  { name: 'Returns', href: '/returns', icon: ArrowPathIcon, roles: ['admin', 'warehouse_manager', 'customer'] },
  { name: 'Revenue Report', href: '/reports/revenue', icon: ChartBarIcon, roles: ['admin'] },
  { name: 'Analytics', href: '/reports/analytics', icon: ChartBarIcon, roles: ['admin', 'warehouse_manager'] },
  { name: 'Suppliers', href: '/admin/suppliers', icon: GlobeAltIcon, roles: ['admin'] },
  { name: 'Users', href: '/admin/users', icon: UsersIcon, roles: ['admin'] },
  { name: 'Warehouses', href: '/admin/warehouses', icon: BuildingOfficeIcon, roles: ['admin'] },
];

function Sidebar({ open, setOpen }) {
  const { user } = useSelector((state) => state.auth);

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-blue-600 px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <h1 className="text-white text-2xl font-bold">SCMS</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {filteredNavigation.map((item) => (
                            <li key={item.name}>
                              <NavLink
                                to={item.href}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                  `${
                                    isActive
                                      ? 'bg-blue-700 text-white'
                                      : 'text-blue-200 hover:text-white hover:bg-blue-700'
                                  } group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold`
                                }
                              >
                                <item.icon className="h-6 w-6 shrink-0" />
                                {item.name}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-blue-600 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-white text-2xl font-bold">SCMS</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          `${
                            isActive
                              ? 'bg-blue-700 text-white'
                              : 'text-blue-200 hover:text-white hover:bg-blue-700'
                          } group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold`
                        }
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}

export default Sidebar;