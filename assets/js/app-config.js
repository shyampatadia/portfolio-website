/**
 * Application Configuration
 * Automatically detects environment and sets appropriate API URL
 */

const AppConfig = {
  // Detect environment based on hostname
  isDevelopment() {
    return window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname === '';
  },

  // Get API base URL based on environment
  getApiBaseUrl() {
    if (this.isDevelopment()) {
      // Local development - FastAPI backend
      return 'http://localhost:8000';
    } else {
      // Production - Vercel deployment
      return 'https://portfolio-website-nine-red-56.vercel.app';
    }
  }
};

// Export for use in other scripts
window.AppConfig = AppConfig;
