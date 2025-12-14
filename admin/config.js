// Admin Configuration
// Automatically detects environment and uses appropriate API URL

const getApiBase = () => {
  // Check if running on GitHub Pages
  const isGithubPages = window.location.hostname.includes('github.io');

  // Check if running on localhost
  const isLocalhost = window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1' ||
                     window.location.protocol === 'file:';

  if (isLocalhost) {
    // Local development - use local backend
    return 'http://localhost:8000/api';
  } else if (isGithubPages) {
    // Production - use Vercel backend
    // TODO: Replace this with your actual Vercel backend URL after deployment
    return 'https://your-backend.vercel.app/api';
  } else {
    // Fallback to local
    return 'http://localhost:8000/api';
  }
};

// Export the API base URL
const API_BASE = getApiBase();

console.log('Admin Panel - API Base:', API_BASE);
