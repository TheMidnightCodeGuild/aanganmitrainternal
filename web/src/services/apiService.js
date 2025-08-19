// API Service for backend communication
const API_BASE_URL = 'http://localhost:5001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.authFailureCallback = null;
  }

  // Set callback for authentication failures
  setAuthFailureCallback(callback) {
    this.authFailureCallback = callback;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Set auth token in localStorage
  setToken(token) {
    localStorage.setItem('token', token);
  }

  // Remove auth token from localStorage
  removeToken() {
    localStorage.removeItem('token');
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle authentication failures
      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed:', data.message || 'Unauthorized');
        this.removeToken();
        if (this.authFailureCallback) {
          this.authFailureCallback();
        }
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Authentication methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  // Property methods
  async getProperties(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/properties${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getProperty(id) {
    return await this.request(`/properties/${id}`);
  }

  async createProperty(propertyData) {
    return await this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData)
    });
  }

  async updateProperty(id, propertyData) {
    return await this.request(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData)
    });
  }

  async deleteProperty(id) {
    return await this.request(`/properties/${id}`, {
      method: 'DELETE'
    });
  }

  // Client methods
  async getClients(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/clients${queryString ? `?${queryString}` : ''}`;
    return await this.request(endpoint);
  }

  async getClient(id) {
    return await this.request(`/clients/${id}`);
  }

  async createClient(clientData) {
    return await this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
  }

  async updateClient(id, clientData) {
    return await this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData)
    });
  }

  async deleteClient(id) {
    return await this.request(`/clients/${id}`, {
      method: 'DELETE'
    });
  }

  async getClientStats() {
    return await this.request('/clients/stats/overview');
  }

  async checkClientDuplicates(email, phone, excludeId = null) {
    const data = { email, phone };
    if (excludeId) {
      data.excludeId = excludeId;
    }
    return await this.request('/clients/check-duplicates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Client Role methods
  async getClientRoles(clientId) {
    return await this.request(`/client-roles/client/${clientId}`);
  }

  async createClientRole(roleData) {
    return await this.request('/client-roles', {
      method: 'POST',
      body: JSON.stringify(roleData)
    });
  }

  async updateClientRole(roleId, roleData) {
    return await this.request(`/client-roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(roleData)
    });
  }

  async deleteClientRole(roleId) {
    return await this.request(`/client-roles/${roleId}`, {
      method: 'DELETE'
    });
  }

  async getClientWithRoles(clientId) {
    const [clientResponse, rolesResponse] = await Promise.all([
      this.request(`/clients/${clientId}`),
      this.request(`/client-roles/client/${clientId}`)
    ]);
    
    return {
      client: clientResponse.client,
      roles: rolesResponse.clientRoles
    };
  }

  // Logout method
  logout() {
    this.removeToken();
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  }

  // Method to simulate authentication failure (for testing)
  simulateAuthFailure() {
    this.removeToken();
    if (this.authFailureCallback) {
      this.authFailureCallback();
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService; 