/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        duoc: {
          navy: '#002B49',     // Azul marino institucional Duoc UC (Contraste 12.6:1 sobre blanco)
          yellow: '#FFA300',   // Amarillo institucional Duoc UC
          amber: '#B45309',    // Ámbar accesible para textos legibles (Contraste 4.6:1 sobre blanco)
          light: '#F8FAFC',    // Fondo claro accesible
          dark: '#0B132B',     // Fondo oscuro de alta legibilidad
        },
        hc: {
          bg: '#000000',       // Alto contraste: Fondo negro absoluto
          text: '#FFFF00',     // Alto contraste: Amarillo puro (legibilidad máxima)
          accent: '#00FFFF',   // Alto contraste: Cian vibrante
          border: '#FFFFFF',   // Alto contraste: Borde blanco puro
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        dyslexic: [
          '"OpenDyslexic"',
          '"Comic Sans MS"',
          'sans-serif',
        ],
      },
      ringWidth: {
        'accessible': '4px',
      },
    },
  },
  plugins: [],
};
