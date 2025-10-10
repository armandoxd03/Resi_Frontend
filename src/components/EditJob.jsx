import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import apiService from '../api'

function EditJob() {
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    barangay: '',
    skillsRequired: []
  })
  const [skills, setSkills] = useState([])
  const [formError, setFormError] = useState('')
  const [job, setJob] = useState(null)

  const { jobId } = useParams()
  const { user, hasAccessTo } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)
  const navigate = useNavigate()

  useEffect(() => {
    // Verify user is an employer
    if (!hasAccessTo('employer')) {
      showError('Employer access required')
      navigate('/landing')
      return
    }

    // Load job details
    loadJobDetails()
  }, [jobId, hasAccessTo, navigate, showError])

  const loadJobDetails = async () => {
    try {
      setLoading(true)
      const jobData = await apiService.getJob(jobId)
      
      console.log('Loaded job data:', jobData)
      console.log('Current user:', user)
      
      if (!jobData) {
        showError('Job not found')
        navigate('/employer-dashboard')
        return
      }

      // Ensure we have the postedBy data
      if (!jobData.postedBy || !jobData.postedBy._id) {
        console.error('Job data missing postedBy information:', jobData)
        showError('Invalid job data - missing owner information')
        navigate('/employer-dashboard')
        return
      }

      // Convert IDs to strings for accurate comparison
      const jobOwnerId = jobData.postedBy._id.toString()
      const currentUserId = user.id.toString()
      
      console.log('Ownership check:', {
        jobOwnerId,
        currentUserId,
        isMatch: jobOwnerId === currentUserId,
        userType: user.userType
      })

      // Verify job belongs to current user or user is admin
      if (jobOwnerId !== currentUserId && user.userType !== 'admin') {
        showError('You can only edit your own jobs')
        navigate('/employer-dashboard')
        return
      }

      setJob(jobData)
      setFormData({
        title: jobData.title || '',
        description: jobData.description || '',
        price: jobData.price || '',
        barangay: jobData.barangay || '',
      })

      setSkills(jobData.skillsRequired || [])
    } catch (err) {
      console.error('Error loading job details:', err)
      showError('Failed to load job details')
      navigate('/employer-dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSkillInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault()
      const newSkill = e.target.value.trim()
      if (!skills.includes(newSkill)) {
        setSkills([...skills, newSkill])
      }
      e.target.value = ''
    }
  }

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Form validation
    if (!formData.title || !formData.description || !formData.price || !formData.barangay) {
      setFormError('Please fill in all required fields')
      return
    }

    // Price validation
    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      setFormError('Please enter a valid price')
      return
    }

    setLoading(true)
    try {
      console.log('Submitting job edit:', {
        jobId,
        userId: user?.id,
        userType: user?.userType
      })
      
      // Make API call to update job
      const result = await apiService.editJob(jobId, {
        ...formData,
        skillsRequired: skills,
        price: parseFloat(formData.price)
      })

      console.log('Job edit response:', result)
      
      success("Job updated successfully!")
      setTimeout(() => {
        navigate('/employer-dashboard')
      }, 1500)
    } catch (err) {
      console.error('Error updating job:', err)
      
      // Enhanced error handling
      let errorMessage = err?.message || 'Failed to update job. Please try again.'
      
      // Check for common error cases
      if (errorMessage.includes('Not authorized') || errorMessage.includes('not authorized')) {
        errorMessage = 'Authorization error: You can only edit jobs that you posted. Your user ID may not match the job poster ID.'
        console.log('User auth details:', {
          currentUserId: user?.id,
          userType: user?.userType
        })
      }
      
      setFormError(errorMessage)
      showError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner large"></div>
        <p>Loading job details...</p>
      </div>
    )
  }

  return (
    <div className="edit-job-container">
      <div className="edit-job-card">
        <div className="edit-job-header">
          <h1>Edit Job</h1>
          <Link to="/employer-dashboard" className="back-btn">Back to Dashboard</Link>
        </div>

        <form onSubmit={handleSubmit} className="edit-job-form">
          {formError && (
            <div className="error-message">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., House Cleaning, Plumbing Repair"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Job Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Describe the job in detail..."
            ></textarea>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (₱) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="1"
                step="1"
                placeholder="e.g., 500"
              />
            </div>

            <div className="form-group">
              <label htmlFor="barangay">Barangay *</label>
              <input
                type="text"
                id="barangay"
                name="barangay"
                value={formData.barangay}
                onChange={handleInputChange}
                required
                placeholder="e.g., San Antonio"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Skills Required</label>
            <div className="skills-input">
              <input
                type="text"
                placeholder="Type skill and press Enter"
                onKeyDown={handleSkillInput}
              />
              <div className="skills-tags">
                {skills.map((skill, index) => (
                  <div key={index} className="skill-tag">
                    {skill}
                    <button 
                      type="button" 
                      className="remove-skill"
                      onClick={() => removeSkill(skill)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn primary" 
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Job'}
            </button>
            <Link to="/employer-dashboard" className="btn secondary">Cancel</Link>
          </div>
        </form>
      </div>

      <style>{`
        .edit-job-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .edit-job-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .edit-job-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .edit-job-header h1 {
          margin: 0;
          color: #2b6cb0;
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

        .edit-job-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        label {
          font-weight: 500;
          color: #4a5568;
        }

        input, textarea, select {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        input:focus, textarea:focus, select:focus {
          border-color: #2b6cb0;
          outline: none;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        .error-message {
          background-color: #fed7d7;
          color: #c53030;
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .skills-input {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .skills-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-tag {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .remove-skill {
          background: none;
          border: none;
          color: #4a5568;
          cursor: pointer;
          font-size: 1rem;
          padding: 0 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .remove-skill:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          text-decoration: none;
          text-align: center;
        }

        .btn.primary {
          background: #2b6cb0;
          color: white;
        }

        .btn.primary:hover {
          background: #2c5282;
        }

        .btn.secondary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .btn.secondary:hover {
          background: #cbd5e0;
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2b6cb0;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .edit-job-container {
            padding: 1rem;
          }
          
          .edit-job-card {
            padding: 1.5rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default EditJob