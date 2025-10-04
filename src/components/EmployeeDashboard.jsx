import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { error: showError } = useContext(AlertContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    const loadEmployeeStats = async () => {
      try {
        const userId = user?.userId;
        const token = localStorage.getItem('token');
        if (!token || !userId) {
          showError('Session expired. Please login again.');
          navigate('/login');
          return;
        }
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
      }
    };
    loadEmployeeStats();
  }, [authLoading, isAuthenticated, user, navigate, showError]);

  return (
    <div className="dashboard-container">
      <h1>Employee Dashboard</h1>
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
      {/* Additional dashboard content can go here */}
    </div>
  );
}

export default EmployeeDashboard;
