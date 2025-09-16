import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { AlertContext } from '../context/AlertContext'

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
                    
                    return (
                      <div 
                        key={q.id} 
                        className={`faq-item ${isActive ? 'active' : ''}`}
                      >
                        <div 
                          className="faq-question" 
                          onClick={() => toggleFAQ(section.id, q.id)}
                        >
                          {q.question}
                          <i className={`fas fa-chevron-${isActive ? 'up' : 'down'}`}></i>
                        </div>
                        <div className="faq-answer">
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

  <style>{`
        .help-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .content-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 2rem;
        }

        .main-content {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .page-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .page-header h1 {
          color: #2b6cb0;
          margin: 0 0 0.5rem 0;
          font-size: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .page-header p {
          color: #666;
          margin: 0;
          font-size: 1.1rem;
        }

        .search-container {
          margin-bottom: 2rem;
        }

        .search-box {
          width: 100%;
          padding: 1rem;
          font-size: 1.1rem;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.3s;
        }

        .search-box:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        .faq-sections {
          margin-bottom: 2rem;
        }

        .faq-section {
          margin-bottom: 2rem;
        }

        .faq-section h2 {
          color: #2b6cb0;
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .faq-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 0.5rem;
          overflow: hidden;
          transition: all 0.3s;
        }

        .faq-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .faq-question {
          padding: 1rem;
          background: #f8f9fa;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: #2d3748;
          transition: all 0.3s;
        }

        .faq-question:hover {
          background: #e9ecef;
        }

        .faq-item.active .faq-question {
          background: #2b6cb0;
          color: white;
        }

        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }

        .faq-item.active .faq-answer {
          max-height: 200px;
        }

        .faq-answer p {
          padding: 1rem;
          margin: 0;
          line-height: 1.6;
          color: #4a5568;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          color: #666;
        }

        .no-results i {
          font-size: 3rem;
          color: #e2e8f0;
          margin-bottom: 1rem;
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .contact-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .contact-card h3 {
          color: #2b6cb0;
          margin: 0 0 1rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .contact-btn {
          width: 100%;
          padding: 1rem;
          background: #38a169;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          transition: all 0.2s;
        }

        .contact-btn:hover {
          background: #2f855a;
          transform: translateY(-1px);
        }

        .contact-methods {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .contact-method {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .contact-method i {
          width: 20px;
          color: #2b6cb0;
        }

        .contact-method div {
          flex: 1;
        }

        .contact-method strong {
          display: block;
          font-size: 0.9rem;
          color: #4a5568;
        }

        .contact-method a,
        .contact-method span {
          color: #2b6cb0;
          text-decoration: none;
          font-size: 0.9rem;
        }

        .contact-method a:hover {
          text-decoration: underline;
        }

        .quick-links {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .quick-links h3 {
          color: #2b6cb0;
          margin: 0 0 1rem 0;
        }

        .quick-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          color: #4a5568;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.2s;
          margin-bottom: 0.5rem;
        }

        .quick-link:hover {
          background: #f8f9fa;
          color: #2b6cb0;
        }

        .quick-link i {
          width: 16px;
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
          max-width: 500px;
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

        .modal-header h2 {
          margin: 0;
          color: #2b6cb0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #2b6cb0;
          box-shadow: 0 0 0 3px rgba(43, 108, 176, 0.1);
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
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

        .btn.primary:hover:not(:disabled) {
          background: #2c5aa0;
        }

        .btn.secondary {
          background: #6c757d;
          color: white;
        }

        .btn.secondary:hover {
          background: #5a6268;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner.small {
          width: 12px;
          height: 12px;
          border-width: 1.5px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .content-wrapper {
            grid-template-columns: 1fr;
            padding: 1rem;
            gap: 1rem;
          }

          .main-content {
            padding: 1.5rem;
          }

          .page-header h1 {
            font-size: 2rem;
          }

          .modal-content {
            width: 95%;
            margin: 1rem;
          }

          .form-actions {
            flex-direction: column;
          }

          .faq-question {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Help
