import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import apiService from '../api'

function Home() {
  const [popularJobs, setPopularJobs] = useState([])
  const [topRatedUsers, setTopRatedUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [jobsResponse, usersResponse] = await Promise.all([
        apiService.getPopularJobs().catch(() => ({ jobs: [] })),
        // You may need to create an endpoint for top rated users
        Promise.resolve({ users: [] })
      ])
      
      setPopularJobs(jobsResponse.jobs || [])
      setTopRatedUsers(usersResponse.users || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchJobs = () => {
    navigate('/search-jobs')
  }

  const handlePostJob = () => {
    if (isAuthenticated) {
      navigate('/post-job')
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="home-container fade-in">
      <section className="hero">
        <div className="hero-content">
          <h2>Maligayang pagdating sa ResiLinked</h2>
          <p>Dito ay makakakita ka ng trabaho batay sa inyong mga kakayahan!</p>
          <div className="button-row">
            <button onClick={handleSearchJobs} className="btn">
              🔍 Maghanap ng Trabaho
            </button>
            {isAuthenticated ? (
              <button onClick={handlePostJob} className="btn">
                ➕ Mag-Post ng Trabaho
              </button>
            ) : (
              <Link to="/login" className="btn">
                👤 Mag-Login para Mag-Post
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="how-section-container">
          <h2>Paano gumagana ang ResiLinked</h2>
          <div className="how-steps">
            <div>
              <span>1</span>
              Mag-Sign-in at Gumawa ng Profile
            </div>
            <div>
              <span>2</span>
              Maghanap ng Trabaho o Kandidato
            </div>
            <div>
              <span>3</span>
              Mag-apply sa mga Trabaho
            </div>
            <div>
              <span>4</span>
              Ibigay ang Rating at Makipag-ugnayan
            </div>
          </div>
        </div>
      </section>

      <section className="jobs-section jobs-section-white">
        <div className="jobs-section-container jobs-section-container-white">
          <h2 className="jobs-section-title-white">Sikat na Trabaho</h2>
          <div className="jobs-list">
            {loading ? (
              <div className="no-data">📊 Loading popular jobs...</div>
            ) : popularJobs.length > 0 ? (
              popularJobs.map((job, index) => (
                <button
                  key={index}
                  className="job-card job-card-btn"
                  type="button"
                  tabIndex={0}
                  aria-label={`Tingnan ang mga trabaho para sa ${job.title || job.jobCategory}`}
                  onClick={() => navigate(`/search-jobs?title=${encodeURIComponent(job.title || job.jobCategory)}`)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/search-jobs?title=${encodeURIComponent(job.title || job.jobCategory)}`)
                    }
                  }}
                >
                  <div className="job-title">
                    {job.title || job.jobCategory}
                  </div>
                </button>
              ))
            ) : (
              <div className="no-data">
                📋 Walang available na trabaho ngayon
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <div className="testimonials-section-container">
          <h2>Mga Sabi ng mga Kliyente</h2>
          <div className="testimonials-list">
            {loading ? (
              <div className="no-data">📝 Loading testimonials...</div>
            ) : topRatedUsers.length > 0 ? (
              topRatedUsers.map((user, index) => (
                <div key={index} className="testimonial-card">
                  <div className="testimonial-stars">★★★★★</div>
                  <div className="testimonial-content">
                    "{user.testimonial || 'Napakagandang serbisyo!'}"
                  </div>
                  <div className="testimonial-footer">
                    <div className="testimonial-avatar">
                      {user.firstName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="testimonial-name">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="testimonial-role">
                        {user.userType || 'Service Provider'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                💬 Walang testimonials pa ngayon
              </div>
            )}
          </div>
        </div>
      </section>

  <style>{`
        .home-container {
          width: 100%;
          margin: 0;
          padding: 0;
        }
        
        /* Modern Hero Section */
        .hero {
          position: relative;
          background: linear-gradient(135deg, var(--primary-600) 0%, var(--secondary-600) 100%);
          color: white;
          padding: var(--spacing-20) 0;
          text-align: center;
          overflow: hidden;
          min-height: 60vh;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        
        .hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('/Informal.jpg') center/cover no-repeat;
          opacity: 0.15;
          z-index: 0;
        }
        
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
          margin: 0 auto;
          padding: 0 var(--spacing-8);
        }
        
        .hero h2 {
          font-size: var(--font-size-5xl);
          font-weight: 800;
          margin-bottom: var(--spacing-6);
          line-height: 1.1;
          background: linear-gradient(135deg, #ffffff, #e0f2fe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none;
        }
        
        .hero p {
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-8);
          opacity: 1;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          color: #ffffff;
          background: rgba(0, 0, 0, 0.1);
          padding: var(--spacing-3) var(--spacing-6);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .button-row {
          display: flex;
          gap: var(--spacing-4);
          justify-content: center;
          flex-wrap: wrap;
          margin-top: var(--spacing-8);
        }
        
        .btn, .hero button {
          background: linear-gradient(135deg, #a78bfa, #7c3aed);
          color: #fff;
          border: none;
          padding: var(--spacing-4) var(--spacing-8);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-lg);
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-2);
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-md);
          min-width: 180px;
          justify-content: center;
          margin: 0;
        }
        
        .btn:hover, .hero button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          background: linear-gradient(135deg, #7c3aed, #a78bfa);
          color: #fff;
        }
        
        /* Modern How Section */
        .how-section {
          background: var(--gray-50);
          padding: var(--spacing-20) 0;
          text-align: center;
          width: 100%;
        }
        
        .how-section-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 var(--spacing-8);
        }
        
        .how-section h2 {
          font-size: var(--font-size-4xl);
          font-weight: 700;
          color: var(--gray-800);
          margin-bottom: var(--spacing-16);
          text-align: center;
        }
        
        .how-steps {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          gap: var(--spacing-4);
          flex-wrap: nowrap;
          overflow-x: auto;
        }
        
        .how-steps div {
          background: white;
          border-radius: var(--radius-2xl);
          padding: var(--spacing-6);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--gray-100);
          transition: all var(--transition-normal);
          position: relative;
          overflow: hidden;
          flex: 1;
          min-width: 200px;
        }
        
        .how-steps div::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
        }
        
        .how-steps div:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-2xl);
        }
        
        .how-steps span {
          display: block;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, var(--primary-500), var(--secondary-500));
          color: white;
          border-radius: var(--radius-full);
          font-size: var(--font-size-2xl);
          font-weight: 700;
          margin: 0 auto var(--spacing-4);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
        }
        
        .how-steps div {
          color: var(--gray-700);
          font-size: var(--font-size-lg);
          font-weight: 500;
          line-height: 1.6;
        }
        
        /* Modern Jobs Section */
        .jobs-section {
          background: #fff;
          padding: var(--spacing-20) 0;
          text-align: center;
          width: 100%;
        }
        
        .jobs-section-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--spacing-8);
        }
        
        .jobs-section h2 {
          font-size: var(--font-size-4xl);
          font-weight: 700;
          color: var(--gray-800);
          margin-bottom: var(--spacing-16);
        }
        
        .jobs-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--spacing-6);
          margin: 0 auto var(--spacing-8);
        }
        
        .jobs-section-white {
          background: #fff;
        }
        .jobs-section-container-white {
          background: #fff;
          border-radius: var(--radius-2xl);
          box-shadow: 0 2px 12px rgba(80, 0, 120, 0.04);
          padding: var(--spacing-12) var(--spacing-8);
        }
        .jobs-section-title-white {
          background: #fff;
          color: #5b21b6;
          font-weight: 700;
          padding-bottom: var(--spacing-4);
        }
        .job-card {
          background: #fff;
          border-radius: var(--radius-2xl);
          padding: var(--spacing-6);
          text-align: center;
          box-shadow: var(--shadow-md);
          border: 2px solid #ede9fe;
          transition: all var(--transition-normal);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          outline: none;
          color: #5b21b6;
          font-size: var(--font-size-lg);
          font-weight: 600;
        }
        .job-card-btn {
          border: none;
          background: #fff;
          width: 100%;
          display: block;
          color: #5b21b6;
          font-weight: 600;
        }
        .job-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #a78bfa 0%, #818cf8 100%);
          transform: scaleX(0);
          transition: transform var(--transition-normal);
          border-top-left-radius: var(--radius-2xl);
          border-top-right-radius: var(--radius-2xl);
        }
        .job-card:hover, .job-card-btn:hover {
          /* Only the top effect changes, background stays white */
          box-shadow: var(--shadow-xl);
          background: #fff;
          border-color: #a78bfa;
          color: #ffffffff;
        }
        .job-card:hover::before, .job-card-btn:hover::before {
          transform: scaleX(1);
        }
        .job-card-btn:focus {
          outline: 2px solid #a78bfa;
          outline-offset: 2px;
          box-shadow: 0 0 0 3px #ddd6fe;
        }
        
        /* Modern Testimonials Section */
        .testimonials-section {
          background: var(--gray-50);
          padding: var(--spacing-20) 0;
          text-align: center;
          width: 100%;
        }
        
        .testimonials-section-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--spacing-8);
        }
        
        .testimonials-section h2 {
          font-size: var(--font-size-4xl);
          font-weight: 700;
          color: var(--gray-800);
          margin-bottom: var(--spacing-16);
        }
        
        .testimonials-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--spacing-8);
        }
        
        .testimonial-card {
          background: white;
          border-radius: var(--radius-2xl);
          padding: var(--spacing-8);
          text-align: left;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--gray-100);
          transition: all var(--transition-normal);
          border-left: 4px solid var(--primary-500);
        }
        
        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }
        
        .testimonial-stars {
          color: var(--warning-500);
          font-size: var(--font-size-xl);
          margin-bottom: var(--spacing-4);
        }
        
        .testimonial-content {
          color: var(--gray-700);
          margin-bottom: var(--spacing-6);
          font-size: var(--font-size-base);
          font-style: italic;
          line-height: 1.6;
        }
        
        .testimonial-footer {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
        }
        
        .testimonial-avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--success-500), var(--success-600));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
          font-size: var(--font-size-lg);
        }
        
        .testimonial-name {
          font-weight: 600;
          color: var(--gray-800);
          font-size: var(--font-size-base);
        }
        
        .testimonial-role {
          color: var(--gray-500);
          font-size: var(--font-size-sm);
        }
        
        .no-data {
          grid-column: 1 / -1;
          padding: var(--spacing-16);
          color: var(--gray-500);
          font-style: italic;
          text-align: center;
          background: var(--gray-100);
          border-radius: var(--radius-xl);
          border: 2px dashed var(--gray-300);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .hero {
            padding: var(--spacing-16) 0;
            min-height: 50vh;
          }
          
          .hero-content {
            padding: 0 var(--spacing-4);
          }
          
          .how-section-container,
          .jobs-section-container,
          .testimonials-section-container {
            padding: 0 var(--spacing-4);
          }
          
          .hero h2 {
            font-size: var(--font-size-3xl);
          }
          
          .hero p {
            font-size: var(--font-size-lg);
          }
          
          .button-row {
            flex-direction: column;
            align-items: center;
          }
          
          .btn, .hero button {
            width: 100%;
            max-width: 300px;
          }
          
          .how-section,
          .jobs-section,
          .testimonials-section {
            padding: var(--spacing-12) 0;
          }
          
          .how-section h2,
          .jobs-section h2,
          .testimonials-section h2 {
            font-size: var(--font-size-2xl);
            margin-bottom: var(--spacing-8);
          }
          
          .how-steps {
            grid-template-columns: 1fr;
          }
          
          .jobs-list {
            grid-template-columns: 1fr;
          }
          
          .testimonials-list {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .how-steps {
            overflow-x: auto;
            padding-bottom: var(--spacing-4);
            scroll-snap-type: x mandatory;
            scroll-behavior: smooth;
          }
          
          .how-steps div {
            scroll-snap-align: start;
            min-width: 80%;
          }
        }
        
        @media (max-width: 480px) {
          .hero {
            padding: var(--spacing-12) 0;
          }
          
          .hero-content {
            padding: 0 var(--spacing-2);
          }
          
          .how-section-container,
          .jobs-section-container,
          .testimonials-section-container {
            padding: 0 var(--spacing-2);
          }
          
          .hero h2 {
            font-size: var(--font-size-2xl);
          }
          
          .hero p {
            font-size: var(--font-size-base);
          }
          
          .how-section,
          .jobs-section,
          .testimonials-section {
            padding: var(--spacing-8) 0;
          }
        }
      `}</style>
    </div>
  )
}

export default Home
