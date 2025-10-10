import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'

// Use environment variable for API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://resilinked-9mf9.vercel.app/api'

function SearchWorkers() {
  const [searchQuery, setSearchQuery] = useState({
    skill: '',
    barangay: '',
    rating: ''
  })
  
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [expandedWorkers, setExpandedWorkers] = useState({})
  
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
    await searchWorkers(searchQuery)
  }

  const searchWorkers = async (query) => {
    setLoading(true)
    setHasSearched(true)
    
    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (query.skill) params.append('skill', query.skill)
      if (query.barangay) params.append('barangay', query.barangay)
      if (query.rating) params.append('minRating', query.rating)

      const token = localStorage.getItem('token')
      if (!token) {
        showError('Please login to search for workers')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE}/users/workers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.users) {
        setWorkers(data.users)
      } else {
        setWorkers([])
        if (data.message || data.alert) {
          showError(data.message || data.alert)
        }
      }
    } catch (err) {
      console.error('Search error:', err)
      let errorMessage = 'Something went wrong while searching for workers.'
      
      if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.'
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      }
      
      showError(errorMessage)
      setWorkers([])
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkerExpansion = (workerId) => {
    setExpandedWorkers(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }))
  }

  const viewProfile = (userId) => {
    window.location.href = `/user-details/${userId}`
  }

  // Load initial worker listings on component mount
  useEffect(() => {
    searchWorkers({})
  }, [])

  return (
    <div className="search-workers-container">
      <div className="search-workers-header">
        <h1>Search Workers</h1>
        <Link to="/employer-dashboard" className="back-btn">Back to Dashboard</Link>
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
              <label htmlFor="rating">Minimum Rating</label>
              <select
                id="rating"
                name="rating"
                value={searchQuery.rating}
                onChange={handleInputChange}
                style={{ minHeight: '48px', fontSize: '1rem' }}
              >
                <option value="">Any Rating</option>
                <option value="5">5 Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Star</option>
              </select>
            </div>

            <div className="form-group">
              {/* Empty for grid balance */}
            </div>
          </div>

          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                Searching...
              </>
            ) : (
              'Search Workers'
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      <div className="results-section">
        {loading && (
          <div className="loading-state">
            <div className="spinner large"></div>
            <p>Searching for workers...</p>
          </div>
        )}

        {!loading && hasSearched && workers.length === 0 && (
          <div className="no-results">
            <h3>No workers found</h3>
            <p>Try adjusting your search criteria to find more workers.</p>
          </div>
        )}

        {!loading && workers.length > 0 && (
          <div className="results-header">
            <h2>Found {workers.length} worker{workers.length !== 1 ? 's' : ''}</h2>
          </div>
        )}

        <div className="workers-grid">
          {workers.map((worker) => (
            <div 
              key={worker._id} 
              className={`worker-card ${expandedWorkers[worker._id] ? 'expanded' : ''}`}
              onClick={() => toggleWorkerExpansion(worker._id)}
            >
              <div className="worker-header">
                <div className="worker-info-header">
                  {worker.profilePicture && (
                    <div className="worker-avatar">
                      <img src={worker.profilePicture} alt={`${worker.firstName} ${worker.lastName}`} />
                    </div>
                  )}
                  <h3>{worker.firstName} {worker.lastName}</h3>
                </div>
                <div className="worker-rating">
                  ⭐ {worker.averageRating ? worker.averageRating.toFixed(1) : 'N/A'}
                </div>
              </div>

              <div className="worker-preview">
                <div className="worker-preview-detail">
                  <span className="preview-icon">📍</span> {worker.barangay || 'Location not specified'}
                </div>
                
                {worker.skills && worker.skills.length > 0 && (
                  <div className="worker-preview-detail">
                    <span className="preview-icon">🛠️</span> {worker.skills.slice(0, 2).join(', ')}
                    {worker.skills.length > 2 && ` +${worker.skills.length - 2} more`}
                  </div>
                )}
                
                <div className="worker-preview-detail">
                  <span className="preview-icon">📊</span> {worker.jobsCompleted || 0} jobs completed
                </div>
              </div>
              
              <div className="expansion-indicator">
                {expandedWorkers[worker._id] ? '▲' : '▼'} 
                <span className="indicator-text">{expandedWorkers[worker._id] ? 'Show less' : 'Show more'}</span>
              </div>

              {expandedWorkers[worker._id] && (
                <div className="worker-content">
                  <hr className="content-divider" />
                  <p className="worker-bio">
                    <strong>Bio:</strong> {worker.bio || 'No bio available'}
                  </p>

                  <div className="worker-details">
                    <div className="worker-detail">
                      <strong>Location:</strong> {worker.barangay || 'Not specified'}
                    </div>
                    
                    {worker.skills && worker.skills.length > 0 && (
                      <div className="worker-detail">
                        <strong>Skills:</strong>
                        <div className="skills-list">
                          {worker.skills.map((skill, index) => (
                            <span key={index} className="skill-badge">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="worker-detail">
                      <strong>Experience:</strong> {worker.yearsExperience || 'Not specified'} years
                    </div>

                    <div className="worker-detail">
                      <strong>Jobs Completed:</strong> {worker.jobsCompleted || 0}
                    </div>
                    
                    <div className="worker-actions">
                      <button 
                        className="view-profile-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewProfile(worker._id);
                        }}
                      >
                        View Profile
                      </button>
                      <button 
                        className="contact-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/user-details/${worker._id}?action=contact`;
                        }}
                      >
                        Contact
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
        .search-workers-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .search-workers-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .search-workers-header h1 {
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

        input, select {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        input:focus, select:focus {
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

        .workers-grid {
          display: grid;
          gap: 1.5rem;
        }

        .worker-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
        }

        .worker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }
        
        .worker-card.expanded {
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        }
        
        .worker-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin: 0.75rem 0;
        }
        
        .worker-preview-detail {
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

        .worker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .worker-info-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .worker-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          background: #e2e8f0;
          flex-shrink: 0;
        }
        
        .worker-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .worker-header h3 {
          margin: 0;
          color: #2b6cb0;
          font-size: 1.25rem;
        }

        .worker-rating {
          background: #ffc107;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .worker-bio {
          color: #4a5568;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .worker-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .worker-detail {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .worker-detail strong {
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

        .worker-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }

        .view-profile-btn {
          background: #3182ce;
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

        .view-profile-btn:hover {
          background: #2c5282;
        }
        
        .contact-btn {
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

        .contact-btn:hover {
          background: #2f855a;
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
          .search-workers-container {
            padding: 1rem;
          }

          .search-workers-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .worker-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .worker-rating {
            align-self: flex-start;
          }
          
          .worker-actions {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .view-profile-btn, .contact-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default SearchWorkers
