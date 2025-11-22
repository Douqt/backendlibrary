import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Bell, AlertCircle, Calendar, DollarSign, BookOpen, UserCheck, CheckCheck, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

const NotificationBell = forwardRef(({ user, setActiveTab }, ref) => {
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
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'x-user-type': user.user_type,
          'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
        }
      });

      const data = await response.json();
      setNotifications(data.notifications || []);
      setNotificationCount(data.count || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  // Expose fetchNotifications to parent components via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchNotifications
  }));

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'due_today':
      case 'due_soon':
      case 'loan_confirmation':
      case 'loan_almost_due':
      case 'loan_due':
      case 'loan_overdue':
        return <Calendar className="h-4 w-4 text-gray-600" />;
      case 'unpaid_fine':
      case 'fine_paid':
        return <DollarSign className="h-4 w-4 text-gray-600" />;
      case 'loan_limit':
        return <BookOpen className="h-4 w-4 text-gray-600" />;
      case 'account_approved':
        return <UserCheck className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark notification as read if it has an ID (persistent notification)
    if (notification.notification_id) {
      try {
        await fetch(`${API_BASE_URL}/notifications/${notification.notification_id}/read`, {
          method: 'POST',
          headers: {
            'x-user-type': user.user_type,
            'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
          }
        });

        // Update local state to reflect read status
        setNotifications(prev =>
          prev.filter(n => n.notification_id !== notification.notification_id)
        );
        setNotificationCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    setActiveTab(notification.link);
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all notifications as read
      await Promise.all(
        notifications.map(notification =>
          fetch(`${API_BASE_URL}/notifications/${notification.notification_id}/read`, {
            method: 'POST',
            headers: {
              'x-user-type': user.user_type,
              'x-user-id': user.user_type === 'member' ? user.member_id : user.staff_id
            }
          })
        )
      );

      // Clear all notifications
      setNotifications([]);
      setNotificationCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Format timestamp as "X time ago"
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Don't show notification bell for staff or when not logged in
  if (!user || user.user_type !== 'member') {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowNotifications(!showNotifications);
          // Refresh notifications when opening the dropdown
          if (!showNotifications) {
            fetchNotifications();
          }
        }}
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className={`h-5 w-5 text-gray-700 ${notificationCount > 0 ? 'animate-pulse' : ''}`} />
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
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Notifications {notificationCount > 0 && `(${notificationCount})`}
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAllAsRead();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs text-gray-400 mt-1">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification, index) => (
                    <button
                      key={notification.notification_id || index}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full p-4 hover:bg-blue-50 transition-all duration-200 text-left flex items-start gap-3 border-l-2 border-transparent hover:border-blue-500"
                    >
                      <div className="flex-shrink-0 mt-0.5 p-2 bg-gray-100 rounded-full">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 leading-relaxed">
                          {notification.message}
                        </p>
                        {notification.created_at && (
                          <p className="text-xs text-gray-500 mt-1.5">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        )}
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
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;
