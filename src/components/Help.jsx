import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'
import styles from './Help.module.css'

function Help() {
  const { user, token } = useContext(AuthContext)
  const { showAlert } = useContext(AlertContext)
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
      category: 'Account at Profile',
      icon: 'fas fa-user-circle',
      questions: [
        {
          id: 'reg',
          question: 'Paano ako magre-register sa ResiLinked?',
          answer: 'Mag-click sa "Register" button sa homepage. Punan ang lahat ng required fields kasama ang inyong pangalan, email, mobile number, at address. Kailangan rin ng valid ID para sa verification. Pagkatapos, maghihintay kayo ng email confirmation.'
        },
        {
          id: 'pass',
          question: 'Nakalimutan ko ang aking password. Paano ko ito ma-reset?',
          answer: 'Sa login page, mag-click sa "Forgot Password". I-enter ang inyong email address at makatanggap kayo ng reset link. Sundin ang instructions sa email para ma-set ang bagong password.'
        },
        {
          id: 'update',
          question: 'Paano ko i-update ang aking profile information?',
          answer: 'Mag-login sa inyong account at pumunta sa "Profile" page. Mag-click sa "Edit Profile" button. Pwede ninyong i-update ang personal information, skills, at profile picture dito.'
        },
        {
          id: 'verify',
          question: 'Bakit hindi pa verified ang aking account?',
          answer: 'Ang verification process ay tumatagal ng 1-3 business days. Sinusuri ng admin ang inyong submitted documents. Kung mahaba na ang naghihintay, mag-contact sa support team.'
        }
      ]
    },
    {
      id: 2,
      category: 'Paghahanap ng Trabaho',
      icon: 'fas fa-briefcase',
      questions: [
        {
          id: 'search',
          question: 'Paano ako maghanap ng trabaho sa ResiLinked?',
          answer: 'Pumunta sa "Find Jobs" page. Pwede ninyong i-filter ang mga trabaho based sa location, skill, at iba pang criteria. Mag-click sa job post para makita ang full details.'
        },
        {
          id: 'apply',
          question: 'Paano ko ma-apply sa isang job?',
          answer: 'Sa job details page, mag-click sa "Apply Now" button. Makikita ng employer ang inyong profile at contact information. Sila na mismo ang makikipag-ugnayan sa inyo.'
        },
        {
          id: 'save',
          question: 'Pwede ko bang i-save ang mga job na interesado ako?',
          answer: 'Yes! Mag-click sa heart icon sa job post para i-save. Makikita ninyo ang mga saved jobs sa inyong dashboard.'
        }
      ]
    },
    {
      id: 3,
      category: 'Pag-post ng Trabaho',
      icon: 'fas fa-plus-circle',
      questions: [
        {
          id: 'employer',
          question: 'Paano ako magiging employer sa ResiLinked?',
          answer: 'Sa registration, piliin ang "Employer" o "Both" bilang user type. Mag-provide ng business information at valid business documents para sa verification.'
        },
        {
          id: 'cost',
          question: 'Magkano ang bayad para mag-post ng trabaho?',
          answer: 'Sa ngayon, libre pa ang pag-post ng trabaho sa ResiLinked. Pwede kayong mag-post ng unlimited job openings.'
        },
        {
          id: 'manage',
          question: 'Paano ko ma-manage ang mga applicants?',
          answer: 'Sa "Employer Dashboard", makikita ninyo ang lahat ng mga nag-apply sa inyong job posts. Pwede ninyong i-contact sila directly gamit ang provided contact information.'
        }
      ]
    },
    {
      id: 4,
      category: 'Security at Privacy',
      icon: 'fas fa-shield-alt',
      questions: [
        {
          id: 'safe',
          question: 'Safe ba ang personal information ko sa ResiLinked?',
          answer: 'Oo! Ginagamit namin ang industry-standard security measures para protektahan ang inyong data. Hindi namin ibinabahagi ang personal information ninyo sa third parties nang walang permission.'
        },
        {
          id: 'privacy',
          question: 'Sino ang makakakita ng profile ko?',
          answer: 'Ang inyong basic profile information ay makikita ng verified employers lang kapag nag-apply kayo sa kanilang job posts. Hindi kayo makikita sa public search.'
        },
        {
          id: 'report',
          question: 'Paano ko ma-report ang suspicious activity?',
          answer: 'Mag-contact sa support team kaagad gamit ang "Contact Support" button. I-provide ang details ng suspicious activity para ma-investigate namin.'
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
            <p>Mga madalas na katanungan at suporta para sa ResiLinked</p>
          </div>

          <div className="search-container">
            <input
              type="text"
              className="search-box"
              placeholder="🔍 Maghanap ng tanong..."
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
              <p>Walang nahanap na mga tanong para sa "{searchTerm}"</p>
              <p>Subukan ninyo ang ibang search terms o mag-contact sa support.</p>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="contact-card">
            <h3><i className="fas fa-headset"></i> Kailangan ng Tulong?</h3>
            <button className="contact-btn" onClick={openSupportModal}>
              <i className="fas fa-envelope"></i>
              Contact Support
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
