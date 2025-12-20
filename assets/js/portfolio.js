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

    // Data properties
    profile: null,
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    blogPosts: [],
    books: [],
    bookStats: null,
    loading: true,
    error: null,

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

      // Load data from API
      this.loadData();
    },

    async loadData() {
      try {
        this.loading = true;

        // Fetch all data in parallel
        const [skills, experience, projects, education, certifications, blogPosts, books, bookStats] = await Promise.all([
          window.api.getSkills().catch(err => {
            console.warn('Failed to fetch skills:', err);
            return [];
          }),
          window.api.getExperience().catch(err => {
            console.warn('Failed to fetch experience:', err);
            return [];
          }),
          window.api.getProjects().catch(err => {
            console.warn('Failed to fetch projects:', err);
            return [];
          }),
          window.api.getEducation().catch(err => {
            console.warn('Failed to fetch education:', err);
            return [];
          }),
          window.api.getCertifications().catch(err => {
            console.warn('Failed to fetch certifications:', err);
            return [];
          }),
          window.api.getBlogPosts({ published_only: true, page: 1, page_size: 10 }).catch(err => {
            console.warn('Failed to fetch blog posts:', err);
            return { posts: [] };
          }),
          window.api.getBooks().catch(err => {
            console.warn('Failed to fetch books:', err);
            return [];
          }),
          window.api.getBookStats().catch(err => {
            console.warn('Failed to fetch book stats:', err);
            return null;
          })
        ]);

        this.skills = skills;
        this.experience = experience;
        this.projects = projects;
        this.education = education;
        this.certifications = certifications;
        this.blogPosts = blogPosts.posts || blogPosts;
        this.books = books;
        this.bookStats = bookStats;

        console.log('Data loaded successfully:', {
          skills: this.skills.length,
          experience: this.experience.length,
          projects: this.projects.length,
          education: this.education.length,
          certifications: this.certifications.length,
          blogPosts: this.blogPosts.length,
          books: this.books.length
        });
      } catch (error) {
        console.error('Error loading data:', error);
        this.error = 'Failed to load data. Please try again later.';
      } finally {
        this.loading = false;
      }
    },

    // Helper method to group skills by category
    getSkillsByCategory(category) {
      return this.skills.filter(skill => skill.category === category);
    },

    // Get icon for skill name
    getSkillIcon(skillName) {
      const iconMap = {
        // Languages
        'Python': 'fab fa-python',
        'C# / .NET': 'fab fa-microsoft',
        'SQL': 'fas fa-database',
        'Java': 'fab fa-java',
        'Julia': 'fas fa-code',
        'JavaScript': 'fab fa-js',
        'Bash / PowerShell': 'fas fa-terminal',
        'C++': 'fas fa-code',
        'CUDA': 'fas fa-microchip',

        // AI/ML
        'LLMs & VLMs': 'fas fa-robot',
        'RAG Architecture': 'fas fa-project-diagram',
        'PyTorch': 'fas fa-fire',
        'LangChain': 'fas fa-link',
        'CrewAI': 'fas fa-users',
        'LangGraph': 'fas fa-project-diagram',
        'DSPy': 'fas fa-brain',
        'vLLM': 'fas fa-bolt',
        'NLP': 'fas fa-language',
        'PySpark': 'fas fa-fire',
        'Pandas': 'fas fa-table',
        'Scikit-learn': 'fas fa-brain',

        // Testing
        'Selenium': 'fas fa-vial',
        'Playwright': 'fas fa-theater-masks',
        'PyTest': 'fas fa-check-double',
        'SpecFlow': 'fas fa-file-alt',
        'Appium': 'fas fa-mobile-alt',
        'Cucumber': 'fas fa-leaf',
        'Postman': 'fas fa-paper-plane',

        // Cloud
        'AWS': 'fab fa-aws',
        'Azure': 'fab fa-microsoft',
        'Docker': 'fab fa-docker',
        'Kubernetes': 'fas fa-dharmachakra',
        'Terraform': 'fas fa-cloud',
        'CI/CD Pipelines': 'fas fa-sync',
        'Redis': 'fas fa-database',

        // Data
        'SQL Server': 'fas fa-database',
        'MySQL': 'fas fa-database',
        'PostgreSQL': 'fas fa-database',
        'MongoDB': 'fas fa-leaf',
        'DynamoDB': 'fas fa-database',
        'Vector Databases': 'fas fa-database',
        'Mem0': 'fas fa-memory',
        'Tableau': 'fas fa-chart-bar',
        'Power BI': 'fas fa-chart-line',

        // Backend
        'FastAPI': 'fas fa-rocket',
        'Flask': 'fas fa-flask',
        'Django': 'fas fa-server',
        '.NET Core': 'fab fa-microsoft'
      };

      return iconMap[skillName] || 'fas fa-code';
    },

    // Format date helper
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    },

    // Format date range helper
    formatDateRange(start, end, isCurrent) {
      const startDate = this.formatDate(start);
      const endDate = isCurrent ? 'Present' : this.formatDate(end);
      return `${startDate} - ${endDate}`;
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
