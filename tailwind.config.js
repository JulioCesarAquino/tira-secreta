/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: { 50: '#fffaf0', 100: '#fdf1d8', 200: '#f9e0ad' },
        sun: { 400: '#ffc93c', 500: '#f5b014' },
        ocean: { 500: '#1b8fb5', 600: '#14708f', 700: '#0f566e' },
        coral: { 400: '#ff7a6b', 500: '#f45b4b' },
      },
      fontFamily: { display: ['"Baloo 2"', 'system-ui', 'sans-serif'] },
      keyframes: { pop: { '0%': { transform: 'scale(.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } } },
    },
  },
  plugins: [],
}
