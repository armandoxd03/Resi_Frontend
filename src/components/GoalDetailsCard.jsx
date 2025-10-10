import React, { useState } from 'react';
import GoalMeter from './GoalMeter';

/**
 * GoalHistoryItem - Component to display a goal history item
 * 
 * @param {Object} props
 * @param {Object} props.item - History item data
 * @returns {JSX.Element}
 */
const GoalHistoryItem = ({ item }) => {
  return (
    <div className="history-item">
      <span className="history-amount">+₱{item.amount?.toLocaleString()}</span>
      <span className="history-source">{item.source === 'job' ? 'Job Payment' : 'Manual'}</span>
      <span className="history-date">{new Date(item.date).toLocaleDateString()}</span>
      
      <style jsx>{`
        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border-radius: 8px;
          padding: 0.5rem 0.7rem;
          font-size: 0.9rem;
          margin-bottom: 0.4rem;
          border: 1px solid #e2e8f0;
        }
        
        .history-amount {
          font-weight: 600;
          color: #38a169;
        }
        
        .history-source {
          color: #4a5568;
        }
        
        .history-date {
          color: #718096;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

/**
 * GoalDetailsCard - Component to display goal details and history
 * 
 * @param {Object} props
 * @param {Object} props.goal - Goal data
 * @param {Function} props.onEdit - Edit callback
 * @param {Function} props.onDelete - Delete callback
 * @returns {JSX.Element}
 */
function GoalDetailsCard({ goal, onEdit, onDelete }) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  
  // Show only first 3 history items by default
  const displayedHistory = showFullHistory ? 
    goal.history || [] : 
    (goal.history || []).slice(0, 3);
  
  // Calculate remaining days if goal has a deadline
  const getRemainingDays = () => {
    if (!goal.deadline) return null;
    
    const deadlineDate = new Date(goal.deadline);
    const today = new Date();
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff;
  };
  
  const remainingDays = getRemainingDays();
  
  return (
    <div className={`goal-card ${goal.completed ? 'completed' : ''}`}>
      <div className="goal-header">
        <h3>{goal.title}</h3>
        <div className="goal-actions">
          {!goal.completed && (
            <button 
              className="edit-goal-btn" 
              onClick={() => onEdit(goal)}
              title="Edit Goal"
            >
              ✎
            </button>
          )}
          <button 
            className="delete-goal-btn" 
            onClick={() => onDelete(goal.id)}
            title="Delete Goal"
          >
            ×
          </button>
        </div>
      </div>
      
      {goal.completed ? (
        <div className="goal-status">
          <div className="status-tag">Completed</div>
          <div className="completion-date">
            Completed on: {new Date(goal.completedAt).toLocaleDateString()}
          </div>
        </div>
      ) : (
        remainingDays !== null && (
          <div className="goal-deadline">
            {remainingDays > 0 ? (
              <div className="deadline-info">
                <span className="days-remaining">{remainingDays} days</span> remaining until target date
              </div>
            ) : (
              <div className="deadline-info overdue">
                <span className="days-remaining">{Math.abs(remainingDays)} days</span> past target date
              </div>
            )}
          </div>
        )
      )}
      
      <GoalMeter 
        progress={goal.progress} 
        currentAmount={goal.currentAmount} 
        targetAmount={goal.targetAmount} 
        completed={goal.completed}
      />
      
      {goal.history && goal.history.length > 0 && (
        <div className="goal-history">
          <div className="history-header">
            <h4>Goal History</h4>
            {goal.history.length > 3 && (
              <button 
                className="toggle-history-btn"
                onClick={() => setShowFullHistory(!showFullHistory)}
              >
                {showFullHistory ? 'Show Less' : `Show All (${goal.history.length})`}
              </button>
            )}
          </div>
          
          <div className="history-list">
            {displayedHistory.map((item, index) => (
              <GoalHistoryItem key={index} item={item} />
            ))}
            
            {!showFullHistory && goal.history.length > 3 && (
              <div className="history-more">
                {goal.history.length - 3} more entries...
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .goal-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.2rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          margin-bottom: 1.5rem;
        }
        
        .goal-card.completed {
          background: #f0fff4;
          border: 1px solid #c6f6d5;
        }
        
        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.7rem;
        }
        
        .goal-header h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: #22314a;
          margin: 0;
        }
        
        .goal-actions {
          display: flex;
          gap: 0.5rem;
        }
        
        .edit-goal-btn, .delete-goal-btn {
          background: none;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
          font-size: 1.2rem;
        }
        
        .edit-goal-btn:hover {
          background: #e2e8f0;
          color: #2b6cb0;
        }
        
        .delete-goal-btn:hover {
          background: #fee2e2;
          color: #e53e3e;
        }
        
        .goal-status {
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .status-tag {
          background: #38a169;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .completion-date {
          font-size: 0.9rem;
          color: #38a169;
        }
        
        .goal-deadline {
          margin-bottom: 0.8rem;
        }
        
        .deadline-info {
          font-size: 0.9rem;
          color: #4a5568;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .deadline-info.overdue {
          color: #e53e3e;
        }
        
        .days-remaining {
          font-weight: 600;
        }
        
        .goal-history {
          margin-top: 1.2rem;
          border-top: 1px solid #e2e8f0;
          padding-top: 0.8rem;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.8rem;
        }
        
        .history-header h4 {
          margin: 0;
          font-size: 0.95rem;
          color: #4a5568;
          font-weight: 600;
        }
        
        .toggle-history-btn {
          background: none;
          border: none;
          color: #2b6cb0;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          padding: 0;
        }
        
        .toggle-history-btn:hover {
          text-decoration: underline;
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        
        .history-more {
          text-align: center;
          color: #718096;
          font-size: 0.85rem;
          font-style: italic;
          padding: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}

export default GoalDetailsCard;