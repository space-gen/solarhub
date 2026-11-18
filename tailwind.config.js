/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#140e22',
        panel: '#1f1833',
        raised: '#2c2346',
        hairline: '#43385f',
        edge: '#85789f',
        limb: '#f7f0e4',
        haze: '#cfc6de',
        sun: '#ffb547',
        corona: '#56e6d4',
        flare: '#ff9d8f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
