/**
 * Portfolio Alpine.js Component
 * Main application logic for theme and tab management
 */

document.addEventListener('alpine:init', () => {
  Alpine.data('portfolio', () => ({
    // Theme properties
    theme: 'dark',

    // Tab properties
    activeTab: 'summary',

    init() {
      console.log('Alpine.js initialized!');

      // Initialize theme manager
      const savedTheme = localStorage.getItem('portfolio-theme');
      if (savedTheme) {
        this.theme = savedTheme;
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.theme = prefersDark ? 'dark' : 'light';
      }
      this.applyTheme();

      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (!localStorage.getItem('portfolio-theme')) {
            this.theme = e.matches ? 'dark' : 'light';
            this.applyTheme();
          }
        });

      // Listen for hash changes from app.js
      window.addEventListener('tabchange', (e) => {
        this.changeTab(e.detail.tab);
      });

      // Check URL hash on init
      const hash = window.location.hash.slice(1);
      const validTabs = ['summary', 'skills', 'experience', 'education', 'projects', 'certifications', 'blog', 'bookshelf'];
      if (hash && validTabs.includes(hash)) {
        this.activeTab = hash;
      }

      console.log('Active tab:', this.activeTab);
      console.log('Theme:', this.theme);
    },

    // Theme methods
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme();
      this.saveTheme();
      console.log('Theme toggled to:', this.theme);
    },

    applyTheme() {
      const htmlElement = document.documentElement;
      if (this.theme === 'dark') {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
      } else {
        htmlElement.classList.remove('dark');
        htmlElement.classList.add('light');
      }
      this.updateMetaThemeColor();
    },

    saveTheme() {
      localStorage.setItem('portfolio-theme', this.theme);
    },

    updateMetaThemeColor() {
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        const color = this.theme === 'dark' ? '#18181b' : '#fafaf9';
        metaThemeColor.setAttribute('content', color);
      }
    },

    isDark() {
      return this.theme === 'dark';
    },

    isLight() {
      return this.theme === 'light';
    },

    getThemeIcon() {
      return this.theme === 'dark' ? 'fa-moon' : 'fa-sun';
    },

    getThemeLabel() {
      return this.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    },

    // Tab methods
    changeTab(tab) {
      console.log('Changing tab to:', tab);
      this.activeTab = tab;
      window.location.hash = tab;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    isActiveTab(tab) {
      return this.activeTab === tab;
    }
  }));
});
