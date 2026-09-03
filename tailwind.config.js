/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lokta: {
          bg: '#FBF9FA',
          bg2: '#F3EEF1',
          ink: '#221A20',
          muted: '#6E6069',
          rule: '#E2D9DE',
          accent: '#4B2440',
          accentSoft: '#EFE3EA',
          warn: '#8A4B12',
          success: '#1B633F',
          successSoft: '#E8F5EE',
          danger: '#8C1D24',
          dangerSoft: '#FCECEE',
        }
      },
      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        body: ['Source Sans 3', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
