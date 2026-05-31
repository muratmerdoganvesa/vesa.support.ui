/** @type {import('tailwindcss').Config} */
export default {
    important: true, // TÜM sınıfları otomatik !important yapar
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }