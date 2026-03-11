import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand: cream surfaces inspired by metroglasspro.com
        cream: {
          50: '#FFFCF7',
          100: '#F7F2EA',
          200: '#EEE6D8',
          300: '#DCCFBB',
        },
        // Brand: charcoal scale for text, borders, and dark surfaces
        navy: {
          DEFAULT: '#342F2B',
          50: '#F6F4F0',
          100: '#ECE6DE',
          200: '#D8CEC0',
          300: '#B9AA98',
          400: '#948372',
          500: '#716254',
          600: '#54493F',
          700: '#3B332D',
          800: '#2A241F',
          900: '#1A1613',
        },
        // Muted bronze accent for highlights and calls to action
        orange: {
          DEFAULT: '#B88A52',
          50: '#FCF7F0',
          100: '#F3E7D4',
          200: '#E6CFAB',
          300: '#D2B27E',
          400: '#BE965B',
          500: '#B88A52',
          600: '#946C40',
          700: '#715232',
          800: '#543D25',
          900: '#3A2918',
        },
        // Dark mode stays warm instead of cold blue-gray
        dark: {
          bg: '#161412',
          card: '#221E1A',
          border: '#3A332D',
          text: '#F6F1E8',
          muted: '#B2A697',
        },
      },
      fontFamily: {
        // Match the brand site's polished, system-first feel.
        sans: ['"Avenir Next"', 'Avenir', '"Helvetica Neue"', '"Segoe UI"', 'Arial', 'sans-serif'],
        display: ['"Avenir Next"', 'Avenir', '"Helvetica Neue"', '"Segoe UI"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        // V3: Extra rounded corners (pillowy look)
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        // V3: Soft, floating shadows
        'card': '0 10px 30px -22px rgba(26, 22, 19, 0.28), 0 14px 40px -30px rgba(59, 51, 45, 0.22)',
        'card-hover': '0 18px 44px -28px rgba(26, 22, 19, 0.34), 0 24px 52px -36px rgba(59, 51, 45, 0.24)',
        'card-lg': '0 24px 60px -38px rgba(26, 22, 19, 0.4), 0 30px 70px -46px rgba(59, 51, 45, 0.28)',
        'soft': '0 8px 24px -20px rgba(26, 22, 19, 0.24)',
        'float': '0 22px 50px -34px rgba(26, 22, 19, 0.38), 0 12px 30px -24px rgba(59, 51, 45, 0.26)',
        'sheet': '0 -18px 50px -34px rgba(26, 22, 19, 0.38)',
        // Dark mode shadows
        'card-dark': '0 20px 50px -34px rgba(0, 0, 0, 0.6), 0 10px 26px -18px rgba(0, 0, 0, 0.45)',
      },
      spacing: {
        // V3: More generous spacing
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'stagger-fade': 'staggerFadeIn 0.35s ease-out both',
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
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        staggerFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
