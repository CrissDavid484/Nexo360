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
          navy: '#002B49',        // Azul marino institucional Duoc UC (Contraste 12.6:1 sobre blanco - Supera WCAG AAA)
          navyDark: '#001D33',    // Azul noche profundo (Contraste 15.5:1 sobre blanco)
          yellow: '#FFA300',      // Amarillo institucional Duoc UC
          gold: '#FFB81C',        // Dorado accesible para foco y acentos
          amber: '#B45309',       // Ámbar accesible para textos legibles (Contraste 4.6:1 sobre blanco)
          light: '#F8FAFC',       // Fondo claro accesible
          dark: '#0B132B',        // Fondo oscuro de alta legibilidad
        },
        hc: {
          bg: '#000000',          // Alto contraste: Fondo negro absoluto
          text: '#FFFF00',        // Alto contraste: Amarillo puro (legibilidad máxima)
          accent: '#00FFFF',      // Alto contraste: Cian vibrante
          border: '#FFFFFF',      // Alto contraste: Borde blanco puro
        }
      },
      fontFamily: {
        sans: [
          '"Atkinson Hyperlegible"',
          '"Open Sans"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        atkinson: [
          '"Atkinson Hyperlegible"',
          'sans-serif',
        ],
        opensans: [
          '"Open Sans"',
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
      minHeight: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '48px',
      },
      maxWidth: {
        'prose-aaa': '75ch', // WCAG 1.4.8 Visual Presentation (AAA): No more than 80 characters per line
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};
