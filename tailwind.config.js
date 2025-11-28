/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#346955',
          '50': '#effaf7',
          '100': '#d6f2ea',
          '200': '#aee2d1',
          '300': '#85c7b1',
          '400': '#62ac90',
          '500': '#458b71',
          '600': '#346955',
          '700': '#2d5948',
          '800': '#234538',
          '900': '#193128',
        },
        accent: {
          DEFAULT: '#BB9C5F',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
    },
  },
  plugins: [],
}