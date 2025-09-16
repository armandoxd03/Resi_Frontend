import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'

function JobsManagement() {
  const navigate = useNavigate()
  const { user, token } = useContext(AuthContext)
  const { showAlert } = useContext(AlertContext)
  
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({})
  const [selectedJob, setSelectedJob] = useState(null)
  const [editingJob, setEditingJob] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const limit = 10

  useEffect(() => {
    // Check if user is admin
    if (!user || user.userType !== 'admin') {
      showAlert('Admin access required', 'error')
      navigate('/landing')
      return
    }

    loadJobs()
  }, [user, navigate, showAlert, currentPage])

  const loadJobs = async (page = currentPage) => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })

  const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/jobs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load jobs')
      }

      const data = await response.json()
      setJobs(data.jobs || [])
      setPagination(data.pagination || {})
      setCurrentPage(page)
    } catch (error) {
      console.error('Error loading jobs:', error)
      showAlert('Failed to load jobs', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters }
    if (value) {
      newFilters[key] = value
    } else {
      delete newFilters[key]
    }
    setFilters(newFilters)
  }

  const applyFilters = () => {
    setCurrentPage(1)
    loadJobs(1)
  }

  const clearFilters = () => {
    setFilters({})
    setCurrentPage(1)
    setTimeout(() => loadJobs(1), 0)
  }

  const viewJob = (jobId) => {
    const job = jobs.find(j => j._id === jobId)
    setSelectedJob(job)
  }

  const editJob = (jobId) => {
    const job = jobs.find(j => j._id === jobId)
    setEditingJob({ ...job })
    setShowEditModal(true)
  }

  const closeJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to close this job?')) return

    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs/${jobId}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to close job')
      }

      showAlert('Job closed successfully', 'success')
      loadJobs()
    } catch (error) {
      console.error('Error closing job:', error)
      showAlert('Failed to close job', 'error')
    }
  }

  const deleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return

    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete job')
      }

      showAlert('Job deleted successfully', 'success')
      loadJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
      showAlert('Failed to delete job', 'error')
    }
  }

  const saveJobEdit = async (e) => {
    e.preventDefault()
    
    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/jobs/${editingJob._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editingJob.title,
          description: editingJob.description,
          price: editingJob.price,
          barangay: editingJob.barangay,
          status: editingJob.status
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update job')
      }

      showAlert('Job updated successfully', 'success')
      setShowEditModal(false)
      setEditingJob(null)
      loadJobs()
    } catch (error) {
      console.error('Error updating job:', error)
      showAlert('Failed to update job', 'error')
    }
  }

  const exportJobs = async () => {
    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/export/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export jobs')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `jobs_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      showAlert('Jobs exported successfully', 'success')
    } catch (error) {
      console.error('Error exporting jobs:', error)
      showAlert('Failed to export jobs', 'error')
    }
  }

  const renderPagination = () => {
    if (!pagination.pages || pagination.pages <= 1) return null

    const pages = []
    const startPage = Math.max(1, pagination.page - 2)
    const endPage = Math.min(pagination.pages, pagination.page + 2)

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return (
      <div className="pagination">
        <button 
          className={`page-btn ${pagination.page === 1 ? 'disabled' : ''}`}
          disabled={pagination.page === 1}
          onClick={() => loadJobs(pagination.page - 1)}
        >
          Previous
        </button>
        
        {startPage > 1 && (
          <>
            <button className="page-btn" onClick={() => loadJobs(1)}>1</button>
            {startPage > 2 && <span className="page-ellipsis">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <button
            key={page}
            className={`page-btn ${page === pagination.page ? 'active' : ''}`}
            onClick={() => loadJobs(page)}
          >
            {page}
          </button>
        ))}
        
        {endPage < pagination.pages && (
          <>
            {endPage < pagination.pages - 1 && <span className="page-ellipsis">...</span>}
            <button className="page-btn" onClick={() => loadJobs(pagination.pages)}>
              {pagination.pages}
            </button>
          </>
        )}
        
        <button 
          className={`page-btn ${pagination.page === pagination.pages ? 'disabled' : ''}`}
          disabled={pagination.page === pagination.pages}
          onClick={() => loadJobs(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1>
          <i className="fas fa-briefcase"></i>
          Jobs Management
        </h1>
        <Link to="/admin-dashboard" className="back-btn">
          <i className="fas fa-arrow-left"></i>
          Back to Admin Dashboard
        </Link>
      </header>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-controls">
          <input
            type="text"
            placeholder="Search jobs..."
            value={filters.q || ''}
            onChange={(e) => handleFilterChange('q', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
          />
          <button className="btn primary" onClick={applyFilters}>
            <i className="fas fa-search"></i>
            Search
          </button>
        </div>

        <div className="filter-controls">
          <select 
            value={filters.status || ''} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select 
            value={filters.barangay || ''} 
            onChange={(e) => handleFilterChange('barangay', e.target.value)}
          >
            <option value="">All Locations</option>
            <option value="Bagumbayan">Bagumbayan</option>
            <option value="Bambang">Bambang</option>
            <option value="Calzada">Calzada</option>
            <option value="Hagonoy">Hagonoy</option>
            <option value="Ibayo-Tipas">Ibayo-Tipas</option>
            <option value="Ligid-Tipas">Ligid-Tipas</option>
            <option value="Lower Bicutan">Lower Bicutan</option>
            <option value="New Lower Bicutan">New Lower Bicutan</option>
            <option value="Napindan">Napindan</option>
            <option value="Palingon">Palingon</option>
            <option value="San Miguel">San Miguel</option>
            <option value="Santa Ana">Santa Ana</option>
            <option value="Tuktukan">Tuktukan</option>
            <option value="Ususan">Ususan</option>
            <option value="Wawa">Wawa</option>
          </select>

          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
          />

          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
          />

          <select 
            value={`${filters.sortBy || 'datePosted'}-${filters.order || 'desc'}`}
            onChange={(e) => {
              const [sortBy, order] = e.target.value.split('-')
              handleFilterChange('sortBy', sortBy)
              handleFilterChange('order', order)
            }}
          >
            <option value="datePosted-desc">Newest First</option>
            <option value="datePosted-asc">Oldest First</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="title-asc">Title: A-Z</option>
            <option value="title-desc">Title: Z-A</option>
          </select>

          <button className="btn secondary" onClick={clearFilters}>
            Clear Filters
          </button>

          <button className="btn success" onClick={exportJobs}>
            <i className="fas fa-download"></i>
            Export CSV
          </button>
        </div>
      </div>

      {/* Results Info */}
      {pagination.total > 0 && (
        <div className="results-info">
          Showing {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} jobs
        </div>
      )}

      {/* Jobs Table */}
      <div className="jobs-container">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="no-data">
            <i className="fas fa-briefcase"></i>
            <p>No jobs found matching your criteria.</p>
          </div>
        ) : (
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Job Details</th>
                <th>Posted By</th>
                <th>Price</th>
                <th>Location</th>
                <th>Status</th>
                <th>Applicants</th>
                <th>Date Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job._id}>
                  <td>
                    <div className="job-title">{job.title || 'Untitled Job'}</div>
                    <div className="job-description">
                      {job.description ? `${job.description.substring(0, 50)}...` : 'No description'}
                    </div>
                  </td>
                  <td>
                    <div className="posted-by">
                      {job.postedBy ? `${job.postedBy.firstName || ''} ${job.postedBy.lastName || ''}`.trim() || 'Unknown' : 'Unknown'}
                    </div>
                    <div className="posted-by-email">
                      {job.postedBy?.email || ''}
                    </div>
                  </td>
                  <td>
                    <span className="price">₱{job.price ? job.price.toLocaleString() : '0'}</span>
                  </td>
                  <td>{job.barangay || 'N/A'}</td>
                  <td>
                    <span className={`job-status status-${(job.status || 'open').toLowerCase()}`}>
                      {capitalizeFirst(job.status || 'open')}
                    </span>
                  </td>
                  <td>
                    <span className="applicants-count">
                      {job.applicants ? job.applicants.length : 0} applicants
                    </span>
                  </td>
                  <td>{formatDate(job.datePosted || job.createdAt)}</td>
                  <td className="actions">
                    <button className="action-btn view-btn" onClick={() => viewJob(job._id)}>
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="action-btn edit-btn" onClick={() => editJob(job._id)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    {(job.status || 'open') === 'open' && (
                      <button className="action-btn close-btn" onClick={() => closeJob(job._id)}>
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                    <button className="action-btn delete-btn" onClick={() => deleteJob(job._id)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Job View Modal */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Job Details</h3>
              <button className="modal-close" onClick={() => setSelectedJob(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="job-detail">
                <h4>{selectedJob.title}</h4>
                <p className="job-description">{selectedJob.description}</p>
                <div className="job-meta">
                  <p><strong>Price:</strong> ₱{selectedJob.price?.toLocaleString()}</p>
                  <p><strong>Location:</strong> {selectedJob.barangay}</p>
                  <p><strong>Status:</strong> {capitalizeFirst(selectedJob.status || 'open')}</p>
                  <p><strong>Posted By:</strong> {selectedJob.postedBy ? `${selectedJob.postedBy.firstName} ${selectedJob.postedBy.lastName}` : 'Unknown'}</p>
                  <p><strong>Date Posted:</strong> {formatDate(selectedJob.datePosted || selectedJob.createdAt)}</p>
                  <p><strong>Applicants:</strong> {selectedJob.applicants?.length || 0}</p>
                </div>
                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div className="skills-section">
                    <strong>Required Skills:</strong>
                    <div className="skills-list">
                      {selectedJob.skills.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Edit Modal */}
      {showEditModal && editingJob && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Job</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveJobEdit}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={editingJob.title || ''}
                    onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={editingJob.description || ''}
                    onChange={(e) => setEditingJob({...editingJob, description: e.target.value})}
                    rows="4"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price</label>
                    <input
                      type="number"
                      value={editingJob.price || ''}
                      onChange={(e) => setEditingJob({...editingJob, price: Number(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={editingJob.status || 'open'}
                      onChange={(e) => setEditingJob({...editingJob, status: e.target.value})}
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

  <style>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          min-height: 100vh;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .page-header h1 {
          color: #2b6cb0;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f8f9fa;
          color: #2b6cb0;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #e9ecef;
        }

        .filters-section {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .search-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .search-controls input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
        }

        .filter-controls {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .filter-controls select,
        .filter-controls input {
          padding: 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn.primary {
          background: #2b6cb0;
          color: white;
        }

        .btn.primary:hover {
          background: #2c5aa0;
        }

        .btn.secondary {
          background: #6c757d;
          color: white;
        }

        .btn.secondary:hover {
          background: #5a6268;
        }

        .btn.success {
          background: #38a169;
          color: white;
        }

        .btn.success:hover {
          background: #2f855a;
        }

        .results-info {
          color: #666;
          margin-bottom: 1rem;
          font-size: 0.9rem;
        }

        .jobs-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .loading {
          text-align: center;
          padding: 3rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2b6cb0;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .no-data {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .no-data i {
          font-size: 3rem;
          color: #e2e8f0;
          margin-bottom: 1rem;
        }

        .jobs-table {
          width: 100%;
          border-collapse: collapse;
        }

        .jobs-table th,
        .jobs-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .jobs-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #2d3748;
        }

        .job-title {
          font-weight: 600;
          color: #2b6cb0;
          margin-bottom: 0.25rem;
        }

        .job-description {
          color: #666;
          font-size: 0.9rem;
        }

        .posted-by {
          font-weight: 500;
        }

        .posted-by-email {
          color: #666;
          font-size: 0.8rem;
        }

        .price {
          font-weight: 700;
          color: #38a169;
        }

        .job-status {
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-open {
          background: #e6fffa;
          color: #00695c;
        }

        .status-closed {
          background: #fed7d7;
          color: #c53030;
        }

        .status-completed {
          background: #d1ecf1;
          color: #0c5460;
        }

        .status-cancelled {
          background: #feebc8;
          color: #c05621;
        }

        .applicants-count {
          color: #666;
          font-size: 0.9rem;
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .view-btn {
          background: #e3f2fd;
          color: #1976d2;
        }

        .view-btn:hover {
          background: #bbdefb;
        }

        .edit-btn {
          background: #fff3e0;
          color: #f57c00;
        }

        .edit-btn:hover {
          background: #ffe0b2;
        }

        .close-btn {
          background: #fce4ec;
          color: #c2185b;
        }

        .close-btn:hover {
          background: #f8bbd9;
        }

        .delete-btn {
          background: #ffebee;
          color: #d32f2f;
        }

        .delete-btn:hover {
          background: #ffcdd2;
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
        }

        .page-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #e2e8f0;
          background: white;
          color: #2d3748;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-btn:hover:not(.disabled) {
          background: #f8f9fa;
        }

        .page-btn.active {
          background: #2b6cb0;
          color: white;
          border-color: #2b6cb0;
        }

        .page-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-ellipsis {
          padding: 0.5rem;
          color: #666;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h3 {
          margin: 0;
          color: #2b6cb0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .modal-close:hover {
          background: #f7fafc;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .job-detail h4 {
          color: #2b6cb0;
          margin: 0 0 1rem 0;
        }

        .job-description {
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .job-meta p {
          margin: 0.5rem 0;
        }

        .skills-section {
          margin-top: 1.5rem;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .skill-tag {
          background: #9c27b0;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #4a5568;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .search-controls,
          .filter-controls {
            flex-direction: column;
          }

          .jobs-table {
            font-size: 0.8rem;
          }

          .jobs-table th,
          .jobs-table td {
            padding: 0.5rem;
          }

          .actions {
            flex-direction: column;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default JobsManagement
