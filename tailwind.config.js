/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        surface: {
          warm: '#faf8f5',
          card: '#ffffff',
          muted: '#f5f3f0',
        },
      },
      backgroundImage: {
        'texture-mesh': 'radial-gradient(at 40% 20%, rgba(20, 184, 166, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168, 85, 247, 0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(20, 184, 166, 0.05) 0px, transparent 50%), radial-gradient(at 80% 50%, rgba(251, 191, 36, 0.04) 0px, transparent 50%)',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 184, 166, 0.15), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(168, 85, 247, 0.08), transparent), radial-gradient(ellipse 60% 40% at 0% 50%, rgba(20, 184, 166, 0.06), transparent)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(15, 23, 42, 0.06), 0 10px 20px -2px rgba(15, 23, 42, 0.04)',
        'soft-teal': '0 4px 20px -2px rgba(20, 184, 166, 0.15), 0 8px 25px -4px rgba(20, 184, 166, 0.08)',
        'soft-violet': '0 4px 20px -2px rgba(168, 85, 247, 0.12), 0 8px 25px -4px rgba(168, 85, 247, 0.06)',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out forwards',
        'pulse-soft': 'pulse 1.5s ease-in-out infinite',
      },
      backgroundSize: {
        'shimmer': '200% 100%',
      },
    },
  },
  plugins: [],
}

