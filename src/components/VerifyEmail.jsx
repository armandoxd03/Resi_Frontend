import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../api';

function VerifyEmail() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { token } = useParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true);
        
        // Call the backend endpoint to verify the email
        const apiUrl = import.meta.env.VITE_API_URL || 'https://resilinked-api.onrender.com/api';
        const response = await fetch(`${apiUrl}/auth/verify-email/${token}`);
        
        const data = await response.json();
        
        if (response.ok) {
          setSuccess(true);
        } else {
          setError(data.alert || 'Email verification failed. This link may be invalid or expired.');
        }
      } catch (err) {
        setError('Network error. Please try again later or contact support.');
        console.error('Verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setError('Invalid verification link. No token provided.');
      setLoading(false);
    }
  }, [token]);

  return (
    <div className="email-verification-container">
      <div className="verification-card">
        {loading ? (
          <div className="verification-loading">
            <div className="verification-spinner"></div>
            <p>Verifying your email address...</p>
          </div>
        ) : success ? (
          <div className="verification-success">
            <div className="verification-icon-success">✓</div>
            <h2>Email Verified Successfully!</h2>
            <p>Your email has been verified. You can now login to your account.</p>
            <Link to="/login" className="verification-button">
              Go to Login
            </Link>
          </div>
        ) : (
          <div className="verification-error">
            <div className="verification-icon-error">✗</div>
            <h2>Verification Failed</h2>
            <p>{error}</p>
            <div className="verification-actions">
              <Link to="/resend-verification" className="verification-button">
                Resend Verification
              </Link>
              <Link to="/register" className="verification-link">
                Register a new account
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .email-verification-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6b21a8 75%, #581c87 100%);
          padding: 2rem 1rem;
        }
        
        .verification-card {
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
        
        .verification-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .verification-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(147, 51, 234, 0.1);
          border-top: 4px solid #7c3aed;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1.5rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .verification-success, 
        .verification-error {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .verification-icon-success,
        .verification-icon-error {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin-bottom: 1.5rem;
        }
        
        .verification-icon-success {
          background-color: #ecfdf5;
          color: #059669;
          border: 2px solid #10b981;
        }
        
        .verification-icon-error {
          background-color: #fef2f2;
          color: #dc2626;
          border: 2px solid #ef4444;
        }
        
        .verification-success h2,
        .verification-error h2 {
          margin-bottom: 1rem;
          font-size: 1.875rem;
          font-weight: 700;
        }
        
        .verification-success p,
        .verification-error p {
          margin-bottom: 2rem;
          color: #4b5563;
          line-height: 1.6;
          font-size: 1.125rem;
        }
        
        .verification-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          width: 100%;
        }
        
        .verification-button {
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
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
          width: 100%;
          text-align: center;
        }
        
        .verification-button:hover {
          background: linear-gradient(135deg, #8b31da, #6c2edd);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(124, 58, 237, 0.3);
        }
        
        .verification-link {
          color: #7c3aed;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
        }
        
        .verification-link:hover {
          color: #6b21a8;
          text-decoration: underline;
        }
        
        @media (max-width: 640px) {
          .verification-card {
            padding: 2rem 1.5rem;
          }
          
          .verification-success h2,
          .verification-error h2 {
            font-size: 1.5rem;
          }
          
          .verification-success p,
          .verification-error p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default VerifyEmail;
