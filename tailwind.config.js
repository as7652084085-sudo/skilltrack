/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'Mukta', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', 'Mukta', 'Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(15, 23, 42, 0.18)',
        lift: '0 18px 40px -16px rgba(37, 99, 235, 0.35)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pop': {
          '0%': { transform: 'scale(0.96) translateY(8px)' },
          '60%': { transform: 'scale(1.01) translateY(-1px)' },
          '100%': { transform: 'scale(1) translateY(0)' },
        },
        'ring': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '80%, 100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fade-in 0.25s ease-out both',
        'pop': 'pop 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'ring': 'ring 1.6s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
        'float': 'float 3.5s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
