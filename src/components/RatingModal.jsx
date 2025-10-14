import { useState } from 'react'
import { useAlert } from '../context/AlertContext'
import apiService from '../api'

function RatingModal({ isOpen, onClose, user, job, onRatingSubmitted }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const { success, error: showError } = useAlert()

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (rating === 0) {
      showError('Please select a rating')
      return
    }

    setSubmitting(true)
    try {
      const result = await apiService.rateUser({
        jobId: job._id,
        rateeId: user._id,
        rating,
        comment: comment.trim()
      })

      success(result.alert || 'Rating submitted successfully!')
      if (onRatingSubmitted) {
        onRatingSubmitted()
      }
      onClose()
    } catch (err) {
      showError(err.message || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setRating(0)
    setHoverRating(0)
    setComment('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content rating-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Rate {user.firstName} {user.lastName}</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="job-info">
            <p><strong>Job:</strong> {job.title}</p>
            <p><strong>Location:</strong> {job.barangay}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="rating-section">
              <label>Your Rating</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="rating-label">
                {rating === 0 ? 'Select a rating' :
                 rating === 1 ? 'Poor' :
                 rating === 2 ? 'Fair' :
                 rating === 3 ? 'Good' :
                 rating === 4 ? 'Very Good' :
                 'Excellent'}
              </p>
            </div>

            <div className="comment-section">
              <label htmlFor="comment">Comment (optional)</label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows="4"
                maxLength="500"
              />
              <div className="char-count">{comment.length}/500</div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || rating === 0}
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>

        <style>{`
          .rating-modal {
            max-width: 500px;
            width: 90%;
          }

          .job-info {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
          }

          .job-info p {
            margin: 0.5rem 0;
            color: #495057;
          }

          .rating-section {
            margin-bottom: 1.5rem;
            text-align: center;
          }

          .rating-section label {
            display: block;
            margin-bottom: 0.75rem;
            font-weight: 600;
            color: #333;
          }

          .star-rating {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
            margin-bottom: 0.5rem;
          }

          .star {
            font-size: 3rem;
            color: #ddd;
            cursor: pointer;
            transition: all 0.2s ease;
            user-select: none;
          }

          .star.filled {
            color: #ffc107;
            transform: scale(1.1);
          }

          .star:hover {
            transform: scale(1.2);
          }

          .rating-label {
            font-size: 1.1rem;
            color: #666;
            font-weight: 500;
            min-height: 1.5rem;
          }

          .comment-section {
            margin-bottom: 1.5rem;
          }

          .comment-section label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #333;
          }

          .comment-section textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-family: inherit;
            font-size: 1rem;
            resize: vertical;
            transition: border-color 0.2s;
          }

          .comment-section textarea:focus {
            outline: none;
            border-color: #7c3aed;
          }

          .char-count {
            text-align: right;
            font-size: 0.875rem;
            color: #666;
            margin-top: 0.25rem;
          }

          .modal-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
          }

          .btn-primary,
          .btn-secondary {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-primary {
            background: linear-gradient(135deg, #7c3aed, #a78bfa);
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
          }

          .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-secondary {
            background: #f1f5f9;
            color: #475569;
          }

          .btn-secondary:hover:not(:disabled) {
            background: #e2e8f0;
          }

          @media (max-width: 768px) {
            .star {
              font-size: 2.5rem;
            }

            .modal-actions {
              flex-direction: column-reverse;
            }

            .btn-primary,
            .btn-secondary {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  )
}

export default RatingModal
