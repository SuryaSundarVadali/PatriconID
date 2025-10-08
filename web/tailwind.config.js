/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 15s ease infinite',
        'gradient-move': 'gradient-move 8s ease-in-out infinite',
        'gradient-move2': 'gradient-move2 10s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        'gradient': {
          '0%, 100%': { 
            backgroundPosition: '0% 50%' 
          },
          '50%': { 
            backgroundPosition: '100% 50%' 
          },
        },
        'gradient-move': {
          '0%, 100%': { 
            transform: 'translate(0, 0) scale(1)',
            opacity: '0.4',
          },
          '33%': { 
            transform: 'translate(30px, -30px) scale(1.1)',
            opacity: '0.5',
          },
          '66%': { 
            transform: 'translate(-30px, 30px) scale(0.95)',
            opacity: '0.45',
          },
        },
        'gradient-move2': {
          '0%, 100%': { 
            transform: 'translateX(0) scale(1)',
            opacity: '0.5',
          },
          '50%': { 
            transform: 'translateX(-40px) scale(1.08)',
            opacity: '0.7',
          },
        },
        'slide-in-left': {
          '0%': { 
            transform: 'translateX(-100%)',
            opacity: '0',
          },
          '100%': { 
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'slide-down': {
          '0%': { 
            transform: 'translateY(-10px)',
            opacity: '0',
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'shimmer': {
          '0%': { 
            backgroundPosition: '-1000px 0',
          },
          '100%': { 
            backgroundPosition: '1000px 0',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}
