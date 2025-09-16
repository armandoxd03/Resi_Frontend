const LoadingSpinner = ({ size = 'medium', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6', 
    large: 'w-8 h-8'
  }

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }

  return (
    <div className={`loading-spinner ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {text && <span className={`loading-text ${textSizes[size]}`}>{text}</span>}

  <style>{`
        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          flex-direction: column;
        }

        .spinner {
          border: 3px solid rgba(147, 51, 234, 0.2);
          border-top: 3px solid #9333ea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-text {
          color: #64748b;
          font-weight: 500;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Size variations */
        .w-4 { width: 16px; height: 16px; border-width: 2px; }
        .h-4 { height: 16px; }
        
        .w-6 { width: 24px; height: 24px; border-width: 3px; }
        .h-6 { height: 24px; }
        
        .w-8 { width: 32px; height: 32px; border-width: 4px; }
        .h-8 { height: 32px; }

        .text-sm { font-size: 0.875rem; }
        .text-base { font-size: 1rem; }
        .text-lg { font-size: 1.125rem; }
      `}</style>
    </div>
  )
}

export default LoadingSpinner
