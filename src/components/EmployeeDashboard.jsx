import { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import apiService from '../api';

function EmployeeDashboard() {
  const [stats, setStats] = useState({
    applicationsCount: 0,
    offersCount: 0,
    viewsCount: 0,
    rating: 0
  });
  const [myApplications, setMyApplications] = useState([]);
  const [applicationHistory, setApplicationHistory] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [loading, setLoading] = useState({
    stats: false,
    applications: false,
    matches: false
  });
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { error: showError } = useContext(AlertContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    
    const loadEmployeeData = async () => {
      const token = localStorage.getItem('token');
      const userId = user?.userId;
      
      if (!token || !userId) {
        showError('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      // Load dashboard stats
      try {
        setLoading(prev => ({ ...prev, stats: true }));
        if (apiService.getEmployeeDashboardStats) {
          const statsResponse = await apiService.getEmployeeDashboardStats(userId);
          setStats({
            applicationsCount: statsResponse.applications || 0,
            offersCount: statsResponse.jobOffers || 0,
            viewsCount: statsResponse.profileViews || 0,
            rating: statsResponse.averageRating || 0
          });
        } else {
          const response = await apiService.getProfile('me');
          if (response.user) {
            setStats({
              applicationsCount: response.user.applicationCount || 0,
              offersCount: response.user.offersCount || 0,
              viewsCount: response.user.profileViews || 0,
              rating: 0
            });
            try {
              const ratingsResponse = await apiService.getUserRatings(response.user?._id);
              if (ratingsResponse.averageRating) {
                setStats(prev => ({
                  ...prev,
                  rating: ratingsResponse.averageRating
                }));
              }
            } catch (ratingError) {
              console.error('Error loading ratings:', ratingError);
            }
          }
        }
      } catch (error) {
        console.error('Error loading employee stats:', error);
        showError('Failed to load dashboard statistics');
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }

      // Load job applications
      try {
        setLoading(prev => ({ ...prev, applications: true }));
        const response = await apiService.getMyApplications();
        
        // Check for the new format with active applications and history
        if (response && response.activeApplications) {
          console.log('Received applications data:', response);
          setMyApplications(response.activeApplications || []);
          setApplicationHistory(response.applicationHistory || []);
        } else {
          // Backward compatibility for old response format
          console.log('Received old format applications data');
          setMyApplications(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error('Error loading applications:', error);
        showError('Failed to load your job applications');
      } finally {
        setLoading(prev => ({ ...prev, applications: false }));
      }

      // Load job matches
      try {
        setLoading(prev => ({ ...prev, matches: true }));
        const response = await apiService.getMyMatches();
        
        console.log('Job matches response:', response);
        
        // Handle various response formats
        if (response && response.jobs) {
          // New format returns { jobs: [...] }
          setJobMatches(Array.isArray(response.jobs) ? response.jobs : []);
          
          // Show message if user has no skills
          if (response.noSkills) {
            showError('Add skills to your profile to see job matches', 'info');
          }
        } else {
          // Backward compatibility for old API
          setJobMatches(Array.isArray(response) ? response : []);
        }
      } catch (error) {
        console.error('Error loading job matches:', error);
        showError('Failed to load job matches');
      } finally {
        setLoading(prev => ({ ...prev, matches: false }));
      }
    };

    loadEmployeeData();
  }, [authLoading, isAuthenticated, user, navigate, showError]);

  const handleApplyToJob = async (jobId) => {
    try {
      await apiService.applyToJob(jobId);
      showError('Application submitted successfully!', 'success');
      
      // Refresh applications
      const appResponse = await apiService.getMyApplications();
      if (appResponse && appResponse.activeApplications) {
        setMyApplications(appResponse.activeApplications || []);
        setApplicationHistory(appResponse.applicationHistory || []);
      } else {
        // Backward compatibility
        setMyApplications(Array.isArray(appResponse) ? appResponse : []);
      }
    } catch (error) {
      showError(error.message || 'Failed to apply for job');
    }
  };

  const handleCancelApplication = async (jobId) => {
    try {
      // Enhanced logging to debug the user ID and job ID being used
      console.log('Attempting to cancel application for job:', jobId);
      console.log('Current user ID:', user?.userId);
      
      // Get the job to verify the user has an application before attempting to cancel
      const job = myApplications.find(j => j._id === jobId);
      if (!job) {
        console.error('Job not found in myApplications list:', jobId);
        showError('Error: Job not found in your applications');
        return;
      }
      
      // Log application data for debugging
      console.log('Job applicants:', job.applicants);
      
      const userApplication = job.applicants.find(a => 
        a.user && (
          (typeof a.user === 'string' && a.user === user?.userId) || 
          (typeof a.user === 'object' && a.user.toString && a.user.toString() === user?.userId)
        )
      );
      
      console.log('Found user application:', userApplication);
      
      if (!userApplication) {
        showError('No application record found for this job. Try refreshing the page.');
        return;
      }
      
      const response = await apiService.cancelApplication(jobId);
      showError('Application cancelled successfully!', 'success');
      
      // Refresh applications
      const appResponse = await apiService.getMyApplications();
      if (appResponse && appResponse.activeApplications) {
        setMyApplications(appResponse.activeApplications || []);
        setApplicationHistory(appResponse.applicationHistory || []);
      } else {
        // Backward compatibility
        setMyApplications(Array.isArray(appResponse) ? appResponse : []);
      }
    } catch (error) {
      console.error('Cancel application error:', error);
      
      // Provide more specific error messages based on the error
      if (error.message === 'No application found') {
        showError('Application not found. It may have already been cancelled or processed.');
        
        // Refresh applications to make sure UI is up to date
        try {
          const appResponse = await apiService.getMyApplications();
          if (appResponse && appResponse.activeApplications) {
            setMyApplications(appResponse.activeApplications || []);
            setApplicationHistory(appResponse.applicationHistory || []);
          } else {
            // Backward compatibility
            setMyApplications(Array.isArray(appResponse) ? appResponse : []);
          }
        } catch (refreshError) {
          console.error('Failed to refresh applications after error:', refreshError);
        }
      } else {
        showError(error.message || 'Failed to cancel application');
      }
    }
  };

  const getApplicationStatus = (application) => {
    if (!application) return 'Not Applied';
    if (application.status === 'accepted') return 'Accepted';
    if (application.status === 'rejected') return 'Rejected';
    return 'Pending';
  };
  
  // Helper function to find user's application in a job
  const findUserApplication = (job) => {
    if (!job || !job.applicants || !user) return null;
    
    return job.applicants.find(a => 
      a.user && (
        (typeof a.user === 'string' && a.user === user.userId) || 
        (typeof a.user === 'object' && a.user.toString && a.user.toString() === user.userId)
      )
    );
  };

  if (loading.stats || loading.applications || loading.matches) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner large"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
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
          <div className="stat-icon">📄</div>
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

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/search-jobs" className="action-btn primary">
          <span className="icon">🔍</span>
          Search Jobs
        </Link>
        <Link to="/profile" className="action-btn secondary">
          <span className="icon">👤</span>
          Update Profile
        </Link>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* My Applications Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>My Applications</h2>
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                Active Applications
              </button>
              <button 
                className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                Application History
              </button>
            </div>
          </div>

          {activeTab === 'active' && (
            <div className="applications-grid">
              {myApplications.length > 0 ? (
                myApplications.map(job => (
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
                        <span className="icon">📅</span>
                        {new Date(job.datePosted).toLocaleDateString()}
                      </div>
                      <div className="meta-item">
                        <span className="status pending">Pending</span>
                      </div>
                    </div>
                    <div className="job-actions">
                      <button 
                        onClick={() => handleCancelApplication(job._id)}
                        className="btn danger"
                        data-job-id={job._id}
                      >
                        Cancel Application
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">
                  <p>No active applications</p>
                  <Link to="/search-jobs" className="btn primary">Browse Available Jobs</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="applications-grid">
              {applicationHistory.length > 0 ? (
                applicationHistory.map(job => (
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
                        <span className="icon">📅</span>
                        {new Date(job.datePosted).toLocaleDateString()}
                      </div>
                      <div className="meta-item">
                        <span className={`status ${job.applicationInfo?.status.toLowerCase() || 'unknown'}`}>
                          {job.applicationInfo?.status === 'accepted' ? 'Accepted' : 
                           job.applicationInfo?.status === 'rejected' ? 'Rejected' : 'Closed'}
                        </span>
                      </div>
                    </div>
                    {job.applicationInfo?.assignedToMe && (
                      <div className="job-actions">
                        <span className="assigned-badge">✓ Assigned to you</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-data">
                  <p>No application history yet</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Job Matches Section */}
        <section className="dashboard-section">
          <h2>Recommended Jobs</h2>
          <div className="jobs-grid">
            {jobMatches.length > 0 ? (
              jobMatches.map(job => (
                <div key={job._id} className="job-card">
                  <div className="job-header">
                    <h3>{job.title}</h3>
                    <div className="job-price">₱{job.price?.toLocaleString()}</div>
                  </div>
                  
                  {/* Match Score Indicator */}
                  {job.matchScore && (
                    <div className="match-score-container">
                      <div className="match-score">
                        <span className="match-label">Match</span>
                        <span className="match-percentage">
                          {Math.min(100, Math.round(job.matchScore / 10 * 20))}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="job-meta">
                    <div className="meta-item">
                      <span className="icon">📍</span>
                      {job.barangay}
                      {job.barangay === user?.barangay && (
                        <span className="location-match">Your area</span>
                      )}
                    </div>
                    <div className="meta-item">
                      <span className="icon">�</span>
                      {new Date(job.datePosted).toLocaleDateString()}
                    </div>
                    <div className="meta-item">
                      <span className="icon">�👥</span>
                      Posted by: {job.postedBy?.firstName} {job.postedBy?.lastName}
                    </div>
                    
                    {/* Matching Skills Section */}
                    {job.matchingSkills && job.matchingSkills.length > 0 && (
                      <div className="matching-skills-container">
                        <div className="matching-skills-label">
                          <span className="icon">✓</span> Your matching skills ({job.matchingSkills.length}):
                        </div>
                        <div className="matching-skills-list">
                          {job.matchingSkills.map((skill, index) => (
                            <span key={index} className="skill-tag matching">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* All Required Skills Section */}
                    {job.skillsRequired && job.skillsRequired.length > 0 && (
                      <div className="skills-container">
                        <div className="skills-label">All required skills ({job.skillsRequired.length}):</div>
                        <div className="skills-list">
                          {job.skillsRequired.map((skill, index) => {
                            const isMatching = job.matchingSkills && job.matchingSkills.includes(skill);
                            return (
                              <span 
                                key={index} 
                                className={`skill-tag ${isMatching ? 'matching' : 'non-matching'}`}
                              >
                                {skill}{isMatching && ' ✓'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {job.description && (
                      <div className="job-description">
                        <p>{job.description.length > 100 
                          ? `${job.description.substring(0, 100)}...` 
                          : job.description}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="job-actions">
                    {job.isOpen && !myApplications.some(app => app._id === job._id) ? (
                      <button 
                        onClick={() => handleApplyToJob(job._id)}
                        className="btn primary"
                      >
                        Apply Now
                      </button>
                    ) : (
                      myApplications.some(app => app._id === job._id) && (
                        <span className="applied-badge">Already Applied</span>
                      )
                    )}
                    <Link to={`/jobs/${job._id}`} className="btn secondary">View Details</Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <p>No job matches found for your skills</p>
                <Link to="/profile" className="btn secondary">Update Your Skills</Link>
                <Link to="/search-jobs" className="btn primary">Browse All Jobs</Link>
              </div>
            )}
          </div>
        </section>
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

        .dashboard-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .dashboard-section .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .dashboard-section h2 {
          color: #2b6cb0;
          margin: 0;
        }
        
        .tab-navigation {
          display: flex;
          gap: 0.5rem;
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
        
        .assigned-badge {
          display: inline-block;
          background: #48bb78;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .applications-grid,
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .job-card {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .job-card:hover {
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

        .skills-container, .matching-skills-container {
          margin-top: 0.8rem;
        }
        
        .skills-label, .matching-skills-label {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.4rem;
          color: #2d3748;
        }
        
        .matching-skills-label {
          color: #38a169;
        }
        
        .skills-list, .matching-skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.3rem;
        }

        .skill-tag {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }
        
        .skill-tag.matching {
          background: #c6f6d5;
          color: #2f855a;
          border: 1px solid #9ae6b4;
          font-weight: 500;
        }
        
        .skill-tag.non-matching {
          background: #edf2f7;
          color: #718096;
        }
        
        .match-score-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 0.5rem;
        }
        
        .match-score {
          display: flex;
          align-items: center;
          background: #ebf8ff;
          border-radius: 15px;
          padding: 0.3rem 0.8rem;
          border: 1px solid #90cdf4;
        }
        
        .match-label {
          color: #2b6cb0;
          font-size: 0.8rem;
          font-weight: 500;
          margin-right: 0.3rem;
        }
        
        .match-percentage {
          color: #2b6cb0;
          font-size: 0.9rem;
          font-weight: 700;
        }
        
        .location-match {
          background: #e6fffa;
          color: #2c7a7b;
          border-radius: 10px;
          padding: 0.1rem 0.4rem;
          margin-left: 0.5rem;
          font-size: 0.7rem;
          font-weight: 500;
          border: 1px solid #81e6d9;
        }
        
        .job-description {
          margin-top: 0.8rem;
          color: #4a5568;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .applied-badge {
          display: inline-block;
          background: #fed7aa;
          color: #c05621;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid #ed8936;
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

        .job-actions {
          margin-top: 1rem;
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

        .btn.danger {
          background: #e53e3e;
          color: white;
        }

        .btn.danger:hover {
          background: #c53030;
        }

        .loading-state {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid transparent;
          border-top: 4px solid #2b6cb0;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .no-data {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .no-data p {
          margin-bottom: 1rem;
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

          .applications-grid,
          .jobs-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default EmployeeDashboard;
