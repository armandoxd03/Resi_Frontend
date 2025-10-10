import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import apiService from '../api'

function SearchWorkers() {
  const [workers, setWorkers] = useState([])
  const [searchParams, setSearchParams] = useState({
    search: '',
    skills: [],
    location: '',
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1
  })
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  const { user, hasAccessTo } = useContext(AuthContext)
  const { error: showError } = useContext(AlertContext)
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!hasAccessTo('employer')) {
      showError('Employer access required')
      navigate('/landing')
      return
    }
    
    // Initial search when component loads
    loadWorkers()
  }, [hasAccessTo, navigate, showError])
  
  const loadWorkers = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (searchParams.search) params.append('search', searchParams.search)
      if (searchParams.location) params.append('location', searchParams.location)
      if (searchParams.skills && searchParams.skills.length > 0) {
        searchParams.skills.forEach(skill => params.append('skills', skill))
      }
      params.append('page', searchParams.page)
      params.append('limit', searchParams.limit)
      
      console.log('Loading workers with params:', Object.fromEntries(params.entries()))
      
      const response = await apiService.getWorkers(Object.fromEntries(params.entries()))
      
      if (response && response.workers) {
        setWorkers(response.workers)
        if (response.pagination) {
          setPagination(response.pagination)
        }
        console.log('Workers loaded:', response.workers.length)
      } else {
        console.log('No workers found or invalid response')
        setWorkers([])
      }
    } catch (error) {
      console.error('Error loading workers:', error)
      showError('Failed to load available workers')
      setWorkers([]) // Graceful fallback
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="search-workers-container">
      <div className="page-header">
        <h1>Search Workers</h1>
        <Link to="/employer-dashboard" className="back-btn">Back to Dashboard</Link>
      </div>
      
      <div className="search-card">
        <h2>Find Available Workers</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          setSearchParams({...searchParams, page: 1});
          loadWorkers();
        }}>
          {/* Search Bar and Filter Button Row */}
          <div className="search-controls">
            <div className="search-input-wrapper">
              <i className="search-icon">🔍</i>
              <input
                id="worker-search" 
                type="text"
                name="search"
                value={searchParams.search}
                onChange={(e) => setSearchParams({...searchParams, search: e.target.value})}
                placeholder="Search by name, skills, or qualifications..."
                className="search-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setSearchParams({...searchParams, page: 1});
                    loadWorkers();
                  }
                }}
              />
              {searchParams.search && (
                <button 
                  type="button"
                  className="clear-search-btn"
                  onClick={() => {
                    setSearchParams({...searchParams, search: ''});
                    setTimeout(() => loadWorkers(), 0);
                  }}
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="action-buttons">
              <button type="submit" className="quick-search-btn" disabled={loading}>
                {loading ? <div className="spinner"></div> : 'Search'}
              </button>
              
              <button 
                type="button"
                className={`toggle-filters-button ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="filter-icon">⚙️</i>
                {showFilters ? 'Hide Filters' : 'Filters'}
                <span className="filter-indicator">{showFilters ? '▲' : '▼'}</span>
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="filter-section">
              <div className="filter-main-section">
                <div className="filter-row">
                  <div className="filter-group">
                    <label htmlFor="worker-location">
                      <i className="filter-icon">📍</i>
                      Location
                    </label>
                    <select 
                      id="worker-location"
                      value={searchParams.location}
                      onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
                      className="filter-select"
                    >
                      <option value="">Any Location</option>
                      <option value="San Miguel">San Miguel</option>
                      <option value="Poblacion">Poblacion</option>
                      <option value="San Isidro">San Isidro</option>
                      <option value="Santo Niño">Santo Niño</option>
                      <option value="Santa Cruz">Santa Cruz</option>
                    </select>
                  </div>
                </div>
                
                <div className="filter-divider">
                  <span>Skills</span>
                </div>
                
                <div className="skills-badge-container">
                  {['Plumbing', 'Carpentry', 'Cleaning', 'Electrical', 'Painting', 'Driving', 
                    'Gardening', 'Cooking', 'Babysitting', 'Tutoring', 'IT Support', 'Customer Service'].map(skill => (
                    <div 
                      key={skill} 
                      onClick={() => {
                        if (searchParams.skills.includes(skill)) {
                          setSearchParams({
                            ...searchParams, 
                            skills: searchParams.skills.filter(s => s !== skill)
                          })
                        } else {
                          setSearchParams({
                            ...searchParams, 
                            skills: [...searchParams.skills, skill]
                          })
                        }
                      }}
                      className={`skill-badge ${searchParams.skills.includes(skill) ? 'selected' : ''}`}
                    >
                      {skill}
                      {searchParams.skills.includes(skill) && (
                        <span className="badge-checkmark">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
                          
              <div className="filter-actions">
                <button 
                  type="submit" 
                  className="filter-button primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="spinner"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="filter-icon">🔍</i>
                      Apply Filters
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="filter-button secondary"
                  onClick={() => {
                    setSearchParams({
                      search: '',
                      skills: [],
                      location: '',
                      page: 1,
                      limit: 20
                    });
                    setTimeout(() => loadWorkers(), 0);
                  }}
                  disabled={loading}
                >
                  <i className="filter-icon">↺</i>
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      
      <div className="search-results">
        <div className="workers-grid">
          {workers.length > 0 ? (
            workers.map(worker => (
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
                  <div className="worker-rating">⭐ {worker.rating || '4.5'}</div>
                </div>
                
                <div className="worker-location">
                  <span className="icon">📍</span> {worker.barangay || 'Location not specified'}
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
          ) : loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Searching for workers...</p>
            </div>
          ) : (
            <div className="no-data">
              <p>No workers found matching your search criteria</p>
              <button 
                className="btn secondary" 
                onClick={() => {
                  setSearchParams({
                    search: '',
                    skills: [],
                    location: '',
                    page: 1,
                    limit: 20
                  });
                  setTimeout(() => loadWorkers(), 0);
                }}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Pagination */}
      {workers.length > 0 && pagination.pages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn" 
            disabled={pagination.page === 1}
            onClick={() => {
              setSearchParams({...searchParams, page: pagination.page - 1});
              setTimeout(() => loadWorkers(), 0);
            }}
          >
            &laquo; Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          <button 
            className="pagination-btn" 
            disabled={pagination.page === pagination.pages}
            onClick={() => {
              setSearchParams({...searchParams, page: pagination.page + 1});
              setTimeout(() => loadWorkers(), 0);
            }}
          >
            Next &raquo;
          </button>
        </div>
      )}
      
      <style>{`
        .search-workers-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .page-header {
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .page-header h1 {
          margin: 0;
          color: #2b6cb0;
          font-size: 2rem;
        }
        
        .back-btn {
          color: #666;
          text-decoration: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: background-color 0.2s;
          display: inline-block;
        }
        
        .back-btn:hover {
          background-color: #f7fafc;
        }
        
        .search-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 2rem;
          margin-bottom: 2.5rem;
          border: 1px solid #edf2f7;
        }
        
        .search-card h2 {
          margin: 0 0 1.5rem 0;
          color: #2b6cb0;
          font-size: 1.5rem;
          font-weight: 600;
          border-bottom: 1px solid #edf2f7;
          padding-bottom: 1rem;
          display: flex;
          align-items: center;
        }
        
        .search-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: stretch;
        }
        
        .search-input-wrapper {
          position: relative;
          flex: 1;
        }
        
        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #718096;
          font-style: normal;
          pointer-events: none;
        }
        
        .search-input {
          padding-left: 2.5rem;
          height: 100%;
          min-height: 3rem;
          font-size: 1rem;
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background-color: #f8fafc;
          transition: all 0.2s;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
          background-color: #fff;
        }
        
        .clear-search-btn {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #718096;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .clear-search-btn:hover {
          color: #e53e3e;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.75rem;
          align-items: stretch;
        }
        
        .quick-search-btn {
          background: #2b6cb0;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 1.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .quick-search-btn:hover:not(:disabled) {
          background: #2c5282;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(43, 108, 176, 0.2);
        }
        
        .quick-search-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .toggle-filters-button {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #4a5568;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 8px;
          padding: 0 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          gap: 0.5rem;
          white-space: nowrap;
        }
        
        .toggle-filters-button:hover {
          background-color: #edf2f7;
          border-color: #cbd5e0;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
        }
        
        .toggle-filters-button.active {
          background-color: #e6f0ff;
          border-color: #90cdf4;
          color: #2b6cb0;
        }
        
        .filter-section {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 1rem;
          animation: fadeIn 0.3s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) inset;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .filter-main-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .filter-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .filter-group label {
          font-weight: 600;
          color: #2d3748;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .filter-input,
        .filter-select {
          padding: 0.75rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          background-color: #f8fafc;
          color: #2d3748;
          height: 48px;
        }
        
        .filter-input:focus,
        .filter-select:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
          background-color: #fff;
        }
        
        .filter-divider {
          position: relative;
          text-align: center;
          margin: 1.5rem 0 1rem;
        }
        
        .filter-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background-color: #e2e8f0;
          z-index: 1;
        }
        
        .filter-divider span {
          background-color: #f8fafc;
          padding: 0 1rem;
          position: relative;
          z-index: 2;
          color: #4a5568;
          font-weight: 500;
          font-size: 0.9rem;
        }
        
        .filter-icon {
          font-style: normal;
          margin-right: 0.25rem;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .skills-badge-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        
        .skill-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #f7fafc;
          border: 1px solid #e2e8f0;
          color: #4a5568;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          user-select: none;
        }
        
        .skill-badge.selected {
          background-color: #ebf8ff;
          border-color: #4299e1;
          color: #2b6cb0;
        }
        
        .skill-badge:hover {
          border-color: #4299e1;
          transform: translateY(-1px);
        }
        
        .badge-checkmark {
          font-size: 0.8rem;
          background: #3182ce;
          color: white;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .filter-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 1rem;
        }
        
        .filter-button {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 160px;
          justify-content: center;
          border: none;
        }
        
        .filter-button.primary {
          background: #2b6cb0;
          color: white;
          box-shadow: 0 4px 6px rgba(43, 108, 176, 0.2);
        }
        
        .filter-button.primary:hover:not(:disabled) {
          background: #2c5282;
          transform: translateY(-2px);
          box-shadow: 0 6px 10px rgba(43, 108, 176, 0.25);
        }
        
        .filter-button.secondary {
          background: transparent;
          color: #2b6cb0;
          border: 1px solid #2b6cb0;
        }
        
        .filter-button.secondary:hover:not(:disabled) {
          background: #edf2f7;
          transform: translateY(-2px);
        }
        
        .filter-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .search-results {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          padding: 1.5rem;
        }
        
        .workers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .worker-card {
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .worker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .worker-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
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
        
        .worker-header h3 {
          margin: 0;
          color: #2b6cb0;
          font-size: 1.1rem;
        }
        
        .worker-rating {
          background: #ffc107;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-weight: bold;
          font-size: 0.9rem;
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
        
        .worker-info {
          margin-bottom: 1rem;
        }
        
        .worker-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .skill-tag {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
        }
        
        .worker-actions {
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
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Pagination Styles */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
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
          min-width: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
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
        
        @media (max-width: 768px) {
          .search-workers-container {
            padding: 1rem;
          }
          
          .search-controls {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .action-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
          }
          
          .quick-search-btn,
          .toggle-filters-button {
            padding: 0.75rem 1rem;
            min-width: 0;
          }
          
          .filter-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .filter-actions {
            flex-direction: column;
            width: 100%;
          }
          
          .filter-button {
            width: 100%;
          }
          
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .pagination {
            gap: 0.5rem;
          }
          
          .pagination-btn {
            padding: 0.4rem 0.8rem;
            min-width: 40px;
          }
          
          .pagination-info {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 480px) {
          .pagination {
            margin-top: 1.5rem;
          }
          
          .pagination-btn {
            padding: 0.3rem 0.6rem;
            font-size: 0.85rem;
          }
          
          .workers-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .worker-card {
            padding: 1rem;
          }
          
          .worker-name {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  )
}

export default SearchWorkers