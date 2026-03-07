/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        solar: {
          50: '#fff8e6',
          100: '#ffefc0',
          200: '#ffd966',
          300: '#ffc833',
          400: '#ffb300',
          500: '#ff9500',
          600: '#e07000',
          700: '#b85000',
          800: '#8a3a00',
          900: '#5c2500',
        },
        space: {
          950: '#020408',
          900: '#050d1a',
          800: '#0a1628',
          700: '#0f2040',
          600: '#152b58',
          500: '#1d3a70',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      backgroundImage: {
        'solar-radial': 'radial-gradient(ellipse at center, #ff9500 0%, #ff4500 40%, #b01000 70%, transparent 100%)',
        'space-gradient': 'linear-gradient(to bottom, #020408, #050d1a, #0a1628)',
      },
    },
  },
  plugins: [],
}
