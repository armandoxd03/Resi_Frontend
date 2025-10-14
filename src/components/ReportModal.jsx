import React, { useState } from 'react';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, onSubmit, reportType, targetName }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (reason.trim().length < 10) {
      alert('Please provide a reason with at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Failed to submit report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      onClose();
    }
  };

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2>Report {reportType}</h2>
          <button 
            className="report-modal-close" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        
        <div className="report-modal-body">
          <p className="report-target-info">
            You are reporting: <strong>{targetName}</strong>
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reason">
                Reason for Report <span className="required">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe why you are reporting this..."
                rows="5"
                required
                minLength={10}
                disabled={isSubmitting}
              />
              <span className="char-count">
                {reason.length} / 10 minimum characters
              </span>
            </div>

            <div className="report-modal-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-report"
                disabled={isSubmitting || reason.trim().length < 10}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
