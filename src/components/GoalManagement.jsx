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
  const [activeTab, setActiveTab] = useState('active')
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
      let wasActiveGoalCompleted = false
      
      if (currentGoal) {
        // Check if this was an active goal that is now being completed
        wasActiveGoalCompleted = currentGoal.isActive && wouldBeCompleted
        
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
      
      // If an active goal was just completed, look for priority goals to activate
      if (wasActiveGoalCompleted) {
        await activateNextPriorityGoal()
      } else {
        // Just refresh the goals
        loadGoals()
      }
    } catch (err) {
      console.error('Error saving goal:', err)
      showError('Failed to save goal. Please try again.')
    }
  }
  
  const activateNextPriorityGoal = async () => {
    try {
      // First load the updated goals
      const response = await apiService.getMyGoals()
      
      if (response && response.categorizedGoals) {
        const pendingGoals = response.categorizedGoals.pending || []
        
        // Find priority goals
        const priorityGoal = pendingGoals.find(goal => goal.isPriority)
        
        if (priorityGoal) {
          // Activate the priority goal
          await apiService.setActiveGoal(priorityGoal._id)
          success(`Priority goal "${priorityGoal.description}" has been automatically activated!`)
        }
      }
      
      // Finally, reload all goals
      loadGoals()
    } catch (err) {
      console.error('Error activating priority goal:', err)
      // Still load goals, even if auto-activation fails
      loadGoals()
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
  
  const handleSetActiveGoal = async (goalId, isPriority = false) => {
    try {
      if (isPriority) {
        // If it's a priority goal, just update it with isPriority flag
        await apiService.updateGoal(goalId, { isPriority: true })
        success('Goal set as priority and will be activated automatically when current goal is completed!')
      } else {
        // If not a priority goal, set it as active directly
        await apiService.setActiveGoal(goalId)
        success('Goal set as active!')
      }
      
      // Reload goals to show the changes
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
          {/* Tabs Navigation */}
          <div className="goals-tabs" data-active={activeTab}>
            <button 
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} 
              onClick={() => setActiveTab('active')}
            >
              Active Goal
              <span className="tab-count">{goals.active.length}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} 
              onClick={() => setActiveTab('pending')}
            >
              Pending Goals
              <span className="tab-count">{goals.pending.length}</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} 
              onClick={() => setActiveTab('completed')}
            >
              Completed Goals
              <span className="tab-count">{goals.completed.length}</span>
            </button>
          </div>
          
          {/* Active Goal Tab Content */}
          {activeTab === 'active' && (
            <div className="goal-section active-section">
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
          )}
          
          {/* Pending Goals Tab Content */}
          {activeTab === 'pending' && (
            <div className="goal-section pending-section">
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
                        <div className="goal-buttons">
                          {goal.isPriority ? (
                            <span className="priority-badge">Next Up</span>
                          ) : (
                            <button 
                              className="priority-btn"
                              onClick={() => handleSetActiveGoal(goal._id, true)}
                              title="Set as next goal when current active goal completes"
                            >
                              Set as Priority
                            </button>
                          )}
                          <button 
                            className="activate-btn"
                            onClick={() => handleSetActiveGoal(goal._id)}
                          >
                            Set as Active
                          </button>
                        </div>
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
          )}
          
          {/* Completed Goals Tab Content */}
          {activeTab === 'completed' && (
            <div className="goal-section completed-section">
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
          )}
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
          gap: 1.5rem;
        }
        
        .goals-tabs {
          display: flex;
          background: linear-gradient(to bottom, #ffffff, #f7fafc);
          border-radius: 12px;
          padding: 0.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 3px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8);
          position: relative;
          overflow: hidden;
          z-index: 1;
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        
        .tab-btn {
          flex: 1;
          padding: 1rem 1.5rem;
          background: transparent;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          z-index: 2;
          border-radius: 8px;
          white-space: nowrap;
          user-select: none;
          letter-spacing: 0.01em;
        }
        
        .tab-btn.active {
          color: #fff;
          font-weight: 700;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
        }
        
        .tab-btn::before {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 15%;
          width: 70%;
          height: 3px;
          background: #e2e8f0;
          transform: scaleX(0.7);
          opacity: 0;
          transition: all 0.3s ease;
          border-radius: 3px;
        }
        
        .tab-btn:not(.active):hover::before {
          transform: scaleX(1);
          opacity: 1;
        }
        
        .tab-btn:not(.active):hover {
          color: #2c5282;
          background-color: rgba(255, 255, 255, 0.5);
        }
        
        .goals-tabs::after {
          content: '';
          position: absolute;
          height: calc(100% - 10px);
          top: 5px;
          z-index: 1;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(43, 108, 176, 0.3);
        }
        
        .goals-tabs[data-active="active"]::after {
          left: 5px;
          width: calc(33.33% - 10px);
          background: linear-gradient(135deg, #3182ce, #2b6cb0);
          animation: tabFadeIn 0.3s ease-out;
        }
        
        .goals-tabs[data-active="pending"]::after {
          left: calc(33.33% + 5px);
          width: calc(33.33% - 10px);
          background: linear-gradient(135deg, #3182ce, #2b6cb0);
          animation: tabFadeIn 0.3s ease-out;
        }
        
        .goals-tabs[data-active="completed"]::after {
          left: calc(66.66% + 5px);
          width: calc(33.33% - 10px);
          background: linear-gradient(135deg, #3182ce, #2b6cb0);
          animation: tabFadeIn 0.3s ease-out;
        }
        
        @keyframes tabFadeIn {
          0% {
            opacity: 0.7;
            transform: scale(0.97);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          background: rgba(255, 255, 255, 0.3);
          color: #fff;
          font-size: 0.75rem;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        
        .tab-btn:not(.active) .tab-count {
          background: #e2e8f0;
          color: #4a5568;
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
          background: linear-gradient(to bottom, #ffffff, #f7fafc);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
          transition: all 0.25s ease;
          position: relative;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }

        .goal-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .goal-card.active {
          background: linear-gradient(to bottom right, #ebf8ff, #e6f6ff);
          border: 2px solid #4299e1;
          box-shadow: 0 5px 15px rgba(66, 153, 225, 0.15);
        }
        
        .goal-card.active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 6px;
          height: 100%;
          background: #4299e1;
        }

        .goal-card.completed {
          background: linear-gradient(to bottom right, #f0fff4, #e6ffed);
          border: 2px solid #68d391;
          box-shadow: 0 5px 15px rgba(104, 211, 145, 0.15);
        }
        
        .goal-card.completed::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 6px;
          height: 100%;
          background: #68d391;
        }
        
        .goal-card.priority {
          box-shadow: 0 5px 15px rgba(237, 137, 54, 0.15);
        }

        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
        }

        .goal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: #2d3748;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .goal-actions {
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn, .delete-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
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
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 1rem;
          position: relative;
        }

        .current-amount {
          font-weight: 700;
          color: #2b6cb0;
          font-size: 1.5rem;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
        }

        .target-amount {
          color: #718096;
          font-size: 1.25rem;
          font-variant-numeric: tabular-nums;
        }

        .amount-separator {
          color: #a0aec0;
          font-weight: 300;
          margin: 0 0.25rem;
        }

        .progress-container {
          background: linear-gradient(to right, #edf2f7, #e2e8f0);
          border-radius: 10px;
          height: 14px;
          overflow: hidden;
          margin-bottom: 1rem;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(to right, #4299e1, #2b6cb0);
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          transition: width 0.5s ease;
          border-radius: 8px;
        }

        .goal-card.completed .progress-bar {
          background: linear-gradient(to right, #68d391, #38a169);
        }

        .goal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.25rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(226, 232, 240, 0.6);
        }

        .progress-percentage {
          color: #4a5568;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          background-color: #edf2f7;
          border-radius: 4px;
          display: inline-block;
        }
        
        .goal-buttons {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .activate-btn {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #4299e1;
          color: white;
          box-shadow: 0 2px 4px rgba(66, 153, 225, 0.3);
        }

        .activate-btn:hover {
          background: #3182ce;
          transform: translateY(-1px);
        }
        
        .add-income-btn {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          background: linear-gradient(to bottom, #48bb78, #38a169);
          color: white;
          box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .add-income-btn:hover {
          background: linear-gradient(to bottom, #38a169, #2f855a);
          transform: translateY(-1px);
          box-shadow: 0 3px 6px rgba(72, 187, 120, 0.4);
        }
        
        .add-income-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba(72, 187, 120, 0.3);
        }
        
        .priority-btn {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          background: linear-gradient(to bottom, #f7fafc, #edf2f7);
          color: #4a5568;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .priority-btn:hover {
          background: linear-gradient(to bottom, #edf2f7, #e2e8f0);
          color: #2d3748;
          border-color: #cbd5e0;
          box-shadow: 0 3px 5px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }
        
        .priority-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .priority-badge {
          background: linear-gradient(135deg, #ecc94b, #d69e2e);
          color: #744210;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          box-shadow: 0 2px 4px rgba(184, 137, 15, 0.2);
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }
        
        .priority-badge::before {
          content: "★";
          font-size: 0.8rem;
          margin-right: 2px;
          animation: starPulse 1.5s ease-in-out infinite alternate;
          display: inline-block;
        }
        
        @keyframes starPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.2); opacity: 1; }
        }

        .completed-badge {
          background: linear-gradient(135deg, #68d391, #48bb78);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(72, 187, 120, 0.2);
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .completed-badge::before {
          content: "✓";
          font-size: 0.9rem;
          font-weight: bold;
        }

        .completion-date {
          color: #718096;
          font-size: 0.875rem;
        }

        .no-goals {
          text-align: center;
          padding: 3rem 1.5rem;
          color: #718096;
          background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
          border-radius: 12px;
          border: 1px dashed #cbd5e0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
          font-size: 1.1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .no-goals::before {
          content: "🎯";
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .loading-state {
          text-align: center;
          padding: 4rem 1rem;
          color: #4a5568;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(66, 153, 225, 0.2);
          border-left-color: #4299e1;
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.42, 0.61, 0.58, 0.41) infinite;
          margin: 0 auto 1.5rem;
          box-shadow: 0 0 15px rgba(66, 153, 225, 0.1);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 2.5rem;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.12);
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
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
          
          .goals-tabs {
            padding: 0.4rem;
            margin-bottom: 1.25rem;
            border-radius: 10px;
          }
          
          .tab-btn {
            padding: 0.75rem 0.5rem;
            font-size: 0.85rem;
            letter-spacing: -0.01em;
          }
          
          .tab-count {
            min-width: 18px;
            height: 18px;
            font-size: 0.7rem;
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
          
          .goal-buttons {
            width: 100%;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .add-income-btn,
          .activate-btn,
          .priority-btn {
            width: 100%;
            justify-content: center;
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