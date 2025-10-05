import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import apiService from '../api'

function PostJob() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    barangay: '',
    postMethod: 'public'
  })
  
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [skillError, setSkillError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { user, isLoggedIn } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn) {
      showError('Please log in to post a job')
      navigate('/login')
      return
    }

    // Load draft if exists
    const draft = localStorage.getItem('draftJob')
    if (draft) {
      try {
        const draftData = JSON.parse(draft)
        setFormData({
          title: draftData.title || '',
          description: draftData.description || '',
          price: draftData.price || '',
          barangay: draftData.barangay || '',
          postMethod: draftData.postMethod || 'public'
        })
        
        if (draftData.skillsRequired && draftData.skillsRequired.length > 0) {
          setSkills(draftData.skillsRequired)
        }
      } catch (e) {
        console.error('Error loading draft:', e)
      }
    }
  }, [isLoggedIn, navigate, showError])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (formError) {
      setFormError('')
    }
  }

  const handleSkillInputKeyDown = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      addSkill(skillInput.trim())
      setSkillInput('')
    }
  }

  const addSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills(prev => [...prev, skill])
      setSkillError('')
    } else {
      setSkillError('Skill already added')
    }
  }

  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove))
  }

  const handleSaveDraft = () => {
    const draftData = {
      ...formData,
      skillsRequired: skills
    }
    localStorage.setItem('draftJob', JSON.stringify(draftData))
    success('Job saved as draft.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    
    if (skills.length === 0) {
      setFormError('Please add at least one required skill')
      return
    }
    if (!formData.postTiming || (formData.postTiming === 'schedule' && !formData.scheduledTime)) {
      setFormError('Please select a post timing and date/time if scheduling')
      return
    }

    setLoading(true);
    try {
      const result = await apiService.createJob({
        ...formData,
        skillsRequired: skills
      });

      success("Job posted successfully!");
      setFormData({
        title: '',
        description: '',
        price: '',
        barangay: '',
        postMethod: 'public',
        postTiming: 'now',
        scheduledTime: ''
      });
      setSkills([]);
      localStorage.removeItem('draftJob');
      setTimeout(() => {
        navigate('/employer-dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error posting job:', err);
      const errorMessage = err?.message || 'Failed to post job. Please try again.';
      setFormError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="post-job-container">
      <div className="post-job-card">
        <div className="post-job-header">
          <h1>Post a Job</h1>
          <Link to="/employer-dashboard" className="back-btn">Back to Dashboard</Link>
        </div>

        <form onSubmit={handleSubmit} className="post-job-form">
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
              placeholder="Describe the job requirements, what needs to be done, and any specific instructions"
            />
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
                min="0"
                step="0.01"
                placeholder="e.g., 500.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="barangay">Location (Barangay) *</label>
              <input
                type="text"
                id="barangay"
                name="barangay"
                value={formData.barangay}
                onChange={handleInputChange}
                required
                placeholder="e.g., Barangay San Jose"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Required Skills <span style={{color:'red'}}>*</span></label>
            <div className="skills-table">
              {['Plumbing','Carpentry','Cleaning','Electrical','Painting','Gardening','Cooking','Driving','Babysitting','Tutoring','IT Support','Customer Service'].map(skill => (
                <div key={skill} className="skills-table-row">
                  <span className="skills-table-name">{skill}</span>
                  <input
                    type="checkbox"
                    name="skillsRequired"
                    value={skill}
                    checked={skills.includes(skill)}
                    onChange={e => {
                      const checked = e.target.checked;
                      setSkills(checked
                        ? [...skills, skill]
                        : skills.filter(s => s !== skill)
                      );
                    }}
                    className="skills-table-checkbox"
                  />
                </div>
              ))}
            </div>
            <div className="form-group">
              <label htmlFor="otherSkill">Other:</label>
              <input
                type="text"
                id="otherSkill"
                name="otherSkill"
                value={formData.otherSkill || ''}
                onChange={e => setFormData(prev => ({...prev, otherSkill: e.target.value}))}
                placeholder="Add custom skill"
              />
              <div className="custom-skill-actions">
                <button type="button" className="btn btn-secondary add-btn"
                  onClick={() => {
                    if (formData.otherSkill && !skills.includes(formData.otherSkill)) {
                      setSkills([...skills, formData.otherSkill]);
                      setFormData(prev => ({...prev, otherSkill: ''}));
                    }
                  }}
                >Add</button>
                <button type="button" className="btn btn-secondary clear-btn"
                  onClick={() => {
                    setFormData(prev => ({...prev, otherSkill: ''}));
                    setSkills([]);
                  }}
                >Clear</button>
              </div>
            </div>
            <small>Select all that apply. Add custom skills if needed.</small>
            {skills.length === 0 && (
              <div className="field-error">Please select at least one required skill</div>
            )}
            {skills.length > 0 && (
                <div className="skill-tags">
                  {skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
            )}
          </div>

          <div className="form-group">
            <label>Post Timing *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="postTiming"
                  value="now"
                  checked={formData.postTiming === 'now'}
                  onChange={() => setFormData(prev => ({...prev, postTiming: 'now'}))}
                  style={{ marginRight: "5px" }}
                  required
                />
                <span className="radio-text">Post Now</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="postTiming"
                  value="schedule"
                  checked={formData.postTiming === 'schedule'}
                  onChange={() => setFormData(prev => ({...prev, postTiming: 'schedule'}))}
                  style={{ marginRight: "5px" }}
                  required
                />
                <span className="radio-text">Schedule Post</span>
              </label>
            </div>
            {formData.postTiming === 'schedule' && (
              <div style={{marginTop: '0.7em'}}>
                <label htmlFor="scheduledTime">Select Date & Time:</label>
                <input
                  type="datetime-local"
                  id="scheduledTime"
                  name="scheduledTime"
                  value={formData.scheduledTime || ''}
                  onChange={e => setFormData(prev => ({...prev, scheduledTime: e.target.value}))}
                  style={{marginLeft: '0.5em'}}
                  required
                />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="save-draft-btn"
              onClick={handleSaveDraft}
            >
              Save as Draft
            </button>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Posting Job...
                </>
              ) : (
                'Post Job'
              )}
            </button>
          </div>
        </form>
      </div>

  <style>{`
        .post-job-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .post-job-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .post-job-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .post-job-header h1 {
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
          font-weight: 600;
          color: #2d3748;
        }

        input[type="text"],
        input[type="number"],
        textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        input[type="text"]:focus,
        input[type="number"]:focus,
        textarea:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        textarea {
          resize: vertical;
          font-family: inherit;
        }

        .skill-tags {
          margin-top: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .skill-tag {
          background: #2b6cb0;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

          .skills-table {
            display: flex;
            flex-direction: column;
            gap: 0;
            max-height: 140px;
            overflow-y: auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f9f9f9;
            padding: 0.5em 0.5em;
          }
          .skills-table-row {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            padding: 0.3em 0.5em;
            border-bottom: 1px solid #f0f0f0;
          }
          .skills-table-row:last-child {
            border-bottom: none;
          }
          .skills-table-name {
            font-size: 1em;
            color: #2d3748;
          }
          .skills-table-checkbox {
            justify-self: end;
            accent-color: #2b6cb0;
            width: 18px;
            height: 18px;
          }
          @media (max-width: 600px) {
            .skills-table-row {
              grid-template-columns: 1fr auto;
              padding: 0.3em 0.3em;
            }
            .skills-table-name {
              font-size: 0.98em;
            }
            .skills-table-checkbox {
              width: 16px;
              height: 16px;
            }
          }

            .pro-checkbox-label {
              display: flex;
              align-items: center;
              gap: 0.4em;
              padding: 0.15em 0.3em;
            }
            .pro-checkbox {
              margin: 0 0.2em 0 0;
              vertical-align: middle;
              accent-color: #2b6cb0;
              width: 16px;
              height: 16px;
            }
            .pro-checkbox-text {
              display: inline-block;
              vertical-align: middle;
              font-size: 0.98rem;
              color: #2d3748;
            }
            .skill-tag {
              background: linear-gradient(90deg, #2b6cb0 80%, #2563eb 100%);
              color: #fff;
              padding: 0.18rem 0.7rem 0.18rem 0.7rem;
              border-radius: 16px;
              font-size: 0.95rem;
              display: flex;
              align-items: center;
              gap: 0.35rem;
              box-shadow: 0 2px 8px rgba(43,108,176,0.08);
            }
            .remove-skill {
              margin-left: 0.3em;
              background: none;
              border: none;
              color: #e53e3e;
              cursor: pointer;
              font-weight: 500;
              font-size: 1em;
              line-height: 1;
              transition: color 0.2s;
            }
            .remove-skill:hover {
              color: #b91c1c;
            }
            .pro-checkbox {
              margin: 0;
              vertical-align: middle;
              position: relative;
              top: 0;
            }
            .pro-checkbox-text {
              display: inline-block;
              vertical-align: middle;
            }

        .remove-skill {
          cursor: pointer;
          font-weight: bold;
          font-size: 1.2rem;
          line-height: 1;
        }

        .remove-skill:hover {
          color: #fed7d7;
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
          font-weight: normal;
          user-select: none;
        }

        .radio-label input[type="radio"] {
          margin: 0;
          width: auto;
          height: 16px;
          width: 16px;
          vertical-align: middle;
          position: relative;
          top: -1px;
        }
        
        .radio-text {
          display: inline-block;
          vertical-align: middle;
          line-height: 1;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .save-draft-btn {
          background: #718096;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .save-draft-btn:hover {
          background: #4a5568;
        }

        .submit-btn {
          background: #2b6cb0;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          background: #2c5282;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background: #fed7d7;
          color: #c53030;
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .field-error {
          color: #e53e3e;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        @media (max-width: 768px) {
            .pro-checkbox-group-grid {
              grid-template-columns: 1fr;
              max-height: 56px; /* Show 2 skills at a time on mobile */
              overflow-y: auto;
            }
          .post-job-container {
            padding: 1rem;
          }

          .post-job-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
        .custom-skill-actions {
          display: flex;
          gap: 0.5em;
          margin-top: 0.5em;
        }
        .add-btn, .clear-btn {
          background: #e2e8f0;
          color: #2b6cb0;
          border: none;
          border-radius: 6px;
          padding: 0.4em 1em;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
        }
        .add-btn:hover, .add-btn:focus {
          background: #2b6cb0;
          color: #fff;
          box-shadow: 0 2px 8px rgba(43,108,176,0.12);
        }
        .clear-btn:hover, .clear-btn:focus {
          background: #fed7d7;
          color: #c53030;
          box-shadow: 0 2px 8px rgba(197,48,48,0.12);
        }
        @media (max-width: 600px) {
          .custom-skill-actions {
            flex-direction: column;
            gap: 0.3em;
            width: 100%;
          }
          .add-btn, .clear-btn {
            width: 100%;
            padding: 0.5em 0;
          }
        }
        .custom-skill-actions {
          display: flex;
          gap: 0.5em;
          margin-top: 0.5em;
        }
        .add-btn, .clear-btn {
          background: #e2e8f0;
          color: #2b6cb0;
          border: none;
          border-radius: 6px;
          padding: 0.4em 1em;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
        }
        .add-btn:hover, .add-btn:focus {
          background: #2b6cb0;
          color: #fff;
          box-shadow: 0 2px 8px rgba(43,108,176,0.12);
        }
        .clear-btn:hover, .clear-btn:focus {
          background: #fed7d7;
          color: #c53030;
          box-shadow: 0 2px 8px rgba(197,48,48,0.12);
        }
        @media (max-width: 600px) {
          .custom-skill-actions {
            flex-direction: column;
            gap: 0.3em;
            width: 100%;
          }
          .add-btn, .clear-btn {
            width: 100%;
            padding: 0.5em 0;
          }
        }
      `}</style>
    </div>
  )
}

export default PostJob
