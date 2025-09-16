import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'
import apiService from '../api'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  
  const { login, isAuthenticated } = useAuth()
  const { success, error: showError } = useAlert()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/landing')
    }

    // Load saved email if remember me was checked
    if (localStorage.getItem('rememberMe') === 'true') {
      const savedEmail = localStorage.getItem('savedEmail')
      if (savedEmail) {
        setFormData(prev => ({
          ...prev,
          email: savedEmail,
          rememberMe: true
        }))
      }
    }
  }, [isAuthenticated, navigate])

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email'
        return ''
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 6) return 'Password must be at least 6 characters'
        return ''
      default:
        return ''
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
    
    // Clear errors when user starts typing
    if (error) setError('')
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    const fieldError = validateField(name, value)
    if (fieldError) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: fieldError
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate all fields
    const errors = {}
    Object.keys(formData).forEach(key => {
      if (key !== 'rememberMe') {
        const fieldError = validateField(key, formData[key])
        if (fieldError) errors[key] = fieldError
      }
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    try {
      const data = await apiService.login({
        email: formData.email,
        password: formData.password
      })
      
      if (data.success) {
        // Handle remember me
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
          localStorage.setItem('savedEmail', formData.email)
        } else {
          localStorage.removeItem('rememberMe')
          localStorage.removeItem('savedEmail')
        }

        // Login user
        login(data.token, {
          userId: data.userId,
          userType: data.userType,
          isVerified: data.isVerified,
          firstName: data.firstName,
          lastName: data.lastName,
          email: formData.email
        })

        // Show success message
        success('Login successful! Redirecting...', 2000)

        // Redirect based on user type
        setTimeout(() => {
          if (data.userType === 'admin') {
            navigate('/admin-dashboard')
          } else {
            navigate('/landing')
          }
        }, 1500)
      } else {
        const errorMessage = data.alert || 'Invalid email or password'
        setError(errorMessage)
        showError(errorMessage)
      }
    } catch (err) {
      console.error('Login error:', err)
      const errorMessage = err.message || 'Connection error. Please try again.'
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    const email = formData.email.trim()
    if (email) {
      navigate(`/reset-request?email=${encodeURIComponent(email)}`)
    } else {
      navigate('/reset-request')
    }
  }

  return (
    <div className="login-container fade-in">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="ResiLinked Logo" className="login-logo" />
          <h1>ResiLinked</h1>
          <p>Mag-login sa inyong account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message" id="loginError">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                autoComplete="email"
                placeholder="Ilagay ang inyong email"
                className={fieldErrors.email ? 'error' : formData.email && !fieldErrors.email ? 'valid' : ''}
              />
              <div className="input-status">
                {fieldErrors.email && (
                  <span className="error-icon" title={fieldErrors.email}>
                    ❌
                  </span>
                )}
                {formData.email && !fieldErrors.email && (
                  <span className="success-icon" title="Valid email">
                    ✅
                  </span>
                )}
              </div>
            </div>
            {fieldErrors.email && (
              <div className="field-error">
                {fieldErrors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                required
                autoComplete="current-password"
                placeholder="Ilagay ang inyong password"
                className={fieldErrors.password ? 'error' : formData.password && !fieldErrors.password ? 'valid' : ''}
              />
              <div className="input-status">
                {fieldErrors.password && (
                  <span className="error-icon" title={fieldErrors.password}>
                    ❌
                  </span>
                )}
                {formData.password && !fieldErrors.password && (
                  <span className="success-icon" title="Valid password">
                    ✅
                  </span>
                )}
              </div>
            </div>
            {fieldErrors.password && (
              <div className="field-error">
                {fieldErrors.password}
              </div>
            )}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              Remember me
            </label>
          </div>

          <button 
            type="submit" 
            className="login-btn" 
            disabled={loading}
          >
            <span className="btn-text" style={{ display: loading ? 'none' : 'inline' }}>
              Login
            </span>
            <div className="btn-loader" style={{ display: loading ? 'flex' : 'none' }}>
              <div className="spinner"></div>
              <span>Logging in...</span>
            </div>
          </button>

          <div className="login-links">
            <button 
              type="button" 
              className="link-button" 
              onClick={handleForgotPassword}
            >
              Nakalimutan ang password?
            </button>
          </div>
        </form>

        <div className="login-footer">
          <p>Wala kayong account pa?</p>
          <Link to="/register" className="register-link">
            Mag-register dito
          </Link>
        </div>

        <div className="back-home">
          <Link to="/" className="back-home-btn">
            Bumalik sa Home
          </Link>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 75%, #581c87 100%);
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }

        .login-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="a" cx="50%" cy="50%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.1"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="200" r="150" fill="url(%23a)"/><circle cx="800" cy="300" r="100" fill="url(%23a)"/><circle cx="600" cy="700" r="120" fill="url(%23a)"/></svg>') center/cover;
          pointer-events: none;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 32px 64px rgba(147, 51, 234, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 440px;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .login-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .login-logo {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 32px rgba(147, 51, 234, 0.3);
        }

        .login-header h1 {
          background: linear-gradient(135deg, #9333ea, #6b21a8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.75rem 0;
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .login-header p {
          color: #64748b;
          margin: 0;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 1.75rem;
        }

        label {
          display: block;
          margin-bottom: 0.75rem;
          color: #374151;
          font-weight: 600;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        input[type="email"],
        input[type="password"] {
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

        input[type="email"]:focus,
        input[type="password"]:focus {
          outline: none;
          border-color: #9333ea;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
          transform: translateY(-1px);
        }

        input[type="email"]:hover,
        input[type="password"]:hover {
          border-color: rgba(147, 51, 234, 0.2);
          background: rgba(255, 255, 255, 0.9);
        }

        input.valid {
          border-color: #059669;
          background: rgba(255, 255, 255, 0.95);
        }

        input.valid:focus {
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        input.error {
          border-color: #dc2626;
          background: rgba(255, 255, 255, 0.95);
        }

        input.error:focus {
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
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



        .checkbox-group {
          margin-bottom: 1.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 0.95rem;
          color: #64748b;
          font-weight: 500;
          gap: 0.75rem;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          margin: 0;
          accent-color: #9333ea;
          border-radius: 4px;
        }

        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          border: none;
          padding: 1rem 1.5rem;
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
        }

        .login-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.3s ease;
        }

        .login-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(147, 51, 234, 0.35);
        }

        .login-btn:hover:not(:disabled)::before {
          left: 100%;
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.3);
        }

        .login-btn:disabled {
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

        .login-links {
          text-align: center;
          margin-bottom: 2rem;
        }

        .link-button {
          background: none;
          border: none;
          color: #9333ea;
          cursor: pointer;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          transition: all 0.2s ease;
          position: relative;
        }

        .link-button:hover {
          color: #7c3aed;
          background: rgba(147, 51, 234, 0.1);
          text-decoration: none;
        }

        .login-footer {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid rgba(147, 51, 234, 0.1);
          margin-bottom: 1.5rem;
        }

        .login-footer p {
          margin: 0 0 0.75rem 0;
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .register-link {
          color: #059669;
          text-decoration: none;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          transition: all 0.2s ease;
          display: inline-block;
        }

        .register-link:hover {
          background: rgba(5, 150, 105, 0.1);
          text-decoration: none;
          transform: translateY(-1px);
        }

        .back-home {
          text-align: center;
        }

        .back-home-btn {
          color: #64748b;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .back-home-btn:hover {
          color: #9333ea;
          background: rgba(147, 51, 234, 0.1);
          text-decoration: none;
        }

        .error-message {
          background: linear-gradient(135deg, #fef2f2, #fee2e2);
          color: #dc2626;
          padding: 1rem 1.25rem;
          border-radius: 16px;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
          font-weight: 500;
          border: 1px solid rgba(220, 38, 38, 0.2);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .error-message::before {
          content: '⚠';
          font-size: 1.1rem;
          flex-shrink: 0;
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
          .login-container {
            padding: 0.5rem;
          }

          .login-card {
            padding: 2rem 1.5rem;
            border-radius: 20px;
            margin: 0.5rem;
          }

          .login-header h1 {
            font-size: 2rem;
          }

          .login-logo {
            width: 64px;
            height: 64px;
          }

          input[type="email"],
          input[type="password"] {
            padding: 0.875rem 3rem 0.875rem 1rem;
            font-size: 16px; /* Prevents zoom on iOS */
          }

          .input-status {
            right: 1rem;
            gap: 0.2rem;
          }

          .login-btn {
            padding: 0.875rem 1.25rem;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 1.5rem 1rem;
            margin: 0.25rem;
          }

          .login-header {
            margin-bottom: 2rem;
          }

          .login-header h1 {
            font-size: 1.75rem;
          }

          input[type="email"],
          input[type="password"] {
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
          .login-card {
            padding: 1.25rem 0.875rem;
          }

          input[type="email"],
          input[type="password"] {
            padding: 0.7rem 2.5rem 0.7rem 0.75rem;
            font-size: 16px;
          }

          .input-status {
            right: 0.75rem;
          }

          .login-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Login
