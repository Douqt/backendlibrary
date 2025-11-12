import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, Calendar, DollarSign, BookOpen } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';

const NotificationBell = ({ user, setActiveTab }) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.user_type === 'member') {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: {
          'x-user-type': user.user_type,
          'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
        },
        withCredentials: true
      });

      setNotifications(response.data.notifications || []);
      setNotificationCount(response.data.count || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'due_today':
      case 'due_soon':
        return <Calendar className="h-4 w-4 text-gray-600" />;
      case 'unpaid_fine':
        return <DollarSign className="h-4 w-4 text-gray-600" />;
      case 'loan_limit':
        return <BookOpen className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleNotificationClick = (notification) => {
    setActiveTab(notification.link);
    setShowNotifications(false);
  };

  // Don't show notification bell for staff or when not logged in
  if (!user || user.user_type !== 'member') {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => (
                    <button
                      key={index}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {notification.message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
