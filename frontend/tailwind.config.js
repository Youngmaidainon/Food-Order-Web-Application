/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F97316',
          hover: '#ea580c',
        },
        secondary: {
          DEFAULT: '#10B981',
          hover: '#059669',
        },
        background: '#09090b',
        surface: '#18181b',
        borderColor: '#27272a',
        'text-main': '#f4f4f5',
        'text-muted': '#a1a1aa',
      },
      fontFamily: {
        sans: ['Prompt', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        'glass-md': '0 10px 20px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(120%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      }
    },
  },
  plugins: [],
}
