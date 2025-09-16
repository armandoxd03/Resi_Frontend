import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'

function PostProfile() {
  const navigate = useNavigate()
  const { user, token } = useContext(AuthContext)
  const { showAlert } = useContext(AlertContext)
  
  const [formData, setFormData] = useState({
    bio: '',
    hourlyRate: '',
    experience: '',
    availability: '',
    serviceDescription: '',
    portfolio: '',
    certifications: ''
  })
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isDraft, setIsDraft] = useState(false)

  useEffect(() => {
    // Check if user is employee or both
    if (!user || (user.userType !== 'employee' && user.userType !== 'both')) {
      showAlert('Employee access required', 'error')
      navigate('/landing')
      return
    }

    // Load draft from localStorage if exists
    const draftProfile = localStorage.getItem('draftProfile')
    if (draftProfile) {
      try {
        const draft = JSON.parse(draftProfile)
        setFormData(draft.formData || {})
        setSkills(draft.skills || [])
        setIsDraft(true)
      } catch (error) {
        console.error('Error loading draft:', error)
      }
    }

    // Load existing profile data
    loadExistingProfile()
  }, [user, navigate, showAlert])

  const loadExistingProfile = async () => {
    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const profile = await response.json()
        if (profile.bio || profile.hourlyRate || profile.experience) {
          setFormData({
            bio: profile.bio || '',
            hourlyRate: profile.hourlyRate || '',
            experience: profile.experience || '',
            availability: profile.availability || '',
            serviceDescription: profile.serviceDescription || '',
            portfolio: profile.portfolio || '',
            certifications: profile.certifications || ''
          })
          if (profile.skills) {
            setSkills(profile.skills)
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      addSkill(skillInput.trim())
      setSkillInput('')
    }
  }

  const addSkill = (skill) => {
    if (!skills.includes(skill) && skills.length < 10) {
      setSkills(prev => [...prev, skill])
    }
  }

  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove))
  }

  const saveDraft = () => {
    const draftData = { formData, skills }
    localStorage.setItem('draftProfile', JSON.stringify(draftData))
    showAlert('Profile saved as draft successfully!', 'success')
    setIsDraft(true)
  }

  const clearDraft = () => {
    localStorage.removeItem('draftProfile')
    setIsDraft(false)
    showAlert('Draft cleared', 'info')
  }

  const validateForm = () => {
    if (!formData.bio.trim()) {
      showAlert('Bio is required', 'error')
      return false
    }
    if (!formData.serviceDescription.trim()) {
      showAlert('Service description is required', 'error')
      return false
    }
    if (skills.length === 0) {
      showAlert('Please add at least one skill', 'error')
      return false
    }
    if (formData.hourlyRate && (isNaN(formData.hourlyRate) || formData.hourlyRate <= 0)) {
      showAlert('Please enter a valid hourly rate', 'error')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const profileData = {
        ...formData,
        skills,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null
      }

  const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      showAlert('Profile published successfully!', 'success')
      localStorage.removeItem('draftProfile')
      setIsDraft(false)
      
      // Redirect after success
      setTimeout(() => {
        navigate('/employee-dashboard')
      }, 2000)

    } catch (error) {
      console.error('Error publishing profile:', error)
      showAlert('Failed to publish profile. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1>
          <i className="fas fa-user-edit"></i>
          Edit Worker Profile
        </h1>
        <Link to="/employee-dashboard" className="back-btn">
          <i className="fas fa-arrow-left"></i>
          Back to Dashboard
        </Link>
      </header>

      {isDraft && (
        <div className="draft-notice">
          <i className="fas fa-save"></i>
          <span>You have unsaved draft changes</span>
          <button className="clear-draft-btn" onClick={clearDraft}>
            Clear Draft
          </button>
        </div>
      )}

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>
            <i className="fas fa-info-circle"></i>
            Basic Information
          </h2>
          
          <div className="form-group">
            <label htmlFor="bio">Bio / About Me *</label>
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell employers about yourself, your experience, and what makes you a great worker..."
              rows="4"
              required
            />
            <small>Minimum 50 characters recommended</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hourlyRate">Hourly Rate (₱)</label>
              <input
                type="number"
                id="hourlyRate"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                placeholder="e.g., 150"
                min="50"
                max="5000"
              />
              <small>Optional - set your preferred hourly rate</small>
            </div>

            <div className="form-group">
              <label htmlFor="experience">Years of Experience</label>
              <select
                id="experience"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', e.target.value)}
              >
                <option value="">Select experience level</option>
                <option value="0-1">0-1 years (Beginner)</option>
                <option value="1-3">1-3 years (Intermediate)</option>
                <option value="3-5">3-5 years (Experienced)</option>
                <option value="5-10">5-10 years (Expert)</option>
                <option value="10+">10+ years (Master)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="availability">Availability</label>
            <select
              id="availability"
              value={formData.availability}
              onChange={(e) => handleInputChange('availability', e.target.value)}
            >
              <option value="">Select availability</option>
              <option value="full-time">Full-time (40+ hours/week)</option>
              <option value="part-time">Part-time (20-40 hours/week)</option>
              <option value="weekends">Weekends only</option>
              <option value="evenings">Evenings only</option>
              <option value="flexible">Flexible schedule</option>
              <option value="project-based">Project-based</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>
            <i className="fas fa-tools"></i>
            Skills & Services
          </h2>
          
          <div className="form-group">
            <label htmlFor="serviceDescription">Service Description *</label>
            <textarea
              id="serviceDescription"
              value={formData.serviceDescription}
              onChange={(e) => handleInputChange('serviceDescription', e.target.value)}
              placeholder="Describe the services you offer. What type of work can you do? What are your specialties?"
              rows="4"
              required
            />
            <small>Be specific about what services you can provide</small>
          </div>

          <div className="form-group">
            <label htmlFor="skillInput">Skills *</label>
            <div className="skills-input-container">
              <input
                type="text"
                id="skillInput"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="Type a skill and press Enter (e.g., Plumbing, Electrical, Cleaning...)"
                maxLength="30"
              />
              <button
                type="button"
                className="add-skill-btn"
                onClick={() => {
                  if (skillInput.trim()) {
                    addSkill(skillInput.trim())
                    setSkillInput('')
                  }
                }}
              >
                Add
              </button>
            </div>
            <small>Add up to 10 skills. Press Enter or click Add after each skill.</small>
            
            {skills.length > 0 && (
              <div className="skills-container">
                {skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      className="remove-skill"
                      onClick={() => removeSkill(skill)}
                      title="Remove skill"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>
            <i className="fas fa-certificate"></i>
            Additional Information
          </h2>
          
          <div className="form-group">
            <label htmlFor="portfolio">Portfolio / Work Samples</label>
            <textarea
              id="portfolio"
              value={formData.portfolio}
              onChange={(e) => handleInputChange('portfolio', e.target.value)}
              placeholder="Links to your previous work, photos of completed projects, or descriptions of notable jobs you've done..."
              rows="3"
            />
            <small>Optional - showcase your best work</small>
          </div>

          <div className="form-group">
            <label htmlFor="certifications">Certifications & Training</label>
            <textarea
              id="certifications"
              value={formData.certifications}
              onChange={(e) => handleInputChange('certifications', e.target.value)}
              placeholder="List any relevant certifications, training courses, or licenses you have..."
              rows="3"
            />
            <small>Optional - add credibility to your profile</small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={saveDraft}
          >
            <i className="fas fa-save"></i>
            Save Draft
          </button>
          
          <button
            type="submit"
            className="btn primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Publishing...
              </>
            ) : (
              <>
                <i className="fas fa-upload"></i>
                Publish Profile
              </>
            )}
          </button>
        </div>
      </form>

  <style>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .page-header h1 {
          color: #2b6cb0;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f8f9fa;
          color: #2b6cb0;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #e9ecef;
        }

        .draft-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #856404;
        }

        .clear-draft-btn {
          margin-left: auto;
          padding: 0.25rem 0.75rem;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .clear-draft-btn:hover {
          background: #5a6268;
        }

        .profile-form {
          background: #f8f9fa;
          padding: 2rem;
          border-radius: 12px;
        }

        .form-section {
          margin-bottom: 2.5rem;
          background: white;
          padding: 1.5rem;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .form-section h2 {
          color: #2b6cb0;
          margin: 0 0 1.5rem 0;
          font-size: 1.3rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #4a5568;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: #666;
          font-size: 0.8rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .skills-input-container {
          display: flex;
          gap: 0.5rem;
        }

        .skills-input-container input {
          flex: 1;
        }

        .add-skill-btn {
          padding: 0.75rem 1rem;
          background: #38a169;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .add-skill-btn:hover {
          background: #2f855a;
        }

        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          min-height: 50px;
        }

        .skill-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: #2b6cb0;
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .remove-skill {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1.2rem;
          font-weight: bold;
          padding: 0;
          margin-left: 0.25rem;
          line-height: 1;
        }

        .remove-skill:hover {
          color: #ffeb3b;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          font-size: 1rem;
        }

        .btn.primary {
          background: #2b6cb0;
          color: white;
        }

        .btn.primary:hover:not(:disabled) {
          background: #2c5aa0;
        }

        .btn.secondary {
          background: #6c757d;
          color: white;
        }

        .btn.secondary:hover {
          background: #5a6268;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .profile-form {
            padding: 1rem;
          }

          .form-section {
            padding: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .skills-input-container {
            flex-direction: column;
          }

          .page-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default PostProfile
