module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#dce4fe',
          300: '#c2cdfd',
          400: '#9daafb',
          500: '#707df7',
          600: '#5559f0',
          700: '#4645da',
          800: '#3a3ab1',
          900: '#33348d',
          950: '#1e1e53',
        },
        secondary: {
          50: '#f4fbf2',
          100: '#e5f6e0',
          500: '#7EBA02',
          600: '#529900',
          700: '#3f7300',
        },
        accent: {
          DEFAULT: '#FFC102',
          500: '#FFC102',
          600: '#e69500',
        }
      }
    },
  },
  plugins: [],
};