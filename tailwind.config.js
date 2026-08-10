/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f6f3",
          100: "#e6ebe2",
          200: "#cdd8c5",
          300: "#a9bd9c",
          400: "#839c73",
          500: "#647d56",
          600: "#4e6342",
          700: "#3f4f37",
          800: "#35412f",
          900: "#2d3629",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
