/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F4FF',
          100: '#ECF1FF',
          200: '#D9E4FF',
          500: '#315BF4', // Primary Figma
          600: '#2547CE',
          700: '#1D36A3',
        },
        ink: {
          900: '#1D2737', // Headline & dark text
          700: '#42506A', // Body text
          500: '#7D8DA8', // Secondary / muted text
          300: '#A9B7CD',
        },
        surface: {
          canvas: '#FAFCFF',
          card: '#F7FAFF',
          border: '#E8EDF4',
        },
        'figma-primary': {
          DEFAULT: '#315BF4',
          dark: '#2547CE',
          soft: '#ECF1FF',
        },
        'figma-canvas': '#FAFCFF',
        'figma-border': '#E8EDF4',
        'figma-dark': '#1D2737',
        'figma-body': '#42506A',
        'figma-muted': '#7D8DA8',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        editorial: '0px 10px 24px -7px rgba(51, 87, 166, 0.09)',
        card: '0px 9px 22px -7px rgba(48, 82, 163, 0.08)',
      }
    },
  },
  plugins: [],
}

