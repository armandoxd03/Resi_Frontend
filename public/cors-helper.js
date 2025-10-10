window.addEventListener('DOMContentLoaded', (event) => {
  // Create a small utility to help with CORS issues in development
  if (window.location.hostname === 'localhost') {
    console.log('📡 Setting up CORS helper for development');
    
    // Store the original fetch
    const originalFetch = window.fetch;
    
    // Override fetch to add CORS mode
    window.fetch = function(url, options = {}) {
      // Only modify requests to the backend
      if (typeof url === 'string' && url.includes('resilinked-backend.onrender.com')) {
        options.mode = 'cors';
        options.credentials = 'include';
        
        // Ensure headers exist
        if (!options.headers) {
          options.headers = {};
        }
        
        // Add custom header to help with CORS
        if (options.headers instanceof Headers) {
          options.headers.append('X-Requested-With', 'XMLHttpRequest');
        } else {
          options.headers['X-Requested-With'] = 'XMLHttpRequest';
        }
        
        console.log(`🔄 Modified request to: ${url}`);
      }
      
      return originalFetch.call(this, url, options);
    };
  }
});