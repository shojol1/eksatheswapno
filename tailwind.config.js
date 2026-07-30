/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        somiti: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          dark: '#0f172a',
          navy: '#0284c7',
          gold: '#f59e0b',
        }
      },
      fontFamily: {
        bengali: ['"Kalpurush"', '"Hind Siliguri"', '"Noto Sans Bengali"', 'sans-serif'],
        sans: ['"Kalpurush"', '"Inter"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
