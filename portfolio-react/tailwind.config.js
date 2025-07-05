/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  safelist: [
    // Animation classes that might be used dynamically
    'animate-float',
    'animate-float-slow',
    'animate-float-medium', 
    'animate-float-fast',
    'animate-pulse-slow',
    'animate-bounce-subtle',
    'animate-shimmer',
    'animate-fade-in',
    'animate-slide-in-up',
    // Custom color classes
    'bg-blue-primary',
    'bg-blue-secondary',
    'text-blue-primary',
    'text-blue-secondary',
    'border-blue-primary',
    // Pattern classes
    'bg-pattern',
    'main-card',
    'profile-container',
    'name-gradient',
    'badge-animated',
    'social-icon',
    'floating-bubble',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e0e1ff',
          200: '#c7c9fe',
          300: '#a5a7fc',
          400: '#8183f9',
          500: '#6366f1',
          600: '#4b4fe5',
          700: '#3a3fce',
          800: '#3035a7',
          900: '#2c3183',
          950: '#1a1c48',
        },
        secondary: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9e0',
          300: '#b8b9c5',
          400: '#9294a6',
          500: '#75778b',
          600: '#5d5f71',
          700: '#4b4c5c',
          800: '#3f404d',
          900: '#383842',
          950: '#25252c',
        },
        'dark-bg': '#101420',
        'dark-card': '#1a1f2e',
        'dark-border': '#232a3a',
        'blue-primary': '#4ba6ef',
        'blue-secondary': '#69b9f0',
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-medium': 'float 6s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s infinite',
        'fade-in': 'fadeIn 1s ease-in-out forwards',
        'slide-in-up': 'slideInUp 0.5s ease forwards',
        'gradient-move': 'gradientMove 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradientMove: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      transitionProperty: {
        'opacity': 'opacity',
        'transform': 'transform',
      },
    },
  },
  plugins: [],
}