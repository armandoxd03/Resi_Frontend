import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import apiService from '../api'

function Settings() {
  const [settings, setSettings] = useState({
    notificationPreferences: {
      job: true,
      message: true
    },
    languagePreference: 'english'
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showSupportModal, setShowSupportModal] = useState(false)
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [supportData, setSupportData] = useState({
    subject: '',
    message: '',
    priority: 'medium'
  })
  
  const { user, isLoggedIn } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)

  useEffect(() => {
    if (!isLoggedIn) {
      showError('Please log in to access settings')
      return
    }
    loadSettings()
  }, [isLoggedIn, showError])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const response = await apiService.getProfile(userData.userId)
      
      if (response.user) {
        const user = response.user
        setSettings({
          notificationPreferences: {
            job: user.notificationPreferences?.job ?? true,
            message: user.notificationPreferences?.message ?? true
          },
          languagePreference: user.languagePreference || 'english'
        })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      showError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      
      const response = await apiService.updateProfile(userData.userId, settings)
      
      if (response.success) {
        success('Settings saved successfully')
      } else {
        showError(response.message || 'Error saving settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showError(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationChange = (type, value) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: value
      }
    }))
  }

  const handleLanguageChange = (language) => {
    setSettings(prev => ({
      ...prev,
      languagePreference: language
    }))
  }

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    return {
      requirements,
      isValid: Object.values(requirements).every(req => req)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('New passwords do not match')
      return
    }
    
    const validation = validatePassword(passwordData.newPassword)
    if (!validation.isValid) {
      showError('Password does not meet requirements')
      return
    }
    
    try {
      const response = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      if (response.success) {
        success('Password changed successfully')
        setShowPasswordModal(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        showError(response.message || 'Failed to change password')
      }
    } catch (error) {
      console.error('Password change error:', error)
      showError(error.message || 'Failed to change password')
    }
  }

  const handleSupportSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // This would typically send to a support system
      // For now, we'll just show a success message
      success('Support ticket submitted successfully. We will get back to you soon.')
      setShowSupportModal(false)
      setSupportData({
        subject: '',
        message: '',
        priority: 'medium'
      })
    } catch (error) {
      console.error('Support submission error:', error)
      showError('Failed to submit support ticket')
    }
  }



  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <Link to="/landing" className="back-btn">Back to Dashboard</Link>
      </div>

      <div className="settings-content">
        {/* Notification Preferences */}
        <div className="settings-section">
          <h2>Notification Preferences</h2>
          <div className="setting-item">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={settings.notificationPreferences.job}
                onChange={(e) => handleNotificationChange('job', e.target.checked)}
              />
              <span className="switch"></span>
              Job notifications
            </label>
            <p className="setting-description">Receive notifications for new job matches</p>
          </div>
          
          <div className="setting-item">
            <label className="switch-label">
              <input
                type="checkbox"
                checked={settings.notificationPreferences.message}
                onChange={(e) => handleNotificationChange('message', e.target.checked)}
              />
              <span className="switch"></span>
              Message notifications
            </label>
            <p className="setting-description">Receive notifications for new messages</p>
          </div>
        </div>

        {/* Language Preferences */}
        <div className="settings-section">
          <h2>Language Preference</h2>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="language"
                value="english"
                checked={settings.languagePreference === 'english'}
                onChange={(e) => handleLanguageChange(e.target.value)}
              />
              <span className="radio-text">English</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="language"
                value="tagalog"
                checked={settings.languagePreference === 'tagalog'}
                onChange={(e) => handleLanguageChange(e.target.value)}
              />
              <span className="radio-text">Tagalog</span>
            </label>
          </div>
        </div>

        {/* Account Security */}
        <div className="settings-section">
          <h2>Account Security</h2>
          <button 
            className="action-btn primary"
            onClick={() => setShowPasswordModal(true)}
          >
            <span className="icon">🔑</span>
            Change Password
          </button>
        </div>

        {/* Support */}
        <div className="settings-section">
          <h2>Support</h2>
          <button 
            className="action-btn secondary"
            onClick={() => setShowSupportModal(true)}
          >
            <span className="icon">💬</span>
            Contact Support
          </button>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <button 
            className="save-btn"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Password</h3>
              <button 
                className="close-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({
                    ...prev,
                    currentPassword: e.target.value
                  }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({
                    ...prev,
                    newPassword: e.target.value
                  }))}
                  required
                  minLength="8"
                />
                
                {passwordData.newPassword && (
                  <div className="password-requirements">
                    <h4>Password Requirements:</h4>
                    <ul>
                      {Object.entries(validatePassword(passwordData.newPassword).requirements).map(([key, met]) => (
                        <li key={key} className={met ? 'met' : 'unmet'}>
                          {key === 'length' && 'At least 8 characters'}
                          {key === 'uppercase' && 'One uppercase letter'}
                          {key === 'lowercase' && 'One lowercase letter'}
                          {key === 'number' && 'One number'}
                          {key === 'special' && 'One special character'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))}
                  required
                  minLength="8"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="modal-overlay" onClick={() => setShowSupportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contact Support</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSupportModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSupportSubmit} className="modal-form">
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={supportData.subject}
                  onChange={(e) => setSupportData(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                  required
                  placeholder="Brief description of your issue"
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={supportData.priority}
                  onChange={(e) => setSupportData(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={supportData.message}
                  onChange={(e) => setSupportData(prev => ({
                    ...prev,
                    message: e.target.value
                  }))}
                  required
                  rows="5"
                  placeholder="Please describe your issue in detail..."
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowSupportModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  <style>{`
        .settings-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .settings-header h1 {
          margin: 0;
          color: #2b6cb0;
          font-size: 2rem;
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

        .settings-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .settings-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }

        .settings-section h2 {
          margin: 0 0 1rem 0;
          color: #2d3748;
          font-size: 1.25rem;
        }

        .setting-item {
          margin-bottom: 1rem;
        }

        .switch-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          font-weight: 500;
        }

        .switch {
          position: relative;
          width: 50px;
          height: 26px;
          background: #ccc;
          border-radius: 13px;
          transition: background 0.2s;
        }

        .switch::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 22px;
          height: 22px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s;
        }

        .switch-label input[type="checkbox"] {
          display: none;
        }

        .switch-label input[type="checkbox"]:checked + .switch {
          background: #2b6cb0;
        }

        .switch-label input[type="checkbox"]:checked + .switch::before {
          transform: translateX(24px);
        }

        .setting-description {
          margin: 0.5rem 0 0 0;
          color: #666;
          font-size: 0.9rem;
        }

        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
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
          background: #e2e8f0;
          color: #2d3748;
        }

        .action-btn.secondary:hover {
          background: #cbd5e0;
        }

        .settings-actions {
          text-align: center;
        }

        .save-btn {
          background: #38a169;
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
        }

        .save-btn:hover:not(:disabled) {
          background: #2f855a;
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 0;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
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
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2b6cb0;
        }



        .password-requirements {
          margin-top: 0.5rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .password-requirements h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: #2d3748;
        }

        .password-requirements ul {
          margin: 0;
          padding-left: 1rem;
          font-size: 0.8rem;
        }

        .password-requirements li.met {
          color: #38a169;
        }

        .password-requirements li.unmet {
          color: #e53e3e;
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

        .loading-state {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .settings-container {
            padding: 1rem;
          }

          .settings-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .modal-content {
            width: 95%;
          }

          .password-input-container input {
            padding: 0.875rem 4rem 0.875rem 1rem;
            font-size: 16px; /* Prevents zoom on iOS */
          }

        }

        @media (max-width: 480px) {
          .modal-content {
            width: 98%;
            padding: 1.5rem 1rem;
          }

          .form-group input {
            padding: 0.75rem;
            font-size: 16px;
          }
        }

        @media (max-width: 360px) {
          .form-group input {
            padding: 0.7rem 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Settings
