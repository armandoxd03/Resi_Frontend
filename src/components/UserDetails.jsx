import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'

function UserDetails() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser, token } = useContext(AuthContext)
  const { showAlert } = useContext(AlertContext)
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [userActivity, setUserActivity] = useState([])
  const [userJobs, setUserJobs] = useState([])
  const [userRatings, setUserRatings] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [jobsLoading, setJobsLoading] = useState(false)
  const [ratingsLoading, setRatingsLoading] = useState(false)

  useEffect(() => {
    // Check if user is admin
    if (!currentUser || currentUser.userType !== 'admin') {
      showAlert('Admin access required', 'error')
      navigate('/landing')
      return
    }

    if (!userId) {
      showAlert('No user specified', 'error')
      navigate('/admin-dashboard')
      return
    }

    loadUserDetails()
  }, [userId, currentUser, navigate, showAlert])

  const loadUserDetails = async () => {
    try {
      setLoading(true)
  const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load user details')
      }

      const userData = await response.json()
      setUser(userData)
    } catch (error) {
      console.error('Error loading user details:', error)
      showAlert('Failed to load user details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadUserActivity = async () => {
    try {
      setActivityLoading(true)
  const response = await fetch(`${import.meta.env.VITE_API_URL}/activity/users/${userId}/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserActivity(data.activities || [])
      }
    } catch (error) {
      console.error('Error loading user activity:', error)
    } finally {
      setActivityLoading(false)
    }
  }

  const loadUserJobs = async () => {
    try {
      setJobsLoading(true)
  const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs?postedBy=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Error loading user jobs:', error)
    } finally {
      setJobsLoading(false)
    }
  }

  const loadUserRatings = async () => {
    try {
      setRatingsLoading(true)
  const response = await fetch(`${import.meta.env.VITE_API_URL}/ratings/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUserRatings(data.ratings || [])
      }
    } catch (error) {
      console.error('Error loading user ratings:', error)
    } finally {
      setRatingsLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'activity' && userActivity.length === 0) {
      loadUserActivity()
    } else if (tab === 'jobs' && userJobs.length === 0) {
      loadUserJobs()
    } else if (tab === 'ratings' && userRatings.length === 0) {
      loadUserRatings()
    }
  }

  const handleVerifyUser = async () => {
    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isVerified: true })
      })

      if (response.ok) {
        setUser(prev => ({ ...prev, isVerified: true }))
        showAlert('User verified successfully', 'success')
      } else {
        throw new Error('Failed to verify user')
      }
    } catch (error) {
      console.error('Error verifying user:', error)
      showAlert('Failed to verify user', 'error')
    }
  }

  const handleDeleteUser = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        showAlert('User deleted successfully', 'success')
        navigate('/admin-dashboard')
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showAlert('Failed to delete user', 'error')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString()
  }

  const getAvatarColor = (name) => {
    const colors = ['#e1eed9', '#f0e6ff', '#ffe6e6', '#e6f7ff']
    const index = (name ? name.length : 0) % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading user details...</p>
        </div>
  <style>{`
          .container {
            max-width: 1000px;
            margin: 40px auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .loading {
            text-align: center;
            padding: 3rem;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #2b6cb0;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container">
        <div className="error">
          <h2>User Not Found</h2>
          <p>The requested user could not be found.</p>
          <Link to="/admin-dashboard" className="btn primary">Back to Admin Dashboard</Link>
        </div>
  <style>{`
          .container {
            max-width: 1000px;
            margin: 40px auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .error {
            text-align: center;
            padding: 3rem;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn.primary {
            background: #2b6cb0;
            color: white;
          }
          .btn.primary:hover {
            background: #2c5aa0;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="container">
      <button className="close-btn" onClick={() => navigate('/admin-dashboard')}>×</button>
      
      <div className="user-header">
        <div 
          className="user-avatar"
          style={{ backgroundColor: getAvatarColor(user.firstName) }}
        >
          👤
        </div>
        <div className="user-info">
          <h1 className="user-name">
            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed User'}
          </h1>
          <div className="user-meta">
            <div className="meta-item">
              <i className="fas fa-envelope"></i>
              <span>{user.email || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-phone"></i>
              <span>{user.mobileNo || 'Not provided'}</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-map-marker-alt"></i>
              <span>{`${user.barangay || 'Unknown location'}, ${user.address || ''}`}</span>
            </div>
          </div>
          <div className="verification-badge">
            {user.isVerified ? (
              <span className="badge verified">Verified</span>
            ) : (
              <span className="badge unverified">Unverified</span>
            )}
          </div>
        </div>
        <div className="action-buttons">
          {!user.isVerified && (
            <button className="btn primary" onClick={handleVerifyUser}>
              <i className="fas fa-check"></i>
              Verify User
            </button>
          )}
          <button className="btn danger" onClick={handleDeleteUser}>
            <i className="fas fa-trash"></i>
            Delete User
          </button>
        </div>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => handleTabChange('activity')}
        >
          Activity
        </button>
        <button 
          className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          onClick={() => handleTabChange('jobs')}
        >
          Jobs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => handleTabChange('ratings')}
        >
          Ratings
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="section">
              <h2 className="section-title">Basic Information</h2>
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-label">User Type</div>
                  <div className="info-value">{user.userType || 'Not specified'}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Registration Date</div>
                  <div className="info-value">{formatDate(user.createdAt)}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Last Login</div>
                  <div className="info-value">{formatDate(user.lastLogin)}</div>
                </div>
                <div className="info-card">
                  <div className="info-label">Status</div>
                  <div className="info-value">{user.isActive !== false ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            </div>

            <div className="section">
              <h2 className="section-title">Skills</h2>
              {Array.isArray(user.skills) && user.skills.length > 0 ? (
                <div className="skills-list">
                  {user.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              ) : (
                <div className="no-data">No skills information available</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-content">
            {activityLoading ? (
              <div className="loading">Loading activity...</div>
            ) : userActivity.length > 0 ? (
              <div className="activity-list">
                {userActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      <i className={`fas ${activity.icon || 'fa-user'}`}></i>
                    </div>
                    <div className="activity-content">
                      <h3 className="activity-title">{activity.title}</h3>
                      <p className="activity-date">{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No activity data available</div>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="jobs-content">
            {jobsLoading ? (
              <div className="loading">Loading jobs...</div>
            ) : userJobs.length > 0 ? (
              <div className="jobs-list">
                {userJobs.map((job) => (
                  <div key={job._id} className="job-item">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="job-description">{job.description}</p>
                    <div className="job-meta">
                      <span className="job-price">₱{job.price}</span>
                      <span className={`job-status ${job.status}`}>{job.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No jobs posted</div>
            )}
          </div>
        )}

        {activeTab === 'ratings' && (
          <div className="ratings-content">
            {ratingsLoading ? (
              <div className="loading">Loading ratings...</div>
            ) : userRatings.length > 0 ? (
              <div className="ratings-list">
                {userRatings.map((rating, index) => (
                  <div key={index} className="rating-item">
                    <div className="rating-stars">
                      {'★'.repeat(rating.score)}{'☆'.repeat(5 - rating.score)}
                    </div>
                    <p className="rating-comment">{rating.comment}</p>
                    <p className="rating-date">{formatDate(rating.date)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No ratings available</div>
            )}
          </div>
        )}
      </div>

  <style>{`
        .container {
          max-width: 1000px;
          margin: 40px auto;
          padding: 30px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 26px;
          font-size: 2.1rem;
          color: #333;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: bold;
          line-height: 1;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: #2b6cb0;
        }

        .user-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .user-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          border: 3px solid #38a169;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-size: 2rem;
          color: #2b6cb0;
          margin: 0 0 10px 0;
        }

        .user-meta {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #4a6b7a;
        }

        .badge {
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .badge.verified {
          background: #38a169;
          color: white;
        }

        .badge.unverified {
          background: #e53e3e;
          color: white;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn.primary {
          background: #38a169;
          color: white;
        }

        .btn.primary:hover {
          background: #2f855a;
        }

        .btn.danger {
          background: #e53e3e;
          color: white;
        }

        .btn.danger:hover {
          background: #c53030;
        }

        .tab-navigation {
          display: flex;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }

        .tab-btn {
          padding: 10px 20px;
          cursor: pointer;
          border: none;
          background: none;
          font-size: 1rem;
          color: #4a6b7a;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tab-btn.active {
          color: #2b6cb0;
          border-bottom-color: #2b6cb0;
        }

        .tab-btn:hover {
          color: #2b6cb0;
        }

        .section {
          margin-bottom: 30px;
        }

        .section-title {
          font-size: 1.5rem;
          color: #2b6cb0;
          margin: 0 0 20px 0;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .info-card {
          background: #f9fafb;
          border-radius: 10px;
          padding: 15px;
        }

        .info-label {
          font-weight: 600;
          color: #4a6b7a;
          margin-bottom: 5px;
        }

        .info-value {
          color: #333;
          font-size: 1.1rem;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .skill-tag {
          background: #38a169;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .no-data {
          text-align: center;
          padding: 2rem;
          color: #666;
          font-style: italic;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #2b6cb0;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 10px;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #38a169;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .activity-title {
          font-weight: 600;
          margin: 0 0 5px 0;
        }

        .activity-date {
          color: #4a6b7a;
          font-size: 0.9rem;
          margin: 0;
        }

        .jobs-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .job-item {
          padding: 20px;
          background: #f9fafb;
          border-radius: 10px;
          border-left: 4px solid #38a169;
        }

        .job-title {
          font-size: 1.2rem;
          color: #2b6cb0;
          margin: 0 0 10px 0;
        }

        .job-description {
          color: #4a5568;
          margin: 0 0 15px 0;
          line-height: 1.6;
        }

        .job-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .job-price {
          font-weight: 700;
          color: #38a169;
          font-size: 1.1rem;
        }

        .job-status {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .job-status.active {
          background: #e6fffa;
          color: #00695c;
        }

        .job-status.completed {
          background: #d1ecf1;
          color: #0c5460;
        }

        .job-status.cancelled {
          background: #fed7d7;
          color: #c53030;
        }

        .ratings-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .rating-item {
          padding: 15px;
          background: #f9fafb;
          border-radius: 10px;
        }

        .rating-stars {
          color: #ffd700;
          font-size: 1.2rem;
          margin-bottom: 10px;
        }

        .rating-comment {
          margin: 0 0 10px 0;
          line-height: 1.6;
        }

        .rating-date {
          margin: 0;
          color: #4a6b7a;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .container {
            padding: 20px 15px;
            margin: 20px 10px;
          }

          .user-header {
            flex-direction: column;
            text-align: center;
          }

          .user-meta {
            justify-content: center;
          }

          .action-buttons {
            justify-content: center;
          }

          .tab-navigation {
            flex-wrap: wrap;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default UserDetails
