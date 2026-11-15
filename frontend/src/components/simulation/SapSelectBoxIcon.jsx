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

/**
 * Icono auténtico SAP NetWeaver para Estado "Seleccionada / Inscrita"
 * Carpeta amarilla SAP con insignia circular verde y check blanco (✓) en primer plano.
 */
export const SapEstadoSelectedIcon = ({ className = "w-4 h-4" }) => {
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
      <path d="M3 6.5 L14.5 6.5 L14.5 8 L3 8 Z" fill="#FFEE58" />
      {/* Insignia circular verde con check blanco */}
      <circle cx="8" cy="11" r="4.5" fill="#43A047" stroke="#1B5E20" strokeWidth="0.8" />
      <path
        d="M5.6 11.1 L7.2 12.7 L10.6 9.3"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Icono auténtico SAP para Eliminar / Desinscribir ramo ya inscrito (2ª columna en Modificación)
 * Documento blanco con bordes grises y X roja en la esquina inferior derecha.
 */
export const SapDeleteEnrolledIcon = ({ className = "w-4 h-4" }) => {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Documento blanco con esquina doblada */}
      <path
        d="M3 2 L10.5 2 L13.5 5 L13.5 15 L3 15 Z"
        fill="#FFFFFF"
        stroke="#546E7A"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path d="M10.5 2 L10.5 5 L13.5 5 Z" fill="#CFD8DC" stroke="#546E7A" strokeWidth="0.7" />
      <line x1="5" y1="6.5" x2="10.5" y2="6.5" stroke="#90A4AE" strokeWidth="0.9" />
      <line x1="5" y1="9" x2="9.5" y2="9" stroke="#90A4AE" strokeWidth="0.9" />
      <line x1="5" y1="11.5" x2="8.5" y2="11.5" stroke="#90A4AE" strokeWidth="0.9" />
      {/* X roja en esquina inferior derecha */}
      <circle cx="13" cy="13" r="4" fill="#FFF5F5" stroke="#C62828" strokeWidth="0.7" />
      <path
        d="M11 11 L15 15 M15 11 L11 15"
        stroke="#D32F2F"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Icono auténtico SAP de Basurero metálico para quitar de "Cursos seleccionados"
 */
export const SapTrashIcon = ({ className = "w-3.5 h-3.5" }) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Tapa */}
      <rect x="3" y="3" width="10" height="1.8" rx="0.5" fill="#90A4AE" stroke="#37474F" strokeWidth="0.8" />
      <rect x="6" y="1.5" width="4" height="1.5" fill="#B0BEC5" stroke="#37474F" strokeWidth="0.7" />
      {/* Cuerpo del basurero */}
      <path
        d="M4 5 L12 5 L11.2 14 L4.8 14 Z"
        fill="#CFD8DC"
        stroke="#37474F"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <line x1="6.3" y1="6.5" x2="6.6" y2="12.5" stroke="#546E7A" strokeWidth="0.8" />
      <line x1="8" y1="6.5" x2="8" y2="12.5" stroke="#546E7A" strokeWidth="0.8" />
      <line x1="9.7" y1="6.5" x2="9.4" y2="12.5" stroke="#546E7A" strokeWidth="0.8" />
    </svg>
  );
};

/**
 * Icono auténtico SAP para el botón "Inscribir" / "Grabar"
 */
export const SapInscribirIcon = ({ className = "w-3.5 h-3.5" }) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Ficha / hoja azul y blanca */}
      <rect x="2" y="2" width="10" height="11" rx="1" fill="#E3F2FD" stroke="#1565C0" strokeWidth="1" />
      <rect x="4" y="2" width="6" height="3.5" fill="#1976D2" />
      <rect x="4" y="8" width="6" height="4" fill="#FFFFFF" stroke="#64B5F6" strokeWidth="0.7" />
      {/* Cuadrado pequeño azul de confirmación / disquete SAP */}
      <rect x="9.5" y="9" width="5" height="5" rx="0.8" fill="#0D47A1" stroke="#FFFFFF" strokeWidth="0.7" />
      <path d="M10.8 11.5 L11.8 12.6 L13.4 10.6" stroke="#FFFFFF" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/**
 * Icono auténtico SAP para el botón "Ver Horario"
 * Ventana / libro vertical con franjas de colores (negro, azul, celeste) como en el portal SICOL.
 */
export const SapVerHorarioIcon = ({ className = "w-3.5 h-3.5" }) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="1.5" y="2" width="13" height="12" fill="#ECEFF1" stroke="#263238" strokeWidth="1" />
      <rect x="2.5" y="3" width="3" height="10" fill="#263238" />
      <rect x="6.5" y="3" width="3" height="10" fill="#1E88E5" />
      <rect x="10.5" y="3" width="3" height="10" fill="#81D4FA" />
      <line x1="6.5" y1="6.5" x2="13.5" y2="6.5" stroke="#0D47A1" strokeWidth="0.6" />
      <line x1="6.5" y1="9.8" x2="13.5" y2="9.8" stroke="#0D47A1" strokeWidth="0.6" />
    </svg>
  );
};

/**
 * Recuadro verde (#68A61C) con doble flecha blanca >> para "Haz Click Para Continuar"
 */
export const SapContinueArrowsIcon = ({ className = "w-5 h-5" }) => {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="18" height="18" rx="1.5" fill="#68A61C" stroke="#4D7C12" strokeWidth="1" />
      <path
        d="M5.5 6 L9.5 10 L5.5 14 M10.5 6 L14.5 10 L10.5 14"
        stroke="#FFFFFF"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
