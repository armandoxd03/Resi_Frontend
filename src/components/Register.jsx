import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'
import apiService from '../api'

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNo: '',
    address: '',
    barangay: '',
    gender: '',
    idType: '',
    idNumber: '',
    userType: 'employee',
    skills: [],
    idFrontImage: null,
    idBackImage: null,
    profilePicture: null,
    otherBarangay: '',
    otherSkill: ''
  })
  
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false)
  const skillsDropdownRef = useRef(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  
  const { isAuthenticated } = useAuth()
  const { success, error: showError } = useAlert()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/landing')
    }
  }, [isAuthenticated, navigate])
  
  // Handle click outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const header = document.querySelector('.custom-select-header');
      const clickedOnHeader = header && header.contains(event.target);
      
      if (skillsDropdownRef.current && 
          !skillsDropdownRef.current.contains(event.target) && 
          !clickedOnHeader) {
        setSkillsDropdownOpen(false);
      }
    }

    // Add event listener when dropdown is open
    if (skillsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [skillsDropdownOpen])

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // Special case for barangay field
    if (name === 'barangay' && value === 'other') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        otherBarangay: ''
      }))
    }
    
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }
  
  // Toggle skills dropdown visibility
  const toggleSkillsDropdown = () => {
    setSkillsDropdownOpen(prev => !prev)
  }
  
  // Handle skill checkbox selection
  const handleSkillCheckbox = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const checkPasswordsMatch = () => {
    if (formData.confirmPassword === "") {
      setPasswordError("")
      return
    }

    if (formData.password === formData.confirmPassword) {
      setPasswordError("Passwords match!")
    } else {
      setPasswordError("Passwords do not match!")
    }
  }

  useEffect(() => {
    checkPasswordsMatch()
  }, [formData.password, formData.confirmPassword])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!")
      return
    }
    
    // Validate that at least one skill is selected if employee or both
    if ((formData.userType === 'employee' || formData.userType === 'both') && 
        (!formData.skills || formData.skills.length === 0)) {
      setError("Please select at least one skill")
      return
    }

    setLoading(true)
    setError('')

    const submitFormData = new FormData()
    
    // Add all text fields
    Object.keys(formData).forEach(key => {
      if (key === 'skills') {
        // Handle skills array - append each skill separately
        if (Array.isArray(formData.skills)) {
          formData.skills.forEach(skill => {
            submitFormData.append("skills", skill);
          });
        }
      } else if (key === 'otherSkill' && formData.skills.includes('Other')) {
        // Add other skill as a skill item
        submitFormData.append("skills", formData.otherSkill);
      } else if (key === 'barangay' && formData.barangay === 'other') {
        // Use the otherBarangay value if barangay is set to 'other'
        submitFormData.append('barangay', formData.otherBarangay);
      } else if (key !== 'confirmPassword' && key !== 'idFrontImage' && key !== 'idBackImage' && 
                key !== 'profilePicture' && key !== 'skills' && key !== 'otherBarangay' &&
                key !== 'otherSkill') {
        submitFormData.append(key, formData[key])
      }
    })

    // Add files
    if (formData.idFrontImage) {
      submitFormData.append("idFrontImage", formData.idFrontImage)
    }
    if (formData.idBackImage) {
      submitFormData.append("idBackImage", formData.idBackImage)
    }
    if (formData.profilePicture) {
      submitFormData.append("profilePicture", formData.profilePicture)
    }

    try {
      // Using apiService instead of direct fetch for consistent error handling and CORS settings
      const data = await apiService.register(submitFormData);

      if (data && data.success) {
        success('Registration successful! Please check your email for verification.')
        setVerificationSent(true)
      } else {
        const errorMessage = data.message || data.alert || "Registration failed. Please try again."
        setError(errorMessage)
        showError(errorMessage)
      }
    } catch (err) {
      console.error("Registration error:", err)
      const errorMessage = "Connection error. Please try again."
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (verificationSent) {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="success-message">
            <h2>Registration Successful!</h2>
            <p>A verification email has been sent to your email address. Please check your email and click the verification link to activate your account.</p>
            <Link to="/login" className="login-link">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="register-container fade-in">
      <div className="register-card">
        <div className="register-header">
          <img src="/logo.png" alt="ResiLinked Logo" className="register-logo" style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '24px', marginBottom: '1.5rem', boxShadow: '0 8px 32px rgba(147, 51, 234, 0.3)' }} />
          <h1>ResiLinked</h1>
          <p>Gumawa ng bagong account</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                placeholder="Unang pangalan"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                placeholder="Apelyido"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="email@example.com"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Gumawa ng password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Ulitin ang password"
                style={{
                  borderColor: passwordError === "Passwords match!" ? 'green' : 
                             passwordError === "Passwords do not match!" ? 'red' : ''
                }}
              />
              {passwordError && (
                <div className={`password-feedback ${passwordError === "Passwords match!" ? 'success' : 'error'}`}>
                  {passwordError}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mobileNo">Mobile Number</label>
            <input
              type="tel"
              id="mobileNo"
              name="mobileNo"
              value={formData.mobileNo}
              onChange={handleInputChange}
              required
              placeholder="09XXXXXXXXX"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              placeholder="Buong address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="barangay">Barangay</label>
            <select
              id="barangay"
              name="barangay"
              value={formData.barangay}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Barangay</option>
              <option value="Sto. Rosario">Sto. Rosario</option>
              <option value="Sta. Lucia">Sta. Lucia</option>
              <option value="Sta. Teresita">Sta. Teresita</option>
              <option value="other">Other</option>
            </select>
            {formData.barangay === 'other' && (
              <input
                type="text"
                id="otherBarangay"
                name="otherBarangay"
                value={formData.otherBarangay}
                onChange={handleInputChange}
                placeholder="Specify your barangay"
                style={{ marginTop: '0.5em' }}
                required={formData.barangay === 'other'}
              />
            )}
          </div>

          {(formData.userType === 'employee' || formData.userType === 'both') && (
            <div className="form-group">
              <label htmlFor="skills">Skills <span style={{color:'red'}}>*</span></label>
              <div className="custom-select-container">
                <div 
                  className="custom-select-header"
                  onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}
                  style={{
                    borderColor: formData.skills.length > 0 ? '#7e22ce' : 'rgba(147, 51, 234, 0.1)',
                    boxShadow: skillsDropdownOpen ? '0 0 0 2px rgba(126, 34, 206, 0.1)' : 'none'
                  }}
                >
                  <div className="custom-select-value">
                    {formData.skills.length === 0 
                      ? "Select skills" 
                      : `${formData.skills.length} skills selected`}
                  </div>
                  <div className="custom-select-arrow" style={{ 
                    transform: skillsDropdownOpen ? 'rotate(180deg)' : 'none' 
                  }}>▼</div>
                </div>
                
                {skillsDropdownOpen && (
                  <div className="custom-select-options" ref={skillsDropdownRef}>
                    {['Plumbing', 'Carpentry', 'Cleaning', 'Electrical', 'Painting', 'Gardening', 
                      'Cooking', 'Driving', 'Babysitting', 'Tutoring', 'IT Support', 'Customer Service', 'Other'].map(skill => (
                      <div key={skill} className="custom-select-option">
                        <label className="checkbox-label">
                          <div className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              checked={formData.skills.includes(skill)}
                              onChange={() => handleSkillCheckbox(skill)}
                              className="skill-checkbox"
                            />
                            <div className="checkbox-custom"></div>
                          </div>
                          <span className="checkbox-text">{skill.toUpperCase()}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {formData.skills.includes('Other') && (
                <input
                  type="text"
                  id="otherSkill"
                  name="otherSkill"
                  value={formData.otherSkill || ''}
                  onChange={e => setFormData(prev => ({...prev, otherSkill: e.target.value}))}
                  placeholder="Specify your skill"
                  style={{ marginTop: '0.5em' }}
                  required={formData.skills.includes('Other')}
                />
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Pumili ng gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="userType">User Type</label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                required
              >
                <option value="employee">Employee</option>
                <option value="employer">Employer</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="idType">ID Type</label>
              <select
                id="idType"
                name="idType"
                value={formData.idType}
                onChange={handleInputChange}
                required
              >
                <option value="">Pumili ng ID type</option>
                <option value="drivers_license">Driver's License</option>
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="voter_id">Voter's ID</option>
                <option value="sss_id">SSS ID</option>
                <option value="philhealth_id">PhilHealth ID</option>
                <option value="tin_id">TIN ID</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="idNumber">ID Number</label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                required
                placeholder="ID number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="idFrontImage">ID Front Image</label>
              <input
                type="file"
                id="idFrontImage"
                name="idFrontImage"
                onChange={handleInputChange}
                accept="image/*"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="idBackImage">ID Back Image</label>
              <input
                type="file"
                id="idBackImage"
                name="idBackImage"
                onChange={handleInputChange}
                accept="image/*"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profilePicture">Profile Picture (Optional)</label>
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              onChange={handleInputChange}
              accept="image/*"
            />
          </div>

          {/* Skills section has been moved to the multi-select dropdown above */}

          <button 
            type="submit" 
            className="register-btn" 
            disabled={loading}
          >
            {loading ? (
              <div className="btn-loader">
                <div className="spinner"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>May account na kayo?</p>
          <Link to="/login" className="login-link">
            Mag-login dito
          </Link>
        </div>

        <div className="back-home">
          <Link to="/" className="back-home-btn">
            Bumalik sa Home
          </Link>
        </div>
      </div>

      <style>{`
        .register-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 75%, #581c87 100%);
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        .register-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="a" cx="50%" cy="50%"><stop offset="0%" stop-color="%23ffffff" stop-opacity="0.1"/><stop offset="100%" stop-color="%23ffffff" stop-opacity="0"/></radialGradient></defs><circle cx="200" cy="200" r="150" fill="url(%23a)"/><circle cx="800" cy="300" r="100" fill="url(%23a)"/><circle cx="600" cy="700" r="120" fill="url(%23a)"/></svg>') center/cover;
          pointer-events: none;
        }

        .register-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 32px 64px rgba(147, 51, 234, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 720px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .register-card::-webkit-scrollbar {
          width: 8px;
        }

        .register-card::-webkit-scrollbar-track {
          background: rgba(147, 51, 234, 0.1);
          border-radius: 8px;
        }

        .register-card::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          border-radius: 8px;
        }

        .register-card::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
        }

        .register-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .register-logo {
          width: 80px;
          height: 80px;
          border-radius: 20px;
          margin-bottom: 1.5rem;
          box-shadow: 0 8px 32px rgba(147, 51, 234, 0.3);
        }

        .register-header h1 {
          background: linear-gradient(135deg, #9333ea, #6b21a8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.75rem 0;
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .register-header p {
          color: #64748b;
          margin: 0;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.75rem;
        }

        .form-group {
          margin-bottom: 1.75rem;
        }

        .form-row .form-group {
          margin-bottom: 0;
        }

        label {
          display: block;
          margin-bottom: 0.75rem;
          color: #374151;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        label::after {
          content: ' *';
          color: #dc2626;
          font-weight: bold;
        }

        .form-group:has(input[type="file"]:not([required])) label::after,
        .form-group:has(input[name="skills"]) label::after {
          content: ' (Optional)';
          color: #64748b;
          font-weight: normal;
          text-transform: none;
          font-size: 0.8rem;
        }

        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="tel"],
        input[type="file"],
        select {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid rgba(147, 51, 234, 0.1);
          border-radius: 16px;
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          font-family: inherit;
        }
        
        .custom-select-container {
          position: relative;
          width: 100%;
        }
        
        .custom-select-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid rgba(147, 51, 234, 0.1);
          border-radius: 16px;
          font-size: 1rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .custom-select-header:hover {
          border-color: rgba(147, 51, 234, 0.2);
        }
        
        .custom-select-value {
          flex: 1;
        }
        
        .custom-select-arrow {
          font-size: 0.8rem;
          color: #666;
          transition: transform 0.2s;
        }
        
        .custom-select-options {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          max-height: 240px;
          overflow-y: auto;
          border: 2px solid rgba(147, 51, 234, 0.1);
          border-radius: 12px;
          background: white;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          animation: fadeIn 0.2s ease-in-out;
          padding: 6px 0;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .custom-select-option {
          padding: 0.6rem 1rem;
          border-bottom: 1px solid rgba(147, 51, 234, 0.05);
        }
        
        .custom-select-option:last-child {
          border-bottom: none;
        }
        
        .custom-select-option:hover {
          background: rgba(147, 51, 234, 0.05);
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          width: 100%;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .checkbox-wrapper {
          position: relative;
          display: inline-block;
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          margin-right: 10px;
          vertical-align: middle;
        }
        
        .skill-checkbox {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }
        
        .checkbox-custom {
          position: absolute;
          top: 0;
          left: 0;
          height: 18px;
          width: 18px;
          background-color: #fff;
          border: 2px solid #7e22ce;
          border-radius: 4px;
          transition: all 0.2s;
        }
        
        .skill-checkbox:checked ~ .checkbox-custom {
          background-color: #7e22ce;
        }
        
        .checkbox-custom:after {
          content: "";
          position: absolute;
          display: none;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .skill-checkbox:checked ~ .checkbox-custom:after {
          display: block;
        }
        
        .checkbox-text {
          display: inline-block;
          vertical-align: middle;
          margin-top: 1px;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
        }
        
        small {
          display: block;
          margin-top: 0.5rem;
          color: #64748b;
          font-size: 0.8rem;
          font-style: italic;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: #9333ea;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
          transform: translateY(-1px);
        }

        input:hover,
        select:hover {
          border-color: rgba(147, 51, 234, 0.2);
          background: rgba(255, 255, 255, 0.9);
        }

        select {
          background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23374151" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 12px;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }

        input[type="file"] {
          padding: 0.75rem 1rem;
          cursor: pointer;
          border-style: dashed;
        }

        input[type="file"]::-webkit-file-upload-button {
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          margin-right: 1rem;
          transition: all 0.2s ease;
        }

        input[type="file"]::-webkit-file-upload-button:hover {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          transform: translateY(-1px);
        }

        small {
          display: block;
          margin-top: 0.5rem;
          color: #64748b;
          font-size: 0.8rem;
          font-style: italic;
        }

        .password-feedback {
          font-size: 0.875rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          border-radius: 10px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .password-feedback.success {
          color: #059669;
          background: rgba(5, 150, 105, 0.1);
          border: 1px solid rgba(5, 150, 105, 0.2);
        }

        .password-feedback.success::before {
          content: '✓';
          font-weight: bold;
        }

        .password-feedback.error {
          color: #dc2626;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .password-feedback.error::before {
          content: '✗';
          font-weight: bold;
        }

        .register-btn {
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
          margin-bottom: 2rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(147, 51, 234, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .register-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.3s ease;
        }

        .register-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed, #6b21a8);
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(147, 51, 234, 0.35);
        }

        .register-btn:hover:not(:disabled)::before {
          left: 100%;
        }

        .register-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.3);
        }

        .register-btn:disabled {
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

        .register-footer {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid rgba(147, 51, 234, 0.1);
          margin-bottom: 1.5rem;
        }

        .register-footer p {
          margin: 0 0 0.75rem 0;
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .login-link {
          color: #059669;
          text-decoration: none;
          font-weight: 700;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          transition: all 0.2s ease;
          display: inline-block;
        }

        .login-link:hover {
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

        .success-message {
          text-align: center;
          padding: 3rem 2rem;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-radius: 20px;
          border: 1px solid rgba(5, 150, 105, 0.2);
        }

        .success-message h2 {
          background: linear-gradient(135deg, #059669, #047857);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.5rem;
          font-size: 2rem;
          font-weight: 700;
        }

        .success-message p {
          color: #374151;
          margin-bottom: 2rem;
          line-height: 1.7;
          font-size: 1.1rem;
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
          .register-container {
            padding: 1rem 0.5rem;
          }

          .register-card {
            padding: 2rem 1.5rem;
            border-radius: 20px;
            margin: 0.5rem;
          }

          .register-header h1 {
            font-size: 2rem;
          }

          .register-logo {
            width: 64px;
            height: 64px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .form-row .form-group {
            margin-bottom: 1.75rem;
          }

          input[type="text"],
          input[type="email"],
          input[type="password"],
          input[type="tel"],
          select {
            padding: 0.875rem 1rem;
            font-size: 16px; /* Prevents zoom on iOS */
          }

          .register-btn {
            padding: 1rem 1.25rem;
            font-size: 1rem;
          }
        }

        @media (max-width: 480px) {
          .register-card {
            padding: 1.5rem 1.25rem;
          }

          .register-header {
            margin-bottom: 2rem;
          }

          .register-header h1 {
            font-size: 1.75rem;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }
        }

        /* Enhanced input validation states */
        input:valid:not(:placeholder-shown) {
          border-color: #059669;
        }

        input:invalid:not(:placeholder-shown):not(:focus) {
          border-color: #dc2626;
        }

        /* Progress indicator for multi-step feeling */
        .register-header::after {
          content: '';
          position: absolute;
          bottom: -1rem;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 4px;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          border-radius: 2px;
        }

        .register-header {
          position: relative;
        }

        /* Custom dropdown styles */
        .custom-dropdown-container {
          position: relative;
          width: 100%;
          user-select: none;
          font-size: 1rem;
        }
        
        .custom-dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          min-height: 42px;
          color: #333;
          font-size: 0.9rem;
        }
        
        .custom-dropdown-header:hover {
          border-color: #7e22ce;
        }
        
        .dropdown-selected-value {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          font-size: 0.9rem;
        }
        
        .dropdown-arrow {
          font-size: 10px;
          color: #555;
          margin-left: 8px;
          transition: transform 0.2s;
        }
        
        .custom-dropdown-options {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-top: 5px;
          max-height: 210px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          padding: 6px 0;
        }
        
        .custom-dropdown-option {
          padding: 10px 15px;
          transition: background-color 0.2s;
        }
        
        .custom-dropdown-option:hover {
          background-color: #f5f3ff;
        }
        
        .checkbox-container {
          display: flex;
          align-items: center;
          cursor: pointer;
          width: 100%;
          font-size: 0.9rem;
        }
        
        .checkbox-checked {
          background-color: #7e22ce !important;
        }
        
        .checkbox-container input[type="checkbox"] {
          margin-right: 8px;
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid #7e22ce;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          position: relative;
          transition: background 0.2s, border-color 0.2s;
        }
        
        .checkbox-container input[type="checkbox"]:checked {
          background: #7e22ce;
        }
        
        .checkbox-container input[type="checkbox"]:checked::after {
          content: "";
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .checkbox-text {
          margin-left: 10px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #444;
        }
        
        .custom-dropdown-option:not(:last-child) {
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  )
}

export default Register
