import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'

// Use environment variable for API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://resilinked-9mf9.vercel.app/api'

function SearchJobs() {
  const [searchQuery, setSearchQuery] = useState({
    textSearch: '',
    skill: '',
    barangay: '',
    minPrice: '',
    maxPrice: ''
  })
  
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedJobs, setExpandedJobs] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  
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
      
      // Standard parameter naming for consistency across job and worker search
      if (query.textSearch) params.append('search', query.textSearch) // Text search parameter
      if (query.skill) {
        // Handle "Other" skill selection with custom value
        if (query.skill === 'Other' && query.otherSkill) {
          params.append('skill', query.otherSkill)
        } else {
          params.append('skill', query.skill)
        }
      }
      if (query.barangay) params.append('location', query.barangay) // Standardize as location
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
        <form onSubmit={handleSubmit}>
          {/* Search Bar and Filter Button Row */}
          <div className="search-controls">
            <div className="search-input-wrapper">
              <i className="search-icon">🔍</i>
              <input
                type="text"
                id="textSearch"
                name="textSearch"
                value={searchQuery.textSearch}
                onChange={handleInputChange}
                placeholder="Search for jobs by title or skills..."
                className="search-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchJobs(searchQuery);
                  }
                }}
              />
              {searchQuery.textSearch && (
                <button 
                  type="button"
                  className="clear-search-btn"
                  onClick={() => {
                    setSearchQuery(prev => ({ ...prev, textSearch: '' }));
                    searchJobs({ ...searchQuery, textSearch: '' });
                  }}
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="action-buttons">
              <button type="submit" className="quick-search-btn" disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Search'}
              </button>
              
              <button 
                type="button"
                className={`toggle-filters-button ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="filter-icon">⚙️</i>
                {showFilters ? 'Hide Filters' : 'Filters'}
                <span className="filter-indicator">{showFilters ? '▲' : '▼'}</span>
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="filter-section">
              <div className="filter-main-section">
              <div className="filter-row">
                <div className="filter-group">
                  <label htmlFor="skill">
                    <i className="filter-icon">🛠️</i>
                    Required Skill
                  </label>
                  <select
                    id="skill"
                    name="skill"
                    value={searchQuery.skill}
                    onChange={handleInputChange}
                    className="filter-select"
                  >
                    <option value="">Any Skill</option>
                    {['Plumbing','Carpentry','Cleaning','Electrical','Painting','Gardening',
                      'Cooking','Driving','Babysitting','Tutoring','IT Support','Customer Service'].map(skill => (
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
                      placeholder="Specify skill"
                      className="filter-input other-input"
                      required
                    />
                  )}
                </div>

                <div className="filter-group">
                  <label htmlFor="barangay">
                    <i className="filter-icon">📍</i>
                    Location (Barangay)
                  </label>
                  <input
                    type="text"
                    id="barangay"
                    name="barangay"
                    value={searchQuery.barangay}
                    onChange={handleInputChange}
                    placeholder="e.g., Barangay San Jose"
                    className="filter-input"
                  />
                </div>
              </div>
              
              <div className="filter-divider">
                <span>Price Range</span>
              </div>

              <div className="filter-row price-range">
                <div className="filter-group">
                  <label htmlFor="minPrice">
                    <i className="filter-icon">₱</i>
                    Minimum Price
                  </label>
                  <div className="price-input-wrapper">
                    <span className="price-currency">₱</span>
                    <input
                      type="number"
                      id="minPrice"
                      name="minPrice"
                      value={searchQuery.minPrice}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      className="filter-input price-input"
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label htmlFor="maxPrice">
                    <i className="filter-icon">₱</i>
                    Maximum Price
                  </label>
                  <div className="price-input-wrapper">
                    <span className="price-currency">₱</span>
                    <input
                      type="number"
                      id="maxPrice"
                      name="maxPrice"
                      value={searchQuery.maxPrice}
                      onChange={handleInputChange}
                      placeholder="Any"
                      min="0"
                      className="filter-input price-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="filter-actions">
              <button type="submit" className="filter-button primary" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <i className="filter-icon">🔍</i>
                    Apply Filters
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="filter-button secondary"
                onClick={() => {
                  setSearchQuery({
                    textSearch: '', // Clear text search as well
                    skill: '',
                    otherSkill: '',
                    barangay: '',
                    minPrice: '',
                    maxPrice: ''
                  });
                }}
                disabled={loading}
              >
                <i className="filter-icon">↺</i>
                Reset Filters
              </button>
            </div>
            </div>
          )}
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
            
            <div className="active-filters">
              {searchQuery.textSearch && (
                <div className="active-filter-pill">
                  <span>Search: {searchQuery.textSearch}</span>
                  <button 
                    onClick={() => {
                      setSearchQuery(prev => ({ ...prev, textSearch: '' }));
                      // Also trigger search
                      searchJobs({...searchQuery, textSearch: ''});
                    }}
                    aria-label="Remove text search filter"
                  >×</button>
                </div>
              )}
            
              {searchQuery.skill && (
                <div className="active-filter-pill">
                  <span>Skill: {searchQuery.skill === 'Other' ? searchQuery.otherSkill : searchQuery.skill}</span>
                  <button 
                    onClick={() => {
                      setSearchQuery(prev => ({ ...prev, skill: '', otherSkill: '' }));
                      searchJobs({...searchQuery, skill: '', otherSkill: ''});
                    }}
                    aria-label="Remove skill filter"
                  >×</button>
                </div>
              )}
              
              {searchQuery.barangay && (
                <div className="active-filter-pill">
                  <span>Location: {searchQuery.barangay}</span>
                  <button 
                    onClick={() => {
                      setSearchQuery(prev => ({ ...prev, barangay: '' }));
                      searchJobs({...searchQuery, barangay: ''});
                    }}
                    aria-label="Remove location filter"
                  >×</button>
                </div>
              )}
              
              {(searchQuery.minPrice || searchQuery.maxPrice) && (
                <div className="active-filter-pill">
                  <span>Price: 
                    {searchQuery.minPrice ? ` ₱${searchQuery.minPrice}` : ' ₱0'} 
                    {searchQuery.maxPrice ? ` - ₱${searchQuery.maxPrice}` : ' +'}
                  </span>
                  <button 
                    onClick={() => {
                      setSearchQuery(prev => ({ ...prev, minPrice: '', maxPrice: '' }));
                      searchJobs({...searchQuery, minPrice: '', maxPrice: ''});
                    }}
                    aria-label="Remove price filter"
                  >×</button>
                </div>
              )}
              
              {(searchQuery.textSearch || searchQuery.skill || searchQuery.barangay || searchQuery.minPrice || searchQuery.maxPrice) && (
                <button 
                  className="clear-all-filters"
                  onClick={() => {
                    setSearchQuery({
                      textSearch: '',
                      skill: '',
                      otherSkill: '',
                      barangay: '',
                      minPrice: '',
                      maxPrice: ''
                    });
                    // Also search with no filters to show all jobs
                    searchJobs({});
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
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
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

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
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 2rem;
          margin-bottom: 2.5rem;
          border: 1px solid #edf2f7;
        }
        
        .search-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: stretch;
        }
        
        .search-input-wrapper {
          position: relative;
          flex: 1;
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #718096;
          font-style: normal;
          pointer-events: none;
        }
        
        .search-input {
          padding-left: 2.5rem;
          height: 100%;
          min-height: 3rem;
          font-size: 1rem;
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: #f8fafc;
          transition: all 0.2s;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
          background-color: #fff;
        }
        
        .clear-search-btn {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #718096;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .clear-search-btn:hover {
          color: #e53e3e;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.75rem;
          align-items: stretch;
        }
        
        .quick-search-btn {
          background: #2b6cb0;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .quick-search-btn:hover:not(:disabled) {
          background: #2c5282;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(43, 108, 176, 0.2);
        }
        
        .quick-search-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .toggle-filters-button {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #4a5568;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 8px;
          padding: 0 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          gap: 0.5rem;
          white-space: nowrap;
        }
        
        .toggle-filters-button:hover {
          background-color: #edf2f7;
          border-color: #cbd5e0;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        }
        
        .toggle-filters-button.active {
          background-color: #e6f0ff;
          border-color: #90cdf4;
          color: #2b6cb0;
        }
        
        .toggle-filters-button .filter-icon {
          color: #2b6cb0;
          font-size: 1.1rem;
          margin-right: 0.25rem;
        }
        
        .filter-indicator {
          margin-left: 0.25rem;
          font-size: 0.8rem;
          color: #718096;
          transition: transform 0.2s;
        }
        
        .filter-section {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 1rem;
          animation: fadeIn 0.3s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) inset;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .filter-main-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .filter-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .filter-icon {
          font-style: normal;
          margin-right: 0.25rem;
        }
        
        .filter-divider {
          position: relative;
          text-align: center;
          margin: 1.5rem 0 1rem;
        }
        
        .filter-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background-color: #e2e8f0;
          z-index: 1;
        }
        
        .filter-divider span {
          background-color: white;
          padding: 0 1rem;
          position: relative;
          z-index: 2;
          color: #4a5568;
          font-weight: 500;
          font-size: 0.9rem;
        }

        label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2d3748;
        }

        input,
        select {
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          background-color: #f8fafc;
          color: #2d3748;
          width: 100%;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
          background-color: #fff;
        }
        
        select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232d3748' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 16px 16px;
          padding-right: 2.5rem;
        }

        .filter-input,
        .filter-select {
          width: 100%;
        }
        
        .price-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .price-currency {
          position: absolute;
          left: 12px;
          color: #4a5568;
          font-weight: 500;
          pointer-events: none;
        }
        
        .price-input {
          padding-left: 28px;
        }

        .filter-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          justify-content: center;
        }

        .filter-button {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 160px;
          justify-content: center;
          border: none;
        }
        
        .filter-button.primary {
          background: #2b6cb0;
          color: white;
          box-shadow: 0 4px 6px rgba(43, 108, 176, 0.2);
        }
        
        .filter-button.primary:hover:not(:disabled) {
          background: #2c5282;
          transform: translateY(-2px);
          box-shadow: 0 6px 10px rgba(43, 108, 176, 0.25);
        }
        
        .filter-button.secondary {
          background: transparent;
          color: #2b6cb0;
          border: 1px solid #2b6cb0;
        }
        
        .filter-button.secondary:hover:not(:disabled) {
          background: #edf2f7;
          transform: translateY(-2px);
        }
        
        .filter-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .loading-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #4a5568;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #edf2f7;
        }
        
        .loading-state p {
          margin-top: 1.5rem;
          font-weight: 500;
        }

        .no-results {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #edf2f7;
        }

        .no-results h3 {
          color: #2d3748;
          margin-bottom: 0.75rem;
          font-size: 1.5rem;
        }
        
        .no-results p {
          color: #718096;
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .results-header {
          margin-bottom: 1.5rem;
          padding: 0.75rem 0 1rem;
          border-bottom: 1px solid #edf2f7;
        }

        .results-header h2 {
          color: #2d3748;
          margin: 0 0 0.75rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .active-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        
        .active-filter-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: #ebf4ff;
          border: 1px solid #bee3f8;
          color: #2b6cb0;
          font-size: 0.85rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 500;
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .active-filter-pill button {
          background: none;
          border: none;
          color: #4a5568;
          font-size: 1.2rem;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin-left: 0.25rem;
        }
        
        .active-filter-pill button:hover {
          color: #e53e3e;
        }
        
        .clear-all-filters {
          background: none;
          border: none;
          color: #e53e3e;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          margin-left: 0.5rem;
          text-decoration: underline;
        }
        
        .clear-all-filters:hover {
          background-color: #FEF2F2;
        }

        .jobs-grid {
          display: grid;
          gap: 1.5rem;
        }

        .job-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          padding: 1.5rem;
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          border: 1px solid #edf2f7;
        }

        .job-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.09);
          border-color: #e2e8f0;
        }
        
        .job-card.expanded {
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
          border-color: #cbd5e0;
        }
        
        .job-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin: 0.75rem 0;
        }
        
        .job-preview-detail {
          display: flex;
          align-items: center;
          color: #4a5568;
          font-size: 0.85rem;
          background: #f7fafc;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border: 1px solid #edf2f7;
          transition: all 0.2s;
        }
        
        .job-preview-detail:hover {
          background: #edf2f7;
          border-color: #e2e8f0;
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
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px dashed #edf2f7;
        }
        
        .indicator-text {
          margin-left: 0.5rem;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .content-divider {
          border: 0;
          height: 1px;
          background-color: #e2e8f0;
          margin: 1.25rem 0;
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .job-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.25rem;
          flex: 1;
          font-weight: 600;
          line-height: 1.4;
        }

        .job-price {
          background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.1rem;
          box-shadow: 0 3px 6px rgba(56, 161, 105, 0.2);
          display: flex;
          align-items: center;
          min-width: 80px;
          justify-content: center;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        .job-description {
          color: #4a5568;
          margin-bottom: 1.25rem;
          line-height: 1.6;
          font-size: 0.95rem;
          background: #f8fafc;
          padding: 1rem;
          border-radius: 8px;
          border-left: 3px solid #2b6cb0;
        }

        .job-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .job-detail {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #edf2f7;
        }
        
        .job-detail:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
        }

        .job-detail strong {
          color: #2d3748;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .skill-badge {
          background: #ebf4ff;
          color: #4299e1;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          border: 1px solid #bee3f8;
        }

        .job-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #edf2f7;
        }

        .apply-btn {
          background: linear-gradient(135deg, #38a169 0%, #2f855a 100%);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          z-index: 5; /* Ensure button is clickable */
          box-shadow: 0 4px 10px rgba(56, 161, 105, 0.2);
        }

        .apply-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #2f855a 0%, #276749 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(56, 161, 105, 0.25);
        }

        .apply-btn:disabled {
          background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 6px rgba(160, 174, 192, 0.2);
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 0.5rem;
        }

        .spinner.large {
          width: 40px;
          height: 40px;
          border-width: 3px;
          margin: 0 auto;
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
          
          .search-controls {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .action-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
          }
          
          .quick-search-btn,
          .toggle-filters-button {
            padding: 0.75rem 1rem;
            min-width: 0;
          }

          .filter-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .filter-actions {
            flex-direction: column;
            width: 100%;
          }
          
          .filter-button {
            width: 100%;
          }

          .job-header {
            flex-direction: column;
            gap: 1rem;
          }

          .job-price {
            align-self: flex-start;
          }
          
          .job-preview {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .job-preview-detail {
            width: 100%;
          }
          
          .active-filters {
            gap: 0.5rem 0.25rem;
            margin-top: 0.5rem;
          }
          
          .active-filter-pill {
            font-size: 0.8rem;
            padding: 0.2rem 0.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default SearchJobs
