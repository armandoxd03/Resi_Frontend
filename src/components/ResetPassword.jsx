import { useState, useEffect, useContext } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { AlertContext } from '../context/AlertContext'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { showAlert } = useContext(AlertContext)
  
  const [formData, setFormData] = useState({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    level: 'Weak',
    color: '#ef4444'
  })
  
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    match: false
  })

  const [touched, setTouched] = useState({
    token: false,
    newPassword: false,
    confirmPassword: false
  })

  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    // Auto-focus appropriate field
    if (!formData.token) {
      document.getElementById('token')?.focus()
    } else {
      document.getElementById('newPassword')?.focus()
    }
  }, [formData.token])

  const checkPasswordStrength = (password) => {
    let score = 0
    const newRequirements = { ...requirements }

    // Length check
    if (password.length >= 8) {
      score += 1
      newRequirements.length = true
    } else {
      newRequirements.length = false
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1
      newRequirements.uppercase = true
    } else {
      newRequirements.uppercase = false
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1
      newRequirements.lowercase = true
    } else {
      newRequirements.lowercase = false
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1
      newRequirements.number = true
    } else {
      newRequirements.number = false
    }

    // Password match check
    if (formData.confirmPassword && password === formData.confirmPassword) {
      newRequirements.match = true
    } else if (formData.confirmPassword) {
      newRequirements.match = false
    }

    setRequirements(newRequirements)

    let level = 'Weak'
    let color = '#ef4444'

    if (score >= 4) {
      level = 'Strong'
      color = '#10b981'
    } else if (score >= 3) {
      level = 'Good'
      color = '#f59e0b'
    } else if (score >= 2) {
      level = 'Fair'
      color = '#f97316'
    }

    setPasswordStrength({ score, level, color })
    return score >= 4
  }

  const validateField = (name, value) => {
    switch (name) {
      case 'token':
        return !value.trim() ? 'Reset token is required' : ''
      case 'newPassword':
        if (!value) return 'New password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        return ''
      case 'confirmPassword':
        if (!value) return 'Please confirm your password'
        if (value !== formData.newPassword) return 'Passwords do not match'
        return ''
      default:
        return ''
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))

    const error = validateField(name, value)
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleFocus = (e) => {
    const { name } = e.target
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const checkPasswordMatch = () => {
    if (formData.confirmPassword && formData.newPassword) {
      const match = formData.newPassword === formData.confirmPassword
      setRequirements(prev => ({ ...prev, match }))
      return match
    }
    return false
  }

  const validateForm = () => {
    const tokenValid = formData.token.trim().length > 0
    const passwordStrong = passwordStrength.score >= 4
    const passwordsMatch = requirements.match
    
    return tokenValid && passwordStrong && passwordsMatch
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear field errors when user starts typing
    if (touched[name] && fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    if (name === 'newPassword') {
      checkPasswordStrength(value)
    } else if (name === 'confirmPassword') {
      setTimeout(checkPasswordMatch, 0)
    }
  }



  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showAlert('warning', 'Please fill all fields with valid information')
      return
    }

    setLoading(true)

    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: formData.token, 
          newPassword: formData.newPassword 
        })
      })

      const data = await response.json()

      if (response.ok) {
        setShowSuccess(true)
        showAlert('success', 'Password reset successfully!')
      } else {
        throw new Error(data.message || 'Failed to reset password')
      }
      
    } catch (err) {
      console.error('Reset password error:', err)
      
      let errorMessage = 'There was a problem resetting your password. Please try again.'
      
      if (err.message.includes('token')) {
        errorMessage = 'Invalid or expired reset token. Please request a new reset link.'
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.'
      }
      
      showAlert('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToLogin = () => {
    navigate('/login')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      navigate('/login')
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (showSuccess) {
    return (
      <div className="reset-password-container fade-in">
        <div className="reset-card">
          <div className="success-content">
            <div className="success-icon">
              ✅
            </div>
            
            <div className="success-message">
              <h2>Password Reset Successful!</h2>
              <p>Your password has been successfully reset. You can now login with your new password.</p>
            </div>
            
            <button 
              onClick={handleGoToLogin}
              className="btn btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-container fade-in">
      <div className="reset-card">
        <div className="card-header">
          <img src="/logo.png" alt="ResiLinked Logo" className="reset-logo" />
          <h1>Reset Your Password</h1>
          <p>Enter your new password below</p>
        </div>
        
        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-group">
            <label htmlFor="token">Reset Token</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="token"
                name="token"
                value={formData.token}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                required
                placeholder="Enter reset token"
                className={fieldErrors.token ? 'error' : formData.token && !fieldErrors.token ? 'valid' : ''}
              />
              <div className="input-status">
                {fieldErrors.token && touched.token && (
                  <span className="error-icon" title={fieldErrors.token}>
                    ❌
                  </span>
                )}
                {formData.token && !fieldErrors.token && touched.token && (
                  <span className="success-icon" title="Valid token">
                    ✅
                  </span>
                )}
              </div>
            </div>
            {fieldErrors.token && touched.token && (
              <div className="field-error">
                {fieldErrors.token}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                required
                placeholder="Enter new password"
                className={fieldErrors.newPassword ? 'error' : formData.newPassword && !fieldErrors.newPassword ? 'valid' : ''}
              />
              <div className="input-status">
                {fieldErrors.newPassword && touched.newPassword && (
                  <span className="error-icon" title={fieldErrors.newPassword}>
                    ❌
                  </span>
                )}
                {formData.newPassword && !fieldErrors.newPassword && touched.newPassword && (
                  <span className="success-icon" title="Valid password">
                    ✅
                  </span>
                )}
              </div>
            </div>
            {fieldErrors.newPassword && touched.newPassword && (
              <div className="field-error">
                {fieldErrors.newPassword}
              </div>
            )}
            
            {formData.newPassword && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill"
                    style={{ 
                      width: `${(passwordStrength.score / 4) * 100}%`,
                      backgroundColor: passwordStrength.color 
                    }}
                  ></div>
                </div>
                <span 
                  className="strength-text"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.level}
                </span>
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                required
                placeholder="Confirm new password"
                className={fieldErrors.confirmPassword ? 'error' : formData.confirmPassword && !fieldErrors.confirmPassword && requirements.match ? 'valid' : ''}
              />
              <div className="input-status">
                {fieldErrors.confirmPassword && touched.confirmPassword && (
                  <span className="error-icon" title={fieldErrors.confirmPassword}>
                    ❌
                  </span>
                )}
                {formData.confirmPassword && !fieldErrors.confirmPassword && requirements.match && (
                  <span className="success-icon" title="Passwords match">
                    ✅
                  </span>
                )}
              </div>
            </div>
            {fieldErrors.confirmPassword && touched.confirmPassword && (
              <div className="field-error">
                {fieldErrors.confirmPassword}
              </div>
            )}
          </div>
          
          {formData.newPassword && (
            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={requirements.length ? 'met' : ''}>
                  At least 8 characters
                </li>
                <li className={requirements.uppercase ? 'met' : ''}>
                  At least one uppercase letter
                </li>
                <li className={requirements.lowercase ? 'met' : ''}>
                  At least one lowercase letter
                </li>
                <li className={requirements.number ? 'met' : ''}>
                  At least one number
                </li>
                <li className={requirements.match ? 'met' : ''}>
                  Passwords match
                </li>
              </ul>
            </div>
          )}
          
          <button 
            type="submit" 
            className="reset-btn"
            disabled={loading || !validateForm()}
          >
            {loading ? (
              <div className="btn-loader">
                <div className="spinner"></div>
                <span>Resetting...</span>
              </div>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
        
        <div className="form-footer">
          <Link to="/login" className="back-link">
            Back to Login
          </Link>
        </div>
      </div>
      
  <style>{`
        .reset-password-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 75%, #581c87 100%);
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        .reset-password-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="a" cx="50%" cy="50%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.1"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="200" r="150" fill="url(%23a)"/><circle cx="800" cy="300" r="100" fill="url(%23a)"/><circle cx="600" cy="700" r="120" fill="url(%23a)"/></svg>') center/cover;
          pointer-events: none;
        }
        
        .reset-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 32px 64px rgba(147, 51, 234, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 540px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .reset-card::-webkit-scrollbar {
          width: 8px;
        }

        .reset-card::-webkit-scrollbar-track {
          background: rgba(147, 51, 234, 0.1);
          border-radius: 8px;
        }

        .reset-card::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          border-radius: 8px;
        }

        .reset-card::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
        }
        
        .card-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .reset-logo {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 32px rgba(147, 51, 234, 0.3);
        }
        
        .card-header h1 {
          background: linear-gradient(135deg, #9333ea, #6b21a8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.75rem 0;
          font-size: 2.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        
        .card-header p {
          color: #64748b;
          margin: 0;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .reset-form {
          margin-bottom: 2rem;
        }
        
        .form-group {
          margin-bottom: 1.75rem;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 0.75rem;
          color: #374151;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .form-group input {
          width: 100%;
          padding: 1rem 3rem 1rem 1.25rem;
          border: 2px solid rgba(147, 51, 234, 0.1);
          border-radius: 16px;
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          font-family: inherit;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #9333ea;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
          transform: translateY(-1px);
        }

        .form-group input:hover {
          border-color: rgba(147, 51, 234, 0.2);
          background: rgba(255, 255, 255, 0.9);
        }

        .form-group input.valid {
          border-color: #059669;
          background: rgba(255, 255, 255, 0.95);
        }

        .form-group input.valid:focus {
          box-shadow: 
            0 0 0 4px rgba(5, 150, 105, 0.1),
            0 8px 24px rgba(5, 150, 105, 0.15);
        }
        
        .form-group input.error {
          border-color: #dc2626;
          background: rgba(255, 255, 255, 0.95);
        }

        .form-group input.error:focus {
          box-shadow: 
            0 0 0 4px rgba(220, 38, 38, 0.1),
            0 8px 24px rgba(220, 38, 38, 0.15);
        }

        .input-status {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          gap: 0.25rem;
          pointer-events: none;
          z-index: 1;
        }

        .error-icon {
          color: #dc2626;
          display: flex;
          align-items: center;
        }

        .success-icon {
          color: #059669;
          display: flex;
          align-items: center;
        }

        .field-error {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 10px;
          font-size: 0.875rem;
          color: #dc2626;
          font-weight: 500;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        

        
        .password-strength {
          margin-top: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: rgba(147, 51, 234, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(147, 51, 234, 0.1);
        }
        
        .strength-bar {
          flex: 1;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 3px;
        }
        
        .strength-text {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        
        .password-requirements {
          background: linear-gradient(135deg, rgba(147, 51, 234, 0.05), rgba(147, 51, 234, 0.02));
          padding: 1.25rem;
          border-radius: 16px;
          margin-bottom: 1.75rem;
          border: 1px solid rgba(147, 51, 234, 0.1);
          backdrop-filter: blur(10px);
        }
        
        .password-requirements h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.95rem;
          color: #374151;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        
        .password-requirements ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 0.5rem;
        }
        
        .password-requirements li {
          position: relative;
          font-size: 0.875rem;
          color: #64748b;
          padding-left: 1.75rem;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
        }
        
        .password-requirements li::before {
          content: '✗';
          position: absolute;
          left: 0;
          color: #dc2626;
          font-weight: bold;
          font-size: 1rem;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(220, 38, 38, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .password-requirements li.met {
          color: #059669;
          font-weight: 500;
        }
        
        .password-requirements li.met::before {
          content: '✓';
          color: white;
          background: #059669;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
        }
        
        .reset-btn {
          width: 100%;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          border: none;
          padding: 1.25rem 1.5rem;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(147, 51, 234, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.025em;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 58px;
        }

        .reset-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.3s ease;
        }

        .reset-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(147, 51, 234, 0.35);
        }

        .reset-btn:hover:not(:disabled)::before {
          left: 100%;
        }

        .reset-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.3);
        }
        
        .reset-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.2);
        }
        
        .btn-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top: 2.5px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .form-footer {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid rgba(147, 51, 234, 0.1);
        }
        
        .back-link {
          color: #9333ea;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .back-link:hover {
          background: rgba(147, 51, 234, 0.1);
          text-decoration: none;
        }
        
        .success-content {
          text-align: center;
        }
        
        .success-icon {
          margin-bottom: 2rem;
          display: flex;
          justify-content: center;
        }
        
        .success-message h2 {
          background: linear-gradient(135deg, #059669, #047857);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 1rem 0;
          font-size: 2rem;
          font-weight: 700;
        }
        
        .success-message p {
          color: #374151;
          margin-bottom: 2rem;
          line-height: 1.6;
          font-size: 1.1rem;
        }

        .btn {
          padding: 1rem 2rem;
          border: none;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 58px;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          box-shadow: 0 8px 24px rgba(147, 51, 234, 0.3);
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          box-shadow: 0 10px 28px rgba(147, 51, 234, 0.35);
          text-decoration: none;
        }

        .fade-in {
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { 
            opacity: 0; 
          }
          to { 
            opacity: 1; 
          }
        }
        
        @media (max-width: 768px) {
          .reset-password-container {
            padding: 1rem 0.5rem;
          }

          .reset-card {
            padding: 2rem 1.5rem;
            border-radius: 20px;
            margin: 0.5rem;
          }
          
          .card-header h1 {
            font-size: 1.75rem;
          }

          .reset-logo {
            width: 64px;
            height: 64px;
          }

          .form-group input {
            padding: 0.875rem 3rem 0.875rem 1rem;
            font-size: 16px; /* Prevents zoom on iOS */
          }

          .input-status {
            right: 1rem;
            gap: 0.2rem;
          }

          .reset-btn {
            padding: 1rem 1.25rem;
            font-size: 1rem;
          }

          .password-requirements {
            padding: 1rem;
          }

          .password-requirements ul {
            gap: 0.375rem;
          }
        }

        @media (max-width: 480px) {
          .reset-card {
            padding: 1.5rem 1rem;
            margin: 0.25rem;
          }

          .card-header {
            margin-bottom: 2rem;
          }

          .card-header h1 {
            font-size: 1.5rem;
          }

          .form-group input {
            padding: 0.75rem 3rem 0.75rem 0.875rem;
            font-size: 16px;
          }

          .input-status {
            right: 1rem;
            gap: 0.15rem;
          }

          .error-icon,
          .success-icon {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 360px) {
          .reset-card {
            padding: 1.25rem 0.875rem;
          }

          .form-group input {
            padding: 0.7rem 2.5rem 0.7rem 0.75rem;
            font-size: 16px;
          }

          .input-status {
            right: 0.75rem;
          }

          .card-header h1 {
            font-size: 1.25rem;
          }
        }
          }

          .form-group {
            margin-bottom: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default ResetPassword
