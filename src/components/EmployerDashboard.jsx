import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import apiService from '../api'

function EmployerDashboard() {
  // Helper function for price formatting
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '₱0';
    if (typeof price === 'number') return '₱' + price.toLocaleString();
    return '₱' + price;
  };

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
  // New state for worker profile modal
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [currentWorker, setCurrentWorker] = useState(null)
  // New state for invitation modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedJobForInvite, setSelectedJobForInvite] = useState(null)

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
        const workersData = data.users;
        console.log("Loading ratings for", workersData.length, "workers...");
        
        // Get ratings for each worker
        const workersWithRatings = await Promise.all(
          workersData.map(async (worker) => {
            try {
              const ratingsResponse = await apiService.getUserRatings(worker._id);
              const avgRating = ratingsResponse.averageRating || 
                               (ratingsResponse.ratings && ratingsResponse.ratings.length > 0 
                                ? ratingsResponse.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsResponse.ratings.length
                                : null);
              
              return {
                ...worker,
                avgRating: avgRating,
                ratingCount: ratingsResponse.ratings ? ratingsResponse.ratings.length : 0
              };
            } catch (err) {
              console.log(`Could not fetch ratings for worker ${worker._id}:`, err);
              return worker;
            }
          })
        );
        
        setWorkers(workersWithRatings);
      } else {
        setWorkers([]);
      }
    } catch (error) {
      console.error('Error loading workers:', error);
      setWorkers([]); // Graceful fallback
    }
  }
  
  // State for worker ratings
  const [workerRatings, setWorkerRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  
  // View worker profile function
  const viewWorkerProfile = async (worker) => {
    try {
      setLoading(true);
      setWorkerRatings([]);
      
      // Get detailed worker profile and ratings in parallel
      const [profile, ratingsResponse] = await Promise.all([
        apiService.getProfile(worker._id),
        apiService.getUserRatings(worker._id).catch(err => {
          console.error('Error loading ratings:', err);
          return { ratings: [] };
        })
      ]);
      
      setCurrentWorker(profile.user || worker);
      setWorkerRatings(ratingsResponse.ratings || []);
      setShowWorkerModal(true);
    } catch (error) {
      console.error('Error loading worker profile:', error);
      showError('Could not load worker profile');
    } finally {
      setLoading(false);
    }
  }
  
  // Contact worker function - opens contact modal
  const contactWorker = (worker) => {
    setCurrentWorker(worker);
    setContactMessage('');
    setShowContactModal(true);
  }
  
  // Send message function
  const sendMessage = () => {
    if (!contactMessage.trim()) {
      showError('Please enter a message');
      return;
    }
    
    // In a real app, this would send the message to the backend
    // For now, we'll just show a success message
    success(`Message sent to ${currentWorker.firstName} ${currentWorker.lastName}!`);
    setShowContactModal(false);
    setContactMessage('');
  }
  
  // Function to open invite modal with the selected worker
  const openInviteModal = (worker) => {
    setCurrentWorker(worker);
    setShowInviteModal(true);
  }
  
  // Function to send job invitation
  const sendJobInvitation = async (jobId) => {
    if (!currentWorker || !currentWorker._id || !jobId) {
      showError('Missing information to send invitation');
      return;
    }
    
    // Find the selected job
    const selectedJob = myJobs.find(job => job._id === jobId);
    
    // Check if job is active/open before sending invitation
    if (selectedJob && selectedJob.isOpen === false) {
      showError('You can only invite workers to active jobs');
      return;
    }
    
    try {
      console.log('Sending job invitation with params:', {
        jobId,
        workerId: currentWorker._id,
        workerName: `${currentWorker.firstName} ${currentWorker.lastName}`
      });
      
      setLoading(true);
      // Use the new API method for invitations
      await apiService.inviteWorker(jobId, currentWorker._id);
      
      success(`Invitation sent to ${currentWorker.firstName} ${currentWorker.lastName}!`);
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      // Show more specific error message
      if (error.message.includes('not found')) {
        showError('Job or worker not found. Please refresh and try again.');
      } else if (error.message.includes('not authorized')) {
        showError('You are not authorized to invite workers to this job.');
      } else {
        showError('Could not send invitation. Please try again later.');
      }
    } finally {
      setLoading(false);
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
                        <div className="job-price">{formatPrice(job.price)}</div>
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
                        <div className="worker-rating">
                          <span className="star-icon">★</span>
                          {worker.avgRating ? worker.avgRating.toFixed(1) : 'N/A'}
                        </div>
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
                        <button 
                          className="btn primary" 
                          onClick={() => contactWorker(worker)}
                          aria-label={`Contact ${worker.firstName}`}
                        >
                          Contact
                        </button>
                        <button 
                          className="btn secondary" 
                          onClick={() => viewWorkerProfile(worker)}
                          aria-label={`View ${worker.firstName}'s profile`}
                        >
                          View Profile
                        </button>
                        <button 
                          className="btn accent" 
                          onClick={() => openInviteModal(worker)}
                          aria-label={`Invite ${worker.firstName} to job`}
                        >
                          Invite to Job
                        </button>
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
        
        .modal-title-with-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .modal-header h2 {
          margin: 0;
          color: #2b6cb0;
        }
        
        .modal-close, .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #718096;
          cursor: pointer;
        }
        
        .modal-close:hover, .close-button:hover {
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
          display: flex;
          flex-direction: column;
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
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        
        .worker-rating .star-icon {
          color: #ffffff;
          font-size: 1rem;
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
          justify-content: center;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background-color 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 100px;
          height: 38px;
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
        
        .btn.accent {
          background: #8b5cf6;
          color: white;
        }
        
        .btn.accent:hover {
          background: #7c3aed;
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

        .worker-info {
          flex: 1;
          margin-bottom: 1rem;
        }
        
        .worker-card .worker-actions {
          margin-top: auto;
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;
          justify-content: center;
        }

        .worker-card .worker-actions .btn {
          flex: 1;
          min-width: 90px;
          max-width: 120px;
          font-weight: 500;
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

        /* Worker Profile Modal Styles */
        .worker-profile-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .worker-profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4c1d95, #6d28d9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: bold;
        }

        .worker-profile-info h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .worker-profile-contact {
          margin: 1.5rem 0;
          padding: 1rem;
          background: #f0f9ff;
          border-radius: 8px;
          border-left: 3px solid #3b82f6;
        }

        .worker-profile-details {
          margin-top: 1.5rem;
        }

        .worker-profile-section {
          margin-bottom: 1.5rem;
        }

        .worker-profile-section h4 {
          margin-bottom: 0.5rem;
          color: #1e40af;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 0.5rem;
        }
        
        /* Worker Profile Tabs */
        .worker-profile-tabs {
          margin-top: 1.5rem;
        }
        
        .tab-nav {
          display: flex;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 1.5rem;
        }
        
        .tab-nav .tab-btn {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          font-size: 1rem;
          font-weight: 500;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .tab-nav .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }
        
        .tab-nav .tab-btn:hover:not(.active) {
          color: #0f172a;
        }
        
        .worker-profile-tabs .tab-content {
          display: none;
        }
        
        .worker-profile-tabs .tab-content.active {
          display: block;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        /* Ratings */
        .ratings-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .ratings-summary {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
        }
        
        .ratings-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        
        .big-score {
          font-size: 2.5rem;
          font-weight: bold;
          color: #2d3748;
        }
        
        .big-stars {
          font-size: 1.5rem;
          color: #cbd5e0;
        }
        
        .big-stars .star.filled {
          color: #f59e0b;
        }
        
        .rating-count {
          font-size: 0.9rem;
          color: #64748b;
        }
        
        .ratings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .rating-card {
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: white;
        }
        
        .rating-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }
        
        .rater-info {
          display: flex;
          flex-direction: column;
        }
        
        .rater-name {
          font-weight: 500;
          color: #2d3748;
        }
        
        .rating-date {
          font-size: 0.8rem;
          color: #94a3b8;
        }
        
        .rating-stars {
          color: #f59e0b;
          font-size: 1.1rem;
        }
        
        .rating-stars .star:not(.filled) {
          color: #cbd5e0;
        }
        
        .rating-comment {
          font-size: 0.95rem;
          color: #4a5568;
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }
        
        .rating-job {
          font-size: 0.85rem;
          color: #64748b;
          padding-top: 0.5rem;
          border-top: 1px dashed #e2e8f0;
        }
        
        .job-label {
          font-weight: 500;
        }
        
        .job-title {
          color: #2d3748;
        }
        
        .no-ratings {
          text-align: center;
          padding: 2rem;
          color: #64748b;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px dashed #e2e8f0;
        }
        
        .worker-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.25rem 0;
        }
        
        .stars {
          color: #f59e0b;
          font-size: 1rem;
        }
        
        .star {
          color: #cbd5e0;
        }
        
        .star.filled {
          color: #f59e0b;
        }
        
        .rating-score {
          font-weight: bold;
          color: #2d3748;
        }
        
        /* Contact Modal Styles */
        .contact-modal .modal-body {
          padding: 0;
        }
        
        .contact-info-section {
          padding: 1.5rem;
          background: linear-gradient(to bottom, #f0f9ff, #ffffff);
          border-radius: 8px 8px 0 0;
        }
        
        .contact-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .contact-avatar {
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4c1d95, #6d28d9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .contact-details {
          flex: 1;
        }
        
        .contact-details h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }
        
        .contact-number, .contact-email {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.25rem 0;
          color: #4a5568;
          font-size: 0.95rem;
        }
        
        .contact-icon {
          font-size: 1.1rem;
        }
        
        .contact-methods {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1.25rem;
          margin-top: 1rem;
          border: 1px solid #e2e8f0;
        }
        
        .contact-method-header {
          margin-bottom: 1rem;
        }
        
        .contact-method-header h4 {
          margin: 0 0 0.25rem 0;
          color: #2d3748;
        }
        
        .contact-method-header p {
          margin: 0;
          font-size: 0.9rem;
          color: #64748b;
        }
        
        .contact-method-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 0.75rem;
        }
        
        .contact-option {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          color: inherit;
          background: white;
        }
        
        .contact-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .option-icon {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        
        .option-label {
          font-size: 0.9rem;
          font-weight: 500;
          color: #2d3748;
        }
        
        .contact-option.call:hover {
          background: #ebf8ff;
          border-color: #63b3ed;
        }
        
        .contact-option.sms:hover {
          background: #e6fffa;
          border-color: #38b2ac;
        }
        
        .contact-option.email:hover {
          background: #faf5ff;
          border-color: #9f7aea;
        }
        
        .contact-option.message:hover {
          background: #f0fff4;
          border-color: #68d391;
        }
        
        .message-section {
          padding: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }
        
        .message-section h4 {
          margin: 0 0 0.25rem 0;
          color: #2d3748;
        }
        
        .message-info {
          margin: 0 0 1rem 0;
          font-size: 0.9rem;
          color: #64748b;
        }
        
        .message-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .message-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          resize: vertical;
          font-family: inherit;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        
        .message-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        
        .message-actions {
          display: flex;
          justify-content: flex-end;
        }
        
        @media (max-width: 640px) {
          .contact-method-options {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .job-invite-list {
          max-height: 300px;
          overflow-y: auto;
          display: grid;
          gap: 0.75rem;
          margin: 1rem 0;
        }

        .job-invite-item {
          padding: 1rem;
          border-radius: 10px;
          border: 2px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          position: relative;
          overflow: hidden;
          background-color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
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
        
        .job-status-indicator {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
        }
        
        .job-status-indicator.active {
          background-color: #c6f6d5;
          color: #22543d;
          border: 1px solid #9ae6b4;
        }
        
        .job-status-indicator.completed {
          background-color: #bee3f8;
          color: #2a4365;
          border: 1px solid #90cdf4;
        }
        
        .job-status-indicator.closed {
          background-color: #fed7d7;
          color: #822727;
          border: 1px solid #feb2b2;
        }
        
        /* Job Status Badge Styling - For use in other contexts */
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

        .job-invite-item:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .job-invite-item.selected {
          background: #e0f2fe;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
        }
        
        .job-invite-item.job-inactive {
          opacity: 0.7;
          cursor: not-allowed;
          position: relative;
        }
        
        .job-invite-item.job-inactive:hover {
          transform: none;
          box-shadow: none;
          background: #f1f5f9;
        }
        
        .job-invite-item.job-inactive:after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            -45deg,
            rgba(0, 0, 0, 0.05),
            rgba(0, 0, 0, 0.05) 10px,
            transparent 10px,
            transparent 20px
          );
          border-radius: 8px;
          pointer-events: none;
        }
        
        .selected-indicator {
          background: #3b82f6;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 10px;
          flex-shrink: 0;
        }
        
        .checkmark {
          color: white;
          font-size: 0.9rem;
          font-weight: bold;
        }
        
        .job-description-preview {
          margin: 0.5rem 0;
          font-size: 0.85rem;
          color: #4a5568;
          line-height: 1.4;
        }
        
        .job-invite-details {
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          align-items: center;
        }
        
        .job-invite-item h4 {
          margin: 0;
          color: #2d3748;
          font-size: 1.1rem;
        }
        
        .job-price {
          margin: 0;
          color: #38a169;
          font-weight: bold;
          font-size: 1.1rem;
          background-color: #f0fff4;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          border: 1px solid #c6f6d5;
          display: inline-block;
        }
        
        .job-location {
          margin: 0;
          color: #718096;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.9rem;
        }
        
        .location-icon {
          font-size: 0.9rem;
        }
        
        .skill-tag-small {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.15rem 0.4rem;
          border-radius: 12px;
          font-size: 0.75rem;
          margin-right: 0.3rem;
          display: inline-block;
        }
        
        .skill-tag-more {
          font-size: 0.75rem;
          color: #718096;
        }
        
        .job-skills-preview {
          margin-top: 0.7rem;
        }
        
        .invite-worker-info {
          display: flex;
          align-items: center;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
          margin-bottom: 1rem;
          border-left: 4px solid #3b82f6;
        }
        
        .worker-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4c1d95, #6d28d9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          margin-right: 1rem;
          flex-shrink: 0;
        }
        
        .worker-details {
          flex: 1;
        }
        
        .worker-details h3 {
          margin: 0 0 0.3rem 0;
          color: #2d3748;
        }
        
        .worker-skills-preview {
          color: #64748b;
          font-size: 0.9rem;
          margin: 0;
        }
        
        .invitation-instruction {
          margin-bottom: 0.5rem;
        }
        
        .invitation-instruction p {
          font-weight: 500;
          color: #4a5568;
        }
        
        .no-jobs-message {
          text-align: center;
          padding: 2rem;
          background: #f0fff4;
          border-radius: 10px;
          border: 2px dashed #9ae6b4;
          box-shadow: inset 0 0 20px rgba(104, 211, 145, 0.1);
        }
        
        .no-jobs-message .icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          color: #38a169;
        }
        
        .no-jobs-message h3 {
          margin: 0.5rem 0;
          color: #276749;
          font-size: 1.3rem;
        }
        
        .no-jobs-message p {
          margin-bottom: 1.5rem;
          color: #2f855a;
          font-size: 0.95rem;
        }
        
        .no-jobs-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          text-align: left;
          background: rgba(255, 255, 255, 0.8);
          padding: 1rem;
          border-radius: 8px;
        }
        
        .info-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        
        .info-icon {
          font-size: 1.1rem;
          flex-shrink: 0;
        }
        
        .info-text {
          font-size: 0.9rem;
          color: #2d3748;
          line-height: 1.4;
        }
        
        .no-jobs-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .spinner-inline {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s ease-in-out infinite;
        }
      `}</style>

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
                    currentWorker.firstName?.[0] || 'W'
                  )}
                </div>
                <div className="worker-profile-info">
                  <h3>{currentWorker.firstName} {currentWorker.lastName}</h3>
                  <div className="worker-rating">
                    <span className="stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star} 
                          className={star <= (currentWorker.avgRating || 4.5) ? "star filled" : "star"}>
                          ★
                        </span>
                      ))}
                    </span>
                    <span className="rating-score">{(currentWorker.avgRating || 4.5).toFixed(1)}</span>
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
                  <button 
                    className="tab-btn" 
                    id="ratings-tab"
                    onClick={(e) => {
                      document.querySelectorAll('.worker-profile-tabs .tab-btn').forEach(btn => 
                        btn.classList.remove('active'));
                      e.target.classList.add('active');
                      document.querySelectorAll('.worker-profile-tabs .tab-content').forEach(content => 
                        content.classList.remove('active'));
                      document.getElementById('ratings-content').classList.add('active');
                    }}
                  >
                    Ratings & Reviews
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
                    <p>{currentWorker.experience || 'No experience information provided'}</p>
                  </div>
                  
                  <div className="worker-profile-section">
                    <h4>Contact Information</h4>
                    <p><strong>Email:</strong> {currentWorker.email}</p>
                    <p><strong>Phone:</strong> {currentWorker.mobileNo || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="tab-content" id="ratings-content">
                  <div className="ratings-container">
                    <div className="ratings-summary">
                      <div className="ratings-score">
                        <span className="big-score">{(currentWorker.avgRating || 4.5).toFixed(1)}</span>
                        <span className="big-stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span 
                              key={star} 
                              className={star <= (currentWorker.avgRating || 4.5) ? "star filled" : "star"}>
                              ★
                            </span>
                          ))}
                        </span>
                        <span className="rating-count">({workerRatings.length || 0} reviews)</span>
                      </div>
                    </div>
                    
                    <div className="ratings-list">
                      {workerRatings.length > 0 ? (
                        workerRatings.map(rating => (
                          <div key={rating._id} className="rating-card">
                            <div className="rating-header">
                              <div className="rater-info">
                                <span className="rater-name">
                                  {rating.rater?.firstName} {rating.rater?.lastName}
                                </span>
                                <span className="rating-date">
                                  {new Date(rating.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="rating-stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <span 
                                    key={star}
                                    className={star <= rating.rating ? "star filled" : "star"}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                            {rating.comment && (
                              <div className="rating-comment">{rating.comment}</div>
                            )}
                            {rating.job && (
                              <div className="rating-job">
                                <span className="job-label">Job: </span>
                                <span className="job-title">{rating.job.title}</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="no-ratings">No reviews yet</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn primary" 
                onClick={() => contactWorker(currentWorker)}
                aria-label={`Contact ${currentWorker.firstName}`}
              >
                Contact
              </button>
              <button 
                className="btn accent"
                onClick={() => {
                  setShowWorkerModal(false);
                  openInviteModal(currentWorker);
                }}
                aria-label={`Invite ${currentWorker.firstName} to job`}
              >
                Invite to Job
              </button>
              <button 
                className="btn secondary" 
                onClick={() => setShowWorkerModal(false)}
                aria-label="Close modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Contact Worker Modal */}
      {showContactModal && currentWorker && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Contact {currentWorker.firstName}</h2>
              <button className="modal-close" onClick={() => setShowContactModal(false)} aria-label="Close contact modal">×</button>
            </div>
            
            <div className="modal-body">
              <div className="contact-info-section">
                <div className="contact-header">
                  <div className="contact-avatar">
                    {currentWorker.profilePicture ? (
                      <img 
                        src={currentWorker.profilePicture} 
                        alt={`${currentWorker.firstName}'s profile`}
                        className="profile-image"
                      />
                    ) : (
                      currentWorker.firstName?.[0] || 'W'
                    )}
                  </div>
                  <div className="contact-details">
                    <h3>{currentWorker.firstName} {currentWorker.lastName}</h3>
                    {currentWorker.mobileNo && (
                      <p className="contact-number">
                        <span className="contact-icon">📱</span>
                        {currentWorker.mobileNo}
                      </p>
                    )}
                    <p className="contact-email">
                      <span className="contact-icon">📧</span>
                      {currentWorker.email}
                    </p>
                  </div>
                </div>
                
                <div className="contact-methods">
                  <div className="contact-method-header">
                    <h4>Contact Methods</h4>
                    <p>Choose how you'd like to reach out</p>
                  </div>
                  
                  <div className="contact-method-options">
                    {currentWorker.mobileNo && (
                      <a href={`tel:${currentWorker.mobileNo}`} className="contact-option call">
                        <div className="option-icon">📞</div>
                        <div className="option-label">Call</div>
                      </a>
                    )}
                    
                    {currentWorker.mobileNo && (
                      <a href={`sms:${currentWorker.mobileNo}`} className="contact-option sms">
                        <div className="option-icon">💬</div>
                        <div className="option-label">SMS</div>
                      </a>
                    )}
                    
                    <a href={`mailto:${currentWorker.email}`} className="contact-option email">
                      <div className="option-icon">📧</div>
                      <div className="option-label">Email</div>
                    </a>
                    
                    <div className="contact-option message" onClick={() => document.getElementById('message-input').focus()}>
                      <div className="option-icon">✉️</div>
                      <div className="option-label">Message</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="message-section">
                <h4>Send a Message</h4>
                <p className="message-info">Send a direct message to {currentWorker.firstName} through the platform</p>
                
                <div className="message-form">
                  <textarea 
                    id="message-input"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={`Hello ${currentWorker.firstName}, I'm interested in discussing a job opportunity with you...`}
                    rows="5"
                    className="message-textarea"
                  ></textarea>
                  
                  <div className="message-actions">
                    <button 
                      className="btn primary"
                      onClick={sendMessage}
                      disabled={!contactMessage.trim()}
                      aria-label={`Send message to ${currentWorker.firstName}`}
                    >
                      {loading ? (
                        <span className="spinner-inline"></span>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn secondary" 
                onClick={() => setShowContactModal(false)}
                aria-label="Close contact modal"
              >
                Close
              </button>
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
                    currentWorker.firstName?.[0] || 'W'
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
                      <span className="info-text">Workers are more likely to apply to jobs they've been invited to</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">⏱️</span>
                      <span className="info-text">Fill your positions faster by reaching out to skilled workers</span>
                    </div>
                  </div>
                  <div className="no-jobs-actions">
                    <Link to="/post-job" className="btn accent">Post a New Job</Link>
                    <button 
                      className="btn secondary"
                      onClick={() => setShowInviteModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn primary"
                disabled={
                  !selectedJobForInvite || 
                  (selectedJobForInvite && myJobs.find(job => job._id === selectedJobForInvite)?.isOpen === false)
                } 
                onClick={() => sendJobInvitation(selectedJobForInvite)}
                aria-label={`Send job invitation to ${currentWorker.firstName}`}
              >
                {loading ? (
                  <span className="spinner-inline"></span>
                ) : (
                  'Send Invitation'
                )}
              </button>
              <button 
                className="btn secondary" 
                onClick={() => setShowInviteModal(false)}
                aria-label="Cancel invitation"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployerDashboard
