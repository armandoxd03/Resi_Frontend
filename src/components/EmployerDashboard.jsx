import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import apiService from '../api'

function EmployerDashboard() {
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState('my-jobs')
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplications: 0,
    completedJobs: 0,
    averageRating: 0
  })
  const [myJobs, setMyJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [recommendedWorkers, setRecommendedWorkers] = useState([])
  const [tabLoading, setTabLoading] = useState(false)

  const { user, hasAccessTo } = useContext(AuthContext)
  const { success, error: showError } = useContext(AlertContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!hasAccessTo('employer')) {
      showError('Employer access required')
      navigate('/landing')
      return
    }
    
    loadDashboardData()
    loadRecommendedWorkers()
  }, [hasAccessTo, navigate, showError])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await loadDashboardStats()
      await loadTabContent(currentTab)
    } catch (error) {
      console.error('Dashboard initialization error:', error)
      showError('Failed to load dashboard. Please try refreshing.')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      // Load jobs, applications, and ratings in parallel
      const token = localStorage.getItem('token')
      
      const [jobsResponse, applicationsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || "https://resilinked-9mf9.vercel.app/api"}/jobs/my-jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || "https://resilinked-9mf9.vercel.app/api"}/jobs/my-applications-received`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      let jobs = []
      let receivedApplications = []

      if (jobsResponse.ok) {
        jobs = await jobsResponse.json()
      }
      
      if (applicationsResponse.ok) {
        receivedApplications = await applicationsResponse.json()
      }

      const activeJobs = jobs.filter(job => job.isOpen !== false).length
      const totalApplications = receivedApplications.reduce((sum, job) => 
        sum + (job.applicants ? job.applicants.length : 0), 0
      )
      const completedJobs = jobs.filter(job => job.completed).length

      setStats({
        activeJobs,
        totalApplications,
        completedJobs,
        averageRating: 4.2 // Placeholder - would load from ratings API
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      showError('Failed to load dashboard statistics')
    }
  }

  const loadTabContent = async (tabId) => {
    setTabLoading(true)
    try {
      switch (tabId) {
        case 'my-jobs':
          await loadMyJobs()
          break
        case 'applications':
          await loadApplications()
          break
        case 'workers':
          await loadWorkers()
          break
        default:
          break
      }
    } catch (error) {
      console.error(`Error loading ${tabId} content:`, error)
      showError(`Failed to load ${tabId} data`)
    } finally {
      setTabLoading(false)
    }
  }

  const loadMyJobs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://resilinked-9mf9.vercel.app/api"}/jobs/my-jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const jobs = await response.json()
        setMyJobs(jobs)
      } else {
        showError('Failed to load your jobs')
      }
    } catch (error) {
      console.error('Error loading my jobs:', error)
      showError('Error loading your jobs')
    }
  }

  const loadApplications = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://resilinked-9mf9.vercel.app/api"}/jobs/my-applications-received`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const apps = await response.json()
        setApplications(apps)
      } else {
        showError('Failed to load applications')
      }
    } catch (error) {
      console.error('Error loading applications:', error)
      showError('Error loading applications')
    }
  }

  const loadWorkers = async () => {
    // This function is kept for compatibility with loadTabContent
    // Now we just load recommended workers
    await loadRecommendedWorkers()
  }

  const handleTabChange = async (tabId) => {
    setCurrentTab(tabId)
    await loadTabContent(tabId)
  }
  
  const loadRecommendedWorkers = async () => {
    try {
      setTabLoading(true)
      const response = await apiService.getTopRated()
      if (Array.isArray(response)) {
        setRecommendedWorkers(response)
        console.log('Loaded recommended workers:', response.length)
      } else {
        console.error('Invalid response format for recommended workers:', response)
        setRecommendedWorkers([])
      }
    } catch (error) {
      console.error('Error loading recommended workers:', error)
      setRecommendedWorkers([])
      showError('Failed to load recommended workers')
    } finally {
      setTabLoading(false)
    }
  }

  const editJob = (jobId) => {
    // Navigate to edit job page (when implemented)
    navigate(`/edit-job/${jobId}`)
  }
  
  const completeJob = async (jobId) => {
    if (window.confirm('Are you sure you want to mark this job as complete? Payment will be distributed to the worker\'s goals.')) {
      try {
        console.log('Completing job with ID:', jobId);
        
        setTabLoading(true);
        const response = await apiService.completeJob(jobId);
        
        let successMsg = 'Job completed successfully!';
        
        if (response.goalUpdateResult) {
          const { updated, completed, noActiveGoals } = response.goalUpdateResult;
          
          if (noActiveGoals) {
            successMsg += ' Worker had no active goals, but payment was processed.';
          } else if (completed && completed.length > 0) {
            successMsg += ` ${completed.length} goal(s) completed! `;
            
            if (updated && updated.length > 0) {
              successMsg += `Progress updated on ${updated.length} additional goal(s).`;
            }
          } else if (updated && updated.length > 0) {
            successMsg += ` Progress updated on ${updated.length} goal(s).`;
          }
          
          console.log('Goal update result:', response.goalUpdateResult);
        }
        
        success(successMsg);
        
        // Refresh the jobs list and dashboard stats
        await loadMyJobs();
        await loadDashboardStats();
      } catch (error) {
        console.error('Error completing job:', error);
        showError(`Error completing job: ${error.message}`);
      } finally {
        setTabLoading(false);
      }
    }
  }

  const deleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        console.log('Deleting job with ID:', jobId);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('No authentication token found');
          showError('Authorization failed. Please log in again.');
          return;
        }
        
        const apiUrl = import.meta.env.VITE_API_URL || "https://resilinked-9mf9.vercel.app/api";
        const endpoint = `${apiUrl}/jobs/${jobId}`;
        console.log('DELETE request to endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const responseData = await response.json();
        console.log('Delete job response:', {
          status: response.status,
          ok: response.ok,
          data: responseData
        });
        
        if (response.ok) {
          success('Job deleted successfully');
          // Refresh the jobs list and dashboard stats
          loadMyJobs();
          loadDashboardStats();
        } else {
          showError(`Failed to delete job: ${responseData.message || responseData.alert || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        showError(`Error deleting job: ${error.message}`);
      }
    }
  }

  const handleApplication = async (applicationId, action, jobId, userId) => {
    try {
      console.log(`handleApplication called with:`, {
        applicationId,
        action,
        jobId,
        userId
      })
      
      if (!userId) {
        console.error('Missing userId parameter in handleApplication');
        showError(`Failed to ${action} application: Missing user ID`);
        return;
      }

      const token = localStorage.getItem('token')
      let endpoint, method
      
      if (action === 'accept') {
        endpoint = `${import.meta.env.VITE_API_URL || "https://resilinked-9mf9.vercel.app/api"}/jobs/${jobId}/assign`
        method = 'POST'
      } else if (action === 'reject') {
        endpoint = `${import.meta.env.VITE_API_URL || "https://resilinked-9mf9.vercel.app/api"}/jobs/${jobId}/reject`
        method = 'POST'
      }
      
      console.log(`Making ${method} request to ${endpoint} with userId: ${userId}`);
      
      const response = await fetch(endpoint, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })
      
      const responseData = await response.json();
      console.log(`Response for ${action}:`, {
        status: response.status,
        ok: response.ok,
        data: responseData
      });
      
      if (response.ok) {
        success(`Application ${action}ed successfully`)
        loadApplications()
        // Also reload the jobs to reflect changes
        loadMyJobs()
        loadDashboardStats()
      } else {
        showError(`Failed to ${action} application: ${responseData.message || responseData.alert || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(`Error ${action}ing application:`, error)
      showError(`Error ${action}ing application: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner large"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Employer Dashboard</h1>
        <p>Welcome back, {user?.firstName}!</p>
        <Link to="/landing" className="back-btn">Back to Landing</Link>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <h3>{stats.activeJobs}</h3>
            <p>Active Jobs</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.totalApplications}</h3>
            <p>Total Applications</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedJobs}</h3>
            <p>Completed Jobs</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.averageRating.toFixed(1)}</h3>
            <p>Average Rating</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/post-job" className="action-btn primary">
          <span className="icon">➕</span>
          Post New Job
        </Link>
        <div className="action-buttons">
          <button 
            className="action-btn secondary"
            onClick={() => handleTabChange('workers')}
          >
            <span className="icon">🏆</span>
            Recommended Workers
          </button>
          <Link to="/search-workers" className="action-btn secondary">
            <span className="icon">🔍</span>
            Search Workers
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${currentTab === 'my-jobs' ? 'active' : ''}`}
          onClick={() => handleTabChange('my-jobs')}
        >
          My Jobs
        </button>
        <button 
          className={`tab-btn ${currentTab === 'applications' ? 'active' : ''}`}
          onClick={() => handleTabChange('applications')}
        >
          Applications Received
        </button>
        <button 
          className={`tab-btn ${currentTab === 'workers' ? 'active' : ''}`}
          onClick={() => handleTabChange('workers')}
        >
          Available Workers
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {tabLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {/* My Jobs Tab */}
            {currentTab === 'my-jobs' && (
              <div className="jobs-grid">
                {myJobs.length > 0 ? (
                  myJobs.map(job => (
                    <div key={job._id} className="job-card">
                      <div className="job-header">
                        <h3>{job.title}</h3>
                        <div className="job-price">₱{job.price?.toLocaleString()}</div>
                      </div>
                      
                      <div className="job-meta">
                        <div className="meta-item">
                          <span className="icon">📍</span>
                          {job.barangay}
                        </div>
                        <div className="meta-item">
                          <span className="icon">👥</span>
                          {job.applicants ? job.applicants.length : 0} applicants
                        </div>
                        <div className="meta-item">
                          <span className={`status ${job.completed ? 'completed' : job.isOpen !== false ? 'active' : 'closed'}`}>
                            {job.completed ? 'Completed' : job.isOpen !== false ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        {job.assignedTo && (
                          <div className="meta-item">
                            <span className="icon">👤</span>
                            Assigned to: {job.assignedTo.firstName} {job.assignedTo.lastName}
                          </div>
                        )}
                      </div>
                      
                      <p className="job-description">
                        {job.description?.substring(0, 100)}
                        {job.description?.length > 100 ? '...' : ''}
                      </p>
                      
                      <div className="job-actions">
                        {job.assignedTo && !job.completed && (
                          <button 
                            className="btn success"
                            onClick={() => completeJob(job._id)}
                            title="Mark job as completed and process payment"
                          >
                            Complete Job
                          </button>
                        )}
                        <button 
                          className="btn secondary"
                          onClick={() => editJob(job._id)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn danger"
                          onClick={() => deleteJob(job._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <p>You haven't posted any jobs yet</p>
                    <Link to="/post-job" className="btn primary">Post Your First Job</Link>
                  </div>
                )}
              </div>
            )}

            {/* Applications Tab */}
            {currentTab === 'applications' && (
              <div className="applications-grid">
                {applications.length > 0 ? (
                  applications.map(job => (
                    <div key={job._id} className="application-section">
                      <h3 className="job-title">{job.title}</h3>
                      <div className="applicants-list">
                        {job.applicants?.map(app => (
                          <div key={app._id} className="applicant-card">
                            <div className="applicant-info">
                              <h4>{app.user?.firstName} {app.user?.lastName}</h4>
                              <p>{app.user?.email}</p>
                              <span className={`status ${app.status}`}>
                                {app.status || 'pending'}
                              </span>
                            </div>
                            <div className="applicant-actions">
                              {app.status === 'pending' && (
                                <>
                                  <button 
                                    className="btn primary"
                                    onClick={() => handleApplication(app._id, 'accept', job._id, app.user?._id)}
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    className="btn danger"
                                    onClick={() => handleApplication(app._id, 'reject', job._id, app.user?._id)}
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )) || []}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <p>No applications received yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Workers Tab */}
            {currentTab === 'workers' && (
              <>
                <div className="section-header">
                  <h2>Recommended Workers</h2>
                  <Link to="/search-workers" className="btn primary">
                    <span className="icon">🔍</span>
                    Advanced Search
                  </Link>
                </div>
                
                <div className="dashboard-section">
                  <div className="workers-grid">
                    {tabLoading ? (
                      <div className="no-data">
                        <div className="spinner"></div>
                        <p>Loading recommended workers...</p>
                      </div>
                    ) : recommendedWorkers.length > 0 ? (
                      recommendedWorkers.map(worker => (
                        <div key={worker._id} className="worker-card">
                          <div className="worker-header">
                            <div className="worker-profile">
                              {worker.profilePicture ? (
                                <img 
                                  src={`data:image/jpeg;base64,${worker.profilePicture}`} 
                                  alt={`${worker.firstName} ${worker.lastName}`} 
                                  className="worker-avatar"
                                />
                              ) : (
                                <div className="worker-avatar-placeholder">
                                  {worker.firstName?.[0]}{worker.lastName?.[0]}
                                </div>
                              )}
                              <h3>{worker.firstName} {worker.lastName}</h3>
                            </div>
                            <div className="worker-rating">⭐ {worker.averageRating?.toFixed(1) || '4.5'}</div>
                          </div>
                          
                          <div className="worker-location">
                            <span className="icon">📍</span> {worker.barangay || 'Location not specified'}
                          </div>
                          
                          <div className="top-rated-badge">
                            <span className="icon">🏆</span> Top Rated
                          </div>
                          
                          <div className="worker-info">
                            <p className="worker-bio">{worker.bio || 'No bio available'}</p>
                            <div className="worker-skills">
                              {worker.skills?.map((skill, index) => (
                                <span key={index} className="skill-tag">{skill}</span>
                              )) || []}
                            </div>
                          </div>
                          
                          <div className="worker-actions">
                            <button className="btn primary">Contact</button>
                            <Link to={`/profile/${worker._id}`} className="btn secondary">View Profile</Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-data">
                        <p>No recommended workers available at the moment</p>
                        <Link to="/search-workers" className="btn primary">Search for Workers</Link>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
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
          margin-bottom: 2rem;
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

        .quick-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .action-btn.primary {
          background: #2b6cb0;
          color: white;
        }

        .action-btn.primary:hover {
          background: #2c5282;
        }

        .action-btn.secondary {
          background: #e2e8f0;
          color: #2d3748;
        }

        .action-btn.secondary:hover {
          background: #cbd5e0;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .tab-navigation {
          background: white;
          border-radius: 12px 12px 0 0;
          display: flex;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .tab-btn {
          flex: 1;
          padding: 1rem 1.5rem;
          border: none;
          background: #f3f6fa;
          color: #2b6cb0;
          cursor: pointer;
          font-size: 1rem;
          transition: background-color 0.2s, color 0.2s;
          border-radius: 12px 12px 0 0;
          border-bottom: 3px solid #e2e8f0;
          font-weight: 500;
        }

        .tab-btn:first-child {
          border-radius: 12px 0 0 0;
        }

        .tab-btn:last-child {
          border-radius: 0 12px 0 0;
        }

        .tab-btn.active {
          background: #2b6cb0;
          color: #fff;
          font-weight: bold;
          text-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }

        .tab-btn:not(.active):hover {
          background: #f7fafc;
        }

        .tab-content {
          background: white;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          min-height: 400px;
        }

        .jobs-grid, .workers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .applications-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .job-card, .worker-card {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .job-card:hover, .worker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .job-header, .worker-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .job-header h3, .worker-header h3 {
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

        .worker-rating {
          background: #ffc107;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-weight: bold;
          font-size: 0.9rem;
        }
        
        .worker-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .worker-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .worker-avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e2e8f0;
          color: #4a5568;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
        
        .worker-location {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #4a5568;
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }
        
        .worker-bio {
          margin-top: 0;
          margin-bottom: 0.75rem;
        }
        
        .top-rated-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #F59E0B;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          background: #FFFBEB;
          border-radius: 12px;
          width: fit-content;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .job-meta, .worker-info {
          margin-bottom: 1rem;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
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

        .status.active {
          background: #e6fffa;
          color: #00695c;
        }

        .status.closed {
          background: #fed7d7;
          color: #c53030;
        }
        
        .status.completed {
          background: #c6f6d5;
          color: #2f855a;
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

        .job-actions, .worker-actions, .applicant-actions {
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

        .btn.danger {
          background: #e53e3e;
          color: white;
        }

        .btn.danger:hover {
          background: #c53030;
        }
        
        .btn.success {
          background: #38a169;
          color: white;
        }
        
        .btn.success:hover {
          background: #2f855a;
        }

        .application-section {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
        }

        .job-title {
          margin: 0 0 1rem 0;
          color: #2b6cb0;
          font-size: 1.2rem;
        }

        .applicants-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .applicant-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 8px;
        }

        .applicant-info h4 {
          margin: 0;
          color: #2d3748;
        }

        .applicant-info p {
          margin: 0.25rem 0;
          color: #666;
          font-size: 0.9rem;
        }

        .worker-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .skill-tag {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
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

        /* Search Form Styles */
        .search-section {
          margin-bottom: 2rem;
        }
        
        .search-section h3 {
          font-size: 1.25rem;
          color: #2b6cb0;
          margin-bottom: 1rem;
        }
        
        .search-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .search-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .search-input-group label {
          font-weight: 500;
          color: #4a5568;
          font-size: 0.9rem;
        }
        
        .search-input-with-icon {
          position: relative;
        }
        
        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #718096;
        }
        
        .search-input-group input,
        .search-input-group select {
          padding: 0.75rem;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 0.95rem;
        }
        
        .search-input-with-icon input {
          padding-left: 2.5rem;
        }
        
        .skills-filter {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.5rem;
        }
        
        .skill-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .search-actions {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }
        
        .search-btn {
          padding: 0.75rem 1.5rem;
          font-weight: 500;
        }
        
        /* Pagination Styles */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 2rem;
          gap: 1rem;
        }
        
        .pagination-btn {
          padding: 0.5rem 1rem;
          background: #e2e8f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          color: #2d3748;
          font-weight: 500;
          transition: background 0.2s;
        }
        
        .pagination-btn:hover:not(:disabled) {
          background: #cbd5e0;
        }
        
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pagination-info {
          color: #4a5568;
          font-size: 0.9rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        
        .dashboard-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .tab-button {
          background: #e2e8f0;
          color: #2d3748;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .tab-button.active {
          background: #2b6cb0;
          color: white;
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
          }
          
          .search-form {
            grid-template-columns: 1fr;
          }
          
          .search-actions {
            flex-direction: column;
            gap: 0.5rem;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .quick-actions {
            flex-direction: column;
          }

          .tab-navigation {
            flex-direction: column;
          }

          .tab-btn {
            border-radius: 0;
          }

          .tab-btn:first-child {
            border-radius: 12px 12px 0 0;
          }

          .tab-btn:last-child {
            border-radius: 0;
          }

          .jobs-grid, .workers-grid {
            grid-template-columns: 1fr;
          }

          .applicant-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default EmployerDashboard
