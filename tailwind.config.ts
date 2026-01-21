import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#F7F1E6',
          200: '#F0E6D3',
        },
        navy: {
          DEFAULT: '#1B2B5A',
          50: '#E8EBF2',
          100: '#C5CCE0',
          200: '#9EAACC',
          300: '#7788B8',
          400: '#5A6FA8',
          500: '#3D5698',
          600: '#334A85',
          700: '#283B6E',
          800: '#1B2B5A',
          900: '#101A38',
        },
        orange: {
          DEFAULT: '#F5A623',
          50: '#FEF6E7',
          100: '#FDE9C3',
          200: '#FCDA9B',
          300: '#FACB73',
          400: '#F9BF55',
          500: '#F5A623',
          600: '#E6951A',
          700: '#CC8215',
          800: '#A66A11',
          900: '#80520D',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(27, 43, 90, 0.05), 0 1px 2px -1px rgba(27, 43, 90, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(27, 43, 90, 0.07), 0 2px 4px -2px rgba(27, 43, 90, 0.05)',
        'sheet': '0 -4px 20px -5px rgba(27, 43, 90, 0.1)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
