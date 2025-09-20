class ApiService {
  // ================= Change Password =================
  async changePassword({ currentPassword, newPassword }) {
    return this.request("/users/me/password", {
      method: "PUT",
      body: { currentPassword, newPassword },
    });
  }
  // ================= Get Profile (for Settings.jsx compatibility) =================
  async getProfile() {
    return this.request("/users/me");
  }
  // ================= Job Creation =================
  async createJob(jobData) {
    // jobData should include: title, price, barangay, description, skillsRequired (array), location (optional)
    return this.request("/jobs", {
      method: "POST",
      body: jobData,
    });
  }
  // ================= Profile Update =================
  async updateProfile(updates) {
    return this.request("/users/me", {
      method: "PUT",
      body: updates,
    });
  }
  // ================= Ratings =================
  async getUserRatings(userId) {
    return this.request(`/ratings/user/${userId}`);
  }
  constructor() {
    this.baseURL =
      import.meta.env.VITE_API_URL ||
      "https://resi-backend-1.onrender.com/api";
    this.DEBUG = true;
  }

  normalizeEndpoint(endpoint) {
    // Always ensure endpoint starts with /
    return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    endpoint = this.normalizeEndpoint(endpoint);

    const defaultHeaders = {
      "Content-Type": "application/json",
    };

    // Do NOT attach Authorization header for login or register
    const isAuthRoute =
      endpoint === "/auth/login" || endpoint === "/auth/register";
    if (token && !isAuthRoute) {
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

    // Handle FormData
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

      // Attach status to response data for frontend logic
      if (typeof data === 'object' && data !== null) {
        data._httpStatus = response.status;
      }

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.dispatchEvent(new Event("storage"));
          throw new Error("Session expired. Please login again.");
        } else if (response.status === 403) {
          throw new Error("Forbidden: You don't have permission");
        } else if (response.status === 404) {
          throw new Error("Resource not found");
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again later.");
        } else {
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

  // ... (all other methods remain unchanged, just using this.request with normalized endpoints)

  // ================= Jobs =================
  async getPopularJobs() {
    return this.request("/jobs/popular");
  }

  async getJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/jobs${query ? "?" + query : ""}`);
  }

  // ================= Profile =================
  async getProfileMe() {
    return this.request(`/users/me`);
  }

  // ================= Health Check =================
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