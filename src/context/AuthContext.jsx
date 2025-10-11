import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext()

export { AuthContext }

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userData')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('savedEmail')
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const verifyToken = useCallback(async () => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('userData')
    
    if (!token || !userData) {
      clearAuthData()
      return false
    }

    try {
      // Create a controller to abort the request if it takes too long
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://resilinked-9mf9.vercel.app/api'}/auth/verify`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          // Add caching headers
          'Cache-Control': 'max-age=900' // Tell browsers to cache for 15 minutes
        },
        signal: controller.signal
      })
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const responseData = await response.json()
        
        // Don't update local data if the response indicates it's cached server-side
        // This prevents unnecessary state updates
        if (!responseData.cached) {
          try {
            const parsedUserData = JSON.parse(userData)
            
            // Update user data with fresh info if available
            const updatedUserData = {
              userId: parsedUserData.userId || responseData.user?.id || responseData.user?._id,
              userType: parsedUserData.userType || responseData.user?.userType,
              isVerified: parsedUserData.isVerified || responseData.user?.isVerified,
              firstName: parsedUserData.firstName || responseData.user?.firstName,
              lastName: parsedUserData.lastName || responseData.user?.lastName
            }
            
            localStorage.setItem('userData', JSON.stringify(updatedUserData))
            setUser(updatedUserData)
          } catch (parseError) {
            // If we can't parse the stored data, just continue with authentication
            console.error('Error parsing stored user data:', parseError)
          }
        }
        
        setIsAuthenticated(true)
        return true
      } else {
        // Don't log in production
        if (process.env.NODE_ENV !== 'production') {
          console.log('Token verification failed with status:', response.status)
        }
        
        // Only clear auth data for auth errors, not for server errors
        if (response.status === 401 || response.status === 403) {
          clearAuthData()
        }
        return false
      }
    } catch (error) {
      // Don't log in production unless it's not a timeout
      if (process.env.NODE_ENV !== 'production' && error.name !== 'AbortError') {
        console.error('Token verification error:', error)
      }
      
      // Don't clear auth data on network errors or timeouts
      // This prevents users from being logged out due to temporary network issues
      return null
    }
  }, [clearAuthData])

  useEffect(() => {
    const initAuth = async () => {
      // Set DEBUG_AUTH to false in production
      const DEBUG_AUTH = false;
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('userData')
      const lastVerified = localStorage.getItem('lastTokenVerification')
      
      if (DEBUG_AUTH) {
        console.log('AuthContext initialization:', { 
          token: !!token, 
          hasUserData: !!userData,
          lastVerified
        })
      }
      
      if (token && userData) {
        try {
          const parsedUserData = JSON.parse(userData)
          setUser(parsedUserData)
          setIsAuthenticated(true)
          
          // Only verify on startup if it's been more than 15 minutes since last verification
          const now = Date.now()
          const lastVerifiedTime = parseInt(lastVerified || '0')
          const fifteenMinutes = 15 * 60 * 1000
          
          if (!lastVerified || (now - lastVerifiedTime > fifteenMinutes)) {
            if (DEBUG_AUTH) {
              console.log('Verifying token on startup (last verified:', new Date(lastVerifiedTime).toLocaleTimeString(), ')')
            }
            
            // Don't wait for verification to complete
            verifyToken().then(result => {
              if (result) {
                localStorage.setItem('lastTokenVerification', now.toString())
              }
            }).catch(err => {
              console.error('Background token verification failed:', err);
            });
          } else if (DEBUG_AUTH) {
            console.log('Skipping verification, token verified recently at:', new Date(lastVerifiedTime).toLocaleTimeString())
          }
          
        } catch (error) {
          console.error('Error parsing user data:', error)
          clearAuthData()
        }
      }
      
      // Set loading to false whether we have auth data or not
      setLoading(false)
    }

    initAuth()

    // Set up periodic token verification with progressive backoff
    // Start with 15 minute interval, then double it up to 30 minutes max
    let verificationInterval = 15 * 60 * 1000 // Start with 15 minutes
    const maxInterval = 30 * 60 * 1000 // Max 30 minutes
    let consecutiveVerifications = 0
    
    const interval = setInterval(() => {
      if (isAuthenticated) {
        const lastVerified = localStorage.getItem('lastTokenVerification')
        const now = Date.now()
        const lastVerifiedTime = parseInt(lastVerified || '0')
        
        // Only verify if the current interval time has passed
        if (!lastVerified || (now - lastVerifiedTime > verificationInterval)) {
          verifyToken().then(result => {
            if (result) {
              localStorage.setItem('lastTokenVerification', now.toString())
              consecutiveVerifications++
              
              // Increase interval for next verification if we've had multiple successful verifications
              if (consecutiveVerifications > 2 && verificationInterval < maxInterval) {
                verificationInterval = Math.min(verificationInterval * 2, maxInterval)
              }
            } else {
              // If verification failed, reset to more frequent checks
              verificationInterval = 15 * 60 * 1000
              consecutiveVerifications = 0
            }
          })
        }
      }
    }, 60000) // Check every minute if we should verify based on our dynamic interval

    return () => clearInterval(interval)
  }, [isAuthenticated, verifyToken, clearAuthData])

  const login = (token, userData) => {
    // Set DEBUG_AUTH to true to show authentication-related logs
    const DEBUG_AUTH = false;
    if (DEBUG_AUTH) {
      console.log('Login called with:', { token: !!token, userData })
    }
    localStorage.setItem('token', token)
    localStorage.setItem('userData', JSON.stringify(userData))
    setUser(userData)
    setIsAuthenticated(true)
    if (DEBUG_AUTH) {
      console.log('Login completed, auth state:', { isAuthenticated: true, user: userData })
    }
  }

  const logout = useCallback(() => {
    clearAuthData()
  }, [clearAuthData])

  const updateUser = (updatedUserData) => {
    const newUserData = { ...user, ...updatedUserData }
    localStorage.setItem('userData', JSON.stringify(newUserData))
    setUser(newUserData)
  }

  // Check if user has access to specific dashboard types
  const hasAccessTo = useCallback((dashboardType) => {
    // Set DEBUG_ACCESS to true to show permission-related logs
    const DEBUG_ACCESS = false;
    if (DEBUG_ACCESS) {
      console.log('hasAccessTo check:', {
        dashboardType,
        isAuthenticated,
        user,
        userType: user?.userType
      })
    }
    
    if (!isAuthenticated || !user) {
      if (DEBUG_ACCESS) {
        console.log('Access denied: not authenticated or no user data')
      }
      return false
    }
    
    switch (dashboardType) {
      case 'employee':
        const hasEmployeeAccess = user.userType === 'employee' || user.userType === 'both'
        if (DEBUG_ACCESS) {
          console.log('Employee access check:', hasEmployeeAccess)
        }
        return hasEmployeeAccess
      case 'employer':
        const hasEmployerAccess = user.userType === 'employer' || user.userType === 'both'
        if (DEBUG_ACCESS) {
          console.log('Employer access check:', hasEmployerAccess)
        }
        return hasEmployerAccess
      case 'admin':
        const hasAdminAccess = user.userType === 'admin'
        if (DEBUG_ACCESS) {
          console.log('Admin access check:', hasAdminAccess)
        }
        return hasAdminAccess
      default:
        if (DEBUG_ACCESS) {
          console.log('Unknown dashboard type:', dashboardType)
        }
        return false
    }
  }, [isAuthenticated, user])

  const value = {
    user,
    isAuthenticated,
    isLoggedIn: isAuthenticated, // Alias for backward compatibility
    loading,
    login,
    logout,
    updateUser,
    verifyToken,
    hasAccessTo,
    clearAuthData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
