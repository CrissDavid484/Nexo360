import React from 'react';

/**
 * Icono auténtico SAP WebDynpro SICOL de Duoc UC (Columna de Selección / Tomar Asignatura)
 * Fiel a single_icon_col1.png extraído directamente del portal oficial:
 * Representa un cubo 3D gris/azul acero a la izquierda y una mano humana desde la derecha
 * con los dedos curvados tomando o sujetando el cubo.
 */
export const SapSelectBoxIcon = ({ className = "w-4 h-4" }) => {
  return (
    <svg
      viewBox="0 0 20 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 1. Cubo 3D gris/azul acero (lado izquierdo) */}
      {/* Cara superior del cubo */}
      <polygon
        points="1.5,5.5 6,3 10.5,5.5 6,8"
        fill="#8CA4BC"
        stroke="#1A2938"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Cara frontal izquierda del cubo (sombra) */}
      <polygon
        points="1.5,5.5 6,8 6,14.5 1.5,12"
        fill="#2C3E50"
        stroke="#1A2938"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Cara frontal derecha del cubo (medio tono) */}
      <polygon
        points="6,8 10.5,5.5 10.5,12 6,14.5"
        fill="#4A6278"
        stroke="#1A2938"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />

      {/* 2. Mano en tono piel alcanzando y tomando el cubo desde la derecha */}
      {/* Muñeca / brazo que entra desde el borde derecho */}
      <path
        d="M19 14.5 L14 14 L12.5 11 L14.5 8.5 L19 9.5 Z"
        fill="#E8B888"
        stroke="#422510"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Palma / dorso de la mano */}
      <path
        d="M14.5 8.5 L10 7.5 L7.5 9 L9 11.5 L12.5 11 Z"
        fill="#F5CBA0"
        stroke="#422510"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Dedo pulgar curvado sobre la parte superior del cubo */}
      <path
        d="M9.5 7.5 C8 6.5 6.5 6.8 6 7.5 C6.5 8 8 8.5 9.5 8 Z"
        fill="#FCE0C2"
        stroke="#422510"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      {/* Dedos índice y medio curvados agarrando el frente del cubo */}
      <path
        d="M8.5 9 L6.8 9.8 L7.2 11.5 L9 11 Z"
        fill="#E8B888"
        stroke="#422510"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      <path
        d="M10 10.8 L8.5 11.5 L9 13 L10.8 12.2 Z"
        fill="#DFA876"
        stroke="#422510"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Icono auténtico SAP WebDynpro SICOL de Duoc UC (Columna Estado)
 * Fiel a single_icon_col2.png extraído directamente del portal oficial:
 * Carpeta / ficha amarilla con un anillo circular / lupa metálica en primer plano.
 */
export const SapEstadoIcon = ({ className = "w-4 h-4" }) => {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Carpeta / Ficha amarilla */}
      <path
        d="M2 5 L6 5 L7.5 7 L15.5 7 L15.5 14.5 L2 14.5 Z"
        fill="#FDD835"
        stroke="#8D6E00"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* Pestaña superior con reflejo */}
      <path
        d="M3 6.5 L14.5 6.5 L14.5 8 L3 8 Z"
        fill="#FFEE58"
      />
      {/* Anillo circular / lupa metálica en primer plano */}
      <circle
        cx="8"
        cy="11"
        r="4"
        fill="#FFFFFF"
        stroke="#37474F"
        strokeWidth="1.2"
      />
      <circle
        cx="8"
        cy="11"
        r="2.8"
        fill="#E0E6ED"
        stroke="#78909C"
        strokeWidth="0.6"
      />
    </svg>
  );
};

/**
 * Icono auténtico SAP para la pestaña "Horario"
 * Ventana cuadriculada con marco negro y el panel vertical izquierdo en color cian brillante.
 */
export const SapHorarioTabIcon = ({ className = "w-4 h-4" }) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Fondo marco exterior negro */}
      <rect x="1" y="2" width="14" height="12" fill="#2E4053" stroke="#000000" strokeWidth="1" />
      {/* Panel vertical izquierdo en cian brillante */}
      <rect x="2" y="3" width="3.5" height="10" fill="#00D2FF" />
      {/* Paneles de la cuadrícula derecha */}
      <rect x="6.5" y="3" width="3.5" height="4.5" fill="#7F9AA8" stroke="#000000" strokeWidth="0.6" />
      <rect x="10.5" y="3" width="3.5" height="4.5" fill="#7F9AA8" stroke="#000000" strokeWidth="0.6" />
      <rect x="6.5" y="8" width="3.5" height="4.5" fill="#7F9AA8" stroke="#000000" strokeWidth="0.6" />
      <rect x="10.5" y="8" width="3.5" height="4.5" fill="#7F9AA8" stroke="#000000" strokeWidth="0.6" />
    </svg>
  );
};

/**
 * Icono auténtico SAP para la pestaña "Cursos seleccionados"
 * Diagrama de flujo / proceso con líneas blancas de conexión y nodos rojos con borde negro.
 */
export const SapCursosTabIcon = ({ className = "w-4 h-4" }) => {
  return (
    <svg
      viewBox="0 0 18 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Línea blanca de flujo escalonada */}
      <path
        d="M2.5 12 L7 12 L7 5 L13 5 L13 8"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
      {/* Nodo / caja roja superior izquierda */}
      <rect x="5.5" y="2" width="4" height="4" fill="#D32F2F" stroke="#000000" strokeWidth="0.9" />
      {/* Nodo / caja roja superior derecha */}
      <rect x="11.5" y="4" width="4" height="4" fill="#E53935" stroke="#000000" strokeWidth="0.9" />
      {/* Nodo / caja roja inferior derecha */}
      <rect x="11.5" y="9" width="4" height="4" fill="#C62828" stroke="#000000" strokeWidth="0.9" />
      {/* Nodo blanco inicial */}
      <rect x="1" y="10" width="3.5" height="3.5" fill="#ECEFF1" stroke="#000000" strokeWidth="0.8" />
    </svg>
  );
};
