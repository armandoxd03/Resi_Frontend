import { useState } from 'react'

const FormInput = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  onBlur, 
  onFocus,
  error, 
  touched,
  required = false,
  placeholder,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = (e) => {
    setIsFocused(true)
    if (onFocus) onFocus(e)
  }

  const handleBlur = (e) => {
    setIsFocused(false)
    if (onBlur) onBlur(e)
  }

  const getInputClassName = () => {
    let className = 'form-input'
    
    if (isFocused) className += ' focused'
    if (error && touched) className += ' error'
    if (value && !error) className += ' valid'
    
    return className
  }

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={getInputClassName()}
          required={required}
          {...props}
        >
          {props.children}
        </select>
      )
    }

    if (type === 'textarea') {
      return (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={getInputClassName()}
          placeholder={placeholder}
          required={required}
          {...props}
        />
      )
    }

    return (
      <input
        type={type}
        name={name}
        value={type === 'file' ? undefined : value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={getInputClassName()}
        placeholder={placeholder}
        required={required}
        {...props}
      />
    )
  }

  return (
    <div className="form-input-container">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="required-asterisk">*</span>}
      </label>
      
      <div className="input-wrapper">
        {renderInput()}
        
        {/* Status indicators */}
        <div className="input-status">
          {touched && error && (
            <span className="error-icon" title={error}>
              ❌
            </span>
          )}
          
          {value && !error && touched && (
            <span className="success-icon" title="Valid">
              ✅
            </span>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {touched && error && (
        <div className="error-message">
          <span className="error-text">{error}</span>
        </div>
      )}
      
      {/* Helper text */}
      {props.helperText && !error && (
        <div className="helper-text">
          {props.helperText}
        </div>
      )}

  <style>{`
        .form-input-container {
          margin-bottom: 1.75rem;
          position: relative;
        }

        .form-label {
          display: block;
          margin-bottom: 0.75rem;
          color: #374151;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          transition: color 0.2s ease;
        }

        .required-asterisk {
          color: #dc2626;
          margin-left: 0.25rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input {
          width: 100%;
          padding: 1rem 3rem 1rem 1.25rem;
          border: 2px solid rgba(147, 51, 234, 0.1);
          border-radius: 16px;
          font-size: 1rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          font-family: inherit;
        }

        .form-input:focus,
        .form-input.focused {
          outline: none;
          border-color: #9333ea;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 
            0 0 0 4px rgba(147, 51, 234, 0.1),
            0 8px 24px rgba(147, 51, 234, 0.15);
          transform: translateY(-2px);
        }

        .form-input:hover {
          border-color: rgba(147, 51, 234, 0.2);
          background: rgba(255, 255, 255, 0.9);
        }

        .form-input.valid {
          border-color: #059669;
          background: rgba(255, 255, 255, 0.95);
        }

        .form-input.valid:focus {
          box-shadow: 
            0 0 0 4px rgba(5, 150, 105, 0.1),
            0 8px 24px rgba(5, 150, 105, 0.15);
        }

        .form-input.error {
          border-color: #dc2626;
          background: rgba(255, 255, 255, 0.95);
        }

        .form-input.error:focus {
          box-shadow: 
            0 0 0 4px rgba(220, 38, 38, 0.1),
            0 8px 24px rgba(220, 38, 38, 0.15);
        }

        select.form-input {
          background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="%23374151" d="M2 0L0 2h4zm0 5L0 3h4z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 3rem center;
          background-size: 12px;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }

        input[type="file"].form-input {
          padding: 0.75rem 3rem 0.75rem 1rem;
          cursor: pointer;
          border-style: dashed;
        }

        textarea.form-input {
          min-height: 120px;
          resize: vertical;
          padding-top: 1rem;
          padding-bottom: 1rem;
        }

        .input-status {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .error-icon {
          color: #dc2626;
          display: flex;
          align-items: center;
        }

        .success-icon {
          color: #059669;
          display: flex;
          align-items: center;
        }

        .error-message {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 10px;
          font-size: 0.875rem;
          color: #dc2626;
          font-weight: 500;
          animation: slideIn 0.2s ease;
        }

        .error-text {
          flex: 1;
        }

        .helper-text {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: #64748b;
          font-style: italic;
          padding-left: 0.25rem;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .form-input {
            padding: 0.875rem 3rem 0.875rem 1rem;
            font-size: 16px; /* Prevents zoom on iOS */
          }

          input[type="file"].form-input {
            padding: 0.625rem 3rem 0.625rem 0.875rem;
          }
        }
      `}</style>
    </div>
  )
}

export default FormInput
