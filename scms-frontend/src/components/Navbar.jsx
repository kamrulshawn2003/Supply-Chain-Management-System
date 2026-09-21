// src/components/Navbar.jsx
import { Fragment, useEffect, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Bars3Icon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../api/endpoints/notifications';
import toast from 'react-hot-toast';

function Navbar({ onMenuClick }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState([]);

  const fetchUnread = async () => {
    try {
      const response = await notificationsAPI.unreadCount();
      const count = response.data?.data?.count ?? response.data?.count ?? 0;
      setUnreadCount(count);
    } catch (error) {
      // Silent — badge is non-critical
    }
  };

  const fetchRecent = async () => {
    try {
      const response = await notificationsAPI.getAll({ limit: 5 });
      let list = [];
      if (Array.isArray(response.data)) list = response.data;
      else if (response.data.data && Array.isArray(response.data.data)) list = response.data.data;
      setRecent(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch (error) {
      // Silent
    }
  };

  const fetchAll = async () => {
    await Promise.all([fetchUnread(), fetchRecent()]);
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await notificationsAPI.markRead(notification.id);
        setRecent((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (error) {
        // continue to navigation even if mark-read failed
      }
    }
    if (notification.link) navigate(notification.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setRecent((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notification bell */}
          <Menu as="div" className="relative">
            <Menu.Button className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500">
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-blue-600 hover:text-blue-900"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {recent.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">No notifications</p>
                  ) : (
                    recent.map((notification) => (
                      <Menu.Item key={notification.id}>
                        {({ active }) => (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } block w-full px-4 py-3 text-left`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-900 truncate">
                                {notification.title}
                              </span>
                              {!notification.read && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600"></span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="mt-0.5 text-[10px] text-gray-400">
                              {formatTime(notification.createdAt)}
                            </p>
                          </button>
                        )}
                      </Menu.Item>
                    ))
                  )}
                </div>

                <div className="border-t border-gray-100 px-4 py-2">
                  <button
                    onClick={() => navigate('/notifications')}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    View all notifications
                  </button>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-4 text-sm font-semibold leading-6 text-gray-900">
                  {user?.name}
                </span>
                <span className="ml-2 text-xs text-gray-500 capitalize">
                  ({user?.role})
                </span>
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } block px-3 py-1 text-sm leading-6 text-gray-900 w-full text-left`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
