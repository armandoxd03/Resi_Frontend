import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import apiService from '../api';
import { getProfilePictureUrl } from '../utils/imageHelper';

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);
  
  const { user } = useAuth();
  const { success, error: showError } = useAlert();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Search users when searchQuery changes
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setSearching(true);
      apiService.searchUsers({ search: searchQuery.trim() })
        .then(res => {
          const users = res?.data?.users || res?.data?.data?.users || [];
          // Exclude self
          setSearchResults(users.filter(u => u._id !== user._id));
        })
        .catch((err) => {
          console.error('Search error:', err);
          showError('Failed to search users. Please try again.');
          setSearchResults([]);
        })
        .finally(() => setSearching(false));
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  }, [searchQuery, user._id]);

  // Poll for new messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);
      
      // Poll every 3 seconds for new messages
      pollingInterval.current = setInterval(() => {
        loadMessages(selectedConversation._id, true);
      }, 3000);
    }

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInbox();
      
      // Group messages by sender to create conversations
      const messagesData = response?.data?.data?.messages || response?.data?.messages || [];
      const conversationMap = new Map();
      
      messagesData.forEach(msg => {
        const otherUser = msg.sender._id === user._id ? msg.recipient : msg.sender;
        const userId = otherUser._id;
        
        if (!conversationMap.has(userId)) {
          conversationMap.set(userId, {
            _id: userId,
            user: otherUser,
            lastMessage: msg,
            unreadCount: 0
          });
        }
        
        if (!msg.isRead && msg.recipient._id === user._id) {
          conversationMap.get(userId).unreadCount++;
        }
      });
      
      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Failed to load conversations:', error);
      showError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (recipientId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const [inbox, sent] = await Promise.all([
        apiService.getInbox(),
        apiService.getSentMessages()
      ]);
      
      const inboxMsgs = inbox?.data?.data?.messages || inbox?.data?.messages || [];
      const sentMsgs = sent?.data?.data || sent?.data || [];
      
      // Filter messages for this conversation
      const conversationMsgs = [...inboxMsgs, ...sentMsgs]
        .filter(msg => 
          (msg.sender._id === recipientId || msg.recipient._id === recipientId)
        )
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      setMessages(conversationMsgs);
      
      // Mark unread messages as read
      const unreadMsgs = conversationMsgs.filter(msg => 
        !msg.isRead && msg.recipient._id === user._id
      );
      
      for (const msg of unreadMsgs) {
        try {
          await apiService.markMessageAsRead(msg._id);
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      if (!silent) showError('Failed to load messages');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      setSending(true);
      
      await apiService.sendMessage({
        recipientId: selectedConversation._id,
        subject: `Chat with ${selectedConversation.user.firstName}`,
        content: newMessage.trim()
      });
      
      setNewMessage('');
      await loadMessages(selectedConversation._id, true);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const filteredConversations = searchQuery.trim().length === 0
    ? conversations
    : conversations.filter(conv =>
        `${conv.user.firstName} ${conv.user.lastName}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
  // Start new conversation with searched user
  const handleStartConversation = (userObj) => {
    // Check if conversation already exists
    const existingConv = conversations.find(conv => conv.user._id === userObj._id);
    if (existingConv) {
      setSelectedConversation(existingConv);
    } else {
      // Create a temporary conversation object
      setSelectedConversation({
        _id: userObj._id,
        user: userObj,
        lastMessage: {},
        unreadCount: 0
      });
      setMessages([]);
    }
  };

  const formatTime = (date) => {
    const msgDate = new Date(date);
    const now = new Date();
    const diff = now - msgDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return msgDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="chat-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading conversations...</p>
        </div>
        <style>{chatStyles}</style>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-layout">
        {/* Conversations Sidebar */}
        <div className={`conversations-sidebar ${selectedConversation ? 'mobile-hide' : ''}`}>
          <div className="sidebar-header">
            <h2>Messages</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search users or conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          {/* Show search status */}
          {searchQuery.trim().length > 0 && (
            <div className="search-results-list">
              <div className="search-results-header">
                {searching ? 'Searching...' : `Users ${searchResults.length > 0 ? `(${searchResults.length})` : ''}`}
              </div>
              {searching ? (
                <div className="search-loading">
                  <div className="spinner-sm"></div>
                  <span>Searching users...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(userObj => (
                  <div
                    key={userObj._id}
                    className="conversation-item"
                    onClick={() => handleStartConversation(userObj)}
                  >
                    <div className="conv-avatar">
                      {userObj.profilePicture ? (
                        <img src={getProfilePictureUrl(userObj)} alt={userObj.firstName} />
                      ) : (
                        <div className="avatar-placeholder">
                          {userObj.firstName?.[0]}{userObj.lastName?.[0]}
                        </div>
                      )}
                      <span className="online-indicator"></span>
                    </div>
                    <div className="conv-info">
                      <div className="conv-header">
                        <h3>{userObj.firstName} {userObj.lastName}</h3>
                        <span className="user-type">{userObj.userType}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-no-results">
                  <span>No users found</span>
                </div>
              )}
            </div>
          )}

          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <div className="empty-state">
                <p>No conversations yet</p>
                <span>Start chatting with employees or employers!</span>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  className={`conversation-item ${selectedConversation?._id === conv._id ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conv)}
                >
                  <div className="conv-avatar">
                    {conv.user.profilePicture ? (
                      <img src={getProfilePictureUrl(conv.user)} alt={conv.user.firstName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {conv.user.firstName?.[0]}{conv.user.lastName?.[0]}
                      </div>
                    )}
                    <span className="online-indicator"></span>
                  </div>
                  <div className="conv-info">
                    <div className="conv-header">
                      <h3>{conv.user.firstName} {conv.user.lastName}</h3>
                      <span className="conv-time">{formatTime(conv.lastMessage.createdAt)}</span>
                    </div>
                    <div className="conv-preview">
                      <p>{conv.lastMessage.content?.substring(0, 50)}...</p>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`chat-area ${!selectedConversation ? 'mobile-hide' : ''}`}>
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">
                    {selectedConversation.user.profilePicture ? (
                      <img src={getProfilePictureUrl(selectedConversation.user)} alt={selectedConversation.user.firstName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {selectedConversation.user.firstName?.[0]}{selectedConversation.user.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3>{selectedConversation.user.firstName} {selectedConversation.user.lastName}</h3>
                    <span className="user-type">{selectedConversation.user.userType}</span>
                  </div>
                </div>
              </div>

              <div className="messages-container">
                {messages.map((msg, index) => {
                  const isOwnMessage = msg.sender._id === user._id;
                  const showAvatar = index === 0 || messages[index - 1].sender._id !== msg.sender._id;
                  
                  return (
                    <div key={msg._id} className={`message ${isOwnMessage ? 'own' : 'other'}`}>
                      {!isOwnMessage && showAvatar && (
                        <div className="message-avatar">
                          {selectedConversation.user.profilePicture ? (
                            <img src={getProfilePictureUrl(selectedConversation.user)} alt="" />
                          ) : (
                            <div className="avatar-placeholder-sm">
                              {selectedConversation.user.firstName?.[0]}
                            </div>
                          )}
                        </div>
                      )}
                      {!isOwnMessage && !showAvatar && <div className="message-avatar-spacer"></div>}
                      <div className="message-content">
                        <div className="message-bubble">
                          <p>{msg.content}</p>
                        </div>
                        <span className="message-time">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-input-container" onSubmit={handleSendMessage}>
                <textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows="1"
                  disabled={sending}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}>
                  {sending ? '⏳' : '📤'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <div className="empty-chat-state">
                <span className="empty-icon">💬</span>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{chatStyles}</style>
    </div>
  );
}

const chatStyles = `
  .search-results-list {
    border-bottom: 1px solid #e2e8f0;
    background: #f3f4f6;
    padding: 0.5rem 0;
  }
  .search-results-header {
    font-size: 0.95rem;
    font-weight: 600;
    color: #6366f1;
    padding: 0.5rem 1.5rem 0.25rem 1.5rem;
  }
  .search-loading {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    color: #64748b;
  }
  .spinner-sm {
    width: 20px;
    height: 20px;
    border: 3px solid #e2e8f0;
    border-top: 3px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  .search-no-results {
    padding: 1.5rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
  }
  .chat-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    min-height: calc(100vh - 80px);
  }

  .chat-layout {
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 0;
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    height: calc(100vh - 120px);
    overflow: hidden;
  }

  /* Conversations Sidebar */
  .conversations-sidebar {
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
  }

  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: white;
  }

  .sidebar-header h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    color: #1e293b;
  }

  .search-box {
    position: relative;
  }

  .search-box input {
    width: 100%;
    padding: 0.75rem 2.5rem 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.95rem;
    transition: border-color 0.2s;
  }

  .search-box input:focus {
    outline: none;
    border-color: #6366f1;
  }

  .search-icon {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.2rem;
  }

  .conversations-list {
    flex: 1;
    overflow-y: auto;
  }

  .conversation-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid #e2e8f0;
  }

  .conversation-item:hover {
    background: #f1f5f9;
  }

  .conversation-item.active {
    background: #e0e7ff;
    border-left: 4px solid #6366f1;
  }

  .conv-avatar {
    position: relative;
    flex-shrink: 0;
  }

  .conv-avatar img,
  .conv-avatar .avatar-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-placeholder {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .online-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
  }

  .conv-info {
    flex: 1;
    min-width: 0;
  }

  .conv-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }

  .conv-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .conv-time {
    font-size: 0.75rem;
    color: #64748b;
    flex-shrink: 0;
  }

  .conv-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .conv-preview p {
    margin: 0;
    font-size: 0.875rem;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .unread-badge {
    background: #6366f1;
    color: white;
    border-radius: 12px;
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
    flex-shrink: 0;
  }

  /* Chat Area */
  .chat-area {
    display: flex;
    flex-direction: column;
    background: white;
  }

  .chat-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: white;
  }

  .chat-user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .chat-avatar img,
  .chat-avatar .avatar-placeholder {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    object-fit: cover;
  }

  .chat-user-info h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #1e293b;
  }

  .user-type {
    font-size: 0.85rem;
    color: #64748b;
    text-transform: capitalize;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    background: #f8fafc;
  }

  .message {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .message.own {
    flex-direction: row-reverse;
  }

  .message-avatar img,
  .message-avatar .avatar-placeholder-sm {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-placeholder-sm {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .message-avatar-spacer {
    width: 32px;
  }

  .message-content {
    max-width: 60%;
    display: flex;
    flex-direction: column;
  }

  .message.own .message-content {
    align-items: flex-end;
  }

  .message-bubble {
    background: white;
    padding: 0.75rem 1rem;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .message.own .message-bubble {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
  }

  .message-bubble p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    word-wrap: break-word;
  }

  .message-time {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.25rem;
    padding: 0 0.5rem;
  }

  .message-input-container {
    padding: 1.5rem;
    border-top: 1px solid #e2e8f0;
    background: white;
    display: flex;
    gap: 1rem;
    align-items: flex-end;
  }

  .message-input-container textarea {
    flex: 1;
    padding: 0.875rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 0.95rem;
    font-family: inherit;
    resize: none;
    max-height: 120px;
    transition: border-color 0.2s;
  }

  .message-input-container textarea:focus {
    outline: none;
    border-color: #6366f1;
  }

  .message-input-container button {
    padding: 0.875rem 1.25rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1.25rem;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    flex-shrink: 0;
  }

  .message-input-container button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .message-input-container button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .no-conversation-selected {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .empty-chat-state {
    text-align: center;
    color: #64748b;
  }

  .empty-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1rem;
  }

  .empty-chat-state h3 {
    margin: 0 0 0.5rem 0;
    color: #1e293b;
    font-size: 1.5rem;
  }

  .empty-chat-state p {
    margin: 0;
    font-size: 1rem;
  }

  .empty-state {
    padding: 3rem 1.5rem;
    text-align: center;
    color: #64748b;
  }

  .empty-state p {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 500;
  }

  .empty-state span {
    font-size: 0.875rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 1rem;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .chat-container {
      padding: 0;
    }

    .chat-layout {
      grid-template-columns: 1fr;
      border-radius: 0;
      height: 100vh;
    }

    .conversations-sidebar.mobile-hide {
      display: none;
    }

    .chat-area.mobile-hide {
      display: none;
    }

    .message-content {
      max-width: 80%;
    }
  }
`;

export default Chat;
