import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import apiService from '../api'

function Landing() {
  const [recentJobs, setRecentJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const jobsResponse = await apiService.getPopularJobs().catch(() => ({ jobs: [] }))
      setRecentJobs(jobsResponse.jobs || [])
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDashboardLink = () => {
    if (user?.userType === 'admin') return '/admin-dashboard'
    if (user?.userType === 'employer') return '/employer-dashboard'
    return '/employee-dashboard'
  }

  return (
    <div className="landing-page">
      {/* Welcome Section */}
      <section className="welcome-section">
        <h1>Welcome, {user?.firstName || 'User'}!</h1>
        <p className="welcome-message">
          {user?.userType === 'employer' ? 
            'Find workers for your projects' : 
            'Find work opportunities near you'
          }
        </p>
        
        {/* Main Actions */}
        <div className="main-actions">
          <Link to="/search-jobs" className="action-button primary">
            {user?.userType === 'employer' ? 'Find Workers' : 'Find Jobs'}
          </Link>
          <Link to={getDashboardLink()} className="action-button secondary">
            My Dashboard
          </Link>
        </div>
      </section>

      {/* Recent Jobs */}
      <section className="jobs-section">
        <h2>Recent Job Opportunities</h2>
        {loading ? (
          <p className="loading-text">Loading jobs...</p>
        ) : recentJobs.length > 0 ? (
          <div className="jobs-grid">
            {recentJobs.slice(0, 6).map((job, index) => (
              <Link
                key={job._id || index}
                className="job-card job-card-link"
                to={job._id ? `/search-jobs?highlight=${job._id}` : '/search-jobs'}
                title="View job details"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <h3>{job.title}</h3>
                <p>{job.barangay || 'Location not specified'}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="no-jobs">No jobs available right now</p>
        )}
      </section>

      <style>{`
        .landing-page {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--spacing-6);
          font-family: var(--font-family-primary);
          min-height: calc(100vh - var(--header-height) - 200px);
        }

        .welcome-section {
          text-align: center;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.9) 0%, 
            rgba(168, 85, 247, 0.05) 50%, 
            rgba(255, 255, 255, 0.8) 100%);
          padding: var(--spacing-16) var(--spacing-8);
          border-radius: var(--radius-2xl);
          margin-bottom: var(--spacing-12);
          box-shadow: 0 16px 48px rgba(147, 51, 234, 0.1);
          border: 1px solid rgba(147, 51, 234, 0.1);
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
        }

        .welcome-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at 30% 20%, 
            rgba(168, 85, 247, 0.1) 0%, 
            transparent 50%
          );
          pointer-events: none;
        }

        .welcome-section h1 {
          font-size: var(--font-size-4xl);
          background: linear-gradient(135deg, var(--primary-700) 0%, var(--primary-500) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--spacing-6);
          font-weight: 800;
          letter-spacing: -0.02em;
          position: relative;
          z-index: 1;
        }

        .welcome-message {
          font-size: var(--font-size-xl);
          color: var(--gray-600);
          margin-bottom: var(--spacing-10);
          line-height: 1.6;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          z-index: 1;
        }

        .main-actions {
          display: flex;
          gap: var(--spacing-6);
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        .action-button {
          padding: var(--spacing-4) var(--spacing-8);
          border-radius: var(--radius-xl);
          text-decoration: none;
          font-weight: 600;
          font-size: var(--font-size-lg);
          transition: all var(--transition-normal);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 200px;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .action-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left var(--transition-slow);
        }

        .action-button:hover::before {
          left: 100%;
        }

        .action-button.primary {
          background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
          color: white;
          box-shadow: 0 8px 24px rgba(147, 51, 234, 0.3);
        }

        .action-button.primary:hover {
          background: linear-gradient(135deg, var(--primary-700) 0%, var(--primary-800) 100%);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(147, 51, 234, 0.4);
        }

        .action-button.secondary {
          background: rgba(255, 255, 255, 0.9);
          color: var(--primary-700);
          border: 2px solid var(--primary-300);
          backdrop-filter: blur(10px);
        }

        .action-button.secondary:hover {
          background: var(--primary-600);
          color: white;
          border-color: var(--primary-600);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(147, 51, 234, 0.3);
        }

        .jobs-section {
          margin-bottom: var(--spacing-12);
        }

        .jobs-section h2 {
          font-size: var(--font-size-3xl);
          background: linear-gradient(135deg, var(--primary-700) 0%, var(--primary-500) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--spacing-8);
          text-align: center;
          font-weight: 700;
        }

        .loading-text, .no-jobs {
          text-align: center;
          color: var(--gray-500);
          font-size: var(--font-size-lg);
          padding: var(--spacing-16);
          background: rgba(255, 255, 255, 0.8);
          border-radius: var(--radius-xl);
          border: 1px solid var(--primary-200);
          backdrop-filter: blur(10px);
        }

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--spacing-6);
          margin-bottom: var(--spacing-8);
        }

        .job-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid var(--primary-200);
          border-radius: var(--radius-xl);
          padding: var(--spacing-6);
          transition: all var(--transition-normal);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .job-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
        }

        .job-card:hover {
          box-shadow: 0 16px 48px rgba(147, 51, 234, 0.15);
          transform: translateY(-4px);
          border-color: var(--primary-300);
        }

        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--spacing-4);
          margin-top: var(--spacing-4);
        }

        .job-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(120, 72, 255, 0.08);
          padding: var(--spacing-4);
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
          cursor: pointer;
          border: 2px solid transparent;
        }

        .job-card-link:hover, .job-card-link:focus {
          box-shadow: 0 4px 24px rgba(120, 72, 255, 0.18);
          border-color: #a084fa;
          transform: translateY(-2px) scale(1.02);
          text-decoration: none;
        }
          
          .welcome-section h1 {
            font-size: var(--font-size-3xl);
          }
          
          .welcome-message {
            font-size: var(--font-size-lg);
          }
          
          .main-actions {
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-4);
          }
          
          .action-button {
            width: 100%;
            max-width: 320px;
          }
          
          .jobs-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .welcome-section h1 {
            font-size: var(--font-size-2xl);
          }
          
          .welcome-message {
            font-size: var(--font-size-base);
          }
          
          .action-button {
            font-size: var(--font-size-base);
            padding: var(--spacing-3) var(--spacing-6);
          }
        }
      `}</style>
    </div>
  )
}

export default Landing
