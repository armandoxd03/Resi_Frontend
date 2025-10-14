import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import ReportModal from './ReportModal'

// Use environment variable for API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://resi-backend-1.onrender.com/api'

function SearchJobs() {
  const [searchQuery, setSearchQuery] = useState({
    skill: '',
    barangay: '',
    minPrice: '',
    maxPrice: ''
  })
  
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedJobs, setExpandedJobs] = useState({})
  const [reportModal, setReportModal] = useState({ isOpen: false, jobId: null, jobTitle: '' })
  
  const { user, isLoggedIn } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchQuery(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await searchJobs(searchQuery)
  }

  const searchJobs = async (query) => {
    setLoading(true)
    setHasSearched(true)
    
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (query.skill) params.append('skill', query.skill)
      if (query.barangay) params.append('barangay', query.barangay)
      if (query.minPrice) params.append('minPrice', query.minPrice)
      if (query.maxPrice) params.append('maxPrice', query.maxPrice)

      const response = await fetch(`${API_BASE}/jobs/search?${params}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        setJobs(data.data)
      } else {
        setJobs([])
        if (data.message) {
          showError(data.message)
        }
      }
    } catch (err) {
      console.error('Search error:', err)
      let errorMessage = 'Something went wrong while searching for jobs.'
      
      if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.'
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      }
      
      showError(errorMessage)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const toggleJobExpansion = (jobId) => {
    setExpandedJobs(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }))
  }

  const applyToJob = async (jobId, e) => {
    // Prevent the click from toggling the job expansion
    e.stopPropagation()
    
    if (!isLoggedIn) {
      showError('Please login to apply for jobs.')
      return
    }

    const token = localStorage.getItem('token')
    
    try {
      const response = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      
      if (response.ok) {
        success(data.alert || 'Successfully applied to the job!')
        // Refresh the search results to update applicant count
        await searchJobs(searchQuery)
      } else {
        showError(data.alert || data.message || 'Failed to apply to job')
      }
    } catch (err) {
      console.error('Apply error:', err)
      let errorMessage = 'Error applying to job. Please try again.'
      
      if (err.message.includes('already applied')) {
        errorMessage = 'You have already applied to this job.'
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.'
      } else if (err.message.includes('unauthorized')) {
        errorMessage = 'Please log in again to apply for jobs.'
      }
      
      showError(errorMessage)
    }
  }

  const openReportModal = (job, e) => {
    e.stopPropagation() // Prevent job card expansion
    setReportModal({
      isOpen: true,
      jobId: job._id,
      jobTitle: job.title
    })
  }

  const closeReportModal = () => {
    setReportModal({ isOpen: false, jobId: null, jobTitle: '' })
  }

  const handleReportSubmit = async (reason) => {
    try {
      const apiService = await import('../api').then(module => module.default)
      await apiService.reportJob({
        reportedJobId: reportModal.jobId,
        reason
      })
      success('Report submitted successfully')
      closeReportModal()
    } catch (error) {
      console.error('Error submitting report:', error)
      showError(error.message || 'Failed to submit report')
      throw error
    }
  }

  // Load initial job listings on component mount
  useEffect(() => {
    searchJobs({})
  }, [])

  return (
    <div className="search-jobs-container">
      <div className="search-jobs-header">
        <h1>Search Jobs</h1>
  <Link to="/employee-dashboard" className="back-btn">Back to Dashboard</Link>
      </div>

      {/* Search Form */}
      <div className="search-form-card">
        <form onSubmit={handleSubmit} className="search-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="skill">Skill</label>
              <select
                id="skill"
                name="skill"
                value={searchQuery.skill}
                onChange={handleInputChange}
                style={{ minHeight: '48px', fontSize: '1rem' }}
              >
                <option value="">Select a skill</option>
                {['Plumbing','Carpentry','Cleaning','Electrical','Painting','Gardening','Cooking','Driving','Babysitting','Tutoring','IT Support','Customer Service'].map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
                <option value="Other">Other</option>
              </select>
              {searchQuery.skill === 'Other' && (
                <input
                  type="text"
                  id="otherSkill"
                  name="otherSkill"
                  value={searchQuery.otherSkill || ''}
                  onChange={handleInputChange}
                  placeholder="Add custom skill"
                  style={{ marginTop: '0.5em' }}
                  required
                />
              )}
            </div>

            <div className="form-group">
              <label htmlFor="barangay">Location (Barangay)</label>
              <input
                type="text"
                id="barangay"
                name="barangay"
                value={searchQuery.barangay}
                onChange={handleInputChange}
                placeholder="e.g., Barangay San Jose"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="minPrice">Min Price (₱)</label>
              <input
                type="number"
                id="minPrice"
                name="minPrice"
                value={searchQuery.minPrice}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxPrice">Max Price (₱)</label>
              <input
                type="number"
                id="maxPrice"
                name="maxPrice"
                value={searchQuery.maxPrice}
                onChange={handleInputChange}
                placeholder="10000"
                min="0"
              />
            </div>
          </div>

          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Searching...
              </>
            ) : (
              'Search Jobs'
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      <div className="results-section">
        {loading && (
          <div className="loading-state">
            <div className="spinner large"></div>
            <p>Searching for jobs...</p>
          </div>
        )}

        {!loading && hasSearched && jobs.length === 0 && (
          <div className="no-results">
            <h3>No jobs found</h3>
            <p>Try adjusting your search criteria to find more opportunities.</p>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="results-header">
            <h2>Found {jobs.length} job{jobs.length !== 1 ? 's' : ''}</h2>
          </div>
        )}

        <div className="jobs-grid">
          {jobs.map((job) => (
            <div 
              key={job._id} 
              className={`job-card ${expandedJobs[job._id] ? 'expanded' : ''}`}
              onClick={() => toggleJobExpansion(job._id)}
            >
              <div className="job-header">
                <h3>{job.title}</h3>
                <div className="job-price">₱{job.price?.toLocaleString()}</div>
              </div>

              <div className="job-preview">
                <div className="job-preview-detail">
                  <span className="preview-icon">📍</span> {job.barangay}
                </div>
                
                {job.skillsRequired && job.skillsRequired.length > 0 && (
                  <div className="job-preview-detail">
                    <span className="preview-icon">🛠️</span> {job.skillsRequired.slice(0, 2).join(', ')}
                    {job.skillsRequired.length > 2 && ` +${job.skillsRequired.length - 2} more`}
                  </div>
                )}
                
                <div className="job-preview-detail">
                  <span className="preview-icon">👥</span> {job.applicants ? job.applicants.length : 0} applicant(s)
                </div>
              </div>
              
              <div className="expansion-indicator">
                {expandedJobs[job._id] ? '▲' : '▼'} 
                <span className="indicator-text">{expandedJobs[job._id] ? 'Show less' : 'Show more'}</span>
              </div>

              {expandedJobs[job._id] && (
                <div className="job-content">
                  <hr className="content-divider" />
                  <p className="job-description">
                    <strong>Description:</strong> {job.description || 'No description available'}
                  </p>

                  <div className="job-details">
                    <div className="job-detail">
                      <strong>Location:</strong> {job.barangay}
                    </div>
                    
                    {job.skillsRequired && job.skillsRequired.length > 0 && (
                      <div className="job-detail">
                        <strong>Skills Required:</strong>
                        <div className="skills-list">
                          {job.skillsRequired.map((skill, index) => (
                            <span key={index} className="skill-badge">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="job-detail">
                      <strong>Posted by:</strong> {
                        job.postedBy 
                          ? `${job.postedBy.firstName} ${job.postedBy.lastName}` 
                          : 'Anonymous'
                      }
                    </div>

                    <div className="job-detail">
                      <strong>Applicants:</strong> {job.applicants ? job.applicants.length : 0}
                    </div>
                    
                    <div className="job-actions">
                      <button 
                        className="apply-btn"
                        onClick={(e) => applyToJob(job._id, e)}
                        disabled={!isLoggedIn || (user && job.applicants && job.applicants.some(a => (a.user && (a.user._id === user.id || a.user === user.id))))}
                        title={
                          !isLoggedIn
                            ? "Please login to apply"
                            : (user && job.applicants && job.applicants.some(a => (a.user && (a.user._id === user.id || a.user === user.id))))
                              ? "You have already applied to this job"
                              : "Apply for this job"
                        }
                      >
                        {!isLoggedIn
                          ? 'Login to Apply'
                          : (user && job.applicants && job.applicants.some(a => (a.user && (a.user._id === user.id || a.user === user.id))))
                            ? 'Already Applied'
                            : 'Apply Now'}
                      </button>
                      {isLoggedIn && (
                        <button 
                          className="report-btn"
                          onClick={(e) => openReportModal(job, e)}
                          title="Report this job"
                        >
                          🚩 Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={closeReportModal}
        onSubmit={handleReportSubmit}
        reportType="Job"
        targetName={reportModal.jobTitle}
      />

  <style>{`
        .search-jobs-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .search-jobs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .search-jobs-header h1 {
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

        .search-form-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2d3748;
        }

        input {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        .search-btn {
          background: #2b6cb0;
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
          margin-top: 1rem;
        }

        .search-btn:hover:not(:disabled) {
          background: #2c5282;
        }

        .search-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-state {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .no-results h3 {
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .results-header {
          margin-bottom: 1.5rem;
        }

        .results-header h2 {
          color: #2d3748;
          margin: 0;
        }

        .jobs-grid {
          display: grid;
          gap: 1.5rem;
        }

        .job-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .job-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }
        
        .job-card.expanded {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        }
        
        .job-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin: 0.75rem 0;
        }
        
        .job-preview-detail {
          display: flex;
          align-items: center;
          color: #4a5568;
          font-size: 0.9rem;
          background: #f7fafc;
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .preview-icon {
          margin-right: 0.35rem;
        }
        
        .expansion-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #718096;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }
        
        .indicator-text {
          margin-left: 0.25rem;
          font-size: 0.8rem;
        }
        
        .content-divider {
          border: 0;
          height: 1px;
          background-color: #e2e8f0;
          margin: 1rem 0;
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .job-header h3 {
          margin: 0;
          color: #2b6cb0;
          font-size: 1.25rem;
          flex: 1;
        }

        .job-price {
          background: #38a169;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .job-description {
          color: #4a5568;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .job-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .job-detail {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .job-detail strong {
          color: #2d3748;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .skill-badge {
          background: #edf2f7;
          color: #2d3748;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.875rem;
        }

        .job-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }

        .apply-btn {
          background: #38a169;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          position: relative;
          z-index: 5; /* Ensure button is clickable */
        }

        .apply-btn:hover:not(:disabled) {
          background: #2f855a;
        }

        .apply-btn:disabled {
          background: #a0aec0;
          cursor: not-allowed;
        }

        .report-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          z-index: 5;
          margin-left: 0.5rem;
        }

        .report-btn:hover {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .job-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner.large {
          width: 32px;
          height: 32px;
          border-width: 4px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .search-jobs-container {
            padding: 1rem;
          }

          .search-jobs-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .job-header {
            flex-direction: column;
            gap: 1rem;
          }

          .job-price {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

export default SearchJobs
