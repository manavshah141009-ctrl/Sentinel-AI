/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        club: {
          cream: '#FAF4E8',
          creamdark: '#F1E8D2',
          ink: '#14201C',
          pine: '#0C3B32',
          pinedeep: '#082A24',
          leaf: '#1E9E6A',
          tang: '#FF6B2C',
          gold: '#F5B301',
        },
        police: {
          dark: '#0a1128',
          navy: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#FF6B00',
          blue: '#2563eb',
          alert: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
