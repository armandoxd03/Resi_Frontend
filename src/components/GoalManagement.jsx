import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import apiService from '../api'

function GoalManagement() {
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState({
    active: [],
    pending: [],
    completed: []
  })
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [currentGoal, setCurrentGoal] = useState(null)
  const [goalFormData, setGoalFormData] = useState({
    description: '',
    targetAmount: '',
    currentAmount: '0'
  })
  
  const { isLoggedIn } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)
  
  useEffect(() => {
    if (isLoggedIn) {
      loadGoals()
    }
  }, [isLoggedIn])
  
  const loadGoals = async () => {
    try {
      setLoading(true)
      const response = await apiService.getMyGoals()
      
      if (response && response.categorizedGoals) {
        setGoals({
          active: response.categorizedGoals.active || [],
          pending: response.categorizedGoals.pending || [],
          completed: response.categorizedGoals.completed || []
        })
      } else {
        setGoals({
          active: [],
          pending: [],
          completed: []
        })
      }
    } catch (err) {
      console.error('Error loading goals:', err)
      showError('Failed to load goals. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleOpenGoalModal = (goal = null) => {
    if (goal) {
      // Edit existing goal
      setCurrentGoal(goal)
      setGoalFormData({
        description: goal.description,
        targetAmount: goal.targetAmount.toString(),
        currentAmount: goal.currentAmount.toString()
      })
    } else {
      // New goal
      setCurrentGoal(null)
      setGoalFormData({
        description: '',
        targetAmount: '',
        currentAmount: '0'
      })
    }
    setShowGoalModal(true)
  }
  
  const handleGoalInputChange = (e) => {
    const { name, value } = e.target
    setGoalFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSaveGoal = async (e) => {
    e.preventDefault()
    
    try {
      const goalData = {
        description: goalFormData.description,
        targetAmount: parseFloat(goalFormData.targetAmount),
        currentAmount: parseFloat(goalFormData.currentAmount || '0')
      }
      
      // Check if the goal would be completed with these values
      const wouldBeCompleted = goalData.currentAmount >= goalData.targetAmount
      
      let result
      if (currentGoal) {
        // Update existing goal
        result = await apiService.updateGoal(currentGoal._id, goalData)
        if (wouldBeCompleted) {
          success('Goal updated and marked as completed!')
        } else {
          success('Goal updated successfully!')
        }
      } else {
        // Create new goal
        result = await apiService.createGoal(goalData)
        if (wouldBeCompleted) {
          success('New goal created and marked as completed!')
        } else {
          success('New goal created successfully!')
        }
      }
      
      setShowGoalModal(false)
      loadGoals()
    } catch (err) {
      console.error('Error saving goal:', err)
      showError('Failed to save goal. Please try again.')
    }
  }
  
  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return
    
    try {
      // Find if this is the active goal
      const isActiveGoal = goals.active.some(goal => goal._id === goalId)
      
      const result = await apiService.deleteGoal(goalId)
      
      if (isActiveGoal && result.deletedGoal?.wasActive) {
        success('Active goal deleted. Next available goal has been activated.')
      } else {
        success('Goal deleted successfully!')
      }
      
      // Reload goals to reflect changes (including any new active goal)
      loadGoals()
    } catch (err) {
      console.error('Error deleting goal:', err)
      showError('Failed to delete goal. Please try again.')
    }
  }
  
  const handleSetActiveGoal = async (goalId) => {
    try {
      await apiService.setActiveGoal(goalId)
      success('Goal set as active!')
      loadGoals()
    } catch (err) {
      console.error('Error setting active goal:', err)
      showError('Failed to set goal as active. Please try again.')
    }
  }
  
  return (
    <div className="goal-management-container">
      <h1 className="goals-heading">Financial Goal Management</h1>
      
      <div className="actions-panel">
        <button 
          className="action-btn primary" 
          onClick={() => handleOpenGoalModal()}
        >
          <span className="icon">+</span> Create New Goal
        </button>
      </div>
      
      {loading ? (
        <div className="loading-state">
          <div className="spinner large"></div>
          <p>Loading your goals...</p>
        </div>
      ) : (
        <div className="goals-wrapper">
          {/* Active Goal Section */}
          <div className="goal-section active-section">
            <h2>Active Goal</h2>
            {goals.active.length > 0 ? (
              <div className="active-goal">
                {goals.active.map((goal) => (
                  <div className="goal-card active" key={goal._id}>
                    <div className="goal-header">
                      <h3>{goal.description}</h3>
                      <div className="goal-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleOpenGoalModal(goal)}
                          title="Edit Goal"
                        >
                          ✎
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteGoal(goal._id)}
                          title="Delete Goal"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    <div className="goal-amounts">
                      <span className="current-amount">₱{goal.currentAmount.toLocaleString()}</span>
                      <span className="amount-separator">/</span>
                      <span className="target-amount">₱{goal.targetAmount.toLocaleString()}</span>
                    </div>
                    
                    <div className="progress-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${Math.min(100, goal.progress)}%` }}
                      ></div>
                    </div>
                    
                    <div className="goal-footer">
                      <span className="progress-percentage">{goal.progress.toFixed(1)}% Complete</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-goals">
                <p>No active goal. Please create a new goal or activate an existing one.</p>
              </div>
            )}
          </div>
          
          {/* Pending Goals Section */}
          <div className="goal-section pending-section">
            <h2>Pending Goals</h2>
            {goals.pending.length > 0 ? (
              <div className="goals-grid">
                {goals.pending.map((goal) => (
                  <div className="goal-card pending" key={goal._id}>
                    <div className="goal-header">
                      <h3>{goal.description}</h3>
                      <div className="goal-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleOpenGoalModal(goal)}
                          title="Edit Goal"
                        >
                          ✎
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteGoal(goal._id)}
                          title="Delete Goal"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    <div className="goal-amounts">
                      <span className="current-amount">₱{goal.currentAmount.toLocaleString()}</span>
                      <span className="amount-separator">/</span>
                      <span className="target-amount">₱{goal.targetAmount.toLocaleString()}</span>
                    </div>
                    
                    <div className="progress-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${Math.min(100, goal.progress)}%` }}
                      ></div>
                    </div>
                    
                    <div className="goal-footer">
                      <span className="progress-percentage">{goal.progress.toFixed(1)}% Complete</span>
                      <button 
                        className="activate-btn"
                        onClick={() => handleSetActiveGoal(goal._id)}
                      >
                        Set as Active
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-goals">
                <p>No pending goals yet.</p>
              </div>
            )}
          </div>
          
          {/* Completed Goals Section */}
          <div className="goal-section completed-section">
            <h2>Completed Goals</h2>
            {goals.completed.length > 0 ? (
              <div className="goals-grid">
                {goals.completed.map((goal) => (
                  <div className="goal-card completed" key={goal._id}>
                    <div className="goal-header">
                      <h3>{goal.description}</h3>
                      <div className="completed-badge">Completed!</div>
                    </div>
                    
                    <div className="goal-amounts">
                      <span className="current-amount">₱{goal.currentAmount.toLocaleString()}</span>
                      <span className="amount-separator">/</span>
                      <span className="target-amount">₱{goal.targetAmount.toLocaleString()}</span>
                    </div>
                    
                    <div className="progress-container">
                      <div className="progress-bar" style={{ width: '100%' }}></div>
                    </div>
                    
                    <div className="goal-footer">
                      <span className="progress-percentage">100% Complete</span>
                      <span className="completion-date">
                        {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : 'Completed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-goals">
                <p>No completed goals yet. Keep working towards your financial targets!</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowGoalModal(false)}>×</button>
            <h2>{currentGoal ? 'Edit Goal' : 'Create New Goal'}</h2>
            
            <form onSubmit={handleSaveGoal}>
              <div className="form-group">
                <label htmlFor="description">Goal Description</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={goalFormData.description}
                  onChange={handleGoalInputChange}
                  placeholder="e.g., Monthly Savings, New Car, etc."
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="targetAmount">Target Amount (₱)</label>
                  <input
                    type="number"
                    id="targetAmount"
                    name="targetAmount"
                    value={goalFormData.targetAmount}
                    onChange={handleGoalInputChange}
                    placeholder="e.g., 10000"
                    min="1"
                    step="any"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="currentAmount">Current Amount (₱)</label>
                  <input
                    type="number"
                    id="currentAmount"
                    name="currentAmount"
                    value={goalFormData.currentAmount}
                    onChange={handleGoalInputChange}
                    placeholder="e.g., 0"
                    min="0"
                    step="any"
                    required
                  />
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowGoalModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {currentGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      

      
      <style>{`
        .goal-management-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .goals-heading {
          color: #2b6cb0;
          margin-bottom: 1.5rem;
          font-size: 2.25rem;
        }

        .actions-panel {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .action-btn.primary {
          background: #2b6cb0;
          color: white;
        }

        .action-btn.primary:hover {
          background: #2c5282;
        }

        .action-btn.secondary {
          background: #38a169;
          color: white;
        }

        .action-btn.secondary:hover {
          background: #2f855a;
        }

        .goals-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .goal-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }

        .goal-section h2 {
          margin-top: 0;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 0.75rem;
          margin-bottom: 1.5rem;
          color: #2d3748;
        }

        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .goal-card {
          background: #f7fafc;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .goal-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }

        .goal-card.active {
          background: #ebf8ff;
          border: 2px solid #4299e1;
        }

        .goal-card.completed {
          background: #f0fff4;
          border: 2px solid #68d391;
        }

        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .goal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #2d3748;
        }

        .goal-actions {
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn, .delete-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .edit-btn {
          background: #edf2f7;
          color: #4a5568;
        }

        .edit-btn:hover {
          background: #e2e8f0;
        }

        .delete-btn {
          background: #fed7d7;
          color: #e53e3e;
        }

        .delete-btn:hover {
          background: #feb2b2;
        }

        .goal-amounts {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .current-amount {
          font-weight: bold;
          color: #2b6cb0;
          font-size: 1.5rem;
        }

        .target-amount {
          color: #718096;
          font-size: 1.25rem;
        }

        .amount-separator {
          color: #a0aec0;
          font-weight: 300;
        }

        .progress-container {
          background: #edf2f7;
          border-radius: 8px;
          height: 12px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(to right, #4299e1, #2b6cb0);
          border-radius: 8px;
        }

        .goal-card.completed .progress-bar {
          background: linear-gradient(to right, #68d391, #38a169);
        }

        .goal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .progress-percentage {
          color: #4a5568;
          font-size: 0.875rem;
        }

        .activate-btn {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background-color 0.2s;
          background: #4299e1;
          color: white;
        }

        .activate-btn:hover {
          background: #3182ce;
        }

        .completed-badge {
          background: #68d391;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .completion-date {
          color: #718096;
          font-size: 0.875rem;
        }

        .no-goals {
          text-align: center;
          padding: 2rem 1rem;
          color: #718096;
          background: #f7fafc;
          border-radius: 8px;
        }

        .loading-state {
          text-align: center;
          padding: 4rem 1rem;
          color: #718096;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(66, 153, 225, 0.2);
          border-left-color: #4299e1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          width: 100%;
          max-width: 500px;
          position: relative;
          max-height: 90vh;
          overflow-y: auto;
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #718096;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #2d3748;
        }

        .modal-content h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #2d3748;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #4a5568;
        }

        input[type="text"],
        input[type="number"] {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        input[type="text"]:focus,
        input[type="number"]:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background: #2b6cb0;
          color: white;
        }

        .btn-primary:hover {
          background: #2c5282;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }

        @media (max-width: 768px) {
          .goal-management-container {
            padding: 1rem;
          }
          
          .goals-grid {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .goal-amounts {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
          
          .amount-separator {
            display: none;
          }
          
          .goal-footer {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
          }
          
          .add-income-btn,
          .activate-btn {
            width: 100%;
          }
          
          .actions-panel {
            flex-direction: column;
          }
          
          .action-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default GoalManagement