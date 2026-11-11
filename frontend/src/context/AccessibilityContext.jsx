import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { api } from '../services/api';

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

  // Guía de lectura / regla de enfoque para Dislexia y TDAH (W3C COGA)
  const [readingGuide, setReadingGuide] = useState(() => {
    return localStorage.getItem('nexo360_reading_guide') === 'true';
  });

  // Estado para anuncios de lectores de pantalla (WCAG 4.1.3 Status Messages)
  const [announcement, setAnnouncement] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('polite');
  const announceTimerRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const skipBackendSyncRef = useRef(false);

  // Función memoizada para anunciar cambios dinámicos a lectores de pantalla (NVDA, JAWS, VoiceOver)
  const announce = useCallback((message, priority = 'polite') => {
    if (announceTimerRef.current) {
      clearTimeout(announceTimerRef.current);
    }
    setAnnouncementPriority(priority);
    setAnnouncement('');
    announceTimerRef.current = setTimeout(() => {
      setAnnouncement(message);
    }, 50);
  }, []);

  useEffect(() => {
    return () => {
      if (announceTimerRef.current) {
        clearTimeout(announceTimerRef.current);
      }
    };
  }, []);

  // Sincronizar clases con el elemento raíz <html> y persistir solo ante cambios del usuario autenticado
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

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (skipBackendSyncRef.current) {
      skipBackendSyncRef.current = false;
      return;
    }

    // Sincronizar preferencias de accesibilidad con MongoDB únicamente si existe sesión activa
    if (localStorage.getItem('nexo360_token')) {
      api
        .saveAccessibilityPreferences({
          fontSize,
          highContrast,
          dyslexicFont,
          reducedMotion,
          screenReaderOptimized: true,
        })
        .catch(() => {});
    }
  }, [fontSize, highContrast, dyslexicFont, reducedMotion]);

  // Controles de tamaño de fuente memoizados
  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      if (prev === 'normal') {
        announce('Tamaño de texto aumentado a grande');
        return 'large';
      }
      if (prev === 'large') {
        announce('Tamaño de texto aumentado a extra grande');
        return 'xlarge';
      }
      return prev;
    });
  }, [announce]);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      if (prev === 'xlarge') {
        announce('Tamaño de texto reducido a grande');
        return 'large';
      }
      if (prev === 'large') {
        announce('Tamaño de texto restablecido a tamaño normal');
        return 'normal';
      }
      return prev;
    });
  }, [announce]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => {
      const next = !prev;
      announce(next ? 'Modo de alto contraste activado' : 'Modo de alto contraste desactivado');
      return next;
    });
  }, [announce]);

  const toggleDyslexicFont = useCallback(() => {
    setDyslexicFont((prev) => {
      const next = !prev;
      announce(next ? 'Fuente de alta legibilidad activada' : 'Fuente estándar activada');
      return next;
    });
  }, [announce]);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotion((prev) => {
      const next = !prev;
      announce(next ? 'Animaciones reducidas activadas' : 'Animaciones activadas');
      return next;
    });
  }, [announce]);

  const toggleReadingGuide = useCallback(() => {
    setReadingGuide((prev) => {
      const next = !prev;
      localStorage.setItem('nexo360_reading_guide', String(next));
      announce(
        next
          ? 'Guía de lectura activada. Una regla visual resaltará la línea bajo el cursor.'
          : 'Guía de lectura desactivada.',
        'polite'
      );
      return next;
    });
  }, [announce]);

  const resetPreferences = useCallback(() => {
    setFontSize('normal');
    setHighContrast(false);
    setDyslexicFont(false);
    setReducedMotion(false);
    setReadingGuide(false);
    localStorage.removeItem('nexo360_reading_guide');
    announce('Preferencias de visualización restablecidas a los valores predeterminados');
  }, [announce]);

  // Cargar preferencias guardadas del usuario desde el backend sin disparar PUT redundante
  const loadUserPreferences = useCallback((prefs) => {
    if (!prefs) return;
    skipBackendSyncRef.current = true;
    if (prefs.fontSize) setFontSize(prefs.fontSize);
    if (typeof prefs.highContrast === 'boolean') setHighContrast(prefs.highContrast);
    if (typeof prefs.dyslexicFont === 'boolean') setDyslexicFont(prefs.dyslexicFont);
    if (typeof prefs.reducedMotion === 'boolean') setReducedMotion(prefs.reducedMotion);
  }, []);

  const contextValue = useMemo(
    () => ({
      fontSize,
      highContrast,
      dyslexicFont,
      reducedMotion,
      readingGuide,
      announcement,
      announcementPriority,
      announce,
      increaseFontSize,
      decreaseFontSize,
      toggleHighContrast,
      toggleDyslexicFont,
      toggleReducedMotion,
      toggleReadingGuide,
      resetPreferences,
      loadUserPreferences,
    }),
    [
      fontSize,
      highContrast,
      dyslexicFont,
      reducedMotion,
      readingGuide,
      announcement,
      announcementPriority,
      announce,
      increaseFontSize,
      decreaseFontSize,
      toggleHighContrast,
      toggleDyslexicFont,
      toggleReducedMotion,
      toggleReadingGuide,
      resetPreferences,
      loadUserPreferences,
    ]
  );

  return (
    <AccessibilityContext.Provider value={contextValue}>
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
