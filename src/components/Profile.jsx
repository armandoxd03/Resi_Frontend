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
  const [editFormData, setEditFormData] = useState({})
  const [uploading, setUploading] = useState(false)
  
  const { user, updateUser } = useAuth()
  const { success, error: showError } = useAlert()

  useEffect(() => {
    loadProfile()
    loadRatings()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await apiService.getProfile()
      setProfile(data.user)
      setEditFormData(data.user)
    } catch (err) {
      setError('Failed to load profile')
      console.error('Profile load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadRatings = async () => {
    try {
      if (user?.userId) {
        const ratingsResponse = await apiService.getUserRatings(user.userId)
        setRatings(ratingsResponse.ratings || [])
      }
    } catch (err) {
      console.error('Failed to load ratings:', err)
    }
  }

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
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
      showError('Failed to upload profile picture. Please try again.')
    } finally {
      setUploading(false)
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
      skills: profile?.skills ? profile.skills.join(', ') : ''
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

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    
    try {
      const updates = { ...editFormData }
      
      // Parse skills from comma-separated string
      if (updates.skills) {
        updates.skills = updates.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
      }
      
      console.log('Sending profile updates:', updates);
      console.log('Gender value being sent:', updates.gender);
      
      const response = await apiService.updateProfile(updates)
      
      if (response.user) {
        console.log('Profile update successful:', response.user);
        console.log('Gender value received back:', response.user.gender);
        setProfile(response.user)
        updateUser(response.user)
        setShowEditModal(false)
        success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showError('Failed to update profile. Please try again.')
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
                />
                <label htmlFor="profilePictureInput" className="upload-btn">
                  {uploading ? '📤' : '📷'}
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
              <span>{profile?.gender || 'Not provided'}</span>
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
                      <option value="others">Others</option>
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
                  <label htmlFor="skills">Skills (comma separated)</label>
                  <input
                    type="text"
                    id="skills"
                    name="skills"
                    value={editFormData.skills}
                    onChange={handleInputChange}
                    placeholder="e.g. Plumbing, Carpentry, Cleaning"
                  />
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
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
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
        }

        .back-btn {
          color: #2b6cb0;
          text-decoration: none;
          font-weight: 500;
        }

        .back-btn:hover {
          text-decoration: underline;
        }

        .profile-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .profile-header {
          background: linear-gradient(135deg, #2b6cb0, #3182ce);
          color: white;
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .profile-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .avatar-upload {
          position: absolute;
          bottom: 6px;
          right: 6px;
          background: #a78bfa;
          border: 2px solid #fff;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(80,0,120,0.08);
          z-index: 2;
        }

        .upload-btn {
          color: #fff;
          background: transparent;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border: none;
          outline: none;
          transition: background 0.2s;
        }

        .upload-btn:hover, .upload-btn:focus {
          background: #7c3aed;
          color: #fff;
          border-radius: 50%;
        }

        .verified-badge {
          font-size: 0.8rem;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          background: ${profile?.isVerified ? '#10b981' : '#f59e0b'};
          color: white;
          display: inline-block;
          margin-top: 0.5rem;
        }

        .ratings-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .ratings-section h3 {
          margin: 0 0 1rem 0;
          color: #2b6cb0;
        }

        .ratings-list {
          display: grid;
          gap: 1rem;
        }

        .rating-card {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .rating-stars {
          color: #ffc107;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .rating-comment {
          color: #4a5568;
          margin-bottom: 0.5rem;
          font-style: italic;
        }

        .rating-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #666;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 0;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
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

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .edit-form {
          padding: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2b6cb0;
        }

        .form-group textarea {
          resize: vertical;
          font-family: inherit;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          font-size: 2rem;
          font-weight: bold;
          color: white;
        }

        .profile-info h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.8rem;
        }

        .user-type {
          background: rgba(255,255,255,0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.9rem;
          display: inline-block;
          margin: 0 0 0.5rem 0;
          text-transform: capitalize;
        }

        .email {
          opacity: 0.9;
          margin: 0;
        }

        .profile-details {
          padding: 2rem;
        }

        .detail-group {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1rem 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .detail-group:last-child {
          border-bottom: none;
        }

        .detail-group label {
          font-weight: 600;
          color: #4a5568;
          min-width: 120px;
        }

        .detail-group span {
          color: #2d3748;
          text-align: right;
          flex: 1;
        }

        .skills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .skill-tag {
          background: #e2e8f0;
          color: #2b6cb0;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .profile-actions {
          padding: 2rem;
          background: #f8f9fa;
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .btn-primary {
          background: #2b6cb0;
          color: white;
        }

        .btn-primary:hover {
          background: #2c5282;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #2b6cb0;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }

        .loading, .error {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .error {
          color: #e53e3e;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .profile-header {
            flex-direction: column;
            text-align: center;
          }

          .detail-group {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .detail-group span {
            text-align: left;
          }

          .skills-list {
            justify-content: flex-start;
          }

          .profile-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default Profile
