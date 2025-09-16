import { createContext, useContext, useState, useCallback } from 'react'

const AlertContext = createContext()

export { AlertContext }

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider')
  }
  return context
}

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([])

  const addAlert = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const alert = { id, message, type, duration }
    
    setAlerts(prev => [...prev, alert])

    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id)
      }, duration)
    }

    return id
  }, [])

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }, [])

  const success = useCallback((message, duration = 4000) => {
    return addAlert(message, 'success', duration)
  }, [addAlert])

  const error = useCallback((message, duration = 6000) => {
    return addAlert(message, 'error', duration)
  }, [addAlert])

  const warning = useCallback((message, duration = 5000) => {
    return addAlert(message, 'warning', duration)
  }, [addAlert])

  const info = useCallback((message, duration = 4000) => {
    return addAlert(message, 'info', duration)
  }, [addAlert])

  const value = {
    alerts,
    addAlert,
    removeAlert,
    success,
    error,
    warning,
    info
  }

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
    </AlertContext.Provider>
  )
}

function AlertContainer({ alerts, removeAlert }) {
  return (
    <div className="alert-container">
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          alert={alert}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
      
      <style>{`
        .alert-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          font-family: Arial, sans-serif;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

function Alert({ alert, onClose }) {
  const getBackgroundColor = (type) => {
    const colors = {
      success: '#d1fae5',
      error: '#fee2e2',
      warning: '#fef3c7',
      info: '#e0f2fe'
    }
    return colors[type] || colors.info
  }

  const getTextColor = (type) => {
    const colors = {
      success: '#065f46',
      error: '#991b1b',
      warning: '#92400e',
      info: '#0c4a6e'
    }
    return colors[type] || colors.info
  }

  const getBorderColor = (type) => {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#0ea5e9'
    }
    return colors[type] || colors.info
  }

  const getIcon = (type) => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }
    return icons[type] || icons.info
  }

  const getTitle = (type) => {
    const titles = {
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    }
    return titles[type] || titles.info
  }

  return (
    <div className="alert-box">
      <div className="alert-content">
        <span className="alert-icon">{getIcon(alert.type)}</span>
        <div className="alert-text">
          <div className="alert-title">{getTitle(alert.type)}</div>
          <div className="alert-message">{alert.message}</div>
        </div>
        <button onClick={onClose} className="alert-close">×</button>
      </div>

      <style>{`
        .alert-box {
          background: ${getBackgroundColor(alert.type)};
          color: ${getTextColor(alert.type)};
          padding: 16px 20px;
          margin: 8px 0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-left: 4px solid ${getBorderColor(alert.type)};
          min-width: 300px;
          max-width: 400px;
          word-wrap: break-word;
          pointer-events: all;
          position: relative;
          animation: slideInRight 0.3s ease forwards;
        }

        .alert-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .alert-icon {
          font-size: 18px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .alert-text {
          flex: 1;
        }

        .alert-title {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .alert-message {
          font-size: 14px;
          line-height: 1.4;
        }

        .alert-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          margin-left: 8px;
          opacity: 0.7;
        }

        .alert-close:hover {
          opacity: 1;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
