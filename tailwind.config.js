/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#ff6b35",
        "background-light": "#ffffff",
        "background-dark": "#181410",
        "text-light": "#181411",
        "text-dark": "#f8f7f5",
        "text-primary-light": "#212121",
        "text-secondary-light": "#757575",
        "text-primary-dark": "#f8f7f5",
        "text-secondary-dark": "#8d755e",
        "text-subtle-light": "#8a7560",
        "text-subtle-dark": "#a1988e",
        "card-light": "#ffffff",
        "card-dark": "#2a2218",
        "border-light": "#e6e0db",
        "border-dark": "#3c3329",
        "surface": "#ffffff",
        "text-headings": "#212529",
        "text-body": "#6C757D",
        "subtle-light": "#eadbcd",
        "subtle-dark": "#4a3c2b",
        "placeholder-light": "#a17145",
        "placeholder-dark": "#a1917f",
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "Noto Sans KR", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
    },
  },
  plugins: [],
}

