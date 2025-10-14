class ApiService {
  constructor() {
    this.baseURL =
      import.meta.env.VITE_API_URL ||
      "https://resi-backend-1.onrender.com/api";
    this.DEBUG = true;
  }

  normalizeEndpoint(endpoint) {
    return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    endpoint = this.normalizeEndpoint(endpoint);

    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    // Only attach Authorization header for protected endpoints
    const protectedRoutes = [
      "/auth/logout",
      "/users/me",
      "/users/edit",
      "/users/goals",
      "/users/applications",
      "/users/notifications",
      "/jobs/my-jobs",
      "/jobs/my-applications",
      "/jobs/my-matches",
      "/dashboard",
      "/analytics",
      "/auth/me",
      "/users/me/password",
      "/users/me/settings"
    ];
    const isProtected = protectedRoutes.some(route => endpoint.startsWith(route));
    const isAuthRoute = endpoint === "/auth/login" || endpoint === "/auth/register";
    if (token && (isProtected || !isAuthRoute)) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }

    const config = {
      method: options.method || "GET",
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: "include",
      ...options,
    };

    const isFormData = options.body instanceof FormData;
    if (config.body && typeof config.body === "object" && !isFormData) {
      config.body = JSON.stringify(config.body);
    }
    if (isFormData) {
      delete config.headers["Content-Type"];
    }

    try {
      if (this.DEBUG) {
        console.log(
          `🌐 API Request: ${config.method} ${this.baseURL}${endpoint}`
        );
        if (!isFormData && config.body) {
          console.log("📦 Request body:", JSON.parse(config.body));
        }
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else if (contentType?.includes("application/pdf")) {
        data = await response.blob();
      } else {
        data = await response.text();
      }

      if (this.DEBUG) {
        console.log(
          `📨 API Response: ${response.status} ${response.statusText}`
        );
        if (contentType?.includes("application/json")) {
          console.log("📦 Response data:", data);
        }
      }

      if (typeof data === "object" && data !== null) {
        data._httpStatus = response.status;
      }

      if (!response.ok) {
        const isProfilePictureUpload =
          endpoint === "/users/me" && config.method === "PUT" && isFormData;
        const isProfileUpdate =
          endpoint === "/users/me" && config.method === "PUT";

        // Handle rate limiting
        if (response.status === 429) {
          throw new Error("Too many attempts. Please wait and try again later.");
        }

        if (response.status === 401 && !isProfilePictureUpload && !isProfileUpdate) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("storage"));
          throw new Error(data?.alert || data?.message || "Session expired. Please login again.");
        } else if (response.status === 403) {
          throw new Error(data?.alert || data?.message || "Forbidden: You don't have permission");
        } else if (response.status === 404) {
          throw new Error("Resource not found");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
          if (
            response.status === 401 &&
            (isProfilePictureUpload || isProfileUpdate)
          ) {
            throw new Error(
              "Authentication required. Please try saving your changes again."
            );
          }
          throw new Error(
            data?.message ||
              data?.error ||
              `HTTP error! status: ${response.status}`
          );
        }
      }

      return data;
    } catch (error) {
      if (this.DEBUG) {
        console.error("❌ API request failed:", error);
        console.error("Error details:", {
          endpoint: `${this.baseURL}${endpoint}`,
          method: config.method,
          error: error.message,
        });
      }

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      throw error;
    }
  }

  // ================= Auth =================
  async login(credentials) {
    return this.request("/auth/login", {
      method: "POST",
      body: credentials,
    });
  }

  async register(userData) {
    if (userData.profilePicture instanceof File) {
      const formData = new FormData();
      Object.keys(userData).forEach((key) => {
        if (key === "skills" && Array.isArray(userData[key])) {
          userData[key].forEach((skill) => formData.append("skills", skill));
        } else if (userData[key] != null) {
          formData.append(key, userData[key]);
        }
      });

      return this.request("/auth/register", {
        method: "POST",
        headers: {},
        body: formData,
      });
    } else {
      return this.request("/auth/register", {
        method: "POST",
        body: userData,
      });
    }
  }

  async verifyEmail(token) {
    return this.request("/auth/verify", {
      method: "POST",
      body: { token },
    });
  }

  async requestPasswordReset(email) {
    return this.request("/auth/reset/request", {
      method: "POST",
      body: { email },
    });
  }

  async resetPassword(token, newPassword) {
    return this.request("/auth/reset", {
      method: "POST",
      body: { token, newPassword },
    });
  }

  async logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("savedEmail");

    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch {
      console.warn("Backend logout failed, but local state cleared");
    }
  }

  // ================= Users =================
  async getProfileMe() {
    return this.request("/users/me");
  }

  async getWorkers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/workers${query ? "?" + query : ""}`);
  }

    // Employee dashboard stats
    async getEmployeeDashboardStats(userId) {
      return this.request(`/dashboard/employee/${userId}/stats`);
    }

  async getProfile(userId) {
    return this.request(`/users/${userId}`);
  }
  
  async getUserRatings(userId) {
    return this.request(`/ratings/${userId}`);
  }

  async updateProfile(updates) {
    try {
      return await this.request("/users/me", {
        method: "PUT",
        body: updates,
      });
    } catch (error) {
      if (
        error.message.includes("Session expired") ||
        error.message.includes("Authentication required")
      ) {
        throw new Error("Please check your authentication and try again.");
      }
      throw error;
    }
  }

  async updateProfileWithFile(formData) {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    if (!token) {
      throw new Error("Authentication required. Please log in again.");
    }

    // Add required user data to formData
    if (!formData.get('firstName')) formData.append('firstName', userData.firstName || '');
    if (!formData.get('lastName')) formData.append('lastName', userData.lastName || '');
    if (!formData.get('email')) formData.append('email', userData.email || '');

    try {
      return await this.request("/users/me", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });
    } catch (error) {
      if (
        error.message.includes("Session expired") ||
        error.message.includes("Authentication required")
      ) {
        throw new Error("Please check your authentication and try again.");
      }
      throw error;
    }
  }

  async getWorkers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/workers${query ? "?" + query : ""}`);
  }

  // ================= Ratings =================
  async getUserRatings(userId) {
    return this.request(`/ratings/${userId}`);
  }

  async getTopRated() {
    return this.request("/ratings/top-rated");
  }

  async getGivenRatings() {
    return this.request("/ratings/given");
  }

  async rateUser(ratingData) {
    return this.request("/ratings", {
      method: "POST",
      body: ratingData,
    });
  }

  async reportRating(ratingId) {
    return this.request(`/ratings/${ratingId}/report`, {
      method: "POST",
    });
  }

  // ================= Jobs =================
  async getPopularJobs() {
    return this.request("/jobs/popular");
  }

  async getMyMatches() {
    try {
      console.log('Getting job matches from API');
      const result = await this.request("/jobs/my-matches");
      console.log('Job matches API result:', result);
      return result;
    } catch (error) {
      console.error('Error getting job matches:', error);
      if (error.message.includes('Resource not found')) {
        return { jobs: [], error: 'Job matching service not available' };
      }
      throw error;
    }
  }

  async getJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/jobs${query ? "?" + query : ""}`);
  }

  async getJob(id) {
    return this.request(`/jobs/${id}`);
  }

  async createJob(jobData) {
    return this.request("/jobs", {
      method: "POST",
      body: jobData,
    });
  }

  async applyToJob(jobId) {
    return this.request(`/jobs/${jobId}/apply`, {
      method: "POST",
    });
  }

  async cancelApplication(jobId) {
    try {
      const result = await this.request(`/jobs/${jobId}/cancel-application`, {
        method: "DELETE",
      });
      
      return result;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('cancelApplication API error:', error);
      }
      // Enhance error handling to provide better error messages
      if (error.message.includes('No application found')) {
        throw new Error('No application found');
      }
      throw error;
    }
  }

  async getMyJobs() {
    return this.request("/jobs/my-jobs");
  }

  async getMyApplications() {
    return this.request("/jobs/my-applications");
  }

  async getMyApplicationsReceived() {
    return this.request("/jobs/my-applications-received");
  }

  async searchJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/jobs/search${query ? "?" + query : ""}`);
  }

  async closeJob(jobId) {
    return this.request(`/jobs/${jobId}/close`, {
      method: "PUT",
    });
  }
  
  async completeJob(jobId) {
    return this.request(`/jobs/${jobId}/complete`, {
      method: "PUT",
    });
  }

  async deleteJob(jobId) {
    return this.request(`/jobs/${jobId}`, {
      method: "DELETE",
    });
  }
  
  async editJob(jobId, jobData) {
    try {
      console.log('Making editJob API call:', {
        jobId,
        endpoint: `/jobs/${jobId}`,
        hasToken: !!localStorage.getItem("token")
      });
      
      const result = await this.request(`/jobs/${jobId}`, {
        method: "PUT",
        body: jobData,
      });
      
      console.log('Edit job API response:', result);
      return result;
    } catch (error) {
      console.error('Error in editJob API call:', error);
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: You can only edit your own jobs');
      }
      throw error;
    }
  }

  async assignWorker(jobId, userId) {
    return this.request(`/jobs/${jobId}/assign`, {
      method: "POST",
      body: { userId },
    });
  }

  async rejectApplication(jobId, userId) {
    return this.request(`/jobs/${jobId}/reject`, {
      method: "POST",
      body: { userId },
    });
  }
  
  async inviteWorker(jobId, workerId) {
    console.log('Sending invitation request:', { jobId, workerId });
    
    if (!jobId || !workerId) {
      console.error('Missing required parameters for invitation');
      throw new Error('Missing jobId or workerId');
    }
    
    try {
      // Verify the job exists first
      try {
        await this.getJob(jobId);
      } catch (jobError) {
        console.error('Job verification failed:', jobError);
        throw new Error('Job not found or no longer available');
      }
      
      // Send the invitation
      const result = await this.request(`/jobs/${jobId}/invite`, {
        method: "POST",
        body: { workerId },
      });
      
      console.log('Invitation response:', result);
      return result;
    } catch (error) {
      console.error('Invitation API error:', error);
      
      // Provide more helpful error messages
      if (error.message.includes('404')) {
        throw new Error('Job not found. It may have been deleted or closed.');
      } else if (error.message.includes('403')) {
        throw new Error('Not authorized to send this invitation.');
      } else if (error.message.includes('400')) {
        throw new Error('Invalid request. Please check worker and job details.');
      } else {
        throw error;
      }
    }
  }

  async updateApplicantStatus(jobId, userId, status) {
    return this.request(`/jobs/${jobId}/applicants/${userId}`, {
      method: "PUT",
      body: { status },
    });
  }

  // ================= Goals =================
  async createGoal(goalData) {
    return this.request("/goals", {
      method: "POST",
      body: goalData,
    });
  }

  async getMyGoals(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/goals${query ? "?" + query : ""}`);
  }

  async updateGoal(goalId, updates) {
    return this.request(`/goals/${goalId}`, {
      method: "PUT",
      body: updates,
    });
  }

  async deleteGoal(goalId) {
    return this.request(`/goals/${goalId}`, {
      method: "DELETE",
    });
  }
  
  async addIncomeToGoal(data) {
    return this.request('/goals/income', {
      method: "POST",
      body: data
    });
  }
  
  async setActiveGoal(goalId, isPriority = false) {
    return this.request(`/goals/${goalId}/activate`, {
      method: "POST",
      body: { isPriority }
    });
  }

  // ================= Notifications =================
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/notifications${query ? "?" + query : ""}`);
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  }

  async markAllNotificationsAsRead() {
    return this.request("/notifications/read-all", {
      method: "PATCH",
      body: { all: true },
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
  }

  // ================= Reports =================
  async reportUser(reportData) {
    return this.request("/reports", {
      method: "POST",
      body: reportData,
    });
  }

  async getReports() {
    return this.request("/reports");
  }

  async updateReportStatus(reportId, status) {
    return this.request(`/reports/${reportId}`, {
      method: "PATCH",
      body: { status },
    });
  }

  // ================= Dashboard =================
  async getDashboardStats() {
    return this.request("/dashboard/barangay");
  }

  // ================= Admin =================
  async getAdminDashboard() {
    return this.request("/admin/dashboard");
  }

  async searchUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/admin/users${query ? "?" + query : ""}`);
  }

  async exportUsers(format = "pdf", filters = {}) {
    const query = new URLSearchParams({
      format,
      filters: JSON.stringify(filters),
    }).toString();
    return this.request(`/admin/export/users${query ? "?" + query : ""}`);
  }

  async exportJobs(format = "pdf", filters = {}) {
    const query = new URLSearchParams({
      format,
      filters: JSON.stringify(filters),
    }).toString();
    return this.request(`/admin/export/jobs${query ? "?" + query : ""}`);
  }

  async exportRatings(format = "pdf", filters = {}) {
    const query = new URLSearchParams({
      format,
      filters: JSON.stringify(filters),
    }).toString();
    return this.request(`/admin/export/ratings${query ? "?" + query : ""}`);
  }

  // Soft Delete Management
  async getDeletedUsers() {
    return this.request("/admin/soft-delete/users");
  }

  async getDeletedJobs() {
    return this.request("/admin/soft-delete/jobs");
  }

  async getDeletedGoals() {
    return this.request("/admin/soft-delete/goals");
  }

  async restoreUser(userId) {
    try {
      return await this.request(`/admin/soft-delete/users/${userId}/restore`, {
        method: "POST"
      });
    } catch (error) {
      console.error('Error restoring user:', error);
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can restore deleted users');
      }
      throw error;
    }
  }

  async restoreJob(jobId) {
    try {
      return await this.request(`/admin/soft-delete/jobs/${jobId}/restore`, {
        method: "POST"
      });
    } catch (error) {
      console.error('Error restoring job:', error);
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can restore deleted jobs');
      }
      throw error;
    }
  }

  async restoreGoal(goalId) {
    try {
      return await this.request(`/admin/soft-delete/goals/${goalId}/restore`, {
        method: "POST"
      });
    } catch (error) {
      console.error('Error restoring goal:', error);
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can restore deleted goals');
      }
      throw error;
    }
  }

  async permanentlyDeleteUser(userId) {
    try {
      return await this.request(`/admin/soft-delete/users/${userId}/permanent`, {
        method: "DELETE"
      });
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can permanently delete users');
      }
      throw error;
    }
  }

  async permanentlyDeleteJob(jobId) {
    try {
      return await this.request(`/admin/soft-delete/jobs/${jobId}/permanent`, {
        method: "DELETE"
      });
    } catch (error) {
      console.error('Error permanently deleting job:', error);
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can permanently delete jobs');
      }
      throw error;
    }
  }

  async permanentlyDeleteGoal(goalId) {
    try {
      return await this.request(`/admin/soft-delete/goals/${goalId}/permanent`, {
        method: "DELETE"
      });
    } catch (error) {
      console.error('Error permanently deleting goal:', error);
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error('Not authorized: Only administrators can permanently delete goals');
      }
      throw error;
    }
  }

  // ================= Activity =================
  async getUserActivity(userId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(
      `/activity/users/${userId}${query ? "?" + query : ""}`
    );
  }

  async getRecentActivity(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/activity/recent${query ? "?" + query : ""}`);
  }

  async getMyActivity() {
    return this.request("/activity/me");
  }

  // ================= Change Password =================
  async changePassword({ currentPassword, newPassword }) {
    return this.request("/users/me/password", {
      method: "PUT",
      body: { currentPassword, newPassword },
    });
  }

  // ================= Health Check =================
    // ================= Jobs =================
    async getPopularJobs() {
      return this.request("/jobs/popular", {
        method: "GET"
      });
    }

    async getJobs(params = {}) {
      // params: { limit, sortBy, order, ... }
      const query = new URLSearchParams(params).toString();
      return this.request(`/jobs${query ? `?${query}` : ''}`, {
        method: "GET"
      });
    }

    async getProfile(userId) {
      return this.request(`/users/${userId}`, {
        method: "GET"
      });
    }
  async healthCheck() {
    try {
      const response = await fetch(
        `${this.baseURL.replace("/api", "")}/health`,
        { credentials: "include" }
      );
      return await response.json();
    } catch {
      throw new Error("Backend health check failed");
    }
  }

  // ================= Analytics =================
  async getAnalyticsDashboard() {
    return this.request("/analytics/dashboard");
  }

  async getUserGrowth(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/user-growth${query ? "?" + query : ""}`);
  }

  async getJobStatistics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/job-stats${query ? "?" + query : ""}`);
  }
}

const apiService = new ApiService();

export const apiCall = async (endpoint, method = "GET", data = null) => {
  const options = { method };
  if (data && ["POST", "PUT", "PATCH"].includes(method)) {
    options.body = data;
  }
  return await apiService.request(endpoint, options);
};

export default apiService;
