/**
 * API Service
 * Handles all backend API calls
 */

const API_BASE_URL = 'https://portfolio-website-nine-red-56.vercel.app';

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Profile API
  async getProfile() {
    return this.fetch('/api/profile');
  }

  // Skills API
  async getSkills() {
    return this.fetch('/api/content/skills');
  }

  // Experience API
  async getExperience() {
    return this.fetch('/api/content/experience');
  }

  // Projects API
  async getProjects() {
    return this.fetch('/api/content/projects');
  }

  // Education API
  async getEducation() {
    return this.fetch('/api/content/education');
  }

  // Certifications API
  async getCertifications() {
    return this.fetch('/api/content/certifications');
  }

  // Blog API
  async getBlogPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/blog/posts${queryString ? `?${queryString}` : ''}`;
    return this.fetch(endpoint);
  }

  async getBlogPost(postId) {
    return this.fetch(`/api/blog/posts/${postId}`);
  }

  async getBlogPostBySlug(slug) {
    return this.fetch(`/api/blog/posts/slug/${slug}`);
  }

  // Books API
  async getBooks(status = null) {
    const endpoint = status ? `/api/books?status_filter=${status}` : '/api/books';
    return this.fetch(endpoint);
  }

  async getBookStats() {
    return this.fetch('/api/books/stats');
  }

  async getBook(bookId) {
    return this.fetch(`/api/books/${bookId}`);
  }
}

// Create singleton instance
const api = new ApiService(API_BASE_URL);

// Export for use in other scripts
window.api = api;
