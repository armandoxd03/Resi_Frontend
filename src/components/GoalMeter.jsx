import React from 'react';

/**
 * GoalMeter Component - Displays a visual progress bar for financial goals
 * 
 * @param {Object} props
 * @param {number} props.progress - Current progress percentage (0-100)
 * @param {number} props.currentAmount - Current amount saved
 * @param {number} props.targetAmount - Target amount for the goal
 * @param {boolean} props.completed - Whether the goal is completed
 * @param {boolean} props.mini - Whether to display a mini version (optional)
 * @returns {JSX.Element}
 */
function GoalMeter({ progress = 0, currentAmount = 0, targetAmount = 0, completed = false, mini = false }) {
  // Ensure progress is between 0 and 100
  const safeProgress = Math.min(100, Math.max(0, progress));
  
  // Format currency values
  const formattedCurrent = currentAmount.toLocaleString('en-PH', { 
    style: 'currency', 
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  const formattedTarget = targetAmount.toLocaleString('en-PH', { 
    style: 'currency', 
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  // Determine color based on progress
  let progressColor = '#38a169'; // Default green
  
  if (safeProgress < 25) {
    progressColor = '#e53e3e'; // Red for low progress
  } else if (safeProgress < 50) {
    progressColor = '#ed8936'; // Orange for medium-low progress
  } else if (safeProgress < 75) {
    progressColor = '#ecc94b'; // Yellow for medium progress
  } else {
    progressColor = completed ? '#38a169' : '#68d391'; // Green or light green for high progress
  }

  return (
    <div className={`goal-meter ${mini ? 'mini' : ''} ${completed ? 'completed' : ''}`}>
      {!mini && (
        <div className="goal-meter-header">
          <div className="goal-meter-amounts">
            <span className="current-amount">{formattedCurrent}</span>
            <span className="separator">/</span>
            <span className="target-amount">{formattedTarget}</span>
          </div>
          <div className="goal-meter-percentage">{safeProgress.toFixed(1)}%</div>
        </div>
      )}
      
      <div className="goal-meter-bar">
        <div 
          className="goal-meter-progress" 
          style={{ 
            width: `${safeProgress}%`,
            backgroundColor: progressColor
          }}
        ></div>
      </div>
      
      {mini && (
        <div className="goal-meter-mini-label">
          {safeProgress.toFixed(0)}%
        </div>
      )}
      
      <style jsx>{`
        .goal-meter {
          width: 100%;
        }
        
        .goal-meter.completed .goal-meter-progress {
          background-color: #38a169 !important;
        }
        
        .goal-meter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .goal-meter-amounts {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .current-amount {
          font-weight: 600;
          color: #2d3748;
        }
        
        .separator {
          color: #a0aec0;
          font-weight: 400;
        }
        
        .target-amount {
          color: #718096;
        }
        
        .goal-meter-percentage {
          font-weight: 600;
          color: #2d3748;
        }
        
        .goal-meter-bar {
          height: 10px;
          background-color: #edf2f7;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .goal-meter-progress {
          height: 100%;
          border-radius: 5px;
          transition: width 0.5s ease, background-color 0.5s ease;
        }
        
        .goal-meter.mini .goal-meter-bar {
          height: 6px;
          border-radius: 3px;
        }
        
        .goal-meter-mini-label {
          font-size: 0.8rem;
          color: #4a5568;
          text-align: right;
          margin-top: 4px;
        }
        
        .goal-meter.completed .goal-meter-mini-label {
          color: #38a169;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export default GoalMeter;
