import { useState } from 'react';
import MessageInput from './MessageInput';

const MessagesContainer = () => {
  const [messages, setMessages] = useState([]);
  
  // Function to handle sending a message
  const handleSendMessage = (messageText) => {
    const newMessage = {
      id: Date.now(),
      text: messageText,
      timestamp: new Date().toISOString(),
      sender: 'user', // In a real app, you'd get this from authentication context
    };
    
    setMessages([...messages, newMessage]);
    
    // Here you would typically send the message to your backend API
    // For example: sendMessageToApi(newMessage);
  };
  
  return (
    <div className="messages-container">
      <div className="messages-header">
        <h2>Messages</h2>
      </div>
      
      {/* Display messages */}
      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Start a conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message-bubble ${msg.sender === 'user' ? 'sent' : 'received'}`}
            >
              <div className="message-content">{msg.text}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Message input component */}
      <div className="message-input-wrapper">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
      
      <style jsx="true">{`
        .messages-container {
          display: flex;
          flex-direction: column;
          height: 600px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          background: #f8fafc;
          overflow: hidden;
        }
        
        .messages-header {
          padding: 1rem 1.5rem;
          background: #2b6cb0;
          color: white;
        }
        
        .messages-header h2 {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .messages-list {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .no-messages {
          text-align: center;
          color: #64748b;
          padding: 2rem;
        }
        
        .message-bubble {
          max-width: 80%;
          padding: 0.75rem 1rem;
          border-radius: 16px;
          position: relative;
          margin-bottom: 0.75rem;
        }
        
        .message-bubble.sent {
          background: #2b6cb0;
          color: white;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }
        
        .message-bubble.received {
          background: white;
          color: #1a202c;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .message-content {
          margin-bottom: 0.25rem;
          line-height: 1.5;
          word-break: break-word;
        }
        
        .message-time {
          font-size: 0.75rem;
          opacity: 0.8;
          text-align: right;
        }
        
        .message-input-wrapper {
          margin-top: auto;
          padding: 1rem;
          background: white;
          border-top: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default MessagesContainer;