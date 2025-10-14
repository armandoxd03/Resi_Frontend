import { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import apiService from '../api';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isLoggedIn, user } = useContext(AuthContext);

  // Fetch notifications on initial load and when user logs in
  useEffect(() => {
    if (isLoggedIn && user) {
      fetchNotifications();
      // Set up polling interval for notifications
      const intervalId = setInterval(fetchNotifications, 60000); // Check every minute
      return () => clearInterval(intervalId);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn, user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications({ limit: 20 });
      
      if (response && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.meta?.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      // Decrement unread count if we just marked an unread notification as read
      const targetNotification = notifications.find(n => n._id === notificationId);
      if (targetNotification && !targetNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ 
          ...notification, 
          isRead: true 
        }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await apiService.deleteNotification(notificationId);
      
      // Remove from local state
      const updatedNotifications = notifications.filter(
        notification => notification._id !== notificationId
      );
      
      setNotifications(updatedNotifications);
      
      // Update unread count if we removed an unread notification
      const wasUnread = notifications.find(n => n._id === notificationId && !n.isRead);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Format the notification message based on its type
  const getNotificationIcon = (type) => {
    const icons = {
      job_accepted: '✅',
      job_completed: '🏆',
      rating_received: '⭐',
      verification_complete: '🔓',
      job_applied: '📝',
      admin_message: '👨‍💼',
      verification_needed: '🔒',
      security_alert: '🔔',
      goal_created: '🎯',
      job_match: '🔍',
      application_sent: '📤',
      rating_reported: '⚠️',
      user_reported: '🚩',
      report_resolved: '✓',
      profile_update: '👤',
      job_invitation: '📨',
      application_cancelled: '❌',
      application_rejected: '🚫',
      application_update: '📋',
      goal_income_added: '💰',
      goal_completed_job: '🏁'
    };
    
    return icons[type] || '📢';
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        getNotificationIcon,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
