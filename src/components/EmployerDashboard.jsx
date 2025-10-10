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
  const [workers, setWorkers] = useState([])
  const [tabLoading, setTabLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentEditJob, setCurrentEditJob] = useState(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    barangay: '',
    skillsRequired: []
  })

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
      // Load jobs and applications in parallel using apiService
      const [jobs, receivedApplications] = await Promise.all([
        apiService.getMyJobs(),
        apiService.getMyApplicationsReceived()
      ]);

      const activeJobs = jobs.filter(job => job.isOpen !== false).length;
      const totalApplications = receivedApplications.reduce((sum, job) => 
        sum + (job.applicants ? job.applicants.length : 0), 0
      );
      const completedJobs = jobs.filter(job => job.completed).length;

      setStats({
        activeJobs,
        totalApplications,
        completedJobs,
        averageRating: 4.2 // Placeholder - would load from ratings API
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      showError('Failed to load dashboard statistics');
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
      console.log('Loading my jobs from API');
      // Use apiService to get jobs from backend
      const jobs = await apiService.getMyJobs();
      
      if (Array.isArray(jobs)) {
        console.log(`Loaded ${jobs.length} jobs`);
        setMyJobs(jobs);
      } else {
        console.error('Unexpected response format:', jobs);
        setMyJobs([]);
        showError('Received invalid data from server');
      }
    } catch (error) {
      console.error('Error loading my jobs:', error);
      showError('Error loading your jobs: ' + (error.message || 'Unknown error'));
      setMyJobs([]); // Set to empty array on error to avoid undefined issues
    }
  }

  const loadApplications = async () => {
    try {
      // Use apiService instead of direct fetch
      const apps = await apiService.getMyApplicationsReceived();
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
      showError('Error loading applications');
    }
  }

  const loadWorkers = async () => {
    try {
      // Use apiService instead of direct fetch
      const data = await apiService.getWorkers();
      if (data && data.users) {
        setWorkers(data.users);
      } else {
        setWorkers([]);
      }
    } catch (error) {
      console.error('Error loading workers:', error);
      setWorkers([]); // Graceful fallback
    }
  }

  const handleTabChange = async (tabId) => {
    setCurrentTab(tabId)
    await loadTabContent(tabId)
  }

  const editJob = (job) => {
    // Ensure we have a valid job object
    if (!job || !job._id) {
      showError('Invalid job selection');
      return;
    }
    
    // Check if job is already completed
    if (job.completed) {
      showError('Completed jobs cannot be edited');
      return;
    }
    
    console.log('Opening edit modal for job:', job);
    
    setCurrentEditJob(job);
    setEditFormData({
      title: job.title || '',
      description: job.description || '',
      price: job.price || '',
      barangay: job.barangay || '',
      skillsRequired: Array.isArray(job.skillsRequired) ? [...job.skillsRequired] : []
    });
    setShowEditModal(true);
  }

  const completeJob = async (jobId) => {
    if (window.confirm('Mark this job as completed? This will automatically transfer the job income to the worker\'s active financial goal.')) {
      try {
        // Use apiService instead of direct fetch
        const result = await apiService.completeJob(jobId);
        
        success(result.alert || 'Job marked as completed successfully');
        // Refresh the jobs list and dashboard stats
        loadMyJobs();
        loadDashboardStats();
      } catch (error) {
        console.error('Error completing job:', error);
        showError(`Error completing job: ${error.message}`);
      }
    }
  }

  const deleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        setLoading(true);
        console.log('Deleting job with ID:', jobId);
        
        // Use apiService to connect with backend
        const result = await apiService.deleteJob(jobId);
        
        console.log('Delete job response:', result);
        
        success(result.alert || 'Job deleted successfully');
        // Refresh the jobs list and dashboard stats
        await loadMyJobs();
        await loadDashboardStats();
      } catch (error) {
        console.error('Error deleting job:', error);
        showError(`Error deleting job: ${error.message}`);
      } finally {
        setLoading(false);
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

      let result;
      
      if (action === 'accept') {
        // Use apiService instead of direct fetch
        result = await apiService.assignWorker(jobId, userId);
      } else if (action === 'reject') {
        // Use apiService instead of direct fetch
        result = await apiService.rejectApplication(jobId, userId);
      }
      
      console.log(`Response for ${action}:`, result);
      
      success(`Application ${action}ed successfully`);
      loadApplications();
      // Also reload the jobs to reflect changes
      loadMyJobs();
      loadDashboardStats();
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
      showError(`Error ${action}ing application: ${error.message}`);
    }
  }
  
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: name === 'price' ? parseFloat(value) || value : value
    });
  }
  
  const handleSkillInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newSkill = e.target.value.trim();
      
      // Check if skill already exists
      if (editFormData.skillsRequired.includes(newSkill)) {
        // Indicate duplicate skill without showing a full error
        e.target.classList.add('input-error');
        setTimeout(() => {
          e.target.classList.remove('input-error');
        }, 1000);
        return;
      }
      
      // Limit number of skills
      if (editFormData.skillsRequired.length >= 10) {
        showError('You can add up to 10 skills maximum');
        return;
      }
      
      // Add the new skill
      setEditFormData({
        ...editFormData,
        skillsRequired: [...editFormData.skillsRequired, newSkill]
      });
      
      // Clear input
      e.target.value = '';
    }
  }
  
  const removeSkill = (skillToRemove) => {
    setEditFormData({
      ...editFormData,
      skillsRequired: editFormData.skillsRequired.filter(skill => skill !== skillToRemove)
    });
  }
  
  const handleSaveJob = async (e) => {
    e.preventDefault();
    
    if (!currentEditJob || !currentEditJob._id) {
      showError('Invalid job data');
      return;
    }
    
    // Form validation
    if (!editFormData.title || !editFormData.description || !editFormData.price || !editFormData.barangay) {
      showError('Please fill in all required fields');
      return;
    }
    
    // Price validation
    const price = parseFloat(editFormData.price);
    if (isNaN(price) || price <= 0) {
      showError('Please enter a valid price');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Saving job edit:', {
        jobId: currentEditJob._id,
        updates: editFormData
      });
      
      // Make API call to update job using apiService
      const result = await apiService.editJob(currentEditJob._id, {
        ...editFormData,
        price: parseFloat(editFormData.price)
      });
      
      success(result.alert || "Job updated successfully!");
      setShowEditModal(false);
      
      // Refresh the jobs list
      await loadMyJobs();
      await loadDashboardStats();
    } catch (error) {
      console.error('Error updating job:', error);
      showError(`Error updating job: ${error.message || 'Failed to update job'}`);
    } finally {
      setLoading(false);
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
        <Link to="/search-workers" className="action-btn secondary">
          <span className="icon">🔍</span>
          Browse Workers
        </Link>
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
                            <span className={`status ${job.isOpen !== false ? 'active' : (job.completed ? 'completed' : 'closed')}`}>
                              {job.completed ? 'Completed' : (job.isOpen !== false ? 'Active' : 'Closed')}
                            </span>
                          </div>
                          {job.assignedTo && (
                            <div className="meta-item">
                              <span className="icon">👤</span>
                              Assigned to: {job.assignedTo.firstName} {job.assignedTo.lastName}
                            </div>
                          )}
                        </div>                      <p className="job-description">
                        {job.description?.substring(0, 100)}
                        {job.description?.length > 100 ? '...' : ''}
                      </p>
                      
                      <div className="job-actions">
                        <button 
                          className="btn secondary"
                          onClick={() => editJob(job)}
                        >
                          Edit
                        </button>
                        {job.assignedTo && !job.completed && (
                          <button 
                            className="btn success"
                            onClick={() => completeJob(job._id)}
                          >
                            Mark Completed
                          </button>
                        )}
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
              <div className="workers-grid">
                {workers.length > 0 ? (
                  workers.map(worker => (
                    <div key={worker._id} className="worker-card">
                      <div className="worker-header">
                        <h3>{worker.firstName} {worker.lastName}</h3>
                        <div className="worker-rating">⭐ {worker.rating || '4.5'}</div>
                      </div>
                      
                      <div className="worker-info">
                        <p>{worker.bio || 'No bio available'}</p>
                        <div className="worker-skills">
                          {worker.skills?.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                          )) || []}
                        </div>
                      </div>
                      
                      <div className="worker-actions">
                        <button className="btn primary">Contact</button>
                        <button className="btn secondary">View Profile</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <p>No workers available at the moment</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Job Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Job</h2>
              <button 
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSaveJob} className="edit-job-form">
              <div className="form-group">
                <label htmlFor="title">Job Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditFormChange}
                  required
                  placeholder="e.g., House Cleaning, Plumbing Repair"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Job Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
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
                    value={editFormData.price}
                    onChange={handleEditFormChange}
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
                    value={editFormData.barangay}
                    onChange={handleEditFormChange}
                    required
                    placeholder="e.g., San Antonio"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Skills Required</label>
                <div className="skills-input">
                  <div className="skills-input-container">
                    <input
                      type="text"
                      id="skillInput"
                      placeholder="Type skill and press Enter or Add"
                      onKeyDown={handleSkillInput}
                    />
                    <button 
                      type="button" 
                      className="add-skill-btn"
                      onClick={() => {
                        const input = document.getElementById('skillInput');
                        if (input && input.value.trim()) {
                          const newSkill = input.value.trim();
                          
                          // Check if skill already exists
                          if (editFormData.skillsRequired.includes(newSkill)) {
                            input.classList.add('input-error');
                            setTimeout(() => {
                              input.classList.remove('input-error');
                            }, 1000);
                            return;
                          }
                          
                          // Limit number of skills
                          if (editFormData.skillsRequired.length >= 10) {
                            showError('You can add up to 10 skills maximum');
                            return;
                          }
                          
                          setEditFormData({
                            ...editFormData,
                            skillsRequired: [...editFormData.skillsRequired, newSkill]
                          });
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="skills-tags">
                    {editFormData.skillsRequired && editFormData.skillsRequired.map((skill, index) => (
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
                  {editFormData.skillsRequired && editFormData.skillsRequired.length > 0 && (
                    <small className="skill-count">{editFormData.skillsRequired.length} of 10 skills added</small>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn secondary" 
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn primary" 
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  <style>{`
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          padding: 2rem;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #2b6cb0;
        }
        
        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #718096;
          cursor: pointer;
        }
        
        .modal-close:hover {
          color: #2b6cb0;
        }
        
        .edit-job-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .skills-input {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .skills-input-container {
          display: flex;
          gap: 0.5rem;
        }
        
        .skills-input-container input {
          flex: 1;
        }
        
        .skills-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        
        .add-skill-btn {
          background: #2b6cb0;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
        }
        
        .add-skill-btn:hover {
          background: #2c5282;
        }
        
        .input-error {
          border-color: #e53e3e !important;
          animation: shake 0.5s;
        }
        
        .skill-count {
          color: #718096;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
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
        }
        
        .remove-skill:hover {
          color: #e53e3e;
        }
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
          background: #d1ecf1;
          color: #0c5460;
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

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 1rem;
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
