import React, { useContext, useState, useEffect } from 'react';
import { NotificationContext } from '../context/NotificationContext';
import { format } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';

const Notifications = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    fetchNotifications,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    getNotificationIcon
  } = useContext(NotificationContext);

  const [filter, setFilter] = useState('all'); // all, unread, read
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Filter notifications based on selected filter
    if (filter === 'all') {
      setFilteredNotifications(notifications);
    } else if (filter === 'unread') {
      setFilteredNotifications(notifications.filter(n => !n.isRead));
    } else if (filter === 'read') {
      setFilteredNotifications(notifications.filter(n => n.isRead));
    }
  }, [notifications, filter]);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
  };

  const handleMarkAllRead = () => {
    if (window.confirm('Mark all notifications as read?')) {
      markAllAsRead();
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Delete all notifications? This cannot be undone.')) {
      const deletePromises = notifications.map(n => deleteNotification(n._id));
      await Promise.all(deletePromises);
    }
  };

  if (loading && notifications.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-left">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount} unread</span>
          )}
        </div>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button 
              className="btn btn-secondary"
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              className="btn btn-danger"
              onClick={handleDeleteAll}
            >
              Delete all
            </button>
          )}
        </div>
      </div>

      <div className="notifications-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
        <button 
          className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
          onClick={() => setFilter('read')}
        >
          Read ({notifications.filter(n => n.isRead).length})
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No notifications</h3>
            <p>
              {filter === 'all' && 'You have no notifications yet.'}
              {filter === 'unread' && 'You have no unread notifications.'}
              {filter === 'read' && 'You have no read notifications.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div 
              key={notification._id} 
              className={`notification-card ${notification.isRead ? '' : 'unread'}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <div className="notification-meta">
                  <span className="notification-time">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                  {!notification.isRead && (
                    <span className="unread-indicator">● New</span>
                  )}
                </div>
              </div>
              <div className="notification-actions">
                {!notification.isRead && (
                  <button 
                    className="mark-read-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification._id);
                    }}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this notification?')) {
                      deleteNotification(notification._id);
                    }
                  }}
                  title="Delete notification"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx="true">{`
        .notifications-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .notifications-header h1 {
          margin: 0;
          font-size: 2rem;
          color: #2D3748;
        }

        .unread-badge {
          background: #E53E3E;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .btn-secondary {
          background: #3182CE;
          color: white;
        }

        .btn-secondary:hover {
          background: #2C5AA0;
        }

        .btn-danger {
          background: #E53E3E;
          color: white;
        }

        .btn-danger:hover {
          background: #C53030;
        }

        .notifications-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 5px;
        }

        .filter-btn {
          background: none;
          border: none;
          padding: 10px 20px;
          font-size: 0.95rem;
          cursor: pointer;
          color: #718096;
          transition: all 0.2s;
          border-bottom: 3px solid transparent;
          margin-bottom: -7px;
        }

        .filter-btn:hover {
          color: #2D3748;
        }

        .filter-btn.active {
          color: #3182CE;
          border-bottom-color: #3182CE;
          font-weight: 600;
        }

        .error-message {
          background: #FED7D7;
          border: 1px solid #FC8181;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #C53030;
        }

        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .notification-card {
          background: white;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 15px;
          display: flex;
          align-items: flex-start;
          gap: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .notification-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-color: #CBD5E0;
        }

        .notification-card.unread {
          background: #EBF8FF;
          border-left: 4px solid #3182CE;
        }

        .notification-icon {
          font-size: 1.5rem;
          min-width: 32px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .notification-content {
          flex: 1;
        }

        .notification-message {
          margin: 0 0 8px 0;
          color: #2D3748;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .notification-meta {
          display: flex;
          align-items: center;
          gap: 15px;
          font-size: 0.85rem;
        }

        .notification-time {
          color: #718096;
        }

        .unread-indicator {
          color: #3182CE;
          font-weight: 600;
        }

        .notification-actions {
          display: flex;
          gap: 5px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .notification-card:hover .notification-actions {
          opacity: 1;
        }

        .mark-read-btn,
        .delete-btn {
          background: none;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 1.2rem;
        }

        .mark-read-btn {
          color: #48BB78;
        }

        .mark-read-btn:hover {
          background: #C6F6D5;
        }

        .delete-btn {
          color: #E53E3E;
        }

        .delete-btn:hover {
          background: #FED7D7;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #718096;
        }

        .empty-icon {
          font-size: 4rem;
          display: block;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          margin: 0 0 10px 0;
          color: #4A5568;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.95rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .notifications-page {
            padding: 15px;
          }

          .notifications-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-left {
            width: 100%;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .notifications-header h1 {
            font-size: 1.5rem;
          }

          .notification-card {
            padding: 12px;
          }

          .notification-actions {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Notifications;
