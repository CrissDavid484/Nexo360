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
import { speak, stopSpeech, resolveReadableText } from '../utils/speechService';

const AccessibilityContext = createContext();

function syncDocumentAccessibilityClasses({
  fontSize,
  highContrast,
  dyslexicFont,
  reducedMotion,
  readingGuide,
  voiceReader,
}) {
  const root = document.documentElement;
  root.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
  root.classList.add(`font-size-${fontSize}`);

  root.classList.toggle('high-contrast', highContrast);
  root.classList.toggle('font-dyslexic', dyslexicFont);
  root.classList.toggle('reduced-motion', reducedMotion);

  localStorage.setItem('nexo360_font_size', fontSize);
  localStorage.setItem('nexo360_high_contrast', String(highContrast));
  localStorage.setItem('nexo360_dyslexic_font', String(dyslexicFont));
  localStorage.setItem('nexo360_reduced_motion', String(reducedMotion));
  localStorage.setItem('nexo360_reading_guide', String(readingGuide));
  localStorage.setItem('nexo360_voice_reader', String(voiceReader));
}

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

  // Lector de pantalla por voz (Web Speech API) bajo hover/foco
  const [voiceReader, setVoiceReader] = useState(() => {
    return localStorage.getItem('nexo360_voice_reader') === 'true';
  });

  // Estado para la cortina de transición suave entre temas
  const [isCurtainAnimating, setIsCurtainAnimating] = useState(false);

  // Estado para anuncios de lectores de pantalla (WCAG 4.1.3 Status Messages)
  const [announcement, setAnnouncement] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState('polite');
  const announceTimerRef = useRef(null);
  const curtainToggleTimerRef = useRef(null);
  const curtainEndTimerRef = useRef(null);
  const isInitialMountRef = useRef(true);
  const skipBackendSyncRef = useRef(false);
  const voiceReaderRef = useRef(voiceReader);
  voiceReaderRef.current = voiceReader;

  // Función memoizada para anunciar cambios dinámicos a lectores de pantalla (NVDA, JAWS, VoiceOver)
  // y locutar automáticamente estados/alertas cuando Lectura por Voz está activa.
  const announce = useCallback((message, priority = 'polite') => {
    if (announceTimerRef.current) {
      clearTimeout(announceTimerRef.current);
    }
    setAnnouncementPriority(priority);
    setAnnouncement('');
    announceTimerRef.current = setTimeout(() => {
      setAnnouncement(message);
    }, 50);

    if (voiceReaderRef.current && message) {
      speak(message, { force: priority === 'assertive' });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
      if (curtainToggleTimerRef.current) clearTimeout(curtainToggleTimerRef.current);
      if (curtainEndTimerRef.current) clearTimeout(curtainEndTimerRef.current);
      stopSpeech();
    };
  }, []);

  // Sincronizar clases con el elemento raíz <html> y persistir solo ante cambios del usuario autenticado
  useEffect(() => {
    syncDocumentAccessibilityClasses({
      fontSize,
      highContrast,
      dyslexicFont,
      reducedMotion,
      readingGuide,
      voiceReader,
    });

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
          readingGuide,
          voiceReader,
          screenReaderOptimized: true,
        })
        .catch((err) => {
          console.warn('[AccessibilityContext] Error al sincronizar preferencias con backend:', err);
        });
    }
  }, [fontSize, highContrast, dyslexicFont, reducedMotion, readingGuide, voiceReader]);

  // Controles de tamaño de fuente memoizados
  const increaseFontSize = useCallback(() => {
    if (fontSize === 'normal') {
      setFontSize('large');
      announce('Tamaño de texto aumentado a grande');
      return;
    }
    if (fontSize === 'large') {
      setFontSize('xlarge');
      announce('Tamaño de texto aumentado a extra grande');
    }
  }, [fontSize, announce]);

  const decreaseFontSize = useCallback(() => {
    if (fontSize === 'xlarge') {
      setFontSize('large');
      announce('Tamaño de texto reducido a grande');
      return;
    }
    if (fontSize === 'large') {
      setFontSize('normal');
      announce('Tamaño de texto restablecido a tamaño normal');
    }
  }, [fontSize, announce]);

  const toggleHighContrast = useCallback(() => {
    const next = !highContrast;
    const applyChange = () => {
      setHighContrast(next);
      announce(next ? 'Modo de alto contraste activado' : 'Modo de alto contraste desactivado');
    };

    // Si el usuario tiene activo movimiento reducido, cambio instantáneo
    if (reducedMotion) {
      applyChange();
      return;
    }

    // Cortina de transición elegante (View Transition API nativa o fallback)
    if (typeof document !== 'undefined' && document.startViewTransition) {
      setIsCurtainAnimating(true);
      const transition = document.startViewTransition(applyChange);
      transition.finished
        .catch((error) => console.error('Error en transición de accesibilidad:', error))
        .finally(() => {
          setIsCurtainAnimating(false);
        });
    } else {
      if (curtainToggleTimerRef.current) clearTimeout(curtainToggleTimerRef.current);
      if (curtainEndTimerRef.current) clearTimeout(curtainEndTimerRef.current);

      setIsCurtainAnimating(true);
      curtainToggleTimerRef.current = setTimeout(applyChange, 200);
      curtainEndTimerRef.current = setTimeout(() => {
        setIsCurtainAnimating(false);
      }, 500);
    }
  }, [highContrast, reducedMotion, announce]);

  const toggleDyslexicFont = useCallback(() => {
    const next = !dyslexicFont;
    setDyslexicFont(next);
    announce(next ? 'Fuente de alta legibilidad activada' : 'Fuente estándar activada');
  }, [dyslexicFont, announce]);

  const toggleReducedMotion = useCallback(() => {
    const next = !reducedMotion;
    setReducedMotion(next);
    announce(next ? 'Animaciones reducidas activadas' : 'Animaciones activadas');
  }, [reducedMotion, announce]);

  const toggleReadingGuide = useCallback(() => {
    const next = !readingGuide;
    setReadingGuide(next);
    localStorage.setItem('nexo360_reading_guide', String(next));
    announce(
      next
        ? 'Guía de lectura activada. Una regla visual resaltará la línea bajo el cursor.'
        : 'Guía de lectura desactivada.',
      'polite'
    );
  }, [readingGuide, announce]);

  const toggleVoiceReader = useCallback(() => {
    const next = !voiceReaderRef.current;
    voiceReaderRef.current = next;
    setVoiceReader(next);
    localStorage.setItem('nexo360_voice_reader', String(next));
    if (next) {
      announce(
        'Lectura por voz activada. Presiona Escape para silenciar o Alt más V para desactivar',
        'assertive'
      );
    } else {
      stopSpeech();
      announce('Lectura por voz desactivada', 'polite');
    }
  }, [announce]);

  const speakText = useCallback(
    (text, options = {}) => {
      if (!voiceReaderRef.current && !options.force) return false;
      return speak(text, options);
    },
    []
  );

  const stopSpeaking = useCallback(() => {
    stopSpeech();
  }, []);

  const getVoiceProps = useCallback(
    (customText) => {
      const handleSpeakEvent = (event) => {
        if (!voiceReaderRef.current) return;
        const target = event?.currentTarget;
        const rawBaseText = typeof customText === 'function' ? customText(target) : customText;
        const resolved = resolveReadableText(target, rawBaseText);
        if (resolved) {
          speak(resolved, { element: target });
        }
      };

      return {
        'data-voice-managed': 'true',
        onMouseEnter: handleSpeakEvent,
        onFocus: handleSpeakEvent,
      };
    },
    []
  );

  const resetPreferences = useCallback(() => {
    setFontSize('normal');
    setHighContrast(false);
    setDyslexicFont(false);
    setReducedMotion(false);
    setReadingGuide(false);
    voiceReaderRef.current = false;
    setVoiceReader(false);
    stopSpeech();
    localStorage.removeItem('nexo360_reading_guide');
    localStorage.removeItem('nexo360_voice_reader');
    announce('Preferencias de visualización restablecidas a los valores predeterminados');
  }, [announce]);

  // Cargar preferencias guardadas del usuario desde el backend sin disparar PUT redundante
  const loadUserPreferences = useCallback((prefs) => {
    if (!prefs) return;
    skipBackendSyncRef.current = true;
    if (prefs.fontSize) {
      setFontSize(prefs.fontSize);
      localStorage.setItem('nexo360_font_size', prefs.fontSize);
    }
    if (typeof prefs.highContrast === 'boolean') {
      setHighContrast(prefs.highContrast);
      localStorage.setItem('nexo360_high_contrast', String(prefs.highContrast));
    }
    if (typeof prefs.dyslexicFont === 'boolean') {
      setDyslexicFont(prefs.dyslexicFont);
      localStorage.setItem('nexo360_dyslexic_font', String(prefs.dyslexicFont));
    }
    if (typeof prefs.reducedMotion === 'boolean') {
      setReducedMotion(prefs.reducedMotion);
      localStorage.setItem('nexo360_reduced_motion', String(prefs.reducedMotion));
    }
    if (typeof prefs.readingGuide === 'boolean') {
      setReadingGuide(prefs.readingGuide);
      localStorage.setItem('nexo360_reading_guide', String(prefs.readingGuide));
    }
    if (typeof prefs.voiceReader === 'boolean') {
      setVoiceReader(prefs.voiceReader);
      localStorage.setItem('nexo360_voice_reader', String(prefs.voiceReader));
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      fontSize,
      highContrast,
      dyslexicFont,
      reducedMotion,
      readingGuide,
      voiceReader,
      isCurtainAnimating,
      announcement,
      announcementPriority,
      announce,
      increaseFontSize,
      decreaseFontSize,
      toggleHighContrast,
      toggleDyslexicFont,
      toggleReducedMotion,
      toggleReadingGuide,
      toggleVoiceReader,
      speakText,
      stopSpeaking,
      getVoiceProps,
      resetPreferences,
      resetAccessibility: resetPreferences,
      loadUserPreferences,
    }),
    [
      fontSize,
      highContrast,
      dyslexicFont,
      reducedMotion,
      readingGuide,
      voiceReader,
      isCurtainAnimating,
      announcement,
      announcementPriority,
      announce,
      increaseFontSize,
      decreaseFontSize,
      toggleHighContrast,
      toggleDyslexicFont,
      toggleReducedMotion,
      toggleReadingGuide,
      toggleVoiceReader,
      speakText,
      stopSpeaking,
      getVoiceProps,
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
