/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: '#F4A261',
        pine: '#2A6F6B',
        snow: '#FAFAFA',
      },
      fontFamily: {
        heading: ['Cormorant Garamond', 'serif'],
        body: ['Nunito Sans', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 14px 40px rgba(42, 111, 107, 0.14)',
      },
    },
  },
  plugins: [],
}
