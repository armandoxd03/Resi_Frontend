import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NotificationContext } from '../context/NotificationContext';
import { format } from 'date-fns';

const NotificationDropdown = ({ isMobile = false }) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    getNotificationIcon
  } = useContext(NotificationContext);
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Close the dropdown
    setIsOpen(false);
    
    // Handle navigation based on notification type
    // This could be expanded based on your app's requirements
  };
  
  // Format time like "2 hours ago", "5 minutes ago", etc.
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
      return format(date, 'MMM d, yyyy');
    }
  };
  
  return (
    <div className={`notification-dropdown ${isMobile ? 'mobile' : ''}`} ref={dropdownRef}>
      {!isMobile && (
        <button 
          className="notification-bell" 
          onClick={toggleDropdown}
          aria-label="Notifications"
        >
          <span className="bell-icon">🔔</span>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </button>
      )}
      
      {(isOpen || isMobile) && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read" 
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {loading ? (
              <div className="loading-spinner">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <button 
                    className="delete-notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    aria-label="Delete notification"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="dropdown-footer">
            <Link to="/notifications" onClick={() => setIsOpen(false)}>
              View all notifications
            </Link>
          </div>
        </div>
      )}
      
      <style jsx="true">{`
        .notification-dropdown {
          position: relative;
          display: inline-block;
        }
        
        .notification-bell {
          background: none;
          border: none;
          position: relative;
          cursor: pointer;
          padding: 8px 12px;
          font-size: 1.5rem;
          color: #4A5568;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        
        .notification-bell:hover {
          color: #2B6CB0;
        }
        
        .notification-badge {
          position: absolute;
          top: 2px;
          right: 4px;
          min-width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #E53E3E;
          color: white;
          font-size: 0.7rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 5px);
          right: 0;
          width: 350px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-height: 500px;
          display: flex;
          flex-direction: column;
        }
        
        ${isMobile ? `
          .dropdown-menu {
            position: static;
            width: 100%;
            box-shadow: none;
            border: 1px solid #E2E8F0;
          }
        ` : ''}
        
        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #E2E8F0;
        }
        
        .dropdown-header h3 {
          margin: 0;
          color: #2D3748;
          font-size: 1.1rem;
        }
        
        .mark-all-read {
          background: none;
          border: none;
          color: #3182CE;
          font-size: 0.8rem;
          cursor: pointer;
          padding: 5px;
        }
        
        .mark-all-read:hover {
          text-decoration: underline;
        }
        
        .notification-list {
          overflow-y: auto;
          max-height: 400px;
          padding: 0;
        }
        
        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 12px 15px;
          border-bottom: 1px solid #EDF2F7;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
        }
        
        .notification-item:hover {
          background-color: #F7FAFC;
        }
        
        .notification-item.unread {
          background-color: #EBF8FF;
        }
        
        .notification-item.unread:hover {
          background-color: #E6FFFA;
        }
        
        .notification-icon {
          margin-right: 12px;
          font-size: 1.2rem;
          min-width: 24px;
          display: flex;
          justify-content: center;
        }
        
        .notification-content {
          flex: 1;
        }
        
        .notification-content p {
          margin: 0 0 5px;
          font-size: 0.9rem;
          color: #4A5568;
          line-height: 1.4;
        }
        
        .notification-time {
          display: block;
          font-size: 0.75rem;
          color: #718096;
        }
        
        .delete-notification {
          background: none;
          border: none;
          color: #A0AEC0;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0 5px;
          margin-left: 5px;
          opacity: 0;
          transition: opacity 0.2s, color 0.2s;
        }
        
        .notification-item:hover .delete-notification {
          opacity: 1;
        }
        
        .delete-notification:hover {
          color: #E53E3E;
        }
        
        .dropdown-footer {
          padding: 10px 15px;
          text-align: center;
          border-top: 1px solid #E2E8F0;
        }
        
        .dropdown-footer a {
          color: #3182CE;
          text-decoration: none;
          font-size: 0.85rem;
        }
        
        .dropdown-footer a:hover {
          text-decoration: underline;
        }
        
        .empty-state {
          padding: 30px 20px;
          text-align: center;
          color: #718096;
        }
        
        .empty-icon {
          font-size: 2rem;
          display: block;
          margin-bottom: 10px;
        }
        
        .loading-spinner {
          padding: 20px;
          text-align: center;
          color: #718096;
        }
        
        /* Mobile view */
        .notification-dropdown.mobile {
          width: 100%;
        }
        
        .notification-dropdown.mobile .dropdown-menu {
          position: relative;
          width: 100%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          max-height: 300px;
        }
        
        .notification-dropdown.mobile .notification-list {
          max-height: 200px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 480px) {
          .dropdown-menu {
            width: 300px;
            max-width: 90vw;
            right: -100%;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
