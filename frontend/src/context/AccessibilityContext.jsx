import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  // Inicialización desde localStorage
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('nexo360_font_size') || 'normal';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('nexo360_high_contrast') === 'true';
  });

  const [dyslexicFont, setDyslexicFont] = useState(() => {
    return localStorage.getItem('nexo360_dyslexic_font') === 'true';
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('nexo360_reduced_motion') === 'true';
  });

  // Estado para anuncios de lectores de pantalla (WCAG 4.1.3 Status Messages)
  const [announcement, setAnnouncement] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('polite');

  // Función para anunciar cambios dinámicos a lectores de pantalla (NVDA, JAWS, VoiceOver)
  const announce = (message, priority = 'polite') => {
    setAnnouncementPriority(priority);
    setAnnouncement('');
    setTimeout(() => {
      setAnnouncement(message);
    }, 50);
  };

  // Sincronizar clases con el elemento raíz <html>
  useEffect(() => {
    const root = document.documentElement;

    // Tamaño de fuente
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
    root.classList.add(`font-size-${fontSize}`);
    localStorage.setItem('nexo360_font_size', fontSize);

    // Alto contraste
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('nexo360_high_contrast', String(highContrast));

    // Fuente para dislexia
    if (dyslexicFont) {
      root.classList.add('font-dyslexic');
    } else {
      root.classList.remove('font-dyslexic');
    }
    localStorage.setItem('nexo360_dyslexic_font', String(dyslexicFont));

    // Movimiento reducido
    if (reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    localStorage.setItem('nexo360_reduced_motion', String(reducedMotion));
  }, [fontSize, highContrast, dyslexicFont, reducedMotion]);

  // Controles de tamaño de fuente
  const increaseFontSize = () => {
    if (fontSize === 'normal') {
      setFontSize('large');
      announce('Tamaño de texto aumentado a grande');
    } else if (fontSize === 'large') {
      setFontSize('xlarge');
      announce('Tamaño de texto aumentado a extra grande');
    }
  };

  const decreaseFontSize = () => {
    if (fontSize === 'xlarge') {
      setFontSize('large');
      announce('Tamaño de texto reducido a grande');
    } else if (fontSize === 'large') {
      setFontSize('normal');
      announce('Tamaño de texto restablecido a tamaño normal');
    }
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const next = !prev;
      announce(next ? 'Modo de alto contraste activado' : 'Modo de alto contraste desactivado');
      return next;
    });
  };

  const toggleDyslexicFont = () => {
    setDyslexicFont((prev) => {
      const next = !prev;
      announce(next ? 'Fuente de alta legibilidad activada' : 'Fuente estándar activada');
      return next;
    });
  };

  const toggleReducedMotion = () => {
    setReducedMotion((prev) => {
      const next = !prev;
      announce(next ? 'Animaciones reducidas activadas' : 'Animaciones activadas');
      return next;
    });
  };

  // Cargar preferencias guardadas del usuario desde el backend
  const loadUserPreferences = (prefs) => {
    if (!prefs) return;
    if (prefs.fontSize) setFontSize(prefs.fontSize);
    if (typeof prefs.highContrast === 'boolean') setHighContrast(prefs.highContrast);
    if (typeof prefs.dyslexicFont === 'boolean') setDyslexicFont(prefs.dyslexicFont);
    if (typeof prefs.reducedMotion === 'boolean') setReducedMotion(prefs.reducedMotion);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        highContrast,
        dyslexicFont,
        reducedMotion,
        announcement,
        announcementPriority,
        announce,
        increaseFontSize,
        decreaseFontSize,
        toggleHighContrast,
        toggleDyslexicFont,
        toggleReducedMotion,
        loadUserPreferences,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe usarse dentro de un AccessibilityProvider');
  }
  return context;
};
