class HealthService {
    constructor() {
      this.baseURL = 'http://localhost:5001/api';
      this.timeout = 3000; // 3 seconds timeout
    }
  
    async checkBackendHealth() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
  
        const response = await fetch(`${this.baseURL}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
  
        clearTimeout(timeoutId);
  
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
  
        const data = await response.json();
        
        // Check if backend is in maintenance mode
        if (data.status === 'maintenance') {
          throw new Error('MAINTENANCE_MODE');
        }
  
        return { isHealthy: true, data };
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('TIMEOUT');
        }
        
        if (error.message === 'MAINTENANCE_MODE') {
          throw new Error('MAINTENANCE_MODE');
        }
  
        // Network errors, connection refused, etc.
        if (!error.response && error.message.includes('fetch')) {
          throw new Error('NETWORK_ERROR');
        }
  
        throw error;
      }
    }
  
    async checkBackendStatus() {
      try {
        await this.checkBackendHealth();
        return 'HEALTHY';
      } catch (error) {
        if (error.message === 'MAINTENANCE_MODE') {
          return 'MAINTENANCE';
        }
        if (error.message === 'TIMEOUT' || error.message === 'NETWORK_ERROR') {
          return 'DOWN';
        }
        return 'ERROR';
      }
    }
  }
  
  const healthService = new HealthService();
  export default healthService;