import { useState } from 'react';
import { Link } from 'react-router-dom';

function ResendVerification() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const apiUrl = import.meta.env.VITE_API_URL || 'https://resilinked-api.onrender.com/api';
      const response = await fetch(`${apiUrl}/auth/verify/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.alert || 'Failed to resend verification email. Please try again later.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Resend verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resend-verification-container">
      <div className="resend-card">
        <h2>Resend Verification Email</h2>
        
        {!success ? (
          <form onSubmit={handleSubmit} className="resend-form">
            <p className="resend-instructions">
              Enter your email address below and we'll send you a new verification link.
            </p>
            
            {error && <div className="resend-error">{error}</div>}
            
            <div className="resend-input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="resend-button"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
            
            <div className="resend-links">
              <Link to="/login" className="resend-link">
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <div className="resend-success">
            <div className="resend-success-icon">✓</div>
            <h3>Verification Email Sent!</h3>
            <p>
              If an account exists with this email, a verification link has been sent.
              Please check your inbox and spam folder.
            </p>
            <Link to="/login" className="resend-button">
              Back to Login
            </Link>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .resend-verification-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 75%, #581c87 100%);
          padding: 2rem 1rem;
        }
        
        .resend-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          box-shadow: 
            0 32px 64px rgba(147, 51, 234, 0.2),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 500px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .resend-card h2 {
          margin-bottom: 1.5rem;
          font-size: 2rem;
          font-weight: 700;
          background: linear-gradient(135deg, #9333ea, #6b21a8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .resend-instructions {
          margin-bottom: 2rem;
          color: #4b5563;
          line-height: 1.6;
          font-size: 1rem;
        }
        
        .resend-error {
          padding: 0.75rem 1rem;
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          color: #b91c1c;
          text-align: left;
          margin-bottom: 1.5rem;
          border-radius: 8px;
        }
        
        .resend-input-group {
          margin-bottom: 1.5rem;
          text-align: left;
        }
        
        .resend-input-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #4b5563;
          font-size: 0.9rem;
        }
        
        .resend-input-group input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          background: #f9fafb;
          font-size: 1rem;
          transition: all 0.2s;
        }
        
        .resend-input-group input:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
          background: #ffffff;
        }
        
        .resend-button {
          display: inline-block;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          border: none;
          padding: 0.875rem 1.5rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          text-decoration: none;
          width: 100%;
          margin-bottom: 1.5rem;
        }
        
        .resend-button:hover {
          background: linear-gradient(135deg, #8b31da, #6c2edd);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
        }
        
        .resend-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .resend-links {
          display: flex;
          justify-content: center;
        }
        
        .resend-link {
          color: #7c3aed;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        
        .resend-link:hover {
          color: #6b21a8;
          text-decoration: underline;
        }
        
        .resend-success {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .resend-success-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          margin-bottom: 1.5rem;
          background-color: #ecfdf5;
          color: #059669;
          border: 2px solid #10b981;
        }
        
        .resend-success h3 {
          margin-bottom: 1rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: #059669;
        }
        
        .resend-success p {
          margin-bottom: 2rem;
          color: #4b5563;
          line-height: 1.6;
        }
        
        @media (max-width: 640px) {
          .resend-card {
            padding: 2rem 1.5rem;
          }
          
          .resend-card h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default ResendVerification;
