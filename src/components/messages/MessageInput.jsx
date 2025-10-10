import { useState } from 'react';
import '../../components/global.css';

const MessageInput = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    setMessage(e.target.value);
    
    // Clear error when user types
    if (error) {
      setError('');
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if message meets minimum length requirement
    if (message.trim().length < 20) {
      setError('Message must be at least 20 characters long');
      return;
    }
    
    // Send message and reset form
    onSendMessage(message);
    setMessage('');
    setError('');
  };
  
  // Calculate remaining characters needed to meet minimum
  const remainingChars = Math.max(0, 20 - message.length);
  const isValid = message.length >= 20;
  
  return (
    <div className="message-input-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="messageInput">Message</label>
          <textarea
            id="messageInput"
            value={message}
            onChange={handleChange}
            placeholder="Type your message here (minimum 20 characters)..."
            rows="4"
            className={`message-textarea ${error ? 'error' : ''}`}
          />
          
          {/* Character count indicator */}
          <div className="character-count">
            {message.length < 20 ? (
              <span className="count-warning">
                {remainingChars} more character{remainingChars !== 1 ? 's' : ''} needed
              </span>
            ) : (
              <span className="count-valid">
                {message.length} characters (minimum 20)
              </span>
            )}
          </div>
          
          {/* Error message */}
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <button 
          type="submit" 
          className="send-button"
          disabled={!isValid}
        >
          Send Message
        </button>
      </form>
      
      <style jsx="true">{`
        .message-input-container {
          margin-bottom: 1.5rem;
          background: #fff;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .message-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
        }
        
        .message-textarea:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }
        
        .message-textarea.error {
          border-color: #dc2626;
        }
        
        .character-count {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          text-align: right;
        }
        
        .count-warning {
          color: #dc2626;
        }
        
        .count-valid {
          color: #059669;
        }
        
        .error-message {
          margin-top: 0.5rem;
          color: #dc2626;
          font-size: 0.875rem;
        }
        
        .send-button {
          margin-top: 1rem;
          background-color: #2b6cb0;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .send-button:hover {
          background-color: #1d4ed8;
        }
        
        .send-button:disabled {
          background-color: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default MessageInput;