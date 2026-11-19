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
import {
  getColorBlindModeMeta,
  getDefaultPreferencesForDisability,
  getDisabilityProfileMeta,
  isBlindDisabilityProfile,
  normalizeColorBlindMode,
} from '../utils/accessibilityProfiles';

const AccessibilityContext = createContext();

const VALID_FONT_SIZES = new Set(['normal', 'large', 'xlarge']);
const COLOR_BLIND_CLASSES = ['cb-protanopia', 'cb-deuteranopia', 'cb-tritanopia'];

function syncDocumentAccessibilityClasses({
  fontSize,
  highContrast,
  dyslexicFont,
  reducedMotion,
  readingGuide,
  voiceReader,
  colorBlindMode,
  clearReadingMode,
  disabilityProfile,
}) {
  const root = document.documentElement;
  const isBlind = isBlindDisabilityProfile(disabilityProfile);
  const safeColorBlind = normalizeColorBlindMode(colorBlindMode);

  root.classList.remove('font-size-normal', 'font-size-large', 'font-size-xlarge');
  root.classList.add(`font-size-${fontSize}`);

  root.classList.toggle('high-contrast', highContrast);
  root.classList.toggle('font-dyslexic', dyslexicFont);
  root.classList.toggle('reduced-motion', reducedMotion);
  root.classList.toggle('clear-reading-mode', Boolean(clearReadingMode));
  root.classList.toggle('blind-mode', isBlind);

  root.classList.remove(...COLOR_BLIND_CLASSES);
  if (safeColorBlind !== 'none') {
    root.classList.add(`cb-${safeColorBlind}`);
  }

  localStorage.setItem('nexo360_font_size', fontSize);
  localStorage.setItem('nexo360_high_contrast', String(highContrast));
  localStorage.setItem('nexo360_dyslexic_font', String(dyslexicFont));
  localStorage.setItem('nexo360_reduced_motion', String(reducedMotion));
  localStorage.setItem('nexo360_reading_guide', String(isBlind ? false : readingGuide));
  localStorage.setItem('nexo360_voice_reader', String(voiceReader));
  localStorage.setItem('nexo360_color_blind_mode', safeColorBlind);
  localStorage.setItem('nexo360_clear_reading_mode', String(Boolean(clearReadingMode)));
  localStorage.setItem('nexo360_disability_profile', disabilityProfile || 'ninguna');
}

function pickBooleanPref(rawVal, fallbackOverride, currentVal) {
  if (typeof rawVal === 'boolean') return rawVal;
  if (typeof fallbackOverride === 'boolean') return fallbackOverride;
  return currentVal;
}

function resolveMergedPreferences(prefs, options, current) {
  const hasProfileOption =
    typeof options?.disabilityProfile === 'string' && options.disabilityProfile.trim().length > 0;
  if (!prefs && !hasProfileOption) return null;

  const resolvedProfile = hasProfileOption
    ? getDisabilityProfileMeta(options.disabilityProfile).id
    : current.disabilityProfile;
  const isBlind = isBlindDisabilityProfile(resolvedProfile);
  const overrides =
    resolvedProfile !== 'ninguna' ? getDisabilityProfileMeta(resolvedProfile).defaults : {};

  let nextFontSize = current.fontSize;
  if (VALID_FONT_SIZES.has(prefs?.fontSize)) {
    nextFontSize = prefs.fontSize;
  } else if (VALID_FONT_SIZES.has(overrides.fontSize)) {
    nextFontSize = overrides.fontSize;
  }

  let nextColorBlindMode = current.colorBlindMode;
  if (typeof prefs?.colorBlindMode === 'string') {
    nextColorBlindMode = normalizeColorBlindMode(prefs.colorBlindMode);
  } else if (typeof overrides.colorBlindMode === 'string') {
    nextColorBlindMode = normalizeColorBlindMode(overrides.colorBlindMode);
  }

  const nextReadingGuide = isBlind
    ? false
    : pickBooleanPref(prefs?.readingGuide, overrides.readingGuide, current.readingGuide);

  return {
    fontSize: nextFontSize,
    highContrast: pickBooleanPref(prefs?.highContrast, overrides.highContrast, current.highContrast),
    dyslexicFont: pickBooleanPref(prefs?.dyslexicFont, overrides.dyslexicFont, current.dyslexicFont),
    reducedMotion: pickBooleanPref(
      prefs?.reducedMotion,
      overrides.reducedMotion,
      current.reducedMotion
    ),
    readingGuide: nextReadingGuide,
    voiceReader: pickBooleanPref(prefs?.voiceReader, overrides.voiceReader, current.voiceReader),
    colorBlindMode: nextColorBlindMode,
    clearReadingMode: pickBooleanPref(
      prefs?.clearReadingMode,
      overrides.clearReadingMode,
      current.clearReadingMode
    ),
    disabilityProfile: resolvedProfile,
  };
}

