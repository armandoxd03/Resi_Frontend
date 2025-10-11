import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'

// Use environment variable for API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://resi-backend-1.onrender.com/api'

// Helper function for price formatting
const formatPrice = (price) => {
  if (price === undefined || price === null) return '₱0';
  if (typeof price === 'number') return '₱' + price.toLocaleString();
  return '₱' + price;
};

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
  const [showContactModal, setShowContactModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [currentWorker, setCurrentWorker] = useState(null)
  const [contactMessage, setContactMessage] = useState('')
  const [myJobs, setMyJobs] = useState([])
  const [selectedJobForInvite, setSelectedJobForInvite] = useState(null)
  const [sendingInvitation, setSendingInvitation] = useState(false)
  
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

  const viewProfile = async (userId) => {
    try {
      setLoading(true);
      const worker = workers.find(w => w._id === userId);
      if (!worker) {
        showError('Worker not found');
        setLoading(false);
        return;
      }
      
      // Get user profile and ratings
      const token = localStorage.getItem('token');
      
      if (!token) {
        showError('Authentication required');
        setLoading(false);
        return;
      }
      
      // Get user details
      const response = await fetch(`${API_BASE}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        showError('Failed to load worker profile');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data && data.user) {
        setCurrentWorker(data.user);
        setShowWorkerModal(true);
      } else {
        showError('Failed to load worker profile');
      }
    } catch (err) {
      console.error('Error viewing profile:', err);
      showError('An error occurred while loading the profile');
    } finally {
      setLoading(false);
    }
  }
  
  const handleContactWorker = (worker) => {
    setCurrentWorker(worker)
    setShowContactModal(true)
  }
  
  const handleInviteWorker = async (worker) => {
    setCurrentWorker(worker)
    
    // Fetch employer's jobs for invitation
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE}/jobs/my-jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.jobs) {
        setMyJobs(data.jobs)
        setShowInviteModal(true)
      } else {
        showError(data.message || 'Failed to load your jobs')
      }
    } catch (err) {
      console.error('Error fetching jobs:', err)
      showError('Failed to load your jobs. Please try again later.')
    } finally {
      setLoading(false)
    }
  }
  
  const sendMessage = async () => {
    if (!contactMessage.trim()) {
      showError('Please enter a message')
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: currentWorker._id,
          message: contactMessage,
          type: 'message'
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        success('Message sent successfully')
        setContactMessage('')
        setShowContactModal(false)
      } else {
        showError(data.message || 'Failed to send message')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      showError('Failed to send message. Please try again later.')
    }
  }
  
  const sendJobInvitation = async () => {
    if (!selectedJobForInvite) {
      showError('Please select a job to invite the worker to')
      return
    }
    
    try {
      setSendingInvitation(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE}/jobs/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: selectedJobForInvite,
          workerId: currentWorker._id
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        success(`Invitation sent to ${currentWorker.firstName}`)
        setSelectedJobForInvite(null)
        setShowInviteModal(false)
      } else {
        showError(data.message || 'Failed to send invitation')
      }
    } catch (err) {
      console.error('Error sending invitation:', err)
      showError('Failed to send invitation. Please try again later.')
    } finally {
      setSendingInvitation(false)
    }
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
                        type="button"
                      >
                        View Profile
                      </button>
                      <button 
                        className="contact-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactWorker(worker);
                        }}
                        type="button"
                      >
                        Contact
                      </button>
                      <button 
                        className="invite-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInviteWorker(worker);
                        }}
                        type="button"
                      >
                        Invite to Job
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Worker Profile Modal */}
      {showWorkerModal && currentWorker && (
        <div className="modal-overlay" onClick={() => setShowWorkerModal(false)}>
          <div className="modal-content worker-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Worker Profile</h2>
              <button className="modal-close" onClick={() => setShowWorkerModal(false)} aria-label="Close worker profile modal">×</button>
            </div>
            
            <div className="modal-body">
              <div className="worker-profile-header">
                <div className="worker-profile-avatar">
                  {currentWorker.profilePicture ? (
                    <img 
                      src={currentWorker.profilePicture} 
                      alt={`${currentWorker.firstName}'s profile`}
                      className="profile-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {currentWorker.firstName?.[0] || 'W'}
                    </div>
                  )}
                </div>
                <div className="worker-profile-info">
                  <h3>{currentWorker.firstName} {currentWorker.lastName}</h3>
                  <div className="worker-rating">
                    <span className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star} 
                          className={star <= (currentWorker.averageRating || 0) ? "star filled" : "star"}>
                          ★
                        </span>
                      ))}
                    </span>
                    <span className="rating-score">{(currentWorker.averageRating || 0).toFixed(1)}</span>
                  </div>
                  <p className="worker-location">
                    <span className="location-icon">📍</span> {currentWorker.barangay || 'Location not specified'}
                  </p>
                </div>
              </div>
              
              <div className="worker-profile-tabs">
                <div className="tab-nav">
                  <button 
                    className="tab-btn active" 
                    id="info-tab"
                    onClick={(e) => {
                      document.querySelectorAll('.worker-profile-tabs .tab-btn').forEach(btn => 
                        btn.classList.remove('active'));
                      e.target.classList.add('active');
                      document.querySelectorAll('.worker-profile-tabs .tab-content').forEach(content => 
                        content.classList.remove('active'));
                      document.getElementById('info-content').classList.add('active');
                    }}
                  >
                    Profile
                  </button>
                </div>
                
                <div className="tab-content active" id="info-content">
                  <div className="worker-profile-section">
                    <h4>About</h4>
                    <p>{currentWorker.bio || 'No bio available'}</p>
                  </div>
                  
                  <div className="worker-profile-section">
                    <h4>Skills</h4>
                    <div className="worker-skills">
                      {currentWorker.skills?.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      )) || <p>No skills listed</p>}
                    </div>
                  </div>
                  
                  <div className="worker-profile-section">
                    <h4>Experience</h4>
                    <p>{currentWorker.yearsExperience ? `${currentWorker.yearsExperience} years` : 'No experience information provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="worker-profile-actions">
                <button 
                  className="contact-btn" 
                  onClick={() => {
                    setShowWorkerModal(false);
                    handleContactWorker(currentWorker);
                  }}
                >
                  Contact Worker
                </button>
                <button 
                  className="invite-btn" 
                  onClick={() => {
                    setShowWorkerModal(false);
                    handleInviteWorker(currentWorker);
                  }}
                >
                  Invite to Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Contact Worker Modal */}
      {showContactModal && currentWorker && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Contact Worker</h2>
              <button className="modal-close" onClick={() => setShowContactModal(false)} aria-label="Close contact modal">×</button>
            </div>
            
            <div className="modal-body">
              <div className="contact-worker-info">
                <div className="worker-avatar modal-avatar">
                  {currentWorker.profilePicture ? (
                    <img 
                      src={currentWorker.profilePicture} 
                      alt={`${currentWorker.firstName}'s profile`}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {currentWorker.firstName?.[0] || 'W'}
                    </div>
                  )}
                </div>
                <div className="worker-details">
                  <h3>{currentWorker.firstName} {currentWorker.lastName}</h3>
                  <p>{currentWorker.skills && currentWorker.skills.length > 0 
                    ? currentWorker.skills.slice(0, 3).join(', ') + (currentWorker.skills.length > 3 ? '...' : '')
                    : 'No skills listed'}</p>
                </div>
              </div>
              
              <div className="message-form">
                <label htmlFor="contactMessage">Message</label>
                <textarea
                  id="contactMessage"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={5}
                ></textarea>
                
                <button className="send-message-btn" onClick={sendMessage}>
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Job Invitation Modal */}
      {showInviteModal && currentWorker && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-status">
                <h2>Invite to Job</h2>
              </div>
              <button className="modal-close" onClick={() => setShowInviteModal(false)} aria-label="Close job invitation modal">×</button>
            </div>
            
            <div className="modal-body">
              <div className="invite-worker-info">
                <div className="worker-avatar">
                  {currentWorker.profilePicture ? (
                    <img 
                      src={currentWorker.profilePicture} 
                      alt={`${currentWorker.firstName}'s profile`} 
                      className="profile-image"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {currentWorker.firstName?.[0] || 'W'}
                    </div>
                  )}
                </div>
                <div className="worker-details">
                  <h3>{currentWorker.firstName} {currentWorker.lastName}</h3>
                  <p className="worker-skills-preview">
                    {currentWorker.skills && currentWorker.skills.length > 0 
                      ? currentWorker.skills.slice(0, 3).join(', ') + (currentWorker.skills.length > 3 ? '...' : '') 
                      : 'No skills listed'}
                  </p>
                </div>
              </div>
              
              <div className="invitation-instruction">
                <p>Select a job to invite this worker to:</p>
              </div>
              
              {myJobs.length > 0 ? (
                <div className="job-invite-list">
                  {myJobs
                    .map(job => (
                      <div 
                        key={job._id} 
                        className={`job-invite-item ${selectedJobForInvite === job._id ? 'selected' : ''} ${job.isOpen === false ? 'job-inactive' : ''}`}
                        onClick={() => job.isOpen !== false ? setSelectedJobForInvite(job._id) : null}
                        title={job.isOpen === false ? (job.completed ? 'Completed jobs cannot receive invitations' : 'Closed jobs cannot receive invitations') : ''}
                      >
                        <div className="job-invite-item-content">
                          <div className="job-header-with-status">
                            <h4>{job.title}</h4>
                            <div className={`job-status-badge ${job.completed ? 'completed' : (job.isOpen !== false ? 'active' : 'closed')}`}>
                              {job.completed ? 'Completed' : (job.isOpen !== false ? 'Active' : 'Closed')}
                            </div>
                          </div>
                          <p className="job-description-preview">
                            {job.description?.substring(0, 60)}
                            {job.description?.length > 60 ? '...' : ''}
                          </p>
                          <div className="job-invite-details">
                            <p className="job-price">{formatPrice(job.price)}</p>
                            <p className="job-location"><span className="location-icon">📍</span> {job.barangay}</p>
                          </div>
                          {job.skillsRequired && job.skillsRequired.length > 0 && (
                            <div className="job-skills-preview">
                              {job.skillsRequired.slice(0, 3).map((skill, index) => (
                                <span key={index} className="skill-tag-small">{skill}</span>
                              ))}
                              {job.skillsRequired.length > 3 && (
                                <span className="skill-tag-more">+{job.skillsRequired.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                        {selectedJobForInvite === job._id && (
                          <div className="selected-indicator">
                            <span className="checkmark">✓</span>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="no-jobs-message">
                  <div className="icon">📭</div>
                  <h3>No Open Jobs Available</h3>
                  <p>You currently don't have any active job listings to invite workers to.</p>
                  <div className="no-jobs-info">
                    <div className="info-item">
                      <span className="info-icon">💡</span>
                      <span className="info-text">Job invitations help you connect with qualified workers directly</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">🔍</span>
                      <span className="info-text">Create a new job to invite workers</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  className="cancel-btn" 
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="invite-send-btn"
                  onClick={sendJobInvitation}
                  disabled={!selectedJobForInvite || sendingInvitation}
                >
                  {sendingInvitation ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        
        .worker-content {
          padding-bottom: 0.25rem;
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
          justify-content: space-between;
          gap: 0.4rem;
          margin-top: 0.75rem;
          width: 100%;
        }

        /* Common button styles for all action buttons */
        .view-profile-btn, .contact-btn, .invite-btn {
          color: white;
          border: none;
          padding: 0.5rem 0.3rem;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          z-index: 5; /* Ensure button is clickable */
          white-space: nowrap;
          text-align: center;
          width: 31%;
          height: 32px; /* Fixed height for all buttons */
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
        }
        
        /* Individual button colors */
        .view-profile-btn {
          background: #3182ce;
        }

        .view-profile-btn:hover {
          background: #2c5282;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .contact-btn {
          background: #38a169;
        }

        .contact-btn:hover {
          background: #2f855a;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .invite-btn {
          background: #6b46c1;
        }
        
        .invite-btn:hover {
          background: #553c9a;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .modal-title-with-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #2b6cb0;
          font-size: 1.5rem;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #718096;
          cursor: pointer;
          padding: 0.25rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        
        .modal-close:hover {
          color: #2d3748;
        }
        
        .modal-body {
          padding: 0 1.5rem 1.5rem;
        }
        
        .contact-worker-info,
        .invite-worker-info {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .modal-avatar {
          width: 60px;
          height: 60px;
        }
        
        .avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: #e2e8f0;
          color: #4a5568;
          font-size: 1.5rem;
          font-weight: bold;
          border-radius: 50%;
        }
        
        .message-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .message-form label {
          font-weight: 600;
          color: #2d3748;
        }
        
        .message-form textarea {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
          font-size: 1rem;
        }
        
        .message-form textarea:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }
        
        .send-message-btn {
          background: #2b6cb0;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
          align-self: flex-end;
          margin-top: 0.5rem;
        }
        
        .send-message-btn:hover {
          background: #2c5282;
        }
        
        .invitation-instruction {
          margin-bottom: 1rem;
        }
        
        .job-invite-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
          max-height: 350px;
          overflow-y: auto;
        }
        
        .job-invite-item {
          display: flex;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        
        .job-invite-item:hover:not(.job-inactive) {
          border-color: #2b6cb0;
          background-color: #f7fafc;
        }
        
        .job-invite-item.selected {
          border-color: #2b6cb0;
          background-color: #ebf8ff;
        }
        
        .job-invite-item.job-inactive {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .job-invite-item-content {
          flex: 1;
        }
        
        .job-header-with-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .job-status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          margin-left: 10px;
        }
        
        .job-status-badge.active {
          background-color: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }
        
        .job-status-badge.completed {
          background-color: #bee3f8;
          color: #2a4365;
          border: 1px solid #90cdf4;
        }
        
        .job-status-badge.closed {
          background-color: #fed7d7;
          color: #822727;
          border: 1px solid #feb2b2;
        }
        
        .job-description-preview {
          color: #4a5568;
          font-size: 0.875rem;
          margin: 0.5rem 0;
        }
        
        .job-invite-details {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
          font-size: 0.875rem;
        }
        
        .job-price {
          color: #2b6cb0;
          font-weight: 600;
        }
        
        .job-location {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #4a5568;
        }
        
        .location-icon {
          font-size: 1rem;
        }
        
        .job-skills-preview {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        
        .skill-tag-small {
          background: #edf2f7;
          color: #2d3748;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
        }
        
        .skill-tag-more {
          color: #718096;
          font-size: 0.75rem;
          padding: 0.2rem 0.5rem;
        }
        
        .selected-indicator {
          display: flex;
          align-items: center;
          margin-left: 1rem;
        }
        
        .checkmark {
          background-color: #2b6cb0;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }
        
        .no-jobs-message {
          text-align: center;
          padding: 2rem 1rem;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px dashed #cbd5e0;
        }
        
        .no-jobs-message .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          color: #718096;
        }
        
        .no-jobs-message h3 {
          color: #2d3748;
          margin: 0 0 0.5rem;
        }
        
        .no-jobs-message p {
          color: #4a5568;
          margin: 0 0 1.5rem;
        }
        
        .no-jobs-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-align: left;
        }
        
        .info-icon {
          font-size: 1.25rem;
          color: #2b6cb0;
        }
        
        .info-text {
          color: #4a5568;
          font-size: 0.875rem;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .cancel-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          background: transparent;
          border: 2px solid #e2e8f0;
          color: #4a5568;
          transition: all 0.2s;
        }
        
        .cancel-btn:hover {
          background: #f8fafc;
          color: #2d3748;
          border-color: #cbd5e0;
        }
        
        .invite-send-btn {
          background: #2b6cb0;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .invite-send-btn:hover:not(:disabled) {
          background: #2c5282;
        }
        
        .invite-send-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Worker Profile Modal Styles */
        .worker-profile-modal {
          width: 100%;
          max-width: 700px;
        }
        
        .worker-profile-header {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .worker-profile-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          background: #e2e8f0;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          color: #4a5568;
          font-weight: bold;
        }
        
        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .worker-profile-info {
          flex: 1;
        }
        
        .worker-profile-info h3 {
          margin: 0 0 0.5rem;
          color: #2b6cb0;
          font-size: 1.5rem;
        }
        
        .worker-rating {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .stars {
          color: #cbd5e0;
          font-size: 1.25rem;
          display: inline-flex;
        }
        
        .star {
          margin-right: 0.125rem;
        }
        
        .star.filled {
          color: #f6e05e;
        }
        
        .rating-score {
          margin-left: 0.5rem;
          font-weight: bold;
          color: #2d3748;
        }
        
        .worker-location {
          display: flex;
          align-items: center;
          color: #4a5568;
          margin: 0;
          font-size: 0.95rem;
        }
        
        .worker-profile-tabs {
          margin-bottom: 2rem;
        }
        
        .tab-nav {
          display: flex;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 1rem;
        }
        
        .tab-btn {
          background: none;
          border: none;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          font-weight: 600;
          color: #718096;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }
        
        .tab-btn:after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 3px;
          background: transparent;
          transition: background-color 0.2s;
        }
        
        .tab-btn.active {
          color: #2b6cb0;
        }
        
        .tab-btn.active:after {
          background: #2b6cb0;
        }
        
        .tab-content {
          display: none;
        }
        
        .tab-content.active {
          display: block;
        }
        
        .worker-profile-section {
          margin-bottom: 1.5rem;
        }
        
        .worker-profile-section h4 {
          margin: 0 0 0.5rem;
          color: #2d3748;
          font-size: 1.1rem;
        }
        
        .worker-profile-section p {
          margin: 0;
          color: #4a5568;
          line-height: 1.5;
        }
        
        .worker-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .skill-tag {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.35rem 0.75rem;
          border-radius: 20px;
          font-size: 0.9rem;
        }
        
        .worker-profile-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
          border-top: 1px solid #e2e8f0;
          padding-top: 1.5rem;
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

        @media (max-width: 992px) and (min-width: 769px) {
          .worker-actions {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .view-profile-btn, .contact-btn {
            width: 48%;
            height: 34px;
          }
          
          .invite-btn {
            width: 100%;
            margin-top: 0.5rem;
            height: 34px;
          }
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
          
          .view-profile-btn, .contact-btn, .invite-btn {
            width: 100%;
            padding: 0.5rem 0.25rem;
            font-size: 0.85rem;
            height: 36px; /* Slightly taller on mobile for better touch targets */
          }
        }
      `}</style>
    </div>
  )
}

export default SearchWorkers
