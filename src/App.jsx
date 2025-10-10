import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'

// Import all page components
import Home from './components/Home'
import Login from './components/Login'
import Register from './components/Register'
import Landing from './components/Landing'
import Profile from './components/Profile'
import PostProfile from './components/PostProfile'
import PostJob from './components/PostJob'
import SearchJobs from './components/SearchJobs'
import JobsManagement from './components/JobsManagement'
import EmployeeDashboard from './components/EmployeeDashboard'
import EmployerDashboard from './components/EmployerDashboard'
import AdminDashboard from './components/AdminDashboard'
import Settings from './components/Settings'
import Help from './components/Help'
import UserDetails from './components/UserDetails'
import ResetRequest from './components/ResetRequest'
import ResetPassword from './components/ResetPassword'

// Layout component
import Layout from './components/Layout'

// Auth context for managing user state
import { AuthProvider, useAuth } from './context/AuthContext'
import { AlertProvider } from './context/AlertContext'

// Protected Route component
function ProtectedRoute({ children, requiredUserType = null }) {
  const { user, isAuthenticated, loading } = useAuth()
  
  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="spinner" style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(147, 51, 234, 0.2)',
          borderTop: '4px solid #9333ea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading your session...</p>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  // Redirect if not authenticated
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />
  }
  
  // Redirect if wrong user type
  if (requiredUserType && user?.userType !== requiredUserType) {
    console.log('Wrong user type, redirecting to landing');
    return <Navigate to="/landing" replace />
  }
  
  // User is authenticated and has correct role
  return children
}

// Admin Route component
function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredUserType="admin">
      {children}
    </ProtectedRoute>
  )
}

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-request" element={<ResetRequest />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/help" element={<Help />} />
            
            {/* Protected routes */}
            <Route path="/landing" element={
              <ProtectedRoute>
                <Landing />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            <Route path="/post-profile" element={
              <ProtectedRoute>
                <PostProfile />
              </ProtectedRoute>
            } />
            
            <Route path="/post-job" element={
              <ProtectedRoute>
                <PostJob />
              </ProtectedRoute>
            } />
            
            <Route path="/search-jobs" element={
              <ProtectedRoute>
                <SearchJobs />
              </ProtectedRoute>
            } />
            
            <Route path="/jobs-management" element={
              <ProtectedRoute>
                <JobsManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/employee-dashboard" element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/employer-dashboard" element={
              <ProtectedRoute>
                <EmployerDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            
            <Route path="/user-details/:userId" element={
              <ProtectedRoute>
                <UserDetails />
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin-dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </AlertProvider>
  )
}export default App
