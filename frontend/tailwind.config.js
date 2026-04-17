/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#0F0F11',
          sidebar: '#17171A',
          card: '#1E1E23',
          accent: '#6C63FF',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          text: '#F4F4F5',
          muted: '#A1A1AA',
          border: 'rgba(255,255,255,0.07)',
        },
      },
      boxShadow: {
        card: '0 16px 38px -20px rgba(0,0,0,0.55)',
      },
    },
  },
  plugins: [],
};
