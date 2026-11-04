/** Design tokens taken from the Figma file "Serene EduHealth Prototype". */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#27AB4D', dark: '#118733', deep: '#076620', light: '#23C54D' },
        mint: { 50: '#F2FFF2', 100: '#EAFFF0', 150: '#E5FFE5', 200: '#D7FFD7', 300: '#D1FFDD' },
        ink: '#222222',
        muted: '#8F8F8F',
        slate: '#4C669A',
        line: '#E7EBF3',
        field: '#F0F0F0',
        danger: { DEFAULT: '#D61F1F', ink: '#B91C1C', soft: '#FEF2F2', bg: '#FEE2E2' },
        warn: { ink: '#C2410C', bg: '#FFEDD5' },
        ok: { ink: '#15803D', bg: '#DCFCE7' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        shell: '10px 10px 40px 5px rgba(0,0,0,0.10)',
        nav: '-4px -4px 20px 15px rgba(0,0,0,0.03), 4px 4px 20px 15px rgba(0,0,0,0.03)',
        soft: '0 6px 18px -8px rgba(39,171,77,0.35)',
        pop: '0 24px 60px -20px rgba(0,0,0,0.35)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'pop-in': { from: { opacity: 0, transform: 'translateY(8px) scale(.98)' }, to: { opacity: 1, transform: 'none' } },
        'toast-in': { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'none' } },
        'dot': { '0%,80%,100%': { opacity: 0.25 }, '40%': { opacity: 1 } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'pop-in': 'pop-in .18s ease-out',
        'toast-in': 'toast-in .2s ease-out',
        dot: 'dot 1.2s infinite',
      },
    },
  },
  plugins: [],
};
