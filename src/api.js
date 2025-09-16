class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'https://resi-backend-1.onrender.com';
    this.DEBUG = true; // Set this to true to enable debug logging
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    if (
      config.body &&
      typeof config.body === 'object' &&
      config.headers['Content-Type'] === 'application/json'
    ) {
      config.body = JSON.stringify(config.body);
    }

    try {
      if (this.DEBUG) {
        console.log(`Making API request to: ${this.baseURL}${endpoint}`);
        console.log('Request config:', config);
      }
      
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();

      if (this.DEBUG) {
        console.log('API response:', response.status, data);
      }

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 401) {
          // Unauthorized - but don't automatically clear auth data
          if (this.DEBUG) console.warn('401 Unauthorized response received');
          throw new Error('Unauthorized: Authentication required');
        } else if (response.status === 403) {
          throw new Error('Forbidden: You don\'t have permission to perform this action');
        } else {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
      }

      return data;
    } catch (error) {
      if (this.DEBUG) console.error('API request failed:', error);
      throw error;
    }
  }

  // ================= Auth =================
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  }

  async register(userData) {
    const token = localStorage.getItem('token');
    const formData = new FormData();

    Object.keys(userData).forEach((key) => {
      if (key === 'skills' && Array.isArray(userData[key])) {
        userData[key].forEach((skill) => formData.append('skills', skill));
      } else if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });

    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    return response.json();
  }

  async verifyEmail(token) {
    return this.request('/auth/verify', {
      method: 'POST',
      body: { token },
    });
  }

  async requestPasswordReset(email) {
    return this.request('/auth/reset/request', {
      method: 'POST',
      body: { email },
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset', {
      method: 'POST',
      body: { token, newPassword },
    });
  }

  // ================= User =================
  async getProfile() {
    return this.request('/users/me');
  }

  async updateProfile(updates) {
    return this.request('/users/me', {
      method: 'PUT',
      body: updates,
    });
  }

  async updateProfileWithFile(formData) {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${this.baseURL}/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header for FormData - browser will set it with boundary
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // ================= Jobs =================
  async getJobs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `/jobs?${queryParams}`;
    console.log('API getJobs - URL:', url);
    console.log('API getJobs - Filters:', filters);
    return this.request(url);
  }

  async searchJobs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/jobs/search?${queryParams}`);
  }

  async getJob(id) {
    return this.request(`/jobs/${id}`);
  }

  async createJob(jobData) {
    return this.request('/jobs', {
      method: 'POST',
      body: jobData,
    });
  }

  async applyToJob(jobId) {
    return this.request(`/jobs/${jobId}/apply`, {
      method: 'POST',
    });
  }

  async getMyJobMatches() {
    return this.request('/jobs/my-matches');
  }

  async getMyApplications() {
    return this.request('/jobs/my-applications');
  }

  async assignWorker(jobId, userId) {
    return this.request(`/jobs/${jobId}/assign`, {
      method: 'POST',
      body: { userId }
    });
  }

  async getPopularJobs() {
    return this.request('/jobs/popular');
  }

  // ================= Ratings =================
  async rateUser(ratingData) {
    return this.request('/ratings', {
      method: 'POST',
      body: ratingData,
    });
  }

  async getUserRatings(userId) {
    return this.request(`/ratings/${userId}`);
  }

  // ================= Admin =================
  async getDashboardStats() {
    return this.request('/admin/dashboard');
  }

  async getUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/admin/users?${queryParams}`);
  }

  async getUser(userId) {
    return this.request(`/admin/users/${userId}`);
  }

  async updateUser(userId, updates) {
    return this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteUser(userId) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getAdminJobs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    console.log('Calling admin jobs endpoint with params:', queryParams);
    try {
      const response = await this.request(`/admin/jobs?${queryParams}`);
      console.log('Admin jobs response:', response);
      return response;
    } catch (error) {
      console.error('Admin jobs API error:', error);
      throw error;
    }
  }

  async updateJob(jobId, updates) {
    return this.request(`/admin/jobs/${jobId}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteJob(jobId) {
    return this.request(`/admin/jobs/${jobId}`, {
      method: 'DELETE',
    });
  }

  async exportUsersPDF() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${this.baseURL}/admin/users/download/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return response.blob();
    } else {
      throw new Error('Failed to export PDF');
    }
  }

  // ================= Employees =================
  async getEmployeeStats(userId) {
    return this.request(`/employees/${userId}/stats`);
  }

  async getEmployeeApplications(userId) {
    return this.request(`/employees/${userId}/applications`);
  }

  async getEmployeeProfile(userId) {
    return this.request(`/employees/${userId}/profile`);
  }

  async updateEmployeeProfile(userId, profileData) {
    return this.request(`/employees/${userId}/profile`, {
      method: 'PUT',
      body: profileData,
    });
  }

  async searchEmployees(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/employees/search?${queryParams}`);
  }

  async sendJobRequest(employeeId, jobData) {
    return this.request(`/employees/${employeeId}/job-request`, {
      method: 'POST',
      body: jobData,
    });
  }

  async getJobRequests(userId) {
    return this.request(`/users/${userId}/job-requests`);
  }

  async respondToJobRequest(requestId, response) {
    return this.request(`/job-requests/${requestId}/respond`, {
      method: 'POST',
      body: { response },
    });
  }
}

// ✅ Only one instance exported
const apiService = new ApiService();

// Create a simple apiCall function for backward compatibility
export const apiCall = async (endpoint, method = 'GET', data = null) => {
  const options = { method };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = data;
  }
  
  return await apiService.request(endpoint, options);
};

export default apiService;
