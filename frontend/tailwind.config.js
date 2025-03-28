/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      colors: {
        primary: '#2563eb',     // Blue
        secondary: '#10b981',   // Green
        lightBg: '#f9f9f9',     // Light Background
        lightText: '#111827',   // Dark Text
      },
    },
  },
  plugins: [],
}
