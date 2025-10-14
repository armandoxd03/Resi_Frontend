import { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import apiService from '../api';

function Messages() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessage, setNewMessage] = useState({
    recipientId: '',
    recipientEmail: '',
    subject: '',
    content: ''
  });

  const { user } = useContext(AuthContext);
  const { success, error: showError } = useContext(AlertContext);

  // Check if we came from another page with pre-filled data
  useEffect(() => {
    if (location.state) {
      const { recipientEmail, recipientId, recipientName, subject } = location.state;
      if (recipientEmail || recipientId) {
        setNewMessage({
          recipientId: recipientId || '',
          recipientEmail: recipientEmail || '',
          subject: subject || '',
          content: ''
        });
        setShowComposeModal(true);
      }
    }
  }, [location.state]);

  useEffect(() => {
    loadMessages();
  }, [activeTab]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      let response;
      
      if (activeTab === 'inbox') {
        response = await apiService.getInbox();
        console.log('Inbox response:', response);
        const messagesData = response?.data?.data?.messages || response?.data?.messages || [];
        const unread = response?.data?.data?.unreadCount || response?.data?.unreadCount || 0;
        setMessages(messagesData);
        setUnreadCount(unread);
      } else {
        response = await apiService.getSentMessages();
        console.log('Sent messages response:', response);
        const messagesData = response?.data?.data || response?.data || [];
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      showError(error.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    
    // Mark as read if it's an inbox message and unread
    if (activeTab === 'inbox' && !message.isRead) {
      try {
        await apiService.markMessageAsRead(message._id);
        loadMessages(); // Refresh to update unread count
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyContent.trim()) {
      showError('Please enter a message');
      return;
    }

    try {
      const messageData = {
        recipientId: selectedMessage.sender._id,
        subject: `Re: ${selectedMessage.subject}`,
        content: replyContent,
      };
      
      // Add optional fields if they exist
      if (selectedMessage.relatedJob?._id) {
        messageData.relatedJobId = selectedMessage.relatedJob._id;
      }
      if (selectedMessage._id) {
        messageData.parentMessageId = selectedMessage._id;
      }
      
      console.log('Sending reply:', messageData);
      const response = await apiService.sendMessage(messageData);
      console.log('Reply response:', response);
      
      success('Reply sent successfully');
      setReplyContent('');
      setShowReplyModal(false);
      setSelectedMessage(null);
      loadMessages();
    } catch (error) {
      console.error('Failed to send reply:', error);
      showError(error.message || 'Failed to send reply');
    }
  };

  const handleComposeMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.recipientId && !newMessage.recipientEmail) || !newMessage.subject.trim() || !newMessage.content.trim()) {
      showError('Please provide recipient (ID or email), subject, and message');
      return;
    }

    try {
      console.log('Sending new message:', newMessage);
      const messageData = {
        subject: newMessage.subject,
        content: newMessage.content
      };
      
      // Send either recipientId or recipientEmail
      if (newMessage.recipientId) {
        messageData.recipientId = newMessage.recipientId;
      } else if (newMessage.recipientEmail) {
        messageData.recipientEmail = newMessage.recipientEmail;
      }
      
      const response = await apiService.sendMessage(messageData);
      console.log('Send message response:', response);
      
      success('Message sent successfully');
      setNewMessage({ recipientId: '', recipientEmail: '', subject: '', content: '' });
      setShowComposeModal(false);
      setActiveTab('sent');
      loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      showError(error.message || 'Failed to send message');
    }
  };

  const handleDelete = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      await apiService.deleteMessage(messageId);
      success('Message deleted');
      setSelectedMessage(null);
      loadMessages();
    } catch (error) {
      console.error('Failed to delete message:', error);
      showError('Failed to delete message');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1>Messages</h1>
        <div className="header-actions">
          <button className="compose-btn" onClick={() => setShowComposeModal(true)}>
            ✉️ New Message
          </button>
          <Link to="/landing" className="back-btn">Back</Link>
        </div>
      </div>

      <div className="messages-tabs">
        <button
          className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent
        </button>
      </div>

      <div className="messages-content">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : (
          <>
            <div className="messages-list">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>No messages yet</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`message-item ${!message.isRead && activeTab === 'inbox' ? 'unread' : ''} ${selectedMessage?._id === message._id ? 'selected' : ''}`}
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="message-item-header">
                      <div className="message-sender">
                        {activeTab === 'inbox' 
                          ? `${message.sender?.firstName} ${message.sender?.lastName}`
                          : `${message.recipient?.firstName} ${message.recipient?.lastName}`
                        }
                      </div>
                      <div className="message-date">{formatDate(message.createdAt)}</div>
                    </div>
                    <div className="message-subject">{message.subject}</div>
                    <div className="message-preview">
                      {message.content.substring(0, 60)}...
                    </div>
                    {message.relatedJob && (
                      <div className="message-job-tag">
                        Related to: {message.relatedJob.title}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {selectedMessage && (
              <div className="message-detail">
                <div className="message-detail-header">
                  <button
                    className="close-detail-btn"
                    onClick={() => setSelectedMessage(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className="message-detail-content">
                  <h3>{selectedMessage.subject}</h3>
                  
                  <div className="message-meta">
                    <div className="message-from">
                      <strong>From:</strong>{' '}
                      {activeTab === 'inbox'
                        ? `${selectedMessage.sender?.firstName} ${selectedMessage.sender?.lastName}`
                        : `${selectedMessage.recipient?.firstName} ${selectedMessage.recipient?.lastName}`
                      }
                    </div>
                    <div className="message-time">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {selectedMessage.relatedJob && (
                    <div className="message-job-info">
                      <strong>Related Job:</strong> {selectedMessage.relatedJob.title}
                    </div>
                  )}

                  <div className="message-body">
                    {selectedMessage.content}
                  </div>

                  <div className="message-actions">
                    {activeTab === 'inbox' && (
                      <button
                        className="reply-btn"
                        onClick={() => setShowReplyModal(true)}
                      >
                        Reply
                      </button>
                    )}
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(selectedMessage._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reply to {selectedMessage.sender?.firstName}</h3>
              <button
                className="close-btn"
                onClick={() => setShowReplyModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReply} className="modal-form">
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={`Re: ${selectedMessage.subject}`}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows="6"
                  required
                  placeholder="Type your reply here..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowReplyModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose New Message Modal */}
      {showComposeModal && (
        <div className="modal-overlay" onClick={() => setShowComposeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Message</h3>
              <button
                className="close-btn"
                onClick={() => setShowComposeModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleComposeMessage} className="modal-form">
              <div className="form-group">
                <label>Recipient ID or Email</label>
                <input
                  type="text"
                  value={newMessage.recipientId}
                  onChange={(e) => setNewMessage({...newMessage, recipientId: e.target.value, recipientEmail: ''})}
                  placeholder="Enter recipient user ID"
                />
                <div style={{textAlign: 'center', margin: '0.5rem 0', color: '#718096', fontWeight: '600'}}>
                  OR
                </div>
                <input
                  type="email"
                  value={newMessage.recipientEmail}
                  onChange={(e) => setNewMessage({...newMessage, recipientEmail: e.target.value, recipientId: ''})}
                  placeholder="Enter recipient email address"
                />
                <small style={{color: '#718096', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block'}}>
                  💡 You can use either User ID or Email to send a message
                </small>
              </div>

              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  placeholder="Enter subject"
                  required
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                  rows="6"
                  required
                  placeholder="Type your message here..."
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowComposeModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .messages-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .messages-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .messages-header h1 {
          margin: 0;
          color: #2b6cb0;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .compose-btn {
          padding: 0.75rem 1.5rem;
          background: #2b6cb0;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 1rem;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .compose-btn:hover {
          background: #2c5282;
        }

        .back-btn {
          color: #666;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background-color 0.2s;
        }

        .back-btn:hover {
          background-color: #f7fafc;
        }

        .messages-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .tab-btn {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          color: #718096;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .tab-btn.active {
          color: #2b6cb0;
          border-bottom-color: #2b6cb0;
        }

        .tab-btn:hover {
          color: #2b6cb0;
        }

        .unread-badge {
          background: #e53e3e;
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 10px;
          margin-left: 0.5rem;
        }

        .messages-content {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 1.5rem;
          min-height: 500px;
        }

        .messages-list {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow-y: auto;
          max-height: 600px;
        }

        .message-item {
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .message-item:hover {
          background-color: #f7fafc;
        }

        .message-item.unread {
          background-color: #ebf8ff;
          font-weight: 600;
        }

        .message-item.selected {
          background-color: #bee3f8;
        }

        .message-item-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .message-sender {
          font-weight: 600;
          color: #2d3748;
        }

        .message-date {
          font-size: 0.875rem;
          color: #718096;
        }

        .message-subject {
          font-weight: 500;
          color: #4a5568;
          margin-bottom: 0.25rem;
        }

        .message-preview {
          font-size: 0.875rem;
          color: #718096;
        }

        .message-job-tag {
          font-size: 0.75rem;
          color: #2b6cb0;
          margin-top: 0.5rem;
          font-style: italic;
        }

        .no-messages {
          padding: 3rem;
          text-align: center;
          color: #718096;
        }

        .message-detail {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow-y: auto;
          max-height: 600px;
        }

        .message-detail-header {
          padding: 1rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
        }

        .close-detail-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #718096;
        }

        .close-detail-btn:hover {
          color: #2d3748;
        }

        .message-detail-content {
          padding: 1.5rem;
        }

        .message-detail-content h3 {
          margin: 0 0 1rem 0;
          color: #2d3748;
        }

        .message-meta {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .message-job-info {
          padding: 0.75rem;
          background: #ebf8ff;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: #2c5282;
        }

        .message-body {
          line-height: 1.6;
          color: #2d3748;
          margin-bottom: 1.5rem;
          white-space: pre-wrap;
        }

        .message-actions {
          display: flex;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .reply-btn {
          padding: 0.75rem 1.5rem;
          background: #2b6cb0;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .reply-btn:hover {
          background: #2c5282;
        }

        .delete-btn {
          padding: 0.75rem 1.5rem;
          background: #e53e3e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .delete-btn:hover {
          background: #c53030;
        }

        .loading {
          grid-column: 1 / -1;
          padding: 3rem;
          text-align: center;
          color: #718096;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #2b6cb0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .modal-form {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2b6cb0;
        }

        .disabled-input {
          background: #f7fafc;
          color: #718096;
          cursor: not-allowed;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .cancel-btn {
          background: #e2e8f0;
          color: #2d3748;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
        }

        .submit-btn {
          background: #2b6cb0;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
        }

        .submit-btn:hover {
          background: #2c5282;
        }

        @media (max-width: 768px) {
          .messages-content {
            grid-template-columns: 1fr;
          }

          .message-detail {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 100;
            border-radius: 0;
            max-height: 100vh;
          }
        }
      `}</style>
    </div>
  );
}

export default Messages;