function hasPreferencesChanged(next, current) {
  return Object.keys(next).some((key) => next[key] !== current[key]);
}

export const AccessibilityProvider = ({ children }) => {
  // Inicialización desde localStorage
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('nexo360_font_size');
    return VALID_FONT_SIZES.has(saved) ? saved : 'normal';
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

  // Adaptación cromática para daltonismo
  const [colorBlindMode, setColorBlindModeState] = useState(() => {
    return normalizeColorBlindMode(localStorage.getItem('nexo360_color_blind_mode') || 'none');
  });

  // Lectura clara y resumida (TEA / W3C COGA)
  const [clearReadingMode, setClearReadingMode] = useState(() => {
    return localStorage.getItem('nexo360_clear_reading_mode') === 'true';
  });

  // Perfil de discapacidad PAEDIS activo
  const [disabilityProfile, setDisabilityProfile] = useState(() => {
    const saved = localStorage.getItem('nexo360_disability_profile') || 'ninguna';
    return getDisabilityProfileMeta(saved).id;
  });

  const isBlindMode = isBlindDisabilityProfile(disabilityProfile);

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

  const currentSnapshotRef = useRef(null);
  currentSnapshotRef.current = {
    fontSize,
    highContrast,
    dyslexicFont,
    reducedMotion,
    readingGuide,
    voiceReader,
    colorBlindMode,
    clearReadingMode,
    disabilityProfile,
  };

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
    const effectiveReadingGuide = isBlindMode ? false : readingGuide;
    syncDocumentAccessibilityClasses({
      fontSize,
      highContrast,
      dyslexicFont,
      reducedMotion,
      readingGuide: effectiveReadingGuide,
      voiceReader,
      colorBlindMode,
      clearReadingMode,
      disabilityProfile,
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
          readingGuide: effectiveReadingGuide,
          voiceReader,
          colorBlindMode,
          clearReadingMode,
          screenReaderOptimized: true,
        })
        .catch((err) => {
          console.warn('[AccessibilityContext] Error al sincronizar preferencias con backend:', err);
        });
    }
  }, [
    fontSize,
    highContrast,
    dyslexicFont,
    reducedMotion,
    readingGuide,
    voiceReader,
    colorBlindMode,
    clearReadingMode,
    disabilityProfile,
    isBlindMode,
  ]);

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
    if (isBlindMode) {
      setReadingGuide(false);
      localStorage.setItem('nexo360_reading_guide', 'false');
      announce('La guía visual está desactivada en el perfil para persona no vidente.');
      return;
    }
    const next = !readingGuide;
    setReadingGuide(next);
    localStorage.setItem('nexo360_reading_guide', String(next));
    announce(
      next
        ? 'Guía de lectura activada. Una regla visual resaltará la línea bajo el cursor.'
        : 'Guía de lectura desactivada.',
      'polite'
    );
  }, [readingGuide, isBlindMode, announce]);

  const setColorBlindMode = useCallback(
    (mode) => {
      const normalized = normalizeColorBlindMode(mode);
      setColorBlindModeState(normalized);
      localStorage.setItem('nexo360_color_blind_mode', normalized);
      const modeMeta = getColorBlindModeMeta(normalized);
      announce(
        normalized === 'none'
          ? 'Filtro de daltonismo desactivado'
          : `Modo de daltonismo ${modeMeta.label} activado`
      );
    },
    [announce]
  );

  const toggleClearReadingMode = useCallback(() => {
    const next = !clearReadingMode;
    setClearReadingMode(next);
    localStorage.setItem('nexo360_clear_reading_mode', String(next));
    announce(next ? 'Lectura clara y resumida activada' : 'Lectura clara y resumida desactivada');
  }, [clearReadingMode, announce]);

  const applyDisabilityProfile = useCallback(
    (profileId, subtype) => {
      const meta = getDisabilityProfileMeta(profileId);
      const defaults = getDefaultPreferencesForDisability(meta.id, subtype);
      const blind = isBlindDisabilityProfile(meta.id);
      const nextVoice = Boolean(defaults.voiceReader);

      setDisabilityProfile(meta.id);
      setFontSize(defaults.fontSize);
      setHighContrast(Boolean(defaults.highContrast));
      setDyslexicFont(Boolean(defaults.dyslexicFont));
      setReducedMotion(Boolean(defaults.reducedMotion));
      setReadingGuide(blind ? false : Boolean(defaults.readingGuide));
      voiceReaderRef.current = nextVoice;
      setVoiceReader(nextVoice);
      setColorBlindModeState(normalizeColorBlindMode(defaults.colorBlindMode));
      setClearReadingMode(Boolean(defaults.clearReadingMode));

      if (!nextVoice) {
        stopSpeech();
      }

      announce(
        `Perfil de accesibilidad adaptado: ${meta.label}`,
        blind ? 'assertive' : 'polite'
      );
    },
    [announce]
  );

  const clearDisabilityProfile = useCallback(() => {
    setDisabilityProfile('ninguna');
    localStorage.removeItem('nexo360_disability_profile');
  }, []);

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
    setColorBlindModeState('none');
    setClearReadingMode(false);
    stopSpeech();
    localStorage.removeItem('nexo360_reading_guide');
    localStorage.removeItem('nexo360_voice_reader');
    localStorage.removeItem('nexo360_color_blind_mode');
    localStorage.removeItem('nexo360_clear_reading_mode');
    if (!localStorage.getItem('nexo360_token')) {
      setDisabilityProfile('ninguna');
      localStorage.removeItem('nexo360_disability_profile');
    }
    announce('Preferencias de visualización restablecidas a los valores predeterminados');
  }, [announce]);

  // Cargar preferencias guardadas del usuario desde el backend sin disparar PUT redundante
  const loadUserPreferences = useCallback((prefs, options = {}) => {
    const merged = resolveMergedPreferences(prefs, options, currentSnapshotRef.current);
    if (!merged) return;

    if (hasPreferencesChanged(merged, currentSnapshotRef.current)) {
      skipBackendSyncRef.current = true;
    }

    setFontSize(merged.fontSize);
    setHighContrast(merged.highContrast);
    setDyslexicFont(merged.dyslexicFont);
    setReducedMotion(merged.reducedMotion);
    setReadingGuide(merged.readingGuide);
    voiceReaderRef.current = merged.voiceReader;
    setVoiceReader(merged.voiceReader);
    setColorBlindModeState(merged.colorBlindMode);
    setClearReadingMode(merged.clearReadingMode);
    setDisabilityProfile(merged.disabilityProfile);

    localStorage.setItem('nexo360_font_size', merged.fontSize);
    localStorage.setItem('nexo360_high_contrast', String(merged.highContrast));
    localStorage.setItem('nexo360_dyslexic_font', String(merged.dyslexicFont));
    localStorage.setItem('nexo360_reduced_motion', String(merged.reducedMotion));
    localStorage.setItem('nexo360_reading_guide', String(merged.readingGuide));
    localStorage.setItem('nexo360_voice_reader', String(merged.voiceReader));
    localStorage.setItem('nexo360_color_blind_mode', merged.colorBlindMode);
    localStorage.setItem('nexo360_clear_reading_mode', String(merged.clearReadingMode));
    localStorage.setItem('nexo360_disability_profile', merged.disabilityProfile);
  }, []);

  const contextValue = useMemo(
    () => ({
      fontSize,
      highContrast,
      dyslexicFont,
      reducedMotion,
      readingGuide,
      voiceReader,
      colorBlindMode,
      clearReadingMode,
      disabilityProfile,
      isBlindMode,
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
      setColorBlindMode,
      toggleClearReadingMode,
      applyDisabilityProfile,
      clearDisabilityProfile,
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
      colorBlindMode,
      clearReadingMode,
      disabilityProfile,
      isBlindMode,
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
      setColorBlindMode,
      toggleClearReadingMode,
      applyDisabilityProfile,
      clearDisabilityProfile,
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
