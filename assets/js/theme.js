/**
 * Theme Management System
 * Handles dark/light mode toggle with localStorage persistence
 */

// IIFE to prevent global namespace pollution
(function() {
  'use strict';

  /**
   * Alpine.js Theme Manager Component
   * Provides theme switching functionality with persistence
   */
  window.themeManager = () => ({
      // Current theme: 'light' or 'dark'
      theme: 'dark',

      /**
       * Initialize theme manager
       * Loads saved theme from localStorage or detects system preference
       */
      init() {
        // Load theme from localStorage or default to dark
        const savedTheme = localStorage.getItem('portfolio-theme');

        if (savedTheme) {
          this.theme = savedTheme;
        } else {
          // Check system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          this.theme = prefersDark ? 'dark' : 'light';
        }

        // Apply the theme
        this.applyTheme();

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem('portfolio-theme')) {
              this.theme = e.matches ? 'dark' : 'light';
              this.applyTheme();
            }
          });

        console.log('Theme Manager initialized:', this.theme);
      },

      /**
       * Toggle between light and dark themes
       */
      toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.saveTheme();

        // Dispatch custom event for other components to react
        window.dispatchEvent(new CustomEvent('themeChanged', {
          detail: { theme: this.theme }
        }));

        console.log('Theme toggled to:', this.theme);
      },

      /**
       * Set specific theme
       * @param {string} newTheme - 'light' or 'dark'
       */
      setTheme(newTheme) {
        if (newTheme !== 'light' && newTheme !== 'dark') {
          console.error('Invalid theme:', newTheme);
          return;
        }

        this.theme = newTheme;
        this.applyTheme();
        this.saveTheme();

        console.log('Theme set to:', this.theme);
      },

      /**
       * Apply current theme to document
       */
      applyTheme() {
        const htmlElement = document.documentElement;

        if (this.theme === 'dark') {
          htmlElement.classList.add('dark');
          htmlElement.classList.remove('light');
        } else {
          htmlElement.classList.remove('dark');
          htmlElement.classList.add('light');
        }

        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor();
      },

      /**
       * Save theme preference to localStorage
       */
      saveTheme() {
        localStorage.setItem('portfolio-theme', this.theme);
      },

      /**
       * Update meta theme-color tag for mobile browser chrome
       */
      updateMetaThemeColor() {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          // Use CSS variable values
          const color = this.theme === 'dark' ? '#18181b' : '#fafaf9';
          metaThemeColor.setAttribute('content', color);
        }
      },

      /**
       * Check if current theme is dark
       * @returns {boolean}
       */
      isDark() {
        return this.theme === 'dark';
      },

      /**
       * Check if current theme is light
       * @returns {boolean}
       */
      isLight() {
        return this.theme === 'light';
      },

      /**
       * Get theme icon name for display
       * @returns {string} Font Awesome icon class
       */
      getThemeIcon() {
        return this.theme === 'dark' ? 'fa-moon' : 'fa-sun';
      },

      /**
       * Get theme label for accessibility
       * @returns {string}
       */
      getThemeLabel() {
        return this.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
      }
    });

  /**
   * FOUC (Flash of Unstyled Content) Prevention
   * This immediately applies the saved theme before page render
   * Note: This is also included as inline script in index.html <head>
   */
  function preventFOUC() {
    const savedTheme = localStorage.getItem('portfolio-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
  }

  // Execute FOUC prevention immediately
  if (document.readyState === 'loading') {
    preventFOUC();
  }

})();
