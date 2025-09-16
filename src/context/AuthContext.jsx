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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://resilinked-9mf9.vercel.app/api'}/auth/verify`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const responseData = await response.json()
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
        setIsAuthenticated(true)
        return true
      } else {
        // Set DEBUG_AUTH to true to show authentication-related logs
        const DEBUG_AUTH = false;
        if (DEBUG_AUTH) {
          console.log('Token verification failed')
        }
        clearAuthData()
        return false
      }
    } catch (error) {
      // Keep error logging for debugging
      console.error('Token verification error:', error)
      // Don't clear auth data on network errors
      return null
    }
  }, [clearAuthData])

  useEffect(() => {
    const initAuth = async () => {
      // Set DEBUG_AUTH to true to show authentication-related logs
      const DEBUG_AUTH = true;
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('userData')
      
      if (DEBUG_AUTH) {
        console.log('AuthContext initialization:', { token: !!token, userData })
      }
      
      if (token && userData) {
        try {
          const parsedUserData = JSON.parse(userData)
          if (DEBUG_AUTH) {
            console.log('Parsed user data:', parsedUserData)
          }
          setUser(parsedUserData)
          setIsAuthenticated(true)
          if (DEBUG_AUTH) {
            console.log('✅ Authentication state set to true')
          }
          
          // Verify token in background but don't wait for it
          verifyToken().catch(err => {
            console.error('Background token verification failed:', err);
          });
        } catch (error) {
          console.error('Error parsing user data:', error)
          clearAuthData()
        }
      } else if (DEBUG_AUTH) {
        console.log('No token or userData found in localStorage')
      }
      
      // Set loading to false whether we have auth data or not
      setLoading(false)
    }

    initAuth()

    // Set up periodic token verification
    const interval = setInterval(() => {
      if (isAuthenticated) {
        verifyToken()
      }
    }, 30000) // Check every 30 seconds

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
