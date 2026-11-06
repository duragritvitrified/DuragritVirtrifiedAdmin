/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kiln: {
          brick: '#A6300F',
          crimson: '#A10000',
          terracotta: '#C84826',
        },
        stone: {
          clay: '#F4F3F0',
          recessed: '#F4F3F0',
          chip: '#EFEEEB',
          badge: '#E9E8E5',
          input: '#FBFAF9',
        },
        slate: {
          initials: '#545F73',
        },
        periwinkle: {
          pill: '#D5E0F8',
          text: '#2B4A8E',
        },
        terracotta: {
          50: '#FEF2EE',
          100: '#FDE3DA',
          200: '#FAC4B2',
          300: '#F59B7F',
          400: '#EC6F4B',
          500: '#D95530',
          600: '#C84826', // Official PDF Primary Red / Terracotta CTA
          700: '#A6300F', // Official PDF Deep Kiln Brick Red
          800: '#A10000', // Official PDF Deep Crimson
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
          navyDark: '#A6300F',
          navyLight: '#D95530',
          gold: '#C84826',
          goldHover: '#A6300F',
          goldHero: '#D95530',
          goldLight: '#FEF2EE',
          productBlue: '#C84826',
          light: '#FAF9F6',
          text: '#1C1917',
          textNav: '#292524',
          surface: '#FAF9F6',
          card: '#FFFFFF',
          border: '#E7E5E0',
          crimson: '#A10000',
          crimsonDark: '#7F1D1D',
          crimsonLight: '#C84826',
          textMain: '#1C1917',
          textMuted: '#6B7280',
        },
        brand: {
          rust: '#C84826',
          rustHover: '#A6300F',
          maroon: '#A6300F',
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
        serif: ['Newsreader', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        brand: ['Cinzel', 'serif', 'Georgia'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '46': '11.5rem',
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'enterprise': '0 1px 3px 0 rgba(200, 72, 38, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'enterprise-card': '0 4px 6px -1px rgba(166, 44, 17, 0.06), 0 2px 4px -2px rgba(166, 44, 17, 0.04)',
      }
    },
  },
  plugins: [],
}
