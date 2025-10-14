import { useState, useEffect, useContext } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertContext } from '../context/AlertContext'

function ResetRequest() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [touched, setTouched] = useState(false)
  const [searchParams] = useSearchParams()
  const { showAlert } = useContext(AlertContext)

  useEffect(() => {
    // Pre-fill email if coming from login page
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
      setTouched(true)
    }
  }, [searchParams])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailBlur = () => {
    setTouched(true)
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setEmailError('Email is required')
    } else if (!validateEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address')
    } else {
      setEmailError('')
    }
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (touched && emailError) {
      const trimmedEmail = e.target.value.trim()
      if (trimmedEmail && validateEmail(trimmedEmail)) {
        setEmailError('')
      }
    }
  }

  const handleEmailFocus = () => {
    if (emailError) {
      setEmailError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const trimmedEmail = email.trim()
    
    if (!trimmedEmail) {
      showAlert('warning', 'Please enter your email address')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      showAlert('error', 'Please enter a valid email format')
      return
    }

    setLoading(true)

    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/reset/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: trimmedEmail })
      })

      const data = await response.json()

      if (response.ok) {
        setShowSuccess(true)
        showAlert('success', 'Reset link successfully sent to your email!')
      } else {
        throw new Error(data.message || 'Failed to send reset email')
      }
      
    } catch (err) {
      console.error('Reset request error:', err)
      
      let errorMessage = 'There was a problem sending the email. Please try again.'
      
      if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.'
      } else if (err.message.includes('not found') || err.message.includes('404')) {
        errorMessage = 'Email address not found in our records.'
      }
      
      showAlert('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleTryAgain = () => {
    setShowSuccess(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      window.location.href = '/login'
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (showSuccess) {
    return (
      <div className="reset-request-container fade-in">
        <div className="reset-card">
          <div className="success-content">
            <div className="success-message">
              <h2>Reset Link Sent</h2>
              <p>Please check your email for the password reset link.</p>
              <p className="note">If you don't see the email, check your spam folder.</p>
            </div>
            <div className="action-buttons">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleTryAgain}
              >
                Try Again
              </button>
              <Link to="/login" className="btn btn-primary">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-request-container fade-in">
      <div className="reset-card">
        <div className="card-header">
          <img src="/logo.png" alt="ResiLinked Logo" className="reset-logo" />
          <h1>Reset Your Password</h1>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                onFocus={handleEmailFocus}
                required
                placeholder="Enter your email address"
                className={emailError ? 'error' : email && !emailError ? 'valid' : ''}
                autoFocus
              />
            </div>
            {emailError && touched && (
              <div className="field-error">
                {emailError}
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="reset-btn"
            disabled={loading || !!emailError}
          >
            {loading ? (
              <div className="btn-loader">
                <div className="spinner"></div>
                <span>Sending...</span>
              </div>
            ) : (
              'Send Reset Email'
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
        .reset-request-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 75%, #581c87 100%);
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        .reset-request-container::before {
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
          max-width: 480px;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.2);
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
          line-height: 1.6;
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
          text-align: left;
          vertical-align: middle;
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
        
        /* Add placeholder styles to ensure alignment */
        .form-group input::placeholder {
          color: #9CA3AF;
          opacity: 0.7;
          text-align: left;
          vertical-align: middle;
        }

        .input-status {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          pointer-events: none;
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
          text-align: left;
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
          animation: bounceIn 0.6s ease;
        }

        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
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
          margin-bottom: 0.75rem;
          line-height: 1.6;
          font-size: 1.1rem;
        }
        
        .success-message .note {
          font-size: 0.95rem;
          font-style: italic;
          color: #64748b;
          margin-bottom: 2rem;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          min-width: 120px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.3);
        }
        
        .btn-primary:hover {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          box-shadow: 0 10px 28px rgba(147, 51, 234, 0.35);
          text-decoration: none;
        }
        
        .btn-secondary {
          background: rgba(147, 51, 234, 0.1);
          color: #9333ea;
          border: 1px solid rgba(147, 51, 234, 0.2);
        }
        
        .btn-secondary:hover {
          background: rgba(147, 51, 234, 0.2);
          border-color: rgba(147, 51, 234, 0.3);
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
        
        @media (max-width: 640px) {
          .reset-request-container {
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
          
          .action-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .btn {
            width: 100%;
            max-width: 280px;
          }

          .form-group input {
            padding: 0.875rem 3rem 0.875rem 1rem;
            font-size: 16px; /* Prevents zoom on iOS */
          }

          .input-status {
            right: 0.75rem;
            gap: 0.2rem;
          }

          .error-icon,
          .success-icon {
            font-size: 0.9rem;
          }

          .reset-btn {
            padding: 1rem 1.25rem;
            font-size: 1rem;
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

          .form-group input {
            padding: 0.75rem 2.5rem 0.75rem 0.875rem;
            font-size: 16px;
          }

          .input-status {
            right: 0.625rem;
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
            padding: 0.7rem 2.25rem 0.7rem 0.75rem;
            font-size: 16px;
          }

          .input-status {
            right: 0.5rem;
          }

          .error-icon,
          .success-icon {
            font-size: 0.75rem;
          }

          .card-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default ResetRequest
