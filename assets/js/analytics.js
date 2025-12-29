/**
 * Simple Analytics Tracker
 * Tracks page views and blog engagement
 */

class Analytics {
  constructor() {
    this.apiBase = window.AppConfig?.getApiBaseUrl() || 'http://localhost:8000';
    this.visitorId = this.getOrCreateVisitorId();
    this.initialized = false;
  }

  /**
   * Get or create a unique visitor ID
   * Stored in localStorage for persistent tracking
   */
  getOrCreateVisitorId() {
    let visitorId = localStorage.getItem('visitor_id');

    if (!visitorId) {
      // Generate a simple unique ID
      visitorId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('visitor_id', visitorId);
    }

    return visitorId;
  }

  /**
   * Track a page view
   */
  async trackPageView() {
    if (this.initialized) return; // Prevent duplicate tracking
    this.initialized = true;

    const data = {
      page_path: window.location.pathname + window.location.search,
      page_title: document.title,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      visitor_id: this.visitorId
    };

    // For local testing: add ?analytics_test_ip=8.8.8.8 to URL to simulate a public IP
    const urlParams = new URLSearchParams(window.location.search);
    const testIp = urlParams.get('analytics_test_ip');
    const url = testIp
      ? `${this.apiBase}/api/analytics/track/page?test_ip=${testIp}`
      : `${this.apiBase}/api/analytics/track/page`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      console.log('[Analytics] Page view tracked', testIp ? `(test IP: ${testIp})` : '');
    } catch (error) {
      console.error('[Analytics] Failed to track page view:', error);
    }
  }

  /**
   * Track blog post view with engagement metrics
   */
  async trackBlogView(blogPostId, blogPostSlug) {
    const startTime = Date.now();
    let maxScrollDepth = 0;

    // Track scroll depth
    const updateScrollDepth = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPosition = window.scrollY;
      const scrollPercent = Math.min(100, Math.round((scrollPosition / scrollHeight) * 100));
      maxScrollDepth = Math.max(maxScrollDepth, scrollPercent);
    };

    window.addEventListener('scroll', updateScrollDepth);
    updateScrollDepth(); // Initial check

    // Send tracking data when user leaves or after 30 seconds
    const sendBlogTracking = async () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000); // seconds

      const data = {
        blog_post_id: blogPostId,
        blog_post_slug: blogPostSlug,
        visitor_id: this.visitorId,
        time_spent_seconds: timeSpent,
        scroll_depth: maxScrollDepth,
        user_agent: navigator.userAgent
      };

      try {
        // Use sendBeacon for reliable delivery even when page is closing
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon(`${this.apiBase}/api/analytics/track/blog`, blob);
        console.log('[Analytics] Blog view tracked:', { timeSpent, scrollDepth: maxScrollDepth });
      } catch (error) {
        // Fallback to regular fetch
        await fetch(`${this.apiBase}/api/analytics/track/blog`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      }
    };

    // Track after 30 seconds (to capture real engagement)
    setTimeout(sendBlogTracking, 30000);

    // Track when user leaves
    window.addEventListener('beforeunload', sendBlogTracking);
    window.addEventListener('pagehide', sendBlogTracking);
  }

  /**
   * Initialize analytics for the current page
   */
  init() {
    // Track page view on all pages
    this.trackPageView();

    // Check if this is a blog post page and track engagement
    const isBlogPost = window.location.pathname.includes('/blog/post.html');
    if (isBlogPost) {
      const urlParams = new URLSearchParams(window.location.search);
      const slug = urlParams.get('slug');

      if (slug) {
        // Wait a bit to get the blog post ID from the Alpine.js component
        setTimeout(() => {
          const blogData = window.Alpine?.store?.('blogPost')?.post;
          if (blogData && blogData.id) {
            this.trackBlogView(blogData.id, slug);
          }
        }, 1000);
      }
    }
  }
}

// Auto-initialize analytics when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.analytics = new Analytics();
    window.analytics.init();
  });
} else {
  window.analytics = new Analytics();
  window.analytics.init();
}
