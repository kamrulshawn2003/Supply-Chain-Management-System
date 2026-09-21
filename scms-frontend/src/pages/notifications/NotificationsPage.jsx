// src/pages/notifications/NotificationsPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { notificationsAPI } from '../../api/endpoints/notifications';
import toast from 'react-hot-toast';

const typeStyles = {
  ORDER: 'bg-blue-100 text-blue-800',
  PO: 'bg-indigo-100 text-indigo-800',
  RETURN: 'bg-purple-100 text-purple-800',
  LOW_STOCK: 'bg-red-100 text-red-800',
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll();
      let rawList = [];
      if (Array.isArray(response.data)) rawList = response.data;
      else if (response.data.data && Array.isArray(response.data.data)) rawList = response.data.data;
      setNotifications(rawList);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: n.readAt || new Date().toISOString() }))
      );
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-gray-500">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-secondary">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Mark all as read
          </button>
        )}
      </div>

      {!notifications.length ? (
        <div className="bg-white shadow rounded-lg text-center py-12 text-gray-500">
          No notifications yet
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-6 py-4 flex items-start justify-between gap-4 ${
                notification.read ? 'bg-white' : 'bg-blue-50/60'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeStyles[notification.type] || 'bg-gray-100 text-gray-800'}`}>
                    {notification.type}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDate(notification.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {notification.link && (
                  <Link
                    to={notification.link}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    View
                  </Link>
                )}
                {!notification.read && (
                  <button
                    onClick={() => handleMarkRead(notification.id)}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
