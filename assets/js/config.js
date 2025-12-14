/**
 * Tailwind CSS Configuration
 * Warm Professional Theme - Amber, Coral, Gold Accents
 */

tailwind.config = {
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Warm Amber Palette (Primary Accent)
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Primary accent
          600: '#ea580c', // Primary accent (dark mode)
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#451a03',
        },
        // Coral/Orange Palette (Secondary Accent)
        coral: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f97066', // Coral accent
          500: '#fb923c', // Orange-amber
          600: '#f97316', // Orange
          700: '#ea580c',
          800: '#c2410c',
          900: '#991b1b',
          950: '#450a0a',
        },
        // Navy Blue Palette (Foundation)
        navy: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1e3a8a', // Deep navy
          800: '#1e3a70', // Dark navy
          900: '#2a4885', // Medium navy
          950: '#172554',
        },
        // Charcoal/Zinc Palette (Backgrounds - Dark Mode)
        charcoal: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#18181b', // Primary dark background
        },
      },
      // Extend box shadows for warm glow effects
      boxShadow: {
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-amber-lg': '0 0 30px rgba(245, 158, 11, 0.4)',
        'glow-coral': '0 0 20px rgba(249, 112, 102, 0.3)',
        'glow-gold': '0 0 20px rgba(251, 191, 36, 0.3)',
      },
      // Extend animations for smooth interactions
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-medium': 'float 6s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
};
