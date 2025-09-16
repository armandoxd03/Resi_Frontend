import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import apiService from '../api'

function EmployeeDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    applicationsCount: 0,
    offersCount: 0,
    viewsCount: 0,
    rating: 0
  })
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [applicationsLoading, setApplicationsLoading] = useState(true)

  const { user, hasAccessTo, isAuthenticated, loading: authLoading } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)
  const navigate = useNavigate()

  useEffect(() => {
    // Wait for auth context to finish loading
    if (authLoading) {
      console.log('Auth context still loading...')
      return
    }
    
    // Debug localStorage contents
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('userData')
    console.log('EmployeeDashboard - localStorage contents:', {
      token: token ? 'exists' : 'missing',
      userData: userData ? JSON.parse(userData) : 'missing'
    })
    
    console.log('EmployeeDashboard - Auth Check:', {
      authLoading,
      isAuthenticated,
      user,
      userType: user?.userType,
      hasEmployeeAccess: hasAccessTo('employee')
    })
    
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login')
      showError('Please log in to access the dashboard')
      navigate('/login')
      return
    }
    
    if (!hasAccessTo('employee')) {
      console.log('No employee access, redirecting to landing')
      showError('Employee access required')
      navigate('/landing')
      return
    }
    
    console.log('Authentication passed, loading dashboard data')
    loadDashboardData()
  }, [authLoading, isAuthenticated, hasAccessTo, navigate, showError, user])

  const loadDashboardData = async () => {
    await Promise.all([
      loadEmployeeStats(),
      loadRecommendedJobs(),
      loadMyApplications()
    ])
    setLoading(false)
  }

  const loadEmployeeStats = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const response = await apiService.getProfile(userData.userId)
      
      if (response.user) {
        setStats({
          applicationsCount: response.user.applicationCount || 0,
          offersCount: response.user.offersCount || 0,
          viewsCount: response.user.profileViews || 0,
          rating: 0
        })

        // Load ratings separately
        try {
          const ratingsResponse = await apiService.getUserRatings(userData.userId)
          if (ratingsResponse.averageRating) {
            setStats(prev => ({
              ...prev,
              rating: ratingsResponse.averageRating
            }))
          }
        } catch (ratingError) {
          console.error('Error loading ratings:', ratingError)
        }
      }
    } catch (error) {
      console.error('Error loading employee stats:', error)
      showError('Failed to load dashboard statistics')
    }
  }

  const loadRecommendedJobs = async () => {
    try {
      setJobsLoading(true)
      const response = await apiService.getJobs({ limit: 6 })
      setRecommendedJobs(response.jobs || [])
    } catch (error) {
      console.error('Error loading recommended jobs:', error)
      showError('Error loading recommended jobs')
    } finally {
      setJobsLoading(false)
    }
  }

  const loadMyApplications = async () => {
    try {
      setApplicationsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://resilinked-9mf9.vercel.app/api'}/jobs/my-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        // The backend returns an array of Job objects where the user is an applicant
        // We need to flatten this into an array of application objects with job details
        const jobs = await response.json();
        const userId = user?.id || (JSON.parse(localStorage.getItem('userData') || '{}').userId);
        // For each job, find the applicant object for the current user
        const applications = jobs.flatMap(job => {
          if (!Array.isArray(job.applicants)) return [];
          return job.applicants
            .filter(app => app.user && (app.user._id === userId || app.user === userId))
            .map(app => ({
              ...app,
              jobId: job,
              appliedAt: app.appliedAt || app.createdAt || job.datePosted,
            }));
        });
        setMyApplications(applications);
      } else {
        showError('Error loading applications')
      }
    } catch (error) {
      console.error('Error loading applications:', error)
      showError('Error loading applications')
    } finally {
      setApplicationsLoading(false)
    }
  }

  const applyForJob = async (jobId) => {
    try {
      // Check for token and user type before applying
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (!token) {
        showError('You must be logged in to apply for jobs.');
        return;
      }
      if (!userData.userType || (userData.userType !== 'employee' && userData.userType !== 'both')) {
        showError('You need an employee profile to apply for jobs.');
        return;
      }
      const result = await apiService.applyToJob(jobId);
      if (result.success || result.message === 'Application submitted') {
        success('Application submitted successfully!');
        loadMyApplications(); // Refresh applications
        loadRecommendedJobs(); // Refresh job list
      } else {
        // Friendly error labels for common cases
        let friendlyMsg = '';
        const msg = (result.alert || result.message || '').toLowerCase();
        if (msg.includes('already applied')) {
          friendlyMsg = 'You have already applied to this job.';
        } else if (msg.includes('job is closed')) {
          friendlyMsg = 'This job is no longer accepting applications.';
        } else if (msg.includes('employee profile required')) {
          friendlyMsg = 'You need an employee profile to apply for jobs.';
        } else if (msg.includes('cannot apply to own job')) {
          friendlyMsg = 'You cannot apply to your own job posting.';
        } else if (msg.includes('job not found')) {
          friendlyMsg = 'This job is no longer available.';
        } else {
          friendlyMsg = result.alert || result.message || 'Error applying for job';
        }
        showError(friendlyMsg);
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      // Try to show backend error message if available
      if (error && error.message) {
        showError(error.message);
      } else {
        showError('Failed to apply for job');
      }
    }
  }

  const viewJobDetails = (jobId) => {
    if (!jobId) {
      showError('Job details unavailable.')
      return
    }
    // Navigate to search jobs with job ID parameter for highlighting
    navigate(`/search-jobs?highlight=${jobId}`)
  }

  const acceptOffer = async (applicationId) => {
    try {
      const token = localStorage.getItem('token')
  const response = await fetch(`${import.meta.env.VITE_API_URL}/applications/${applicationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        success('Offer accepted successfully!')
        loadMyApplications() // Refresh applications
      } else {
        const data = await response.json()
        showError(data.message || 'Failed to accept offer')
      }
    } catch (error) {
      console.error('Error accepting offer:', error)
      showError('Failed to accept offer. Please try again.')
    }
  }

  if (loading || authLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner large"></div>
          <p>{authLoading ? 'Checking authentication...' : 'Loading dashboard...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Employee Dashboard</h1>
        <p>Welcome back, {user?.firstName}!</p>
        <Link to="/landing" className="back-btn">Back to Landing</Link>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.applicationsCount}</h3>
            <p>Applications</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <h3>{stats.offersCount}</h3>
            <p>Job Offers</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3>{stats.viewsCount}</h3>
            <p>Profile Views</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.rating.toFixed(1)}</h3>
            <p>Average Rating</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recommended Jobs Section */}
        <div className="section">
          <div className="section-header">
            <h2>Recommended Jobs</h2>
            <Link to="/search-jobs" className="view-all-btn">View All Jobs →</Link>
          </div>
          
          {jobsLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading recommended jobs...</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {recommendedJobs.length > 0 ? (
                recommendedJobs.map(job => (
                  <div key={job._id} className="job-card">
                    <div className="job-header">
                      <h3>{job.title || 'Untitled Job'}</h3>
                      <div className="job-price">₱{job.price?.toLocaleString() || 0}</div>
                    </div>
                    
                    <div className="job-meta">
                      <div className="meta-item">
                        <span className="icon">📍</span>
                        {job.barangay || 'N/A'}
                      </div>
                      <div className="meta-item">
                        <span className="icon">👤</span>
                        {job.applicants ? job.applicants.length : 0} applicants
                      </div>
                    </div>
                    
                    <p className="job-description">
                      {job.description 
                        ? job.description.substring(0, 100) + (job.description.length > 100 ? '...' : '')
                        : 'No description available'
                      }
                    </p>
                    
                    <div className="job-actions">
                      <button 
                        className="btn primary"
                        onClick={() => applyForJob(job._id)}
                      >
                        Apply Now
                      </button>
                      <button 
                        className="btn secondary"
                        onClick={() => viewJobDetails(job._id)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">
                  <p>No recommended jobs found</p>
                  <Link to="/search-jobs" className="btn primary">Browse All Jobs</Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* My Applications Section */}
        <div className="section">
          <div className="section-header">
            <h2>My Applications</h2>
          </div>
          
          {applicationsLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your applications...</p>
            </div>
          ) : (
            <div className="applications-grid">
              {myApplications.length > 0 ? (
                myApplications.map(app => {
                  const job = app.jobId || {}
                  return (
                    <div key={app._id} className="application-card">
                      <div className="job-header">
                        <h3>{job.title || 'Unknown Job'}</h3>
                        <div className="job-price">₱{job.price?.toLocaleString() || 0}</div>
                      </div>
                      
                      <div className="job-meta">
                        <div className="meta-item">
                          <span className="icon">📍</span>
                          {job.barangay || 'N/A'}
                        </div>
                        <div className="meta-item">
                          <span className={`status ${app.status?.toLowerCase()}`}>
                            Status: {app.status || 'Pending'}
                          </span>
                        </div>
                        <div className="meta-item">
                          <span className="icon">📅</span>
                          Applied: {app.appliedAt 
                            ? new Date(app.appliedAt).toLocaleDateString() 
                            : 'N/A'
                          }
                        </div>
                      </div>
                      
                      <div className="job-actions">
                        <button 
                          className="btn secondary"
                          onClick={() => viewJobDetails(job._id)}
                          disabled={!job._id}
                        >
                          View Job
                        </button>
                        {app.status === 'accepted' && (
                          <button 
                            className="btn primary"
                            onClick={() => acceptOffer(app._id)}
                          >
                            Accept Offer
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="no-data">
                  <p>You haven't applied to any jobs yet</p>
                  <Link to="/search-jobs" className="btn primary">Find Jobs to Apply</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

  <style>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          margin: 0;
          color: #2b6cb0;
          font-size: 2rem;
        }

        .dashboard-header p {
          margin: 0.5rem 0;
          color: #666;
          font-size: 1.1rem;
        }

        .back-btn {
          color: #666;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background-color 0.2s;
          display: inline-block;
          margin-top: 0.5rem;
        }

        .back-btn:hover {
          background-color: #f7fafc;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          font-size: 2rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e6f3ff;
          border-radius: 50%;
        }

        .stat-content h3 {
          margin: 0;
          font-size: 2rem;
          color: #2b6cb0;
        }

        .stat-content p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }

        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-header h2 {
          margin: 0;
          color: #2d3748;
        }

        .view-all-btn {
          color: #2b6cb0;
          text-decoration: none;
          font-weight: 500;
        }

        .view-all-btn:hover {
          text-decoration: underline;
        }

        .jobs-grid, .applications-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .job-card, .application-card {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .job-card:hover, .application-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
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
          font-size: 1.1rem;
          flex: 1;
        }

        .job-price {
          background: #38a169;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .job-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          font-size: 0.9rem;
        }

        .icon {
          font-size: 0.8rem;
        }

        .status {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status.pending {
          background: #fef7e5;
          color: #b7791f;
        }

        .status.accepted {
          background: #e6fffa;
          color: #00695c;
        }

        .status.rejected {
          background: #fed7d7;
          color: #c53030;
        }

        .job-description {
          color: #4a5568;
          margin-bottom: 1rem;
          line-height: 1.5;
          font-size: 0.9rem;
        }

        .job-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn.primary {
          background: #2b6cb0;
          color: white;
        }

        .btn.primary:hover:not(:disabled) {
          background: #2c5282;
        }

        .btn.secondary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .btn.secondary:hover:not(:disabled) {
          background: #cbd5e0;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-state {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .no-data {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .no-data p {
          margin-bottom: 1rem;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .spinner.large {
          width: 40px;
          height: 40px;
          border-width: 4px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .jobs-grid, .applications-grid {
            grid-template-columns: 1fr;
          }

          .job-header {
            flex-direction: column;
            gap: 0.5rem;
          }

          .job-price {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

export default EmployeeDashboard
