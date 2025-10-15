import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import apiService from '../api'
import styles from './Help.module.css'

function Help() {
  const { user, token } = useContext(AuthContext)
  const { showAlert, error: showError } = useContext(AlertContext)
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeItems, setActiveItems] = useState(new Set())
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const faqData = [
    {
      id: 1,
      category: 'Account and Profile',
      icon: 'fas fa-user-circle',
      questions: [
        {
          id: 'reg',
          question: 'How do I register on ResiLinked?',
          answer: 'Click on the "Register" button on the homepage. Fill in all required fields including your name, email, mobile number, and address. You will also need a valid ID for verification. Afterwards, you will wait for an email confirmation.'
        },
        {
          id: 'pass',
          question: 'I forgot my password. How do I reset it?',
          answer: 'On the login page, click on "Forgot Password". Enter your email address and you will receive a reset link. Follow the instructions in the email to set a new password.'
        },
        {
          id: 'update',
          question: 'How do I update my profile information?',
          answer: 'Log in to your account and go to the "Profile" page. Click on the "Edit Profile" button. You can update your personal information, skills, and profile picture here.'
        },
        {
          id: 'verify',
          question: 'Why is my account not verified yet?',
          answer: 'The verification process takes 1-3 business days. The admin is reviewing your submitted documents. If you have been waiting for a long time, contact the support team.'
        }
      ]
    },
    {
      id: 2,
      category: 'Job Search',
      icon: 'fas fa-briefcase',
      questions: [
        {
          id: 'search',
          question: 'How do I search for jobs on ResiLinked?',
          answer: 'Go to the "Find Jobs" page. You can filter jobs based on location, skill, and other criteria. Click on a job post to see the full details.'
        },
        {
          id: 'apply',
          question: 'How do I apply for a job?',
          answer: 'On the job details page, click on the "Apply Now" button. The employer will see your profile and contact information. They will reach out to you directly.'
        },
        {
          id: 'save',
          question: 'Can I save jobs that I am interested in?',
          answer: 'Yes! Click on the heart icon on a job post to save it. You can view your saved jobs on your dashboard.'
        }
      ]
    },
    {
      id: 3,
      category: 'Job Posting',
      icon: 'fas fa-plus-circle',
      questions: [
        {
          id: 'employer',
          question: 'How do I become an employer on ResiLinked?',
          answer: 'During registration, choose "Employer" or "Both" as your user type. Provide business information and valid business documents for verification.'
        },
        {
          id: 'cost',
          question: 'How much does it cost to post a job?',
          answer: 'Currently, posting jobs on ResiLinked is free. You can post unlimited job openings.'
        },
        {
          id: 'manage',
          question: 'How do I manage applicants?',
          answer: 'In the "Employer Dashboard", you will see all those who applied to your job posts. You can contact them directly using the provided contact information.'
        }
      ]
    },
    {
      id: 4,
      category: 'Security and Privacy',
      icon: 'fas fa-shield-alt',
      questions: [
        {
          id: 'safe',
          question: 'Is my personal information safe on ResiLinked?',
          answer: 'Yes! We use industry-standard security measures to protect your data. We do not share your personal information with third parties without permission.'
        },
        {
          id: 'privacy',
          question: 'Who can see my profile?',
          answer: 'Your basic profile information is visible only to verified employers when you apply to their job posts. You are not visible in public searches.'
        },
        {
          id: 'report',
          question: 'How do I report suspicious activity?',
          answer: 'Contact the support team immediately using the "Contact Support" button. Provide details of the suspicious activity so we can investigate.'
        }
      ]
    }
  ]

  const toggleFAQ = (categoryId, questionId) => {
    const itemKey = `${categoryId}-${questionId}`
    const newActiveItems = new Set(activeItems)
    
    if (newActiveItems.has(itemKey)) {
      newActiveItems.delete(itemKey)
    } else {
      newActiveItems.add(itemKey)
    }
    
    setActiveItems(newActiveItems)
  }

  const filterQuestions = (questions) => {
    if (!searchTerm) return questions
    
    return questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const openSupportChat = async () => {
    try {
      // Get support contact (admin)
      const response = await apiService.getSupportContact()
      const supportContact = response.supportContact || response.data?.supportContact
      
      if (supportContact) {
        // Navigate to chat with support contact pre-selected
        navigate('/chat', { state: { supportContact } })
      } else {
        showError('Support contact not available')
      }
    } catch (error) {
      console.error('Error loading support contact:', error)
      showError('Failed to connect to support. Please try again.')
    }
  }

  const openSupportModal = () => {
    // Pre-populate form with user data if available
    if (user) {
      setSupportForm(prev => ({
        ...prev,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email || ''
      }))
    }
    setShowSupportModal(true)
  }

  const handleSupportFormChange = (field, value) => {
    setSupportForm(prev => ({ ...prev, [field]: value }))
  }

  const submitSupportForm = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(supportForm)
      })

      if (!response.ok) {
        throw new Error('Failed to submit support request')
      }

      showAlert('Support request submitted successfully! We will get back to you soon.', 'success')
      setShowSupportModal(false)
      setSupportForm({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      console.error('Error submitting support request:', error)
      showAlert('Failed to submit support request. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="help-container">
      <div className="content-wrapper">
        <div className="main-content">
          <div className="page-header">
            <h1><i className="fas fa-life-ring"></i> Help and Support</h1>
            <p>Frequently asked questions and support for ResiLinked</p>
          </div>

          <div className="search-container">
            <input
              type="text"
              className="search-box"
              placeholder="🔍 Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="faq-sections">
            {faqData.map(section => {
              const filteredQuestions = filterQuestions(section.questions)
              if (filteredQuestions.length === 0 && searchTerm) return null

              return (
                <div key={section.id} className="faq-section">
                  <h2>
                    <i className={section.icon}></i> {section.category}
                  </h2>
                  
                  {filteredQuestions.map(q => {
                    const itemKey = `${section.id}-${q.id}`
                    const isActive = activeItems.has(itemKey)
                    const answerId = `faq-${section.id}-${q.id}-answer`
                    const buttonId = `faq-${section.id}-${q.id}-button`

                    return (
                      <div 
                        key={q.id} 
                        className={`faq-item ${isActive ? 'active' : ''}`}
                      >
                        <button
                          id={buttonId}
                          aria-controls={answerId}
                          aria-expanded={isActive}
                          className="faq-question"
                          onClick={() => toggleFAQ(section.id, q.id)}
                        >
                          <span>{q.question}</span>
                          <i className={`fas fa-chevron-${isActive ? 'up' : 'down'}`}></i>
                        </button>
                        <div id={answerId} className="faq-answer" role="region" aria-labelledby={buttonId}>
                          <p>{q.answer}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {searchTerm && faqData.every(section => filterQuestions(section.questions).length === 0) && (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <p>No questions found for "{searchTerm}"</p>
              <p>Try different search terms or contact support.</p>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="contact-card">
            <h3><i className="fas fa-headset"></i> Need Help?</h3>
            <button className="contact-btn" onClick={openSupportChat}>
              <i className="fas fa-comments"></i>
              Chat with Support
            </button>
            <button className="contact-btn secondary" onClick={openSupportModal} style={{ marginTop: '10px', background: '#6c757d' }}>
              <i className="fas fa-envelope"></i>
              Email Support
            </button>
            
            <div className="contact-info">
              <div className="contact-methods">
                <div className="contact-method">
                  <i className="fas fa-envelope"></i>
                  <div>
                    <strong>Email:</strong>
                    <a href="mailto:support@resilinked.com">support@resilinked.com</a>
                  </div>
                </div>
                <div className="contact-method">
                  <i className="fas fa-phone"></i>
                  <div>
                    <strong>Hotline:</strong>
                    <a href="tel:+639123456789">+63 912 345 6789</a>
                  </div>
                </div>
                <div className="contact-method">
                  <i className="fas fa-clock"></i>
                  <div>
                    <strong>Hours:</strong>
                    <span>Mon-Fri: 8AM-6PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="quick-links">
            <h3>Quick Links</h3>
            <Link to="/landing" className="quick-link">
              <i className="fas fa-home"></i> Back to Dashboard
            </Link>
            <Link to="/profile" className="quick-link">
              <i className="fas fa-user"></i> My Profile
            </Link>
            <Link to="/settings" className="quick-link">
              <i className="fas fa-cog"></i> Settings
            </Link>
            <Link to="/search-jobs" className="quick-link">
              <i className="fas fa-search"></i> Find Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="modal-overlay" onClick={() => setShowSupportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><i className="fas fa-headset"></i> Contact Support</h2>
              <button className="modal-close" onClick={() => setShowSupportModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={submitSupportForm}>
                <div className="form-group">
                  <label htmlFor="supportName">Name:</label>
                  <input
                    type="text"
                    id="supportName"
                    value={supportForm.name}
                    onChange={(e) => handleSupportFormChange('name', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="supportEmail">Email:</label>
                  <input
                    type="email"
                    id="supportEmail"
                    value={supportForm.email}
                    onChange={(e) => handleSupportFormChange('email', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="supportSubject">Subject:</label>
                  <select
                    id="supportSubject"
                    value={supportForm.subject}
                    onChange={(e) => handleSupportFormChange('subject', e.target.value)}
                    required
                  >
                    <option value="">Select a topic...</option>
                    <option value="account">Account Issues</option>
                    <option value="technical">Technical Problems</option>
                    <option value="jobs">Job Posting/Searching</option>
                    <option value="verification">Account Verification</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="supportMessage">Message:</label>
                  <textarea
                    id="supportMessage"
                    value={supportForm.message}
                    onChange={(e) => handleSupportFormChange('message', e.target.value)}
                    rows="5"
                    placeholder="Describe your concern or question..."
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn secondary" 
                    onClick={() => setShowSupportModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn primary" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="spinner small"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Help styles moved to Help.module.css */}
    </div>
  )
}

export default Help
