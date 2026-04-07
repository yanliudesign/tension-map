/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05060A',
          900: '#0A0B10',
          850: '#0D0F16',
          800: '#11131C',
          700: '#181B28',
          600: '#1F2333',
          500: '#2E3448',
          400: '#4A5270',
          300: '#6B7290',
          200: '#9AA0BA',
          100: '#CDD0E0',
          50:  '#ECEEF5',
        },
        gold: {
          bright: '#F2CC8A',
          DEFAULT: '#E8B86D',
          dim:    '#C49050',
          muted:  '#9A7240',
        },
        crimson: {
          bright: '#DC7070',
          DEFAULT: '#C44F4F',
          dim:    '#9A3535',
        },
        sapphire: {
          bright: '#6AAAD8',
          DEFAULT: '#4A8CC4',
          dim:    '#326899',
        },
        amethyst: {
          bright: '#B07EF0',
          DEFAULT: '#8B5CF6',
          dim:    '#6840C4',
        },
        jade: {
          bright: '#6ACFAA',
          DEFAULT: '#4CAF8B',
          dim:    '#358870',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.4s ease-out',
        'slide-up':  'slideUp 0.35s ease-out',
        'pulse-glow':'pulseGlow 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%,100%': { opacity: '0.6' }, '50%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
