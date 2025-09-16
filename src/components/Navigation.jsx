import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navigation() {
  const { user, logout, hasAccessTo, isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);
  
  // Set to false to disable debug logging
  const DEBUG = false;
  
  // Debug logging only if DEBUG is true
  if (DEBUG) {
    console.log('🧭 Navigation render:', { 
      isAuthenticated, 
      user: !!user, 
      userType: user?.userType,
      loading,
      currentPath: location.pathname
    });
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getDashboardLink = () => {
    if (user?.userType === 'admin') return '/admin-dashboard'
    if (user?.userType === 'employer') return '/employer-dashboard'
    return '/employee-dashboard'
  };

  const NavLink = ({ to, children, className = '' }) => (
    <Link 
      to={to}
      className={`nav-link ${isActivePage(to) ? 'active' : ''} ${className}`}
      onClick={() => setIsMenuOpen(false)}
    >
      {children}
    </Link>
  );

  return (
    <>
      <nav className="main-navigation">
        {isAuthenticated ? (
          <>
            {/* Desktop Navigation */}
            <div className="nav-desktop">
              <div className="nav-links">
                <NavLink to="/search-jobs">
                  <span className="nav-icon">🔍</span>
                  Find Jobs
                </NavLink>
                
                {(user?.userType === 'employee' || user?.userType === 'both') && (
                  <NavLink to="/employee-dashboard">
                    <span className="nav-icon">👤</span>
                    <span style={{ fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>Employee Dashboard</span>
                  </NavLink>
                )}

                {(user?.userType === 'employer' || user?.userType === 'both') && (
                  <>
                    <NavLink to="/employer-dashboard">
                      <span className="nav-icon">💼</span>
                      <span style={{ fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>Employer Dashboard</span>
                    </NavLink>
                    <NavLink to="/post-job">
                      <span className="nav-icon">➕</span>
                      Post Job
                    </NavLink>
                  </>
                )}

                {user?.userType === 'admin' && (
                  <NavLink to="/admin-dashboard">
                    <span className="nav-icon">⚙️</span>
                    Admin
                  </NavLink>
                )}
              </div>

              {/* User Menu */}
              <div className="user-menu" ref={userMenuRef}>
                <button 
                  className="user-menu-trigger"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="user-avatar">
                    {user?.firstName?.[0] || 'U'}
                  </div>
                  <span className="user-name">{user?.firstName || 'User'}</span>
                  <span className={`dropdown-arrow ${userMenuOpen ? 'open' : ''}`}>▼</span>
                </button>

                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <div className="user-details">
                        <span className="user-full-name">
                          {user?.firstName} {user?.lastName}
                        </span>
                        <span className="user-role">{user?.userType}</span>
                      </div>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <span className="dropdown-icon">👤</span>
                      Profile
                    </Link>
                    
                    <Link to="/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      <span className="dropdown-icon">⚙️</span>
                      Settings
                    </Link>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button onClick={handleLogout} className="dropdown-item logout-item">
                      <span className="dropdown-icon">🚪</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="mobile-menu-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className={`hamburger ${isMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          </>
        ) : (
          /* Guest Navigation */
          <div className="nav-desktop">
            <div className="nav-links">
              <NavLink to="/search-jobs">
                <span className="nav-icon">🔍</span>
                Find Jobs
              </NavLink>
              <NavLink to="/login" className="btn-outline">
                Login
              </NavLink>
              <NavLink to="/register" className="btn-primary">
                Get Started
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" ref={menuRef}>
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              <div className="user-info-mobile">
                <div className="user-avatar-mobile">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div className="user-details-mobile">
                  <span className="user-name-mobile">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="user-role-mobile">{user?.userType}</span>
                </div>
              </div>
            </div>

            <div className="mobile-nav-links">
              <NavLink to="/search-jobs">
                <span className="nav-icon">🔍</span>
                Find Jobs
              </NavLink>
              
              <NavLink to="/profile">
                <span className="nav-icon">👤</span>
                Profile
              </NavLink>

              {(user?.userType === 'employee' || user?.userType === 'both') && (
                <>
                  <NavLink to="/employee-dashboard">
                    <span className="nav-icon">📊</span>
                    Employee Dashboard
                  </NavLink>
                  <NavLink to="/post-profile">
                    <span className="nav-icon">📝</span>
                    Post Profile
                  </NavLink>
                </>
              )}

              {(user?.userType === 'employer' || user?.userType === 'both') && (
                <>
                  <NavLink to="/employer-dashboard">
                    <span className="nav-icon">💼</span>
                    Employer Dashboard
                  </NavLink>
                  <NavLink to="/post-job">
                    <span className="nav-icon">➕</span>
                    Post Job
                  </NavLink>
                </>
              )}

              {user?.userType === 'admin' && (
                <NavLink to="/admin-dashboard">
                  <span className="nav-icon">⚙️</span>
                  Admin Dashboard
                </NavLink>
              )}

              <NavLink to="/settings">
                <span className="nav-icon">⚙️</span>
                Settings
              </NavLink>

              <button onClick={handleLogout} className="mobile-logout-btn">
                <span className="nav-icon">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .main-navigation {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
        }

        .nav-desktop {
          display: flex;
          align-items: center;
          gap: var(--spacing-6);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: var(--spacing-4);
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: var(--spacing-2);
          color: white;
          text-decoration: none;
          padding: var(--spacing-3) var(--spacing-5);
          border-radius: var(--radius-xl);
          font-weight: 500;
          font-size: var(--font-size-sm);
          transition: all var(--transition-fast);
          white-space: nowrap;
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.2);
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .nav-link.active {
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .nav-link.btn-outline {
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.4);
          font-weight: 600;
        }

        .nav-link.btn-outline:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.6);
        }

        .nav-link.btn-primary {
          background: linear-gradient(135deg, var(--success-500) 0%, var(--success-600) 100%);
          color: white;
          font-weight: 600;
          border: none;
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
        }

        .nav-link.btn-primary:hover {
          background: linear-gradient(135deg, var(--success-600) 0%, var(--success-700) 100%);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
        }

        .nav-icon {
          font-size: var(--font-size-base);
        }

        /* User Menu */
        .user-menu {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: var(--spacing-2) var(--spacing-4);
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: all var(--transition-fast);
          backdrop-filter: blur(20px);
        }

        .user-menu-trigger:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.1);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-400) 0%, var(--primary-600) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: var(--font-size-sm);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: var(--font-size-sm);
          box-shadow: var(--shadow-sm);
        }

        .user-name {
          font-weight: 500;
          font-size: var(--font-size-sm);
        }

        .dropdown-arrow {
          font-size: var(--font-size-xs);
        }

        .dropdown-arrow.open {
          transform: rotate(180deg);
        }

        .user-dropdown {
          position: absolute;
          top: calc(100% + var(--spacing-2));
          right: 0;
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--gray-200);
          min-width: 220px;
          overflow: hidden;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .user-info {
          padding: var(--spacing-4);
          background: var(--gray-50);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-1);
        }

        .user-full-name {
          font-weight: 600;
          color: var(--gray-800);
          font-size: var(--font-size-sm);
        }

        .user-role {
          font-size: var(--font-size-xs);
          color: var(--gray-500);
          text-transform: capitalize;
        }

        .dropdown-divider {
          height: 1px;
          background: var(--gray-200);
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-3) var(--spacing-4);
          color: var(--gray-700);
          text-decoration: none;
          font-size: var(--font-size-sm);
          transition: all var(--transition-fast);
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: var(--gray-100);
          color: var(--gray-900);
          text-decoration: none;
        }

        .logout-item {
          color: var(--error-600);
        }

        .logout-item:hover {
          background: var(--error-50);
          color: var(--error-700);
        }

        .dropdown-icon {
          font-size: var(--font-size-base);
        }

        /* Mobile Menu */
        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-2);
        }

        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .hamburger span {
          width: 24px;
          height: 2px;
          background: white;
          border-radius: 2px;
        }

        .hamburger.open span:nth-child(1) {
          transform: rotate(45deg) translate(6px, 6px);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }

        .mobile-menu-overlay {
          position: fixed;
          top: var(--header-height);
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          backdrop-filter: blur(5px);
        }

        .mobile-menu {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(168, 85, 247, 0.05) 100%);
          border-radius: 0 0 var(--radius-2xl) var(--radius-2xl);
          box-shadow: 0 20px 56px rgba(147, 51, 234, 0.2);
          animation: fadeIn 0.2s ease;
          backdrop-filter: blur(20px);
          border: 1px solid var(--primary-200);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .mobile-menu-header {
          padding: var(--spacing-6);
          background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-50) 100%);
          border-bottom: 1px solid var(--primary-200);
        }

        .user-info-mobile {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
        }

        .user-avatar-mobile {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
          font-size: var(--font-size-lg);
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.3);
          border: 2px solid var(--primary-300);
        }

        .user-details-mobile {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-1);
        }

        .user-name-mobile {
          font-weight: 600;
          color: var(--gray-800);
          font-size: var(--font-size-base);
        }

        .user-role-mobile {
          font-size: var(--font-size-sm);
          color: var(--gray-500);
          text-transform: capitalize;
        }

        .mobile-nav-links {
          padding: var(--spacing-4);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-2);
        }

        .mobile-nav-links .nav-link {
          color: var(--gray-700);
          background: rgba(255, 255, 255, 0.8);
          padding: var(--spacing-4);
          border-radius: var(--radius-xl);
          font-size: var(--font-size-base);
          border: 1px solid var(--primary-200);
          backdrop-filter: blur(10px);
        }

        .mobile-nav-links .nav-link:hover,
        .mobile-nav-links .nav-link.active {
          background: var(--primary-100);
          color: var(--primary-700);
          border-color: var(--primary-300);
        }

        .mobile-logout-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-3);
          padding: var(--spacing-4);
          background: var(--error-50);
          color: var(--error-600);
          border: 1px solid var(--error-200);
          border-radius: var(--radius-xl);
          font-size: var(--font-size-base);
          cursor: pointer;
          width: 100%;
          transition: all var(--transition-fast);
          backdrop-filter: blur(10px);
        }

        .mobile-logout-btn:hover {
          background: var(--error-100);
          color: var(--error-700);
          border-color: var(--error-300);
          transform: translateX(4px);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .nav-links {
            gap: var(--spacing-2);
          }

          .nav-link {
            padding: var(--spacing-2) var(--spacing-3);
            font-size: var(--font-size-xs);
          }

          .user-name {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .nav-desktop {
            display: none;
          }

          .mobile-menu-button {
            display: block;
          }
        }
      `}</style>
    </>
  );
}

export default Navigation;
