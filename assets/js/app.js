/**
 * Main Application JavaScript
 * Handles initialization and interactive features
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Portfolio website loaded');

  // Initialize skills category filtering
  initializeSkillsFilter();

  // Add smooth scroll behavior
  initializeSmoothScroll();

  // Initialize lazy loading for images
  initializeLazyLoading();
});

/**
 * Initialize skills category filtering
 */
function initializeSkillsFilter() {
  const categoryButtons = document.querySelectorAll('.skill-category-btn');

  if (categoryButtons.length > 0) {
    categoryButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons
        categoryButtons.forEach(btn => btn.classList.remove('active'));

        // Add active class to clicked button
        this.classList.add('active');

        // Get selected category
        const category = this.textContent.trim().toLowerCase();

        // Filter skills (implement based on your needs)
        filterSkills(category);
      });
    });
  }
}

/**
 * Filter skills by category
 * @param {string} category - Category to filter
 */
function filterSkills(category) {
  const skillCards = document.querySelectorAll('.skill-card');

  skillCards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = 'block';
      card.style.animation = 'fadeIn 0.3s ease-in-out';
    } else {
      card.style.display = 'none';
    }
  });

  console.log('Filtered skills by category:', category);
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initializeSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      // Only handle internal anchors
      if (href !== '#' && href.length > 1) {
        e.preventDefault();

        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
}

/**
 * Initialize lazy loading for images
 */
function initializeLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });

    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Utility: Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export functions for use in other modules
window.portfolioApp = {
  filterSkills,
  initializeSkillsFilter,
  initializeSmoothScroll,
  initializeLazyLoading,
  debounce
};
