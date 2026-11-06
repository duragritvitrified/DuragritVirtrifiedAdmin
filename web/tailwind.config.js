/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#FEF2EE',
          100: '#FDE3DA',
          200: '#FAC4B2',
          300: '#F59B7F',
          400: '#EC6F4B',
          500: '#D95530',
          600: '#C84826', // Official PDF Primary Red / Terracotta CTA
          700: '#A62C11', // Official PDF Deep Brick Red / Hover & Active
          800: '#85230D',
          900: '#681B0A'
        },
        morbi: {
          dark: '#1C1917',
          slate: '#292524',
          surface: '#FAF9F6',
          border: '#E7E5E0',
          accent: '#C84826'
        },
        duragrit: {
          navy: '#C84826',
          navyDark: '#A62C11',
          navyLight: '#D95530',
          gold: '#C84826',
          goldHover: '#A62C11',
          goldHero: '#D95530',
          goldLight: '#FEF2EE',
          productBlue: '#C84826',
          light: '#FAF9F6',
          text: '#1C1917',
          textNav: '#292524',
          surface: '#FAF9F6',
          card: '#FFFFFF',
          border: '#E7E5E0',
          crimson: '#A62C11',
          crimsonDark: '#7F1D1D',
          crimsonLight: '#C84826',
          textMain: '#1C1917',
          textMuted: '#6B7280',
        },
        brand: {
          rust: '#C84826',
          rustHover: '#A62C11',
          maroon: '#A62C11',
          cardBg: '#FFFFFF',
          canvas: '#FAF9F6',
          borderLight: '#E7E5E0',
          textPrimary: '#1C1917',
          textMuted: '#6B7280',
          badgeGreen: '#15803D',
          badgeGreenBg: '#ECFDF5'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Newsreader', 'Georgia', 'serif'],
        brand: ['Cinzel', 'serif', 'Georgia'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'enterprise': '0 1px 3px 0 rgba(200, 72, 38, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'enterprise-card': '0 4px 6px -1px rgba(166, 44, 17, 0.06), 0 2px 4px -2px rgba(166, 44, 17, 0.04)',
      }
    },
  },
  plugins: [],
}
