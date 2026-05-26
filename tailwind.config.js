/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          deep: '#050816',
          medium: '#0B1020',
          light: '#11182D',
          border: 'rgba(255, 255, 255, 0.08)'
        },
        action: {
          emerald: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Outfit', 'Inter', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'Syne', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite alternate',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'scan': 'scanLine 3s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%': { boxShadow: '0 0 5px rgba(147, 51, 234, 0.2), 0 0 10px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(147, 51, 234, 0.5), 0 0 25px rgba(59, 130, 246, 0.5)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scanLine: {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' }
        }
      }
    },
  },
  plugins: [],
}
