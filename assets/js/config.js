/**
 * Tailwind CSS Configuration
 * Custom color palette and theme extensions
 */

tailwind.config = {
  darkMode: 'class',
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
      }
    },
  },
};
