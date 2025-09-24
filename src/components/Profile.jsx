import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'
import apiService from '../api'

function Profile() {
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    address: '',
    barangay: '',
    gender: '',
    bio: '',
    skills: []
  })
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
      setLoading(true)
      const data = await apiService.getProfileMe()
      setProfile(data.user)
      setEditFormData({
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        email: data.user.email || '',
        mobileNo: data.user.mobileNo || '',
        address: data.user.address || '',
        barangay: data.user.barangay || '',
        gender: data.user.gender || '',
        bio: data.user.bio || '',
        skills: data.user.skills || []
      })
    } catch (err) {
      setError('Failed to load profile')
      console.error('Profile load error:', err)
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
      email: profile?.email || '',
      mobileNo: profile?.mobileNo || '',
      address: profile?.address || '',
      barangay: profile?.barangay || '',
      gender: profile?.gender || '',
      bio: profile?.bio || '',
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

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading profile...</div>
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
    <div className="container">
      <header className="page-header">
        <h1>My Profile</h1>
        <Link to="/landing" className="back-btn">Back to Dashboard</Link>
      </header>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile?.profilePicture ? (
                <img src={`data:image/jpeg;base64,${profile.profilePicture}`} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </div>
              )}
              <div className="avatar-upload">
                <input
                  type="file"
                  id="profilePictureInput"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <label htmlFor="profilePictureInput" className="upload-btn">
                  {uploading ? '📤 Uploading...' : '📷 Change Photo'}
                </label>
              </div>
            </div>
            <div className="profile-info">
              <h2>{profile?.firstName} {profile?.lastName}</h2>
              <p className="user-type">{profile?.userType}</p>
              <p className="email">{profile?.email}</p>
              <div className="verified-badge">
                {profile?.isVerified ? '✓ Verified' : '⚠ Unverified'}
              </div>
            </div>
          </div>

          <div className="profile-details">
            <div className="detail-group">
              <label>Mobile Number:</label>
              <span>{profile?.mobileNo || 'Not provided'}</span>
            </div>
            <div className="detail-group">
              <label>Address:</label>
              <span>{profile?.address || 'Not provided'}</span>
            </div>
            <div className="detail-group">
              <label>Barangay:</label>
              <span>{profile?.barangay || 'Not provided'}</span>
            </div>
            <div className="detail-group">
              <label>Gender:</label>
              <span>{profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not provided'}</span>
            </div>
            <div className="detail-group">
              <label>Bio:</label>
              <span>{profile?.bio || 'No bio provided'}</span>
            </div>
            {profile?.skills && profile.skills.length > 0 && (
              <div className="detail-group">
                <label>Skills:</label>
                <div className="skills-list">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {ratings.length > 0 && (
            <div className="ratings-section">
              <h3>User Ratings</h3>
              <div className="ratings-list">
                {ratings.map((rating, index) => {
                  const stars = '★'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating)
                  const date = new Date(rating.createdAt).toLocaleDateString()
                  
                  return (
                    <div key={index} className="rating-card">
                      <div className="rating-stars">{stars}</div>
                      <div className="rating-comment">{rating.comment || 'No comment provided'}</div>
                      <div className="rating-footer">
                        <span className="rating-author">{rating.rater?.firstName || 'Anonymous'} {rating.rater?.lastName || ''}</span>
                        <span className="rating-date">{date}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="profile-actions">
            <button onClick={handleEditProfile} className="btn btn-primary">
              Edit Profile
            </button>
            <Link to="/settings" className="btn btn-secondary">
              Settings
            </Link>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Profile</h3>
                <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
              </div>
              
              <form onSubmit={handleSaveProfile} className="edit-form">
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
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="3"
                    value={editFormData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="form-group">
                  <label>Skills</label>
                  <div className="skills-checkbox-group">
                    {['Plumbing', 'Carpentry', 'Cleaning', 'Electrical', 'Painting', 'Gardening', 'Cooking', 'Driving', 'Babysitting', 'Tutoring', 'IT Support', 'Customer Service'].map(skill => (
                      <label key={skill} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editFormData.skills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                        />
                        <span className="checkmark"></span>
                        {skill}
                      </label>
                    ))}
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
      </div>

      <style>{`
        /* ... (your existing CSS styles) ... */
        
        .avatar-upload .upload-btn {
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid #ddd;
        }
        
        .avatar-upload .upload-btn:hover {
          background: white;
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .avatar-upload .upload-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .skills-checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .checkbox-label input {
          display: none;
        }
        
        .checkmark {
          width: 20px;
          height: 20px;
          border: 2px solid #ddd;
          border-radius: 4px;
          position: relative;
        }
        
        .checkbox-label input:checked + .checkmark {
          background: #2b6cb0;
          border-color: #2b6cb0;
        }
        
        .checkbox-label input:checked + .checkmark:after {
          content: '✓';
          color: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}

export default Profile