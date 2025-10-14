import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'
import apiService from '../api'
import GoalManagement from './GoalManagement'
import { getProfilePictureUrl } from '../utils/imageHelper'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [recommendedWorkers, setRecommendedWorkers] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showJobModal, setShowJobModal] = useState(false)
  const [applyingToJob, setApplyingToJob] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [showWorkerModal, setShowWorkerModal] = useState(false)
  const [myJobs, setMyJobs] = useState([])
  const [invitingWorker, setInvitingWorker] = useState(false)
  const [inviteStatus, setInviteStatus] = useState(null)
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    gender: '',
    userType: '',
    email: '',
    mobileNo: '',
    address: '',
    barangay: '',
    skills: []
  })
  // Goals state removed - now using GoalManagement component
  const [uploading, setUploading] = useState(false)
  
  const { user, updateUser, verifyToken } = useAuth()
  const { success, error: showError } = useAlert()

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    if (profile?._id) {
      loadRatings()
      
      // Load recommendations based on user type
      if (profile.userType === 'employee' || profile.userType === 'both') {
        loadRecommendedJobs()
      }
      
      if (profile.userType === 'employer' || profile.userType === 'both') {
        loadRecommendedWorkers()
      }
    }
  }, [profile?._id])

  const loadRecommendedJobs = async () => {
    try {
      setLoadingJobs(true)
      
      // Use the job matching engine API endpoint
      const matchesResponse = await apiService.getMyMatches()
      console.log('Recommended jobs data:', matchesResponse)
      
      // Get user applications to check which jobs the user has already applied to
      let applications = []
      try {
        const applicationsResponse = await apiService.getMyApplications()
        console.log('User applications:', applicationsResponse)
        
        if (applicationsResponse.activeApplications) {
          applications = applicationsResponse.activeApplications
        } else if (Array.isArray(applicationsResponse)) {
          applications = applicationsResponse
        }
      } catch (appErr) {
        console.error('Error fetching user applications:', appErr)
      }
      
      // Mark jobs that the user has already applied to
      const jobsWithApplicationStatus = (matchesResponse.jobs || []).map(job => {
        const hasApplied = applications.some(app => app._id === job._id)
        return {
          ...job,
          alreadyApplied: hasApplied
        }
      })
      
      // Limit to 3 jobs
      const limitedJobs = jobsWithApplicationStatus.slice(0, 3)
      
      setRecommendedJobs(limitedJobs)
    } catch (err) {
      console.error('Failed to load recommended jobs:', err)
    } finally {
      setLoadingJobs(false)
    }
  }
  
  const handleJobClick = (job) => {
    setSelectedJob(job)
    setShowJobModal(true)
    setApplicationStatus(null) // Reset application status
  }
  
  const handleCloseJobModal = () => {
    setShowJobModal(false)
    setSelectedJob(null)
    setApplicationStatus(null)
    setApplyingToJob(false)
  }
  
  const handleApplyToJob = async (jobId) => {
    if (!profile || applyingToJob) return
    
    try {
      setApplyingToJob(true)
      const response = await apiService.applyToJob(jobId)
      console.log('Job application response:', response)
      
      // Show success message
      setApplicationStatus({
        success: true,
        message: response.alert || 'Application submitted successfully!'
      })
      
      // Update the local jobs list to reflect the application
      setRecommendedJobs(jobs => jobs.map(job => 
        job._id === jobId 
          ? {...job, alreadyApplied: true} 
          : job
      ))
      
      success('Application submitted successfully!')
    } catch (err) {
      console.error('Error applying to job:', err)
      setApplicationStatus({
        success: false,
        message: err.message || 'Failed to apply to this job. Please try again.'
      })
      
      showError(err.message || 'Failed to apply to this job')
    } finally {
      setApplyingToJob(false)
    }
  }
  
  const handleWorkerClick = async (worker) => {
    setSelectedWorker(worker)
    setShowWorkerModal(true)
    setInviteStatus(null) // Reset invite status
    
    // Load worker's ratings for the modal
    try {
      const ratingsResponse = await apiService.getUserRatings(worker._id);
      if (ratingsResponse && ratingsResponse.ratings) {
        // Update worker with detailed ratings data
        setSelectedWorker(prevWorker => ({
          ...prevWorker,
          detailedRatings: ratingsResponse.ratings.slice(0, 3), // Get first 3 ratings for display
          rating: ratingsResponse.stats?.averageRating || 
                (ratingsResponse.ratings.length > 0 
                  ? ratingsResponse.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsResponse.ratings.length
                  : 0)
        }));
      }
    } catch (err) {
      console.error("Failed to load worker's ratings:", err);
    }
  }
  
  const handleCloseWorkerModal = () => {
    setShowWorkerModal(false)
    setSelectedWorker(null)
    setInviteStatus(null)
    setInvitingWorker(false)
  }
  
  const handleInviteWorker = async (workerId, jobId) => {
    if (!profile || invitingWorker) return
    
    try {
      setInvitingWorker(true)
      const response = await apiService.inviteWorker(jobId, workerId)
      console.log('Worker invitation response:', response)
      
      // Show success message
      setInviteStatus({
        success: true,
        message: response.alert || 'Invitation sent successfully!'
      })
      
      success('Worker invited successfully!')
    } catch (err) {
      console.error('Error inviting worker:', err)
      setInviteStatus({
        success: false,
        message: err.message || 'Failed to invite this worker. Please try again.'
      })
      
      showError(err.message || 'Failed to invite worker')
    } finally {
      setInvitingWorker(false)
    }
  }
  
  const loadRecommendedWorkers = async () => {
    try {
      setLoadingWorkers(true)
      
      // First try to get top-rated workers
      const topRatedResponse = await apiService.getTopRated()
      console.log('Top-rated workers data:', topRatedResponse)
      
      // The API returns workers directly in the response
      let workers = Array.isArray(topRatedResponse) ? topRatedResponse : []
      
      // If no top-rated workers found, fall back to regular worker recommendations
      if (workers.length === 0) {
        console.log('No top-rated workers found, fetching regular workers instead')
        try {
          // Get regular workers as a fallback, limit to 3
          const regularWorkersResponse = await apiService.getWorkers({ limit: 3 })
          console.log('Regular workers data:', regularWorkersResponse)
          
          // The backend returns users in the 'users' property
          if (regularWorkersResponse.users && regularWorkersResponse.users.length > 0) {
            workers = regularWorkersResponse.users
          }
        } catch (fallbackErr) {
          console.error('Failed to load fallback regular workers:', fallbackErr)
        }
      }
      
      if (workers.length === 0) {
        console.log('No workers found from either source')
        setRecommendedWorkers([])
        return
      }
      
      console.log('Processing workers data:', workers)
      
      // Limit to 3 workers
      workers = workers.slice(0, 3)
      
      // Get ratings for each worker, similar to how EmployerDashboard does it
      const workersWithRatings = await Promise.all(
        workers.map(async (worker) => {
          try {
            const ratingsResponse = await apiService.getUserRatings(worker._id);
            const avgRating = ratingsResponse.stats?.averageRating || 
                             (ratingsResponse.ratings && ratingsResponse.ratings.length > 0 
                              ? ratingsResponse.ratings.reduce((sum, r) => sum + r.rating, 0) / ratingsResponse.ratings.length
                              : 0);
            
            return {
              ...worker,
              rating: parseFloat(avgRating) || 0,
              ratingCount: ratingsResponse.ratings ? ratingsResponse.ratings.length : 0,
              isTopRated: Boolean(worker.averageRating)
            };
          } catch (err) {
            console.log(`Could not fetch ratings for worker ${worker._id}:`, err);
            return {
              ...worker,
              rating: worker.averageRating || 0,
              ratingCount: 0,
              isTopRated: Boolean(worker.averageRating)
            };
          }
        })
      );
      
      console.log('Workers with ratings:', workersWithRatings);
      setRecommendedWorkers(workersWithRatings);
      
      // If user is an employer or both, load their jobs for invitations
      if (profile.userType === 'employer' || profile.userType === 'both') {
        try {
          const jobsResponse = await apiService.getMyJobs();
          console.log('User jobs for invitations:', jobsResponse);
          
          // Filter to only open jobs
          const openJobs = Array.isArray(jobsResponse) 
            ? jobsResponse.filter(job => job.isOpen === true)
            : [];
          
          setMyJobs(openJobs);
        } catch (jobsErr) {
          console.error('Failed to load user jobs:', jobsErr);
        }
      }
    } catch (err) {
      console.error('Failed to load workers:', err)
      
      // If the top-rated API call fails entirely, try to get regular workers
      try {
        console.log('Top-rated API failed, trying to get regular workers')
        const regularResponse = await apiService.getWorkers({ limit: 3 })
        console.log('Regular workers response:', regularResponse);
        
        // The backend returns users in the 'users' property
        const regularWorkers = regularResponse.users || []
        
        if (regularWorkers.length > 0) {
          // Process workers with ratings
          const workersWithRatings = await Promise.all(
            regularWorkers.map(async (worker) => {
              try {
                const ratingsResponse = await apiService.getUserRatings(worker._id);
                return {
                  ...worker,
                  rating: parseFloat(ratingsResponse.stats?.averageRating) || 0,
                  ratingCount: ratingsResponse.ratings ? ratingsResponse.ratings.length : 0,
                  isTopRated: false
                };
              } catch (err) {
                return {
                  ...worker,
                  rating: 0,
                  ratingCount: 0,
                  isTopRated: false
                };
              }
            })
          );
          
          setRecommendedWorkers(workersWithRatings);
        } else {
          setRecommendedWorkers([]);
        }
      } catch (fallbackErr) {
        console.error('Also failed to get regular workers:', fallbackErr);
        setRecommendedWorkers([]);
      }
    } finally {
      setLoadingWorkers(false)
    }
  }

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Use the correct API call for your backend
      const data = await apiService.getProfile('me');
      setProfile(data.user);
      setEditFormData({
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        bio: data.user.bio || '',
        gender: data.user.gender || '',
        userType: data.user.userType || 'employee',
        email: data.user.email || '',
        mobileNo: data.user.mobileNo || '',
        address: data.user.address || '',
        barangay: data.user.barangay || '',
        skills: data.user.skills || []
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile load error:', err);
    } finally {
      setLoading(false)
    }
  }

  const loadRatings = async () => {
    try {
      if (!profile?._id) return
      const ratingsResponse = await apiService.getUserRatings(profile._id)
      setRatings(ratingsResponse.ratings || [])
    } catch (err) {
      console.error('Failed to load ratings:', err)
    }
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      // Verify token first to prevent 401 errors
      await verifyToken()
      
      const formData = new FormData()
      formData.append('profilePicture', file)
      
      // Add required user info to formData
      formData.append('firstName', profile.firstName)
      formData.append('lastName', profile.lastName)
      formData.append('email', profile.email)
      
      const response = await apiService.updateProfileWithFile(formData)
      
      if (response.user) {
        setProfile(response.user)
        updateUser(response.user)
        success('Profile picture updated successfully!')
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      
      // More specific error messages
      if (error.message.includes('Authentication') || error.message.includes('Session')) {
        showError('Authentication issue. Please try logging in again.')
      } else if (error.message.includes('Network')) {
        showError('Network error. Please check your connection.')
      } else {
        showError('Failed to upload profile picture. Please try again.')
      }
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleEditProfile = () => {
    setEditFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      bio: profile?.bio || '',
      gender: profile?.gender || '',
      userType: profile?.userType || 'employee',
      email: profile?.email || '',
      mobileNo: profile?.mobileNo || '',
      address: profile?.address || '',
      barangay: profile?.barangay || '',
      skills: profile?.skills || []
    })
    setShowEditModal(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSkillToggle = (skill) => {
    setEditFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }
  
  // Dedicated function for removing a skill
  const removeSkill = (skillToRemove) => {
    setEditFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    
    try {
      // Verify token first to prevent 401 errors
      await verifyToken()
      
      const updates = { ...editFormData }
      
      console.log('Sending profile updates:', updates)
      
      const response = await apiService.updateProfile(updates)
      
      if (response.user) {
        console.log('Profile update successful:', response.user)
        setProfile(response.user)
        updateUser(response.user)
        setShowEditModal(false)
        success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      
      // More specific error messages
      if (error.message.includes('Authentication') || error.message.includes('Session')) {
        showError('Authentication issue. Please try logging in again.')
      } else {
        showError('Failed to update profile. Please try again.')
      }
    }
  }
  
  // Goal management logic moved to GoalManagement component

  if (loading) {
    return (
      <div className="container">
        <div className="loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
          <div className="spinner" style={{ width: 48, height: 48, border: '6px solid #eee', borderTop: '6px solid #9333ea', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }}></div>
          <div>Loading profile...</div>
        </div>
        <style>{`
        /* Edit Profile Modal Modern Styles */
        .modal-content {
          background: #fff;
          border-radius: 12px;
          padding: 2rem;
          width: 90%;
          max-width: 600px;
          max-height: 85vh;
          overflow-y: auto;
          margin: 0 auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }
        .modal-header h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2b6cb0;
          margin: 0;
        }
        .close-btn {
          background: #f1f5f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 1.5rem;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .close-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
          transform: rotate(90deg);
        }
        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .profile-picture-section {
          text-align: center !important;
          margin-bottom: 1.5rem !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0 !important;
          width: 100% !important;
        }

        .profile-picture-section > label {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 1rem;
          font-size: 0.95rem;
          text-align: center;
        }
        
        .profile-picture-upload {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          margin-bottom: 0 !important;
          width: 100% !important;
        }
        
        .current-picture {
          width: 150px !important;
          height: 150px !important;
          min-width: 150px !important;
          min-height: 150px !important;
          max-width: 150px !important;
          max-height: 150px !important;
          border-radius: 50% !important;
          overflow: hidden !important;
          border: 4px solid #e2e8f0 !important;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto !important;
        }
        
        .current-picture img,
        .profile-picture-section .current-picture img,
        .edit-form .current-picture img {
          width: 100% !important;
          height: 100% !important;
          min-width: 100% !important;
          min-height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: cover !important;
          display: block !important;
          border-radius: 0 !important;
        }
        
        .avatar-placeholder-md {
          width: 150px !important;
          height: 150px !important;
          border-radius: 50% !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 3rem;
          font-weight: bold;
          color: white;
        }
        
        .upload-controls {
          display: flex !important;
          flex-direction: column !important;
          gap: 0.5rem;
          align-items: center !important;
          width: 100%;
          margin-top: 1rem !important;
        }
        
        .upload-btn {
          padding: 0.7rem 1.5rem !important;
          background: #2b6cb0 !important;
          color: white !important;
          border-radius: 8px !important;
          cursor: pointer !important;
          font-weight: 600 !important;
          font-size: 0.95rem !important;
          transition: background 0.2s !important;
          border: none !important;
          display: inline-block !important;
        }
        
        .upload-btn:hover {
          background: #2c5282;
        }
        
        .upload-hint {
          color: #718096;
          font-size: 0.85rem;
        }
        
        .edit-form .form-row {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .edit-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          margin-bottom: 0;
        }
        .edit-form label {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.25rem;
          font-size: 0.95rem;
        }
        .edit-form input,
        .edit-form select,
        .edit-form textarea {
          padding: 0.75rem;
          border-radius: 6px;
          border: 2px solid #e2e8f0;
          font-size: 1rem;
          background: #fff;
          color: #2d3748;
          transition: border-color 0.2s;
        }
        .edit-form input:focus,
        .edit-form select:focus,
        .edit-form textarea:focus {
          outline: none;
          border-color: #2b6cb0;
        }
        .edit-form textarea {
          resize: vertical;
        }
        .form-helper-text {
          color: #64748b;
          font-size: 0.9rem;
          margin-top: 0.5rem;
          font-style: italic;
        }
        .skills-section {
          margin-top: 0.5rem;
        }
        .skills-input-container {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .skills-input-container input {
          flex: 1;
          padding: 0.65rem 1rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        .skills-input-container input:focus {
          outline: none;
          border-color: #6366f1;
        }
        .add-skill-btn {
          padding: 0.65rem 1.25rem;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.9rem;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .add-skill-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
        .common-skills {
          margin-bottom: 1.25rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        .common-skills label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .common-skills-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .common-skill-option {
          background: white;
          border: 1.5px solid #e2e8f0;
          color: #475569;
          padding: 0.45rem 0.85rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .common-skill-option:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .common-skill-option.selected {
          background: #6366f1;
          border-color: #6366f1;
          color: white;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 1rem;
          padding: 1.25rem;
          background: #ffffff;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          min-height: 60px;
        }
        .skill-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 0.5rem 0.85rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.2);
          transition: all 0.2s ease;
        }
        .skill-tag:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .remove-skill {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          padding: 0;
          margin-left: 0.25rem;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: all 0.2s ease;
        }
        .remove-skill:hover {
          background: rgba(255, 255, 255, 0.35);
          transform: scale(1.15);
        }
        .skills-checkbox-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.8rem 1.5rem;
          margin-top: 1rem;
          width: 100%;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 1.01rem;
          font-weight: 500;
        }
        .checkbox-label input {
          display: none;
        }
        .checkmark {
          width: 18px;
          height: 18px;
          border: 2px solid #ddd;
          border-radius: 4px;
          position: relative;
        }
        .checkbox-label input:checked + .checkmark {
          background: #38a169;
          border-color: #38a169;
        }
        .checkbox-label input:checked + .checkmark:after {
          content: '✓';
          color: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 13px;
        }
        .modal-actions {
          display: flex;
          gap: 2rem;
          justify-content: flex-end;
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }
        .btn {
          padding: 0.5rem 1.2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }
        .btn-primary {
          background: #2b6cb0;
          color: #fff;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
        }
        .btn-primary:hover {
          background: #2c5282;
        }
        .btn-secondary {
          background: #e2e8f0;
          color: #2d3748;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: 500;
        }
        .btn-secondary:hover {
          background: #cbd5e1;
        }
        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            padding: 1.5rem;
          }
          .profile-picture-upload {
            flex-direction: column;
            gap: 1rem;
          }
          .upload-controls {
            align-items: center;
          }
          .edit-form .form-row {
            flex-direction: column;
            gap: 0.7rem;
          }
        }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-banner"></div>
      <div className="profile-main-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-lg">
            {profile?.profilePicture ? (
              <img src={getProfilePictureUrl(profile)} alt="Profile" />
            ) : (
              <div className="avatar-placeholder-lg">
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
              </div>
            )}
          </div>
          <div className="profile-name-section">
            <h1>{profile?.firstName} {profile?.lastName}</h1>
            <div className="profile-barangay">
              {profile?.barangay} <span className="verified-badge-lg">Barangay-Verified</span>
            </div>
            <div className="profile-user-type">
              {profile?.userType === 'both' ? 'Employee & Employer' : 
               profile?.userType === 'employee' ? 'Employee' : 
               profile?.userType === 'employer' ? 'Employer' : 'User'}
            </div>
          </div>
          <button className="edit-profile-btn" onClick={handleEditProfile}>Edit Profile</button>
        </div>

        <div className="profile-section">
          <h2>Skills and Services</h2>
          <div className="profile-skills">
            {profile?.skills && profile.skills.length > 0 ? (
              profile.skills.map((skill, idx) => (
                <span className="profile-skill-tag" key={idx}>{skill}</span>
              ))
            ) : <span className="profile-skill-tag">No skills listed</span>}
          </div>
        </div>

        <div className="profile-section">
          <h2>Description</h2>
          <div className="profile-bio">{profile?.bio || 'No description provided.'}</div>
        </div>

        {/* Show recommended jobs if the user is an employee or both */}
        {(profile?.userType === 'employee' || profile?.userType === 'both') && (
          <div className="profile-section">
            <div className="section-header-with-actions">
              <h2>Recommended Jobs</h2>
              <Link to="/search-jobs" className="view-more-btn">View More Jobs</Link>
            </div>
            <div className="profile-recommended-jobs">
              {loadingJobs ? (
                <div className="loading-jobs">Loading recommended jobs...</div>
              ) : recommendedJobs.length > 0 ? (
                recommendedJobs.map((job, index) => (
                  <div 
                    className="job-card" 
                    key={job._id || index} 
                    onClick={() => handleJobClick(job)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="job-title">{job.title}</div>
                    <div className="job-details">
                      <span className="job-price">₱{job.price}</span>
                      <span className="job-match">
                        {job.skillMatchPercentage ? 
                          `${Math.round(job.skillMatchPercentage)}% match` : 
                          'Suggested for you'}
                      </span>
                    </div>
                    {job.matchingSkills && job.matchingSkills.length > 0 && (
                      <div className="job-skills">
                        Skills: {job.matchingSkills.slice(0, 2).join(", ")}
                        {job.matchingSkills.length > 2 && "..."}
                      </div>
                    )}
                    <div className="job-location">
                      {job.locationMatch ? 
                        <span className="location-match">In your barangay</span> : 
                        job.barangay
                      }
                    </div>
                    <div className="job-card-overlay">
                      <div className="view-details-btn">
                        {job.alreadyApplied ? 'View Application' : 'View Details'}
                      </div>
                    </div>
                    {job.alreadyApplied && (
                      <div className="applied-badge">Applied</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-jobs-message">
                  {profile?.skills?.length ? 
                    "No recommended jobs found. Try updating your skills or check back later." : 
                    "Add skills to your profile to see job recommendations."}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Show recommended workers if the user is an employer or both */}
        {(profile?.userType === 'employer' || profile?.userType === 'both') && (
          <div className="profile-section">
            <div className="section-header-with-actions">
              <h2>
                {recommendedWorkers.some(worker => worker.isTopRated) 
                  ? "Top-Rated Workers" 
                  : "Recommended Workers"}
              </h2>
              <Link to="/search-workers" className="view-more-btn">View More Workers</Link>
            </div>
            <div className="profile-recommended-workers">
              {loadingWorkers ? (
                <div className="loading-workers">Loading workers...</div>
              ) : recommendedWorkers.length > 0 ? (
                recommendedWorkers.map((worker, index) => (
                  <div 
                    className="worker-card" 
                    key={worker._id || index}
                    onClick={() => handleWorkerClick(worker)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="worker-avatar">
                      {worker.profilePicture ? (
                        <img 
                          src={getProfilePictureUrl(worker)} 
                          alt={`${worker.firstName} ${worker.lastName}`} 
                        />
                      ) : (
                        <div className="worker-initials">
                          {worker.firstName?.[0]}{worker.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="worker-info">
                      <div className="worker-name">{worker.firstName} {worker.lastName}</div>
                      <div className="worker-barangay">{worker.barangay || 'Unknown barangay'}</div>
                      {worker.skills && worker.skills.length > 0 && (
                        <div className="worker-skills">
                          {worker.skills.slice(0, 2).join(", ")}
                          {worker.skills.length > 2 && "..."}
                        </div>
                      )}
                      <div className="worker-rating-row">
                        {(worker.rating > 0 || worker.averageRating > 0) ? (
                          <>
                            <div className="worker-rating">
                              ★ {typeof worker.rating === 'number' && worker.rating > 0 
                                  ? worker.rating.toFixed(1) 
                                  : worker.averageRating ? worker.averageRating.toFixed(1) : "N/A"}
                            </div>
                            {worker.ratingCount > 0 && (
                              <div className="worker-rating-count">
                                ({worker.ratingCount} ratings)
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="worker-no-rating">No ratings yet</div>
                        )}
                      </div>
                    </div>
                    {worker.isTopRated && (
                      <div className="top-rated-badge">
                        ★ Top Rated
                      </div>
                    )}
                    <div className="worker-card-overlay">
                      <div className="view-details-btn">
                        View Profile
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-workers-message">
                  No workers found at this time.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="profile-section">
          <GoalManagement />
        </div>

        <div className="profile-section">
          <h2>Contact Information</h2>
          <div className="profile-contact">
            <div>{profile?.email}</div>
            <div>{profile?.mobileNo}</div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Worker Rating</h2>
          <div className="profile-ratings-carousel">
            {ratings.length > 0 ? ratings.slice(0, 3).map((rating, idx) => (
              <div className="profile-rating-card" key={idx}>
                <div className="profile-rating-stars">{'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}</div>
                <div className="profile-rating-comment">{rating.comment || 'No comment provided'}</div>
                <div className="profile-rating-footer">
                  <span className="profile-rating-author">{rating.rater?.firstName || 'Anonymous'} {rating.rater?.lastName || ''}</span>
                  <span className="profile-rating-date">{new Date(rating.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )) : <div>No ratings yet.</div>}
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && ( 
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowEditModal(false)} className="close">×</button>
              <div className="modal-header">
                <h3>Edit Profile</h3>
              </div>
              <form onSubmit={handleSaveProfile} className="edit-form">
                {/* Profile Picture Upload */}
                <div className="form-group profile-picture-section">
                  <label>Profile Picture</label>
                  <div className="profile-picture-upload">
                    <div className="current-picture">
                      {profile?.profilePicture ? (
                        <img src={getProfilePictureUrl(profile)} alt="Current Profile" />
                      ) : (
                        <div className="avatar-placeholder-md">
                          {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="upload-controls">
                    <input
                      type="file"
                      id="profilePictureInputModal"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                    <label htmlFor="profilePictureInputModal" className="upload-btn">
                      {uploading ? 'Uploading...' : 'Change Photo'}
                    </label>
                    <small className="upload-hint">JPG, PNG or GIF (max 5MB)</small>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={editFormData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={editFormData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="3"
                    value={editFormData.bio}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="userType">Account Type</label>
                  <select
                    id="userType"
                    name="userType"
                    value={editFormData.userType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="employer">Employer</option>
                    <option value="both">Both</option>
                  </select>
                  <small className="form-helper-text">Choose your account type: Employee, Employer or Both</small>
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={editFormData.address}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="barangay">Barangay</label>
                    <input
                      type="text"
                      id="barangay"
                      name="barangay"
                      value={editFormData.barangay}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="mobileNo">Mobile Number</label>
                  <input
                    type="tel"
                    id="mobileNo"
                    name="mobileNo"
                    value={editFormData.mobileNo}
                    onChange={handleInputChange}
                  />
                </div>
                
                {/* Skills Section - Moved to Bottom */}
                <div className="form-group">
                  <label htmlFor="skills">Skills</label>
                  <div className="skills-section">
                    <div className="skills-input-container">
                      <input
                        type="text"
                        id="skillInput"
                        placeholder="Type a skill and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            e.preventDefault();
                            handleSkillToggle(e.target.value.trim());
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="add-skill-btn"
                        onClick={(e) => {
                          const input = document.getElementById('skillInput');
                          if (input.value.trim()) {
                            handleSkillToggle(input.value.trim());
                            input.value = '';
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="common-skills">
                      <label>Common Skills:</label>
                      <div className="common-skills-options">
                        {['Plumbing', 'Carpentry', 'Cleaning', 'Electrical', 'Painting', 'Gardening', 
                          'Cooking', 'Driving', 'Babysitting', 'Tutoring', 'IT Support', 'Customer Service'].map(skill => (
                          <button 
                            key={skill}
                            type="button" 
                            className={`common-skill-option ${editFormData.skills.includes(skill) ? 'selected' : ''}`}
                            onClick={() => !editFormData.skills.includes(skill) && handleSkillToggle(skill)}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <small className="form-helper-text">Add skills to showcase your expertise. Click on common skills or type your own.</small>
                  
                    {editFormData.skills.length > 0 && (
                      <div className="skills-container">
                        {editFormData.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                            <button
                              type="button"
                              className="remove-skill"
                              onClick={() => removeSkill(skill)}
                              title="Remove skill"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Job Details Modal */}
        {showJobModal && selectedJob && (
          <div className="modal-overlay" onClick={handleCloseJobModal}>
            <div className="modal-content job-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Job Details</h3>
                <button onClick={handleCloseJobModal} className="close-btn">×</button>
              </div>
              
              <div className="job-modal-details">
                <h4 className="job-modal-title">{selectedJob.title}</h4>
                
                <div className="job-modal-section">
                  <div className="job-modal-price">₱{selectedJob.price}</div>
                  <div className="job-modal-posted">
                    Posted {new Date(selectedJob.datePosted).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="job-modal-section">
                  <label>Description</label>
                  <p className="job-modal-description">
                    {selectedJob.description || "No description provided."}
                  </p>
                </div>
                
                <div className="job-modal-section">
                  <label>Location</label>
                  <div className="job-modal-location">
                    {selectedJob.barangay} {selectedJob.locationMatch && (
                      <span className="location-match-badge">In your area</span>
                    )}
                  </div>
                </div>
                
                {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 && (
                  <div className="job-modal-section">
                    <label>Skills Required</label>
                    <div className="job-modal-skills">
                      {selectedJob.skillsRequired.map((skill, idx) => (
                        <span key={idx} className={`job-modal-skill-tag ${
                          selectedJob.matchingSkills?.includes(skill) ? 'matching-skill' : ''
                        }`}>
                          {skill}
                          {selectedJob.matchingSkills?.includes(skill) && (
                            <span className="skill-match-icon">✓</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedJob.postedBy && (
                  <div className="job-modal-section">
                    <label>Posted By</label>
                    <div className="job-modal-employer">
                      {selectedJob.postedBy.firstName} {selectedJob.postedBy.lastName}
                    </div>
                  </div>
                )}
                
                {applicationStatus && (
                  <div className={`application-status ${applicationStatus.success ? 'success' : 'error'}`}>
                    {applicationStatus.message}
                  </div>
                )}
                
                <div className="job-modal-actions">
                  <button 
                    onClick={handleCloseJobModal} 
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                  
                  {profile?.userType !== 'employer' && (
                    selectedJob.alreadyApplied ? (
                      <button className="btn btn-disabled" disabled>
                        Already Applied
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleApplyToJob(selectedJob._id)} 
                        className="btn btn-primary"
                        disabled={applyingToJob}
                      >
                        {applyingToJob ? 'Applying...' : 'Apply Now'}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Worker Details Modal */}
        {showWorkerModal && selectedWorker && (
          <div className="modal-overlay" onClick={handleCloseWorkerModal}>
            <div className="modal-content worker-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Worker Profile</h3>
                <button onClick={handleCloseWorkerModal} className="close-btn">×</button>
              </div>
              
              <div className="worker-modal-details">
                <div className="worker-modal-header">
                  <div className="worker-modal-avatar">
                    {selectedWorker.profilePicture ? (
                      <img 
                        src={getProfilePictureUrl(selectedWorker)} 
                        alt={`${selectedWorker.firstName} ${selectedWorker.lastName}`} 
                      />
                    ) : (
                      <div className="worker-modal-initials">
                        {selectedWorker.firstName?.[0]}{selectedWorker.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="worker-modal-info">
                    <h4 className="worker-modal-name">
                      {selectedWorker.firstName} {selectedWorker.lastName}
                      {selectedWorker.isTopRated && (
                        <span className="worker-modal-badge">★ Top Rated</span>
                      )}
                    </h4>
                    <div className="worker-modal-barangay">{selectedWorker.barangay || 'Unknown barangay'}</div>
                    <div className="worker-modal-rating">
                      {(selectedWorker.rating > 0 || selectedWorker.averageRating > 0) ? (
                        <div className="rating-stars">
                          ★ {typeof selectedWorker.rating === 'number' && selectedWorker.rating > 0 
                              ? selectedWorker.rating.toFixed(1) 
                              : selectedWorker.averageRating ? selectedWorker.averageRating.toFixed(1) : "N/A"}
                          {selectedWorker.ratingCount > 0 && (
                            <span className="rating-count">
                              ({selectedWorker.ratingCount} ratings)
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="no-rating">No ratings yet</div>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedWorker.bio && (
                  <div className="worker-modal-section">
                    <label>About</label>
                    <p className="worker-modal-bio">
                      {selectedWorker.bio}
                    </p>
                  </div>
                )}
                
                {selectedWorker.skills && selectedWorker.skills.length > 0 && (
                  <div className="worker-modal-section">
                    <label>Skills</label>
                    <div className="worker-modal-skills">
                      {selectedWorker.skills.map((skill, idx) => (
                        <span key={idx} className="worker-modal-skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Display recent ratings if available */}
                {selectedWorker.detailedRatings && selectedWorker.detailedRatings.length > 0 && (
                  <div className="worker-modal-section">
                    <label>Recent Ratings</label>
                    <div className="worker-modal-ratings">
                      {selectedWorker.detailedRatings.map((rating, idx) => (
                        <div key={idx} className="worker-modal-rating-card">
                          <div className="worker-modal-rating-stars">
                            {'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}
                          </div>
                          <div className="worker-modal-rating-comment">
                            {rating.comment || "No comment provided."}
                          </div>
                          <div className="worker-modal-rating-footer">
                            <span className="worker-modal-rating-author">
                              {rating.rater?.firstName || 'Anonymous'} {rating.rater?.lastName || ''}
                            </span>
                            <span className="worker-modal-rating-date">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {inviteStatus && (
                  <div className={`invitation-status ${inviteStatus.success ? 'success' : 'error'}`}>
                    {inviteStatus.message}
                  </div>
                )}
                
                {(profile?.userType === 'employer' || profile?.userType === 'both') && myJobs && myJobs.length > 0 && (
                  <div className="worker-modal-section">
                    <label>Invite to Job</label>
                    <div className="job-selection">
                      <select 
                        className="job-select" 
                        id="job-select"
                        disabled={invitingWorker}
                      >
                        <option value="">Select a job to invite worker</option>
                        {myJobs.map(job => (
                          <option key={job._id} value={job._id}>
                            {job.title} - ₱{job.price}
                          </option>
                        ))}
                      </select>
                      <button 
                        className="btn btn-primary invite-btn"
                        disabled={invitingWorker}
                        onClick={() => {
                          const select = document.getElementById('job-select');
                          const jobId = select.value;
                          if (jobId) {
                            handleInviteWorker(selectedWorker._id, jobId);
                          } else {
                            showError('Please select a job first');
                          }
                        }}
                      >
                        {invitingWorker ? 'Sending Invite...' : 'Send Invitation'}
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="worker-modal-actions">
                  <button 
                    onClick={handleCloseWorkerModal} 
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                  
                  <a 
                    href={`/users/${selectedWorker._id}`} 
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Full Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
/* Goal System Styles */
.goal-header-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-goal-btn {
  background: var(--primary-color);
  color: white;
  border: none;
}

.add-income-btn {
  background: var(--success-color, #28a745);
  color: white;
  border: none;
}

.goals-section {
  margin-top: 16px;
}

.goals-category-title {
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--secondary-color, #666);
}

.goals-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.goal-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  padding: 16px;
  transition: all 0.2s ease;
  border-left: 4px solid #ccc;
}

.active-goal {
  border-left-color: var(--primary-color, #007bff);
  box-shadow: 0 3px 12px rgba(0,120,255,0.15);
}

.pending-goal {
  border-left-color: var(--warning-color, #ffc107);
}

.completed-goal {
  border-left-color: var(--success-color, #28a745);
  opacity: 0.8;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.goal-title-section {
  flex: 1;
}

.goal-title {
  margin: 0 0 6px;
  font-size: 1.1rem;
}

.goal-actions {
  display: flex;
  gap: 6px;
}

.edit-goal-btn, .delete-goal-btn, .activate-goal-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.edit-goal-btn:hover {
  background: #f0f0f0;
}

.delete-goal-btn:hover {
  background: #ffeeee;
  color: #ff3333;
}

.activate-goal-btn {
  margin-top: 8px;
  background: var(--primary-color);
  color: white;
  font-size: 0.85rem;
  padding: 6px 12px;
}

.goal-details {
  margin-bottom: 12px;
}

.goal-amount {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 4px;
}

.goal-completion-date {
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
}

.goal-progress-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.profile-goal-bar {
  flex: 1;
  height: 10px;
  background: #eee;
  border-radius: 5px;
  overflow: hidden;
}

.profile-goal-bar-inner {
  height: 100%;
  background: var(--primary-color, #007bff);
  border-radius: 5px;
  transition: width 0.5s ease;
}

.profile-goal-bar-inner.completed {
  background: var(--success-color, #28a745);
}

.profile-goal-percent {
  font-size: 0.85rem;
  color: #666;
  min-width: 40px;
  text-align: right;
}

.active-badge {
  display: inline-block;
  background: var(--primary-color, #007bff);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  margin-top: 4px;
  margin-bottom: 8px;
}

.completed-badge {
  display: inline-block;
  background: var(--success-color, #28a745);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  margin-top: 4px;
  margin-bottom: 8px;
}

.goal-priority {
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
}

.no-goals-message {
  text-align: center;
  padding: 32px 0;
  color: #666;
}

.active-goal-info {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.goal-progress-display {
  margin-top: 8px;
}

.goal-amount-display {
  font-weight: 600;
  margin-bottom: 4px;
}

.goal-progress-bar {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary-color, #007bff);
  border-radius: 4px;
}

.goal-percent-display {
  text-align: right;
  font-size: 0.8rem;
  color: #666;
}

.income-modal {
  max-width: 500px;
}

.no-active-goal-message {
  text-align: center;
  padding: 16px 0;
}

/* Modal and Edit Form Modern Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}
.modal-content {
  max-width: 900px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(34,41,47,0.18);
  padding: 3rem 6vw 3rem 6vw;
  margin: 0 auto;
  position: relative;
  z-index: 2000;
  max-height: 90vh;
  overflow-y: auto;
}
.edit-form {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.edit-form .form-group {
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(34,41,47,0.07);
  padding: 1.5rem 1.5rem 1.2rem 1.5rem;
  margin-bottom: 1.5rem;
}
.edit-form input,
.edit-form select {
  border: none;
  outline: none;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(34,41,47,0.04);
  padding: 1rem 1.2rem;
  font-size: 1.1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  width: 100%;
}
.edit-form label {
  font-weight: 600;
  color: #22292f;
  margin-bottom: 0.3rem;
  letter-spacing: 0.03em;
}

        .profile-page {
          background: #f5f6fa;
          min-height: 100vh;
        }
        .profile-banner {
          background: #22314a;
          height: 140px;
          width: 100vw;
        }
        .profile-main-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(34, 41, 47, 0.08), 0 1.5px 6px rgba(0,0,0,0.04);
          max-width: 900px;
          margin: -80px auto 2rem auto;
          padding: 2.5rem 2.5rem 2rem 2.5rem;
          position: relative;
        }
        .profile-avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2.5rem;
        }
        .profile-avatar-lg {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          background: #e2e8f0;
          border: 4px solid #fff;
          margin-top: -80px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.10);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .profile-avatar-lg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-placeholder-lg {
          font-size: 2.8rem;
          color: #22314a;
          font-weight: 700;
        }
        .avatar-upload-lg {
          position: absolute;
          bottom: 8px;
          right: 8px;
          transform: none;
        }
        .upload-btn-lg {
          background: rgba(124, 58, 237, 0.95);
          color: #fff;
          border: 2px solid #fff;
          border-radius: 50%;
          font-size: 0.75rem;
          padding: 8px 12px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
          transition: all 0.2s;
          font-weight: 600;
          white-space: nowrap;
        }
        .upload-btn-lg:hover {
          background: rgba(109, 40, 217, 0.95);
          transform: scale(1.05);
        }
        .profile-name-section {
          text-align: center;
          margin-top: 1.2rem;
        }
        .profile-name-section h1 {
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          color: #22314a;
        }
        .profile-barangay {
          color: #22314a;
          font-size: 1.1rem;
          margin-top: 0.2rem;
        }
        .profile-user-type {
          color: #4a5568;
          font-size: 1rem;
          margin-top: 0.5rem;
          font-weight: 500;
          background: #f1f5f9;
          padding: 0.3rem 1rem;
          border-radius: 16px;
          display: inline-block;
        }
        .verified-badge-lg {
          color: #38a169;
          font-weight: 600;
          font-size: 1rem;
          margin-left: 0.5rem;
        }
        .edit-profile-btn {
          margin-top: 1.2rem;
          background: #22314a;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .edit-profile-btn:hover {
          background: #2d4059;
        }
        .profile-section {
          margin-bottom: 2.2rem;
        }
        .profile-section h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #22223b;
          margin-bottom: 0.7rem;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .section-header-with-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .view-more-btn {
          background: #22314a;
          color: #fff;
          padding: 0.4rem 0.8rem;
          border-radius: 6px;
          font-size: 0.9rem;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .view-more-btn:hover {
          background: #2d4059;
          text-decoration: none;
        }
        .add-goal-btn {
          background: #38a169;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 0.35rem 0.8rem;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .add-goal-btn:hover {
          background: #2f855a;
        }
        .add-goal-btn span {
          font-size: 1.2rem;
          font-weight: bold;
        }
        .goals-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .goal-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .goal-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #22314a;
          margin: 0;
        }
        .goal-actions {
          display: flex;
          gap: 0.5rem;
        }
        .edit-goal-btn, .delete-goal-btn {
          background: none;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }
        .edit-goal-btn:hover {
          background: #e2e8f0;
          color: #2b6cb0;
        }
        .delete-goal-btn:hover {
          background: #fee2e2;
          color: #e53e3e;
        }
        .goal-details {
          margin-bottom: 0.8rem;
        }
        .goal-amount {
          font-size: 1.1rem;
          font-weight: 600;
          color: #22314a;
        }
        .goal-deadline {
          font-size: 0.9rem;
          color: #64748b;
          margin-top: 0.3rem;
        }
        .no-goals-message {
          color: #64748b;
          font-style: italic;
          padding: 1rem;
          text-align: center;
          background: #f8fafc;
          border-radius: 8px;
        }
        .btn-danger {
          background: #e53e3e;
          color: white;
        }
        .btn-danger:hover {
          background: #c53030;
        }
        .profile-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
        }
        .profile-skill-tag {
          background: #fff;
          border: 1.5px solid #22314a;
          color: #22314a;
          border-radius: 8px;
          padding: 6px 18px;
          font-size: 1rem;
          font-weight: 500;
        }
        .profile-bio {
          font-size: 1.05rem;
          color: #22223b;
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem 1.2rem;
        }
        .profile-recommended-jobs {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.2rem;
          width: 100%;
          margin-top: 1.5rem;
        }
        .job-card {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 1.2rem;
          min-width: 160px;
          font-size: 1rem;
          color: #22314a;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: all 0.2s;
          display: block;
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .job-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border-color: #cbd5e1;
        }
        .job-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(34, 49, 74, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .job-card:hover .job-card-overlay {
          opacity: 1;
        }
        .view-details-btn {
          background: #ffffff;
          color: #22314a;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .job-card:hover .view-details-btn {
          transform: scale(1.05);
        }
        .applied-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #3182ce;
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .job-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #22314a;
          margin-bottom: 0.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .job-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.7rem;
        }
        .job-price {
          font-weight: 600;
          color: #38a169;
        }
        .job-match {
          color: #2b6cb0;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .job-skills {
          color: #4a5568;
          font-size: 0.9rem;
          margin-bottom: 0.6rem;
        }
        .job-location {
          font-size: 0.9rem;
          color: #64748b;
          margin-top: 0.6rem;
        }
        .location-match {
          color: #38a169;
          font-weight: 500;
        }
        .loading-jobs, .no-jobs-message, .loading-workers, .no-workers-message {
          grid-column: 1 / -1;
          padding: 2rem;
          text-align: center;
          color: #64748b;
          background: #f1f5f9;
          border-radius: 8px;
        }
        
        /* Recommended Workers Styles */
        .profile-recommended-workers {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.2rem;
          width: 100%;
          margin-top: 1.5rem;
        }
        
        .worker-card {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 1.2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          text-decoration: none;
          color: #22314a;
          transition: all 0.2s;
          position: relative;
        }
        
        .worker-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          border-color: #cbd5e1;
        }
        
        .worker-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .worker-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .worker-initials {
          font-size: 1.2rem;
          font-weight: 600;
          color: #22314a;
        }
        
        .worker-info {
          flex: 1;
        }
        
        .worker-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #22314a;
          margin-bottom: 0.3rem;
        }
        
        .worker-barangay {
          font-size: 0.9rem;
          color: #4a5568;
          margin-bottom: 0.3rem;
        }
        
        .worker-skills {
          font-size: 0.85rem;
          color: #64748b;
        }
        
        .worker-rating-row {
          display: flex;
          align-items: center;
          margin-top: 0.4rem;
          gap: 0.4rem;
        }
        
        .worker-rating {
          color: #f59e0b;
          font-weight: 600;
          font-size: 0.9rem;
        }
        
        .worker-rating-count {
          font-size: 0.8rem;
          color: #64748b;
        }
        
        .worker-no-rating {
          font-size: 0.85rem;
          color: #64748b;
          font-style: italic;
        }
        
        .top-rated-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #f59e0b;
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .profile-goal-label {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .profile-goal-bar {
          width: 100%;
          height: 18px;
          background: #e2e8f0;
          border-radius: 10px;
          margin-bottom: 0.3rem;
          overflow: hidden;
        }
        .profile-goal-bar-inner {
          height: 100%;
          background: #38d46a;
          border-radius: 10px 0 0 10px;
          transition: width 0.5s;
        }
        .profile-goal-percent {
          font-size: 1rem;
          color: #38a169;
          font-weight: 600;
          margin-top: 0.2rem;
        }
        .profile-languages {
          display: flex;
          gap: 0.7rem;
        }
        .profile-lang-tag {
          background: #fff;
          border: 1.5px solid #22314a;
          color: #22314a;
          border-radius: 8px;
          padding: 6px 18px;
          font-size: 1rem;
          font-weight: 500;
        }
        .profile-contact {
          font-size: 1.05rem;
          color: #22314a;
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem 1.2rem;
        }
        .profile-ratings-carousel {
          display: flex;
          gap: 1.2rem;
          overflow-x: auto;
        }
        .profile-rating-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          min-width: 270px;
          max-width: 320px;
          padding: 1.2rem 1.2rem 1rem 1.2rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .profile-rating-stars {
          color: #fbbf24;
          font-size: 1.2rem;
        }
        .profile-rating-comment {
          color: #22223b;
          font-size: 1.05rem;
          margin-bottom: 0.2rem;
        }
        .profile-rating-footer {
          display: flex;
          justify-content: space-between;
          color: #64748b;
          font-size: 0.98rem;
        }
        /* Job Modal Styles */
        .job-modal-content {
          max-width: 600px;
          padding: 2rem;
        }
        .job-modal-details {
          padding: 0.5rem;
        }
        .job-modal-title {
          font-size: 1.4rem;
          font-weight: 600;
          color: #22314a;
          margin-bottom: 1.2rem;
        }
        .job-modal-section {
          margin-bottom: 1.5rem;
        }
        .job-modal-section label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 0.4rem;
        }
        .job-modal-price {
          font-size: 1.3rem;
          font-weight: 700;
          color: #38a169;
          margin-bottom: 0.4rem;
        }
        .job-modal-posted {
          font-size: 0.9rem;
          color: #64748b;
        }
        .job-modal-description {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
          line-height: 1.5;
          color: #22314a;
        }
        .job-modal-location {
          font-size: 1.05rem;
          color: #22314a;
        }
        .location-match-badge {
          display: inline-block;
          background: #38a169;
          color: white;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          font-size: 0.8rem;
          margin-left: 0.5rem;
        }
        .job-modal-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 0.5rem;
        }
        .job-modal-skill-tag {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 0.3rem 0.8rem;
          border-radius: 6px;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }
        .matching-skill {
          background: #e9f7ef;
          border-color: #38a169;
          color: #2f855a;
        }
        .skill-match-icon {
          color: #38a169;
          font-weight: bold;
        }
        .job-modal-employer {
          font-size: 1.05rem;
          color: #22314a;
        }
        .job-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }
        .application-status {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-weight: 500;
        }
        .application-status.success {
          background: #e9f7ef;
          color: #2f855a;
        }
        .application-status.error {
          background: #fee2e2;
          color: #e53e3e;
        }
        .btn-disabled {
          background: #cbd5e1;
          color: #64748b;
          cursor: not-allowed;
        }
        
        /* Worker Modal Styles */
        .worker-modal-content {
          max-width: 600px;
          padding: 2rem;
        }
        
        .worker-modal-details {
          padding: 0.5rem;
        }
        
        .worker-modal-header {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .worker-modal-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .worker-modal-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .worker-modal-initials {
          font-size: 1.8rem;
          font-weight: 600;
          color: #22314a;
        }
        
        .worker-modal-info {
          flex: 1;
        }
        
        .worker-modal-name {
          font-size: 1.5rem;
          font-weight: 600;
          color: #22314a;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .worker-modal-badge {
          background: #f59e0b;
          color: white;
          font-size: 0.7rem;
          padding: 0.2rem 0.6rem;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          font-weight: 600;
        }
        
        .worker-modal-barangay {
          font-size: 1.05rem;
          color: #4a5568;
          margin-bottom: 0.5rem;
        }
        
        .worker-modal-rating {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
        }
        
        .rating-stars {
          color: #f59e0b;
          font-weight: 600;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .rating-count {
          font-size: 0.9rem;
          color: #64748b;
          font-weight: normal;
        }
        
        .no-rating {
          font-size: 0.9rem;
          color: #64748b;
          font-style: italic;
        }
        
        .worker-modal-section {
          margin-bottom: 1.5rem;
        }
        
        .worker-modal-section label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 0.4rem;
        }
        
        .worker-modal-bio {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
          line-height: 1.5;
          color: #22314a;
        }
        
        .worker-modal-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
          margin-top: 0.5rem;
        }
        
        .worker-modal-skill-tag {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 0.3rem 0.8rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }
        
        .worker-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }
        
        .invitation-status {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          font-weight: 500;
        }
        
        .invitation-status.success {
          background: #e9f7ef;
          color: #2f855a;
        }
        
        .invitation-status.error {
          background: #fee2e2;
          color: #e53e3e;
        }
        
        .job-selection {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        
        .job-select {
          flex: 1;
          padding: 0.7rem;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.9rem;
          color: #22314a;
        }
        
        .invite-btn {
          white-space: nowrap;
        }
        
        .worker-card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(34, 49, 74, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .worker-card:hover .worker-card-overlay {
          opacity: 1;
        }
        
        .worker-modal-ratings {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        
        .worker-modal-rating-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 0.8rem 1rem;
        }
        
        .worker-modal-rating-stars {
          color: #f59e0b;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }
        
        .worker-modal-rating-comment {
          font-size: 0.95rem;
          color: #22314a;
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        
        .worker-modal-rating-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #64748b;
        }
        
        .worker-modal-rating-author {
          font-weight: 500;
        }
        
        @media (max-width: 900px) {
          .profile-main-card {
            padding: 1.2rem 0.5rem;
          }
          .profile-recommended-jobs {
            flex-direction: column;
            gap: 0.7rem;
          }
          .profile-ratings-carousel {
            flex-direction: column;
            gap: 0.7rem;
          }
          .job-modal-content {
            width: 90%;
            padding: 1.5rem;
          }
        }
        
        /* CRITICAL: Profile Picture Edit Modal Overrides */
        .edit-form .profile-picture-section .current-picture {
          width: 150px !important;
          height: 150px !important;
          min-width: 150px !important;
          min-height: 150px !important;
          max-width: 150px !important;
          max-height: 150px !important;
          border-radius: 50% !important;
          overflow: hidden !important;
          border: 4px solid #e2e8f0 !important;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
          margin: 0 auto !important;
        }
        
        .edit-form .profile-picture-section .current-picture img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }
        
        .edit-form .upload-controls {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          margin-top: 1rem !important;
        }
        
        .edit-form .upload-btn {
          display: inline-block !important;
          padding: 0.7rem 1.5rem !important;
          background: #2b6cb0 !important;
          color: white !important;
          cursor: pointer !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
        }
      `}</style>
    </div>
  )
}

export default Profile