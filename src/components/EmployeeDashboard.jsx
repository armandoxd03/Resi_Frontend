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
  const [jobMatches, setJobMatches] = useState([]);
  const [loading, setLoading] = useState({
    stats: false,
    applications: false,
    matches: false
  });
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
        const applications = await apiService.getMyApplications();
        setMyApplications(applications);
      } catch (error) {
        console.error('Error loading applications:', error);
        showError('Failed to load your job applications');
      } finally {
        setLoading(prev => ({ ...prev, applications: false }));
      }

      // Load job matches
      try {
        setLoading(prev => ({ ...prev, matches: true }));
        const matches = await apiService.getMyMatches();
        // Backend returns jobs directly in the response
        setJobMatches(Array.isArray(matches) ? matches : []);
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
      const applications = await apiService.getMyApplications();
      setMyApplications(applications);
    } catch (error) {
      showError(error.message || 'Failed to apply for job');
    }
  };

  const handleCancelApplication = async (jobId) => {
    try {
      await apiService.cancelApplication(jobId);
      showError('Application cancelled successfully!', 'success');
      // Refresh applications
      const applications = await apiService.getMyApplications();
      setMyApplications(applications);
    } catch (error) {
      showError(error.message || 'Failed to cancel application');
    }
  };

  const getApplicationStatus = (application) => {
    if (!application) return 'Not Applied';
    if (application.status === 'accepted') return 'Accepted';
    if (application.status === 'rejected') return 'Rejected';
    return 'Pending';
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
          <h2>My Applications</h2>
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
                      <span className={`status ${getApplicationStatus(job.applicants.find(a => a.user === user?.userId)).toLowerCase()}`}>
                        {getApplicationStatus(job.applicants.find(a => a.user === user?.userId))}
                      </span>
                    </div>
                  </div>
                  {job.isOpen && job.applicants.find(a => a.user === user?.userId)?.status === 'pending' && (
                    <div className="job-actions">
                      <button 
                        onClick={() => handleCancelApplication(job._id)}
                        className="btn danger"
                      >
                        Cancel Application
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-data">
                <p>No applications yet</p>
                <Link to="/search-jobs" className="btn primary">Browse Available Jobs</Link>
              </div>
            )}
          </div>
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
                  <div className="job-meta">
                    <div className="meta-item">
                      <span className="icon">📍</span>
                      {job.barangay}
                    </div>
                    <div className="meta-item">
                      <span className="icon">👥</span>
                      Posted by: {job.postedBy?.firstName} {job.postedBy?.lastName}
                    </div>
                    {job.skillsRequired && (
                      <div className="skills-list">
                        {job.skillsRequired.map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {job.isOpen && !myApplications.some(app => app._id === job._id) && (
                    <div className="job-actions">
                      <button 
                        onClick={() => handleApplyToJob(job._id)}
                        className="btn primary"
                      >
                        Apply Now
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-data">
                <p>No job matches found</p>
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

        .dashboard-section h2 {
          color: #2b6cb0;
          margin: 0 0 1.5rem 0;
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

        .skills-list {
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
