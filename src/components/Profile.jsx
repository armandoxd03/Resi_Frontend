import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'
import apiService from '../api'
import GoalManagement from './GoalManagement'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
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
    }
  }, [profile?._id])

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
          border-radius: 16px;
          padding: 3rem 7vw 3rem 7vw;
          min-width: 340px;
          width: 100%;
          max-width: 1000px;
          padding: 4rem 7vw 4rem 7vw;
          margin: 0 auto;
          box-shadow: 0 4px 24px rgba(34, 41, 47, 0.10), 0 1.5px 6px rgba(0,0,0,0.04);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .modal-header h3 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #22314a;
          letter-spacing: 0.01em;
        .close-btn {
          background: none;
          border: none;
          font-size: 1.7rem;
          color: #64748b;
          cursor: pointer;
          transition: color 0.2s;
        }
        .close-btn:hover {
          color: #22314a;
        }
        .edit-form {
          display: flex;
          flex-direction: column;
          gap: 2.8rem;
          align-items: center;
          max-width: 700px;
          margin: 0 auto;
          margin: 0 auto;
        }
        .edit-form .form-row {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .edit-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          background: #f6f8fa;
          border-radius: 14px;
          box-shadow: 0 2px 12px rgba(34,41,47,0.10);
          padding: 1.2rem 1.5rem 1.2rem 1.5rem;
          margin-bottom: 3rem;
        }
        .edit-form label {
          font-weight: 600;
          color: #22314a;
          margin-bottom: 0.5rem;
        }
        .edit-form input,
        .edit-form select,
        .edit-form textarea {
          padding: 1.1rem 1.2rem;
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
          font-size: 1.08rem;
          background: #f8fafc;
          color: #22314a;
          margin-bottom: 0;
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
          margin-bottom: 1rem;
        }
        .skills-input-container input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
        }
        .add-skill-btn {
          padding: 0.75rem 1rem;
          background: #38a169;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }
        .add-skill-btn:hover {
          background: #2f855a;
        }
        .common-skills {
          margin-bottom: 1rem;
        }
        .common-skills label {
          display: block;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          color: #4a5568;
        }
        .common-skills-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .common-skill-option {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #4a5568;
          padding: 0.4rem 0.8rem;
          border-radius: 16px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .common-skill-option:hover {
          background: #e2e8f0;
        }
        .common-skill-option.selected {
          background: #e9f7ef;
          border-color: #38a169;
          color: #2f855a;
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          min-height: 50px;
        }
        .skill-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: #2b6cb0;
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 16px;
          font-size: 0.9rem;
          font-weight: 500;
          margin: 0.2rem;
        }
        .remove-skill {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          cursor: pointer;
          font-size: 0.95rem;
          padding: 0;
          margin-left: 0.5rem;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: all 0.2s ease;
        }
        .remove-skill:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
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
        .btn-primary {
          background: #38a169;
          color: #fff;
        }
        .btn-primary:hover {
          background: #2f855a;
        }
        .btn-secondary {
          background: #e2e8f0;
          color: #22314a;
        }
        .btn-secondary:hover {
          background: #cbd5e1;
        }
        @media (max-width: 600px) {
          .modal-content {
            padding: 1.2rem 0.5rem;
            min-width: 90vw;
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
              <img src={`data:image/jpeg;base64,${profile.profilePicture}`} alt="Profile" />
            ) : (
              <div className="avatar-placeholder-lg">
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
              </div>
            )}
            <div className="avatar-upload-lg">
              <input
                type="file"
                id="profilePictureInput"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              <label htmlFor="profilePictureInput" className="upload-btn-lg">
                {uploading ? 'Uploading...' : 'Change Photo'}
              </label>
            </div>
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

        <div className="profile-section">
          <h2>Recommended Jobs</h2>
          <div className="profile-recommended-jobs">
            {/* Example jobs, replace with real data if available */}
            <div className="job-card">Cleaner<br /><span>42 matching positions</span></div>
            <div className="job-card">House Mover<br /><span>39 matching positions</span></div>
            <div className="job-card">Elderly Caretaker<br /><span>28 matching positions</span></div>
            <div className="job-card">Cook<br /><span>21 matching positions</span></div>
          </div>
        </div>

        <div className="profile-section">
          <GoalManagement />
        </div>

        <div className="profile-section">
          <h2>Languages Spoken</h2>
          <div className="profile-languages">
            <span className="profile-lang-tag">Tagalog</span>
            <span className="profile-lang-tag">English</span>
          </div>
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
                {/* ...existing edit form code... */}
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
                  <label htmlFor="mobileNo">Mobile Number</label>
                  <input
                    type="tel"
                    id="mobileNo"
                    name="mobileNo"
                    value={editFormData.mobileNo}
                    onChange={handleInputChange}
                  />
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
                {/* Bio and Gender fields moved above userType field */}
                {/* ...other form fields... */}
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
.modal-content .close {
  background: #e0e0e0;
  color: #22292f;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  border: none;
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  left: auto;
  box-shadow: 0 2px 8px rgba(34,41,47,0.10);
  cursor: pointer;
  z-index: 2100;
}
.modal-content .close:hover {
  background: #bdbdbd;
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
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
        }
        .upload-btn-lg {
          background: #fff;
          color: #22314a;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          font-size: 0.95rem;
          padding: 6px 16px;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: all 0.2s;
        }
        .upload-btn-lg:hover {
          background: #f1f5f9;
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
          display: flex;
          gap: 1.2rem;
          justify-content: flex-end;
          margin-top: 2rem;
          gap: 2.2rem;
          border-top: 1px solid #e2e8f0;
          width: 100%;
          border-radius: 10px;
          padding: 1rem 1.2rem;
          min-width: 160px;
          font-size: 1rem;
          font-weight: 600;
          color: #22314a;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .job-card span {
          display: block;
          font-size: 0.95rem;
          color: #64748b;
          font-weight: 400;
          margin-top: 0.3rem;
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
        }
      `}</style>
    </div>
  )
}

export default Profile