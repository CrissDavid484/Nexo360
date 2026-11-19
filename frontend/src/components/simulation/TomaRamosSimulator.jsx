import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ArrowRight,
  Calendar,
  LogOut,
  Printer,
  Download,
  Info,
  HelpCircle,
  FileText,
  RotateCcw,
  Play,
  ExternalLink,
  Lock,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Flame,
  Target,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ClipboardEdit,
  PlusCircle,
  Lightbulb,
} from 'lucide-react';
import {
  PORTAL_INSC_URL,
  TOMA_RAMOS_ESTUDIANTE,
  BLOQUES_HORARIOS_TOMA,
  TOMA_RAMOS_TUTORIAL_VIDEO,
  CARRERAS_DUOC,
  getRandomCoursesForCareer,
  generateTargetPackages,
  appendDifficultyPracticas,
  DIFFICULTY_LEVELS,
  getBoletinSemesterTitle,
  formatStudentNameForBoletin,
  MALLA_CURRICULAR_SEMANAL,
} from '../../data/tomaRamosData';
import {
  SapSelectBoxIcon,
  SapEstadoIcon,
  SapEstadoSelectedIcon,
  SapDeleteEnrolledIcon,
  SapTrashIcon,
  SapHorarioTabIcon,
  SapCursosTabIcon,
  SapInscribirIcon,
  SapVerHorarioIcon,
  SapContinueArrowsIcon,
} from './SapSelectBoxIcon';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { useAccessibleModal } from '../../hooks/useAccessibleModal';
import { api } from '../../services/api';
import { DEFAULT_CAMPUS, getStudentDisplayName, getStudentRut } from '../../utils/studentUtils';

const DIAS_GRILLA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const DIFFICULTY_BADGE_CLASSES = {
  facil: 'bg-emerald-100 text-emerald-800',
  intermedio: 'bg-blue-100 text-blue-800',
  dificil: 'bg-amber-100 text-amber-900',
  'muy-dificil': 'bg-rose-100 text-rose-900',
};

const MALLA_STATUS_CLASSES = {
  inscrito: 'bg-[#E5DC6C] font-bold text-slate-950',
  aprobado: 'bg-[#7BC67E] text-slate-950',
  reprobado: 'bg-[#E57373] text-white',
  pendiente: 'bg-[#FFB74D] text-slate-950',
  convalidado: 'bg-[#81D4FA] text-slate-950',
  'sin-inscribir': 'bg-[#EAEEF3] text-slate-900',
};

const MALLA_LEGEND_ITEMS = [
  { label: 'Sin inscribir', classes: 'bg-[#EAEEF3] border-r border-[#7E9BB8]' },
  { label: 'Inscrito', classes: 'bg-[#E5DC6C] border-r border-[#7E9BB8]' },
  { label: 'Aprobado', classes: 'bg-[#7BC67E] border-r border-[#7E9BB8]' },
  { label: 'Reprobado', classes: 'bg-[#E57373] text-white border-r border-[#7E9BB8]' },
  { label: 'Pendiente', classes: 'bg-[#FFB74D] border-r border-[#7E9BB8]' },
  { label: 'Convalidado', classes: 'bg-[#81D4FA]' },
];

function findCourseCellMatch(courses, tipo, dia, bloqueId) {
  for (const curso of courses) {
    const match = curso.bloques?.find((b) => b.dia === dia && b.bloqueId === bloqueId);
    if (match) {
      return {
        texto: match.texto || `${curso.sigla}-${curso.seccion}`,
        tipo,
        sala: match.salaCorta || match.sala || '',
        profesor: curso.profesor,
        nombre: curso.nombre,
        sigla: curso.sigla,
        seccion: curso.seccion,
      };
    }
  }
  return null;
}

/**
 * Construye la carga académica inicial cuando el usuario elige "Modificación de Asignaturas".
 * Inscribe los ramos del paquete seleccionado (asignando una sección alternativa cuando exista
 * sin tope horario para que el alumno practique cambiarla o desinscribirla).
 */
function buildInitialEnrolledForModificacion(pkg, coursesPool) {
  if (!pkg?.targetCourses?.length) return [];
  const result = [];
  const occupied = new Set();

  pkg.targetCourses.forEach((tc) => {
    const full = coursesPool.find((c) => c.sigla === tc.sigla);
    const validSecs = (full?.secciones || []).filter((s) => !s.sinCupos);

    const altSec = validSecs.find((sec) => {
      if (sec.seccion === tc.seccion) return false;
      if (!sec.bloques || sec.bloques.length === 0) return false;
      return !sec.bloques.some((b) => occupied.has(`${b.dia}-${b.bloqueId}`));
    });

    const chosenSec =
      altSec ||
      validSecs.find((sec) => {
        if (!sec.bloques || sec.bloques.length === 0) return true;
        return !sec.bloques.some((b) => occupied.has(`${b.dia}-${b.bloqueId}`));
      }) || {
        seccion: tc.seccion,
        profesor: tc.profesor,
        sala: tc.sala,
        bloques: tc.bloques || [],
        clasesPortafolio: tc.clasesPortafolio,
        detallePractica: tc.detallePractica,
      };

    (chosenSec.bloques || []).forEach((b) => occupied.add(`${b.dia}-${b.bloqueId}`));

    result.push({
      sigla: tc.sigla,
      siglaEq: full?.siglaEq || '',
      nombre: tc.nombre,
      tipo: tc.tipo || full?.tipo || 'obligatorio',
      seccion: chosenSec.seccion,
      creditos: tc.creditos || full?.creditos || 10,
      sala: chosenSec.sala,
      profesor: chosenSec.profesor,
      bloques: (chosenSec.bloques || []).map((b) => ({
        ...b,
        texto: `${tc.sigla}-${chosenSec.seccion}`,
      })),
      estado: 'inscrito',
      clasesPortafolio: chosenSec.clasesPortafolio || tc.clasesPortafolio,
      detallePractica: chosenSec.detallePractica || tc.detallePractica,
    });
  });

  return result;
}

function getEstadoRowIcon(pendingModification, estaInscrito, estaSeleccionado) {
  if (pendingModification) {
    return (
      <span title="Pendiente de modificar">
        <SapEstadoIcon className="w-4 h-4" />
      </span>
    );
  }
  if (estaInscrito || estaSeleccionado) {
    return (
      <span title={estaInscrito ? 'Inscrita' : 'Seleccionada para inscribir'}>
        <SapEstadoSelectedIcon className="w-4 h-4" />
      </span>
    );
  }
  return (
    <span title="No seleccionada">
      <SapEstadoIcon className="w-4 h-4" />
    </span>
  );
}

function getProgressBarColor(pct) {
  if (pct === 100) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-blue-600';
  return 'bg-amber-500';
}

function getTargetCourseRowBg(hasExactMatch, isOptativo) {
  if (hasExactMatch) return 'bg-emerald-50';
  if (isOptativo) return 'bg-[#bbdefb]';
  return 'bg-white';
}

function getTargetCourseVoiceLabel(tc, hasExactMatch, hasWrongSection, currentSelected) {
  let stateLabel = 'pendiente';
  if (hasExactMatch) {
    stateLabel = 'meta lograda';
  } else if (hasWrongSection) {
    stateLabel = `cambiar de sección ${currentSelected?.seccion} a ${tc.seccion}`;
  }
  return `Meta ${tc.sigla} ${tc.nombre}, sección ${tc.seccion}, ${stateLabel}`;
}

function TargetCourseStatusBadge({ tc, hasExactMatch, hasWrongSection, currentSelected }) {
  if (hasExactMatch) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
        ✓ Meta lograda
      </span>
    );
  }
  if (hasWrongSection) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white">
        Cambiar {currentSelected?.seccion} → {tc.seccion}
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-800">
      Pendiente ({tc.seccion})
    </span>
  );
}

export const TomaRamosSimulator = ({ onExit }) => {
  const { announce, readingGuide, toggleReadingGuide, getVoiceProps } = useAccessibility();
  const { user } = useAuth();

  const simulatorContainerRef = useRef(null);
  const topGuideRef = useRef(null);
  const infoModalRef = useRef(null);
  const infoAcceptBtnRef = useRef(null);
  const preFlowModalRef = useRef(null);
  const sapConfirmTimerRef = useRef(null);
  const printToastTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const [processType, setProcessType] = useState('inscripcion');
  const [activeTutorialTab, setActiveTutorialTab] = useState('inscripcion');
  const [simulationMode, setSimulationMode] = useState('asistido');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [step, setStep] = useState('valida');
  const [leftPanelView, setLeftPanelView] = useState('lista');
  const [currentAsignatura, setCurrentAsignatura] = useState(null);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isLoadingSap, setIsLoadingSap] = useState(false);
  const [isGrabado, setIsGrabado] = useState(false);
  const [isHorarioUnlocked, setIsHorarioUnlocked] = useState(false);

  const [sapStatusMessage, setSapStatusMessage] = useState(null);
  const [showSapHelpBanner, setShowSapHelpBanner] = useState(false);
  const [printToastMessage, setPrintToastMessage] = useState('');
  const [topeHorarioError, setTopeHorarioError] = useState('');

  const studentCareer =
    user?.career ||
    user?.carrera ||
    user?.vivoStudentProfile?.carrera ||
    'Ingeniería en Informática';

  const studentFullName = getStudentDisplayName(user);
  const studentRutFormatted = getStudentRut(user);
  const studentRutRaw =
    String(studentRutFormatted).replace(/[.-]/g, '').toUpperCase() || '219876543';

  const matchedInitialCarrera =
    CARRERAS_DUOC.find(
      (c) =>
        c.nombre.toLowerCase().includes(studentCareer.toLowerCase()) ||
        studentCareer.toLowerCase().includes(c.nombre.toLowerCase())
    ) || CARRERAS_DUOC[2];

  const [selectedCarrera, setSelectedCarrera] = useState(matchedInitialCarrera.nombre);
  const [carreraInfo, setCarreraInfo] = useState(matchedInitialCarrera);
  const [selectedDifficulty, setSelectedDifficulty] = useState('facil');

  const [availableCourses, setAvailableCourses] = useState(() =>
    getRandomCoursesForCareer(matchedInitialCarrera.nombre, 8, 'facil')
  );

  const [isPreFlowActive, setIsPreFlowActive] = useState(true);
  const [preFlowStep, setPreFlowStep] = useState(1);
  const [selectedModeOption, setSelectedModeOption] = useState('guiado');
  const [targetPackages, setTargetPackages] = useState(() =>
    generateTargetPackages(availableCourses, 'facil')
  );
  const [selectedTargetPackage, setSelectedTargetPackage] = useState(null);
  const [isReferenceSheetExpanded, setIsReferenceSheetExpanded] = useState(true);

  const [cursosInscritos, setCursosInscritos] = useState([]);
  const [cursosSeleccionados, setCursosSeleccionados] = useState([]);

  const isUnregisteredUser = Boolean(user && user.isRegisteredInDb === false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (sapConfirmTimerRef.current) clearTimeout(sapConfirmTimerRef.current);
      if (printToastTimerRef.current) clearTimeout(printToastTimerRef.current);
    };
  }, []);

  useAccessibleModal({
    isOpen: showInfoModal,
    onClose: () => {
      if (!isLoadingSap) setShowInfoModal(false);
    },
    containerRef: infoModalRef,
    initialFocusRef: infoAcceptBtnRef,
  });

  useAccessibleModal({
    isOpen: isPreFlowActive && !isUnregisteredUser,
    onClose: () => {
      if (onExit) onExit();
    },
    containerRef: preFlowModalRef,
    restoreFocus: false,
  });

  const clearPersistedTomaRamos = useCallback(async () => {
    if (typeof localStorage === 'undefined' || !localStorage.getItem('nexo360_token')) {
      return;
    }
    try {
      const res = await api.saveTomaRamos([]);
      if (res && res.success === false) {
        console.warn('[TomaRamosSimulator] No se pudo limpiar toma de ramos previa:', res.message);
      }
    } catch (err) {
      console.warn('[TomaRamosSimulator] Error al limpiar toma de ramos en servidor:', err);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning && !isGrabado && (step === 'inscripcion' || step === 'estados')) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isGrabado, step]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    if (availableCourses && availableCourses.length > 0) {
      const pkgs = generateTargetPackages(availableCourses, selectedDifficulty);
      setTargetPackages(pkgs);
      if (pkgs.length > 0) {
        setSelectedTargetPackage((prev) => {
          if (!prev) return pkgs[0];
          const match = pkgs.find((p) => p.id === prev.id);
          return match || pkgs[0];
        });
      }
    }
  }, [availableCourses, selectedDifficulty]);

  useEffect(() => {
    if (!selectedTargetPackage?.targetCourses || !availableCourses || availableCourses.length === 0) {
      return;
    }
    const hasDiscrepancy = selectedTargetPackage.targetCourses.some(
      (tc) => !availableCourses.some((ac) => ac.sigla === tc.sigla)
    );
    if (hasDiscrepancy) {
      const pkgs = generateTargetPackages(availableCourses, selectedDifficulty);
      const match = pkgs.find((p) => p.id === selectedTargetPackage.id) || pkgs[0];
      if (match) {
        setSelectedTargetPackage(match);
      }
    }
  }, [availableCourses, selectedTargetPackage, selectedDifficulty]);

  const refreshRandomCourses = useCallback(
    async (carreraName, difficulty) => {
      try {
        const res = await api.getCourses({ carrera: carreraName, random: true, limit: 12 });
        if (!isMountedRef.current) return;

        if (res?.success && Array.isArray(res.courses) && res.courses.length > 0) {
          const coursesList = appendDifficultyPracticas(res.courses, difficulty);
          setCursosSeleccionados([]);
          setAvailableCourses(coursesList);
          const pkgs = generateTargetPackages(coursesList, difficulty);
          setTargetPackages(pkgs);
          if (pkgs.length > 0) setSelectedTargetPackage(pkgs[0]);
          announce(`Nuevos ramos aleatorios cargados para ${carreraName}.`, 'polite');
          return;
        }
      } catch (err) {
        console.warn('[TomaRamosSimulator] Fallback a catálogo local al obtener cursos:', err);
      }

      if (!isMountedRef.current) return;

      const localRandom = getRandomCoursesForCareer(carreraName, 8, difficulty);
      setCursosSeleccionados([]);
      setAvailableCourses(localRandom);
      const pkgs = generateTargetPackages(localRandom, difficulty);
      setTargetPackages(pkgs);
      if (pkgs.length > 0) setSelectedTargetPackage(pkgs[0]);
      announce(
        `Nuevos ramos cargados para ${carreraName} en dificultad ${
          DIFFICULTY_LEVELS.find((d) => d.id === difficulty)?.name || difficulty
        }.`,
        'polite'
      );
    },
    [announce]
  );

  // Actualizar carrera desde perfil
  useEffect(() => {
    if (!studentCareer) return;

    const match =
      CARRERAS_DUOC.find(
        (c) =>
          c.nombre.toLowerCase().includes(studentCareer.toLowerCase()) ||
          studentCareer.toLowerCase().includes(c.nombre.toLowerCase())
      ) || {
        codigo: '1446114',
        nombre: studentCareer.toUpperCase(),
        nombreCorto: studentCareer,
        escuela: 'Escuela Duoc UC',
        sede: user?.campus || user?.sede || user?.vivoStudentProfile?.sede || DEFAULT_CAMPUS,
        jornada: 'Diurno',
        periodo: '2026 - 002',
        creditosTotalesCurriculum: 418,
        creditosInscritosAprobados: 378,
        creditosTotalesOptativos: 28,
        creditosAprobadosOptativos: 28,
        creditosAprobadosOptativosInterdisciplinarios: 4,
        creditosAprobadosOptativosFormacionCristiana: 0,
        creditosAprobadosOptativosProfundizacion: 0,
      };

    setSelectedCarrera(match.nombre);
    setCarreraInfo(match);
    refreshRandomCourses(match.nombre, 'facil').catch((err) => {
      console.warn('[TomaRamosSimulator] Error cargando ramos iniciales de carrera:', err);
    });
  }, [studentCareer, user?.campus, user?.sede, user?.vivoStudentProfile?.sede, refreshRandomCourses]);

  // Limpiar BD simulada al entrar y salir
  useEffect(() => {
    clearPersistedTomaRamos().catch((err) => {
      console.warn('[TomaRamosSimulator] Error limpiando toma de ramos al iniciar:', err);
    });
    return () => {
      clearPersistedTomaRamos().catch((err) => {
        console.warn('[TomaRamosSimulator] Error limpiando toma de ramos al desmontar:', err);
      });
    };
  }, [clearPersistedTomaRamos]);

  const handleSelectDifficulty = (diffId) => {
    setSelectedDifficulty(diffId);
    refreshRandomCourses(selectedCarrera, diffId).catch((err) => {
      console.warn('[TomaRamosSimulator] Error actualizando dificultad:', err);
    });
  };

  const handleSelectCarrera = (newCarreraName) => {
    const info = CARRERAS_DUOC.find((c) => c.nombre === newCarreraName) || CARRERAS_DUOC[2];
    setSelectedCarrera(newCarreraName);
    setCarreraInfo(info);
    setCursosSeleccionados([]);
    setCursosInscritos([]);
    refreshRandomCourses(newCarreraName, selectedDifficulty).catch((err) => {
      console.warn('[TomaRamosSimulator] Error actualizando carrera:', err);
    });
  };

  // Métricas y Logro
  const diffConfig = DIFFICULTY_LEVELS.find((d) => d.id === selectedDifficulty) || DIFFICULTY_LEVELS[0];
  const targetCourses = selectedTargetPackage?.targetCourses || [];
  const allCurrentCourses = [...cursosInscritos, ...cursosSeleccionados];

  const matchedTargetCourses = targetCourses.filter((tc) =>
    allCurrentCourses.some((c) => c.sigla === tc.sigla && c.seccion === tc.seccion)
  );
  const matchedCount = matchedTargetCourses.length;
  const totalTargetCount = targetCourses.length || diffConfig.totalTargetCount || 3;
  const completionPercentage = Math.min(100, Math.round((matchedCount / totalTargetCount) * 100));

  const wrongSectionCourses = targetCourses.filter((tc) =>
    allCurrentCourses.some((c) => c.sigla === tc.sigla && c.seccion !== tc.seccion)
  );

  const baseScore = matchedCount * 350;
  const perfectBonus = completionPercentage === 100 ? 500 : 0;
  const speedBonus =
    isTimerRunning || isGrabado ? Math.max(0, 300 - Math.floor(timerSeconds * 1.5)) : 300;
  const penalty = wrongSectionCourses.length * 100;
  const rawScore = Math.max(0, baseScore + perfectBonus + speedBonus - penalty);
  const liveScore = Math.round(rawScore * (diffConfig.multiplier || 1.0));

  const [personalRecordSeconds, setPersonalRecordSeconds] = useState(() => {
    const saved = localStorage.getItem('nexo360_toma_ramos_record_seconds');
    return saved ? Number.parseInt(saved, 10) : null;
  });
  const [, setIsNewRecordBeaten] = useState(false);

  useEffect(() => {
    if (completionPercentage === 100 && (isGrabado || step === 'confirmado' || step === 'boletin')) {
      if (!personalRecordSeconds || timerSeconds < personalRecordSeconds) {
        localStorage.setItem('nexo360_toma_ramos_record_seconds', timerSeconds.toString());
        setPersonalRecordSeconds(timerSeconds);
        setIsNewRecordBeaten(true);
      }
    }
  }, [completionPercentage, isGrabado, step, timerSeconds, personalRecordSeconds]);

  const handleStartSimulationFromPreFlow = () => {
    setSapStatusMessage(null);
    setTopeHorarioError('');
    setIsGrabado(false);
    setIsHorarioUnlocked(false);
    setShowInfoModal(false);
    setIsLoadingSap(false);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setLeftPanelView('lista');
    setCurrentAsignatura(null);
    setStep('valida');

    if (processType === 'modificacion' && selectedTargetPackage) {
      const preEnrolled = buildInitialEnrolledForModificacion(
        selectedTargetPackage,
        availableCourses
      );
      setCursosInscritos(preEnrolled);
      setCursosSeleccionados([]);
    } else {
      setCursosInscritos([]);
      setCursosSeleccionados([]);
    }

    setIsPreFlowActive(false);
    announce(
      `Simulador ${
        processType === 'modificacion' ? 'de Modificación de Asignaturas' : 'de Toma de Ramos'
      } desbloqueado. Haz clic en "Haz Click Para Continuar" para iniciar.`,
      'polite'
    );
  };

  const totalCreditosInscritos = cursosInscritos.reduce((acc, c) => acc + (c.creditos || 0), 0);
  const totalCreditosSeleccionados = cursosSeleccionados.reduce(
    (acc, c) => acc + (c.creditos || 0),
    0
  );

  const findScheduleCollision = (seccion, ignoreSigla = null) => {
    const todosLosCursos = [...cursosInscritos, ...cursosSeleccionados].filter(
      (c) => c.sigla !== ignoreSigla
    );
    for (const bloqueNuevo of seccion.bloques || []) {
      for (const cursoActual of todosLosCursos) {
        const choque = (cursoActual.bloques || []).find(
          (b) => b.dia === bloqueNuevo.dia && b.bloqueId === bloqueNuevo.bloqueId
        );
        if (choque) {
          const bloqueInfo = BLOQUES_HORARIOS_TOMA.find((bh) => bh.id === bloqueNuevo.bloqueId);
          return {
            cursoConflicto: cursoActual,
            dia: bloqueNuevo.dia,
            hora: bloqueInfo ? bloqueInfo.hora : bloqueNuevo.bloqueId,
          };
        }
      }
    }
    return null;
  };

  const handleOpenSeccionesInPlace = (asig) => {
    if (isGrabado) return;
    setTopeHorarioError('');
    setCurrentAsignatura(asig);
    setLeftPanelView('seccion');
    announce(`Desplegando secciones para ${asig.nombre}`, 'polite');
  };

  const handleVolverALista = () => {
    setTopeHorarioError('');
    setCurrentAsignatura(null);
    setLeftPanelView('lista');
    announce('Regresando al listado de asignaturas disponibles.', 'polite');
  };

  const handleDropEnrolledCourse = (asig) => {
    if (isGrabado) return;
    setCursosInscritos((prev) => prev.filter((c) => c.sigla !== asig.sigla));
    setSapStatusMessage({
      type: 'success',
      text: `Se ha eliminado la asignatura '${asig.sigla}' de su inscripción actual.`,
    });
    announce(`Asignatura ${asig.sigla} desinscrita temporalmente.`, 'polite');
  };

  const handleSelectSeccion = (asig, seccion) => {
    setTopeHorarioError('');

    const rejectSelection = (msg, broadcast = false) => {
      setTopeHorarioError(msg);
      setSapStatusMessage({ type: 'error', text: msg });
      if (broadcast) announce(msg, 'assertive');
    };

    if (seccion.sinCupos) {
      rejectSelection(
        `A esta asignatura ya no le quedan vacantes disponibles (sección ${asig.sigla}-${seccion.seccion}).`,
        true
      );
      return;
    }

    const yaInscritaItem = cursosInscritos.find((c) => c.sigla === asig.sigla);
    const yaSeleccionadaItem = cursosSeleccionados.find((c) => c.sigla === asig.sigla);

    if (yaInscritaItem && processType === 'inscripcion') {
      rejectSelection(
        `La asignatura ${asig.nombre} ya se encuentra en tu lista de cursos inscritos.`
      );
      return;
    }

    if (yaInscritaItem && yaInscritaItem.seccion === seccion.seccion) {
      rejectSelection(
        `La sección ${asig.sigla}-${seccion.seccion} ya se encuentra inscrita actualmente.`
      );
      return;
    }

    if (yaSeleccionadaItem && yaSeleccionadaItem.seccion === seccion.seccion) {
      setTopeHorarioError(
        `La sección ${asig.sigla}-${seccion.seccion} ya se encuentra en Cursos seleccionados.`
      );
      return;
    }

    const colision = findScheduleCollision(seccion, asig.sigla);
    if (colision) {
      rejectSelection(
        `Tope de Horario Detectado: La sección ${asig.sigla}-${seccion.seccion} choca el día ${colision.dia} (${colision.hora}) con "${colision.cursoConflicto.nombre}" (${colision.cursoConflicto.sigla}-${colision.cursoConflicto.seccion}).`,
        true
      );
      return;
    }

    const wasEnrolled = Boolean(yaInscritaItem) || Boolean(yaSeleccionadaItem?.wasEnrolled);

    const nuevoCurso = {
      sigla: asig.sigla,
      siglaEq: asig.siglaEq || '',
      nombre: asig.nombre,
      tipo: asig.tipo || 'obligatorio',
      seccion: seccion.seccion,
      creditos: asig.creditos,
      sala: seccion.sala,
      profesor: seccion.profesor,
      bloques: (seccion.bloques || []).map((b) => ({
        ...b,
        texto: `${asig.sigla}-${seccion.seccion}`,
      })),
      wasEnrolled,
      clasesPortafolio: seccion.clasesPortafolio || asig.clasesPortafolio,
      detallePractica: seccion.detallePractica || asig.detallePractica,
    };

    if (yaInscritaItem) {
      setCursosInscritos((prev) => prev.filter((c) => c.sigla !== asig.sigla));
    }

    setCursosSeleccionados((prev) => [
      ...prev.filter((c) => c.sigla !== asig.sigla),
      nuevoCurso,
    ]);

    setLeftPanelView('lista');
    setCurrentAsignatura(null);
    setSapStatusMessage({
      type: 'success',
      text: `Se ha seleccionado la sección '${asig.sigla}-${seccion.seccion}' para inscribir.`,
    });
    announce(
      `Se ha seleccionado la sección ${asig.sigla}-${seccion.seccion} para inscribir.`,
      'polite'
    );
  };

  const handleRemoveSeleccionado = (sigla) => {
    if (isGrabado) return;
    setCursosSeleccionados((prev) => prev.filter((c) => c.sigla !== sigla));
    setSapStatusMessage(null);
    announce(`Curso ${sigla} removido de Cursos seleccionados.`, 'polite');
  };

  const handleSiguienteToEstados = () => {
    if (isGrabado || step !== 'inscripcion') return;
    if (cursosSeleccionados.length === 0 && cursosInscritos.length === 0) {
      setSapStatusMessage({
        type: 'warning',
        text: 'Debe seleccionar al menos una asignatura antes de continuar al resumen.',
      });
      return;
    }
    setStep('estados');
    setSapStatusMessage({
      type: 'warning',
      text: 'Revise el siguiente resumen y si está de acuerdo con el horario seleccionado, presione el botón Inscribir.',
    });
    announce(
      'Revise el siguiente resumen en Malla Alumno y si está de acuerdo, presione el botón Inscribir.',
      'polite'
    );
  };

  const handleAnteriorToInscripcion = () => {
    if (isGrabado || step !== 'estados') return;
    setStep('inscripcion');
    setSapStatusMessage(null);
    announce('Regresando a la selección de asignaturas.', 'polite');
  };

  const handleAceptarInformacion = () => {
    setIsLoadingSap(true);
    announce('Procesando inscripción de asignaturas en SICOL...', 'polite');

    if (sapConfirmTimerRef.current) clearTimeout(sapConfirmTimerRef.current);
    sapConfirmTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;

      const nuevosInscritos = [...cursosInscritos, ...cursosSeleccionados].map((c) => ({
        ...c,
        estado: 'inscrito',
      }));
      setCursosInscritos(nuevosInscritos);
      setCursosSeleccionados([]);
      setIsLoadingSap(false);
      setShowInfoModal(false);
      setIsGrabado(true);
      setIsHorarioUnlocked(true);
      setStep('confirmado');
      setSapStatusMessage({
        type: 'success',
        text: 'Se ha realizado la Inscripción de asignaturas.',
      });
      announce(
        'Se ha realizado la Inscripción de asignaturas. Botón Ver Horario desbloqueado.',
        'assertive'
      );
    }, 1100);
  };

  const handleRepeatSimulation = (mode = 'asistido', newRandom = false) => {
    if (sapConfirmTimerRef.current) {
      clearTimeout(sapConfirmTimerRef.current);
      sapConfirmTimerRef.current = null;
    }
    setSimulationMode(mode);
    setSelectedModeOption(mode === 'real' ? 'realista' : 'guiado');
    setIsGrabado(false);
    setIsHorarioUnlocked(false);
    setShowInfoModal(false);
    setIsLoadingSap(false);
    setSapStatusMessage(null);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setCursosSeleccionados([]);
    setCursosInscritos([]);
    setLeftPanelView('lista');
    setCurrentAsignatura(null);
    setTopeHorarioError('');
    setStep('valida');
    setIsPreFlowActive(true);
    setPreFlowStep(1);
    setIsNewRecordBeaten(false);

    if (newRandom) {
      refreshRandomCourses(selectedCarrera, selectedDifficulty).catch((err) => {
        console.warn('[TomaRamosSimulator] Error recargando ramos al repetir:', err);
      });
    }

    clearPersistedTomaRamos().catch((err) => {
      console.warn('[TomaRamosSimulator] Error limpiando carga al reiniciar:', err);
    });
    announce('Simulador reiniciado desde cero.', 'polite');
  };

  const handleReset = () => {
    handleRepeatSimulation(simulationMode, false);
  };

  const handleExitSimulator = () => {
    clearPersistedTomaRamos().catch((err) => {
      console.warn('[TomaRamosSimulator] Error limpiando carga al salir:', err);
    });
    if (onExit) {
      onExit();
    } else {
      handleReset();
    }
  };

  const getCeldaContenido = (dia, bloqueId) =>
    findCourseCellMatch(cursosInscritos, 'inscrito', dia, bloqueId) ||
    findCourseCellMatch(cursosSeleccionados, 'seleccionado', dia, bloqueId);

  const packageCourseSiglas = useMemo(() => {
    const set = new Set();
    (targetPackages || []).forEach((pkg) => {
      (pkg.targetCourses || []).forEach((tc) => set.add(tc.sigla));
    });
    return set;
  }, [targetPackages]);

  const asignaturasParaTomar = useMemo(() => {
    if (!packageCourseSiglas.size) return availableCourses;
    return availableCourses.filter((asig) => packageCourseSiglas.has(asig.sigla));
  }, [availableCourses, packageCourseSiglas]);

  const mallaAlumnoGrid = useMemo(() => {
    const activos = [...cursosInscritos, ...cursosSeleccionados];
    const activosSet = new Set(activos.map((c) => c.sigla));
    const alreadyInMalla = new Set();

    MALLA_CURRICULAR_SEMANAL.forEach((col) => {
      col.asignaturas.forEach((item) => {
        if (activosSet.has(item.sigla)) {
          alreadyInMalla.add(item.sigla);
        }
      });
    });

    const unplaced = activos.filter((c) => !alreadyInMalla.has(c.sigla));
    let unplacedIdx = 0;

    return MALLA_CURRICULAR_SEMANAL.map((col, colIdx) => {
      const updatedAsignaturas = col.asignaturas.map((item) => {
        if (activosSet.has(item.sigla)) {
          return { ...item, status: 'inscrito' };
        }
        if (
          colIdx >= 5 &&
          colIdx <= 7 &&
          item.defaultStatus === 'sin-inscribir' &&
          unplacedIdx < unplaced.length
        ) {
          const placedCourse = unplaced[unplacedIdx++];
          return { sigla: placedCourse.sigla, status: 'inscrito' };
        }
        return { ...item, status: item.defaultStatus };
      });

      if (colIdx === 7 && unplacedIdx < unplaced.length) {
        while (unplacedIdx < unplaced.length) {
          const placedCourse = unplaced[unplacedIdx++];
          updatedAsignaturas.push({ sigla: placedCourse.sigla, status: 'inscrito' });
        }
      }

      return {
        ...col,
        asignaturas: updatedAsignaturas,
      };
    });
  }, [cursosInscritos, cursosSeleccionados]);

  const triggerPrintToast = () => {
    const message =
      'Desde aquí puedes imprimir o descargar tu Boletín Oficial de Carga Académica en PDF.';
    setPrintToastMessage(message);
    announce(message, 'polite');
    if (printToastTimerRef.current) clearTimeout(printToastTimerRef.current);
    printToastTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setPrintToastMessage('');
      }
    }, 4500);
  };

  if (isUnregisteredUser) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="max-w-2xl mx-auto my-12 p-8 bg-white border-2 border-amber-300 rounded-3xl shadow-lg text-center space-y-5 animate-fade-in-up"
      >
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-8 h-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Acceso Restringido al Simulador
          </h2>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
            Para acceder al Simulador de Toma de Ramos debes acercarte a coordinación o administración para registrar tu cuenta oficial en Nexo360.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={onExit}
            {...getVoiceProps('Volver al Centro de Ayuda')}
            className="min-h-[44px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Volver al Centro de Ayuda
          </button>
        </div>
      </div>
    );
  }

  const currentVideo =
    activeTutorialTab === 'modificacion'
      ? TOMA_RAMOS_TUTORIAL_VIDEO.modificacionVideo
      : TOMA_RAMOS_TUTORIAL_VIDEO;

  return (
    <section
      aria-label="Guía oficial y Simulador de Toma de Ramos y Modificación de Asignaturas"
      className="space-y-6 pb-10 w-full max-w-full overflow-x-clip"
    >
      {/* 1. SECCIÓN SUPERIOR FIJA: VIDEO A LA IZQUIERDA + INSTRUCCIONES DERECHA */}
      <div
        ref={topGuideRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-[#002B49] block">
              Vida Académica Duoc UC - Sede Alameda
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Inscripción y Modificación de Asignaturas (Toma de Ramos)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Revisa el video oficial paso a paso a tu izquierda y las instrucciones clave a la
              derecha antes o durante tu práctica en el simulador de abajo.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2.5">
            {!isPreFlowActive && (
              <button
                type="button"
                onClick={() => handleRepeatSimulation(simulationMode, false)}
                {...getVoiceProps('Cambiar modo o dificultad del simulador')}
                className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs flex items-center gap-2 border border-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
                <span>Cambiar Modo / Dificultad</span>
              </button>
            )}

            <a
              href={PORTAL_INSC_URL}
              target="_blank"
              rel="noopener noreferrer"
              {...getVoiceProps('Ir a Toma de Ramos Oficial en nueva pestaña')}
              className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Ir a Toma de Ramos Oficial</span>
              <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Grilla Video Tutorial (Izquierda) + Instrucciones Paso a Paso (Derecha) */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTutorialTab('inscripcion')}
                  {...getVoiceProps('Ver video tutorial de Toma de Ramos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTutorialTab === 'inscripcion'
                      ? 'bg-[#002B49] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                  <span>Video: Toma de Ramos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTutorialTab('modificacion')}
                  {...getVoiceProps('Ver video tutorial de Modificación de Asignaturas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTutorialTab === 'modificacion'
                      ? 'bg-[#002B49] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ClipboardEdit className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Video: Modificación de Asignaturas</span>
                </button>
              </div>

              <a
                href={currentVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                {...getVoiceProps('Ver video tutorial en YouTube')}
                className="text-xs font-semibold text-[#002B49] hover:underline inline-flex items-center gap-1"
              >
                <span>Ver en YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-sm">
              <iframe
                key={currentVideo.videoId}
                src={currentVideo.embedUrl}
                title={currentVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/80">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>
                  Tutorial oficial: <strong>{currentVideo.title}</strong> ({currentVideo.duracion})
                </span>
              </span>
              <span className="text-[11px] text-slate-500">
                Activa subtítulos con tecla{' '}
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold">
                  C
                </kbd>
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-50/80 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Instrucciones para Tomar y Modificar Ramos
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pasos oficiales del portal institucional
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#002B49] text-[#FFB81C] px-2.5 py-1 rounded-full">
                6 Pasos
              </span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {TOMA_RAMOS_TUTORIAL_VIDEO.pasosClave.map((p, idx) => {
                const stepTitle = p.paso.replace(/^\d+\.\s*/, '');
                return (
                  <div
                    key={p.paso}
                    {...getVoiceProps(`Paso ${idx + 1}: ${stepTitle}. ${p.descripcion}`)}
                    className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[#002B49] text-[#FFB81C] font-bold text-[11px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 leading-snug">
                          {stepTitle}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                        {p.tiempo}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                      {p.descripcion}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTENEDOR DEL SIMULADOR SAP SICOL + HOJA DE RUTA LATERAL */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        <div
          ref={simulatorContainerRef}
          role="region"
          aria-label="Simulador Oficial de Toma de Ramos Duoc UC - Sede Alameda (SAP WebDynpro SICOL)"
          className="relative flex-1 min-w-0 w-full min-h-[780px] rounded-2xl overflow-hidden border border-slate-300 shadow-xl bg-[#EEF3F8] text-slate-900 flex flex-col font-sans select-none"
        >
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isPreFlowActive
              ? 'filter blur-md pointer-events-none select-none opacity-65'
              : 'filter blur-0'
          }`}
        >
          {/* Barra superior de herramientas del simulador */}
          <div className="bg-slate-800 text-slate-200 px-3 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 flex items-center gap-2 flex-1 max-w-xl text-slate-300 font-mono text-[11px] overflow-hidden">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
                <span className="truncate">{PORTAL_INSC_URL}</span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                title="Recargar y configurar nueva práctica"
                {...getVoiceProps('Recargar simulador')}
                className="p-1 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
                aria-label="Recargar simulador"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-2 py-0.5 rounded bg-blue-950/90 border border-blue-700/70 text-blue-100 font-bold text-[10px] uppercase">
                {processType === 'modificacion' ? 'Modificación de Asignaturas' : 'Toma de Ramos'}
              </span>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px]">
                <Building2 className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                <select
                  value={selectedCarrera}
                  onChange={(e) => handleSelectCarrera(e.target.value)}
                  {...getVoiceProps('Seleccionar carrera en el simulador')}
                  className="bg-transparent text-white font-medium text-[11px] focus:outline-none cursor-pointer max-w-[160px] truncate"
                  aria-label="Seleccionar Carrera"
                >
                  {CARRERAS_DUOC.map((c) => (
                    <option key={c.codigo} value={c.nombre} className="bg-slate-900 text-white">
                      {c.nombreCorto || c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={toggleReadingGuide}
                {...getVoiceProps(`Guía de lectura ${readingGuide ? 'activada' : 'desactivada'}`)}
                className={`px-2 py-0.5 rounded font-bold border text-[11px] flex items-center gap-1 cursor-pointer ${
                  readingGuide
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
                aria-pressed={readingGuide}
              >
                <span>Guía</span>
                <span className="text-[10px] font-mono px-1 rounded bg-black/30">
                  {readingGuide ? 'ON' : 'OFF'}
                </span>
              </button>

              <div className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-300 font-mono text-[11px] flex items-center gap-1">
                <span className="font-bold text-amber-400">{formatTimer(timerSeconds)}</span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                {...getVoiceProps('Reiniciar simulador')}
                className="px-2 py-0.5 rounded font-bold border text-[11px] bg-slate-900 hover:bg-rose-950 text-rose-300 border-rose-700/60 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" aria-hidden="true" />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>

          {step !== 'boletin' && (
            <>
              <div className="bg-[#111C2D] text-white px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-baseline font-sans tracking-tight leading-none">
                    <span className="text-[#FFB81C] font-black text-lg">Duoc</span>
                    <span className="text-white font-black text-lg ml-0.5">UC</span>
                  </div>
                  <span className="text-slate-400 text-sm font-light">|</span>
                  <span className="text-sm font-medium text-slate-100">
                    {processType === 'modificacion'
                      ? 'Modificación de Asignaturas'
                      : 'Toma de Ramos'}
                  </span>
                </div>
                {simulationMode === 'asistido' && !isPreFlowActive && (
                  <span className="text-[11px] bg-white/10 text-amber-300 px-2.5 py-0.5 rounded font-semibold">
                    Modo Guiado Activo
                  </span>
                )}
              </div>

              <div className="bg-[#84A83B] text-white px-4 py-1 text-xs font-bold flex items-center justify-between border-b border-[#6C8C2E]">
                <button
                  type="button"
                  onClick={() => setShowSapHelpBanner((prev) => !prev)}
                  {...getVoiceProps('Mostrar u ocultar ayuda SICOL')}
                  className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span className="w-3.5 h-3.5 bg-[#E67E22] text-white font-black text-[10px] leading-none flex items-center justify-center rounded-[1px]">
                    +
                  </span>
                  <span>Ayuda</span>
                </button>
                {selectedTargetPackage && (
                  <span className="text-[11px] font-semibold text-white/95">
                    Meta: {selectedTargetPackage.name} ({completionPercentage}% • {liveScore} pts)
                  </span>
                )}
              </div>

              {showSapHelpBanner && (
                <div className="bg-[#FFFDE7] border-b border-amber-300 px-4 py-2 text-xs text-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
                    <span>
                      <strong>Ayuda SICOL:</strong> Haz clic en el ícono de la primera columna (cubo
                      con mano) para elegir o cambiar sección. En <em>Modificación</em> puedes
                      desinscribir un ramo con el ícono de hoja con X roja. Luego pulsa{' '}
                      <strong>Siguiente ▶</strong>, <strong>Inscribir</strong> y{' '}
                      <strong>Aceptar</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => topGuideRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    {...getVoiceProps('Desplazar arriba para ver video tutorial')}
                    className="text-[#002B49] font-bold underline cursor-pointer shrink-0"
                  >
                    Ver Video Tutorial
                  </button>
                </div>
              )}

              <header className="bg-[#CBD9E8] border-b border-[#8EA8C3] shadow-2xs">
                <div className="bg-gradient-to-r from-[#8BAAC9] via-[#B8CFE5] to-[#DCE8F3] px-3 py-1.5 border-b border-[#98B4CE] flex flex-wrap items-center justify-between gap-2">
                  <div className="font-sans italic font-bold text-sm sm:text-[15px] tracking-wide text-slate-950 flex flex-wrap items-center gap-x-6 gap-y-0.5 uppercase">
                    <span>{studentFullName}</span>
                    <span>RUT {studentRutRaw}</span>
                    <span>PERIODO {carreraInfo.periodo || TOMA_RAMOS_ESTUDIANTE.periodo}</span>
                  </div>
                </div>

                <div className="px-3 pt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={handleExitSimulator}
                    {...getVoiceProps('Cerrar sesión del simulador SICOL')}
                    className="bg-gradient-to-b from-[#EFEFEF] to-[#D4D4D4] hover:from-white hover:to-[#E2E2E2] border border-[#8E8E8E] rounded-[2px] px-2.5 py-0.5 text-[11px] font-bold text-slate-800 inline-flex items-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <span>Cerrar Sesión</span>
                    <span className="w-3.5 h-4 bg-[#C62828] text-white font-black text-[11px] flex items-center justify-center leading-none rounded-[1px]">
                      !
                    </span>
                  </button>
                </div>

                <div className="px-3 pb-2 pt-1 grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-1 text-[10px] leading-snug text-slate-900">
                  <div className="md:col-span-3">
                    <div className="font-black text-slate-950">
                      {carreraInfo.codigo || TOMA_RAMOS_ESTUDIANTE.codigoCarrera}{' '}
                      {carreraInfo.nombre || TOMA_RAMOS_ESTUDIANTE.carrera}
                    </div>
                    <div className="uppercase">{carreraInfo.sede || TOMA_RAMOS_ESTUDIANTE.sede}</div>
                    <div className="uppercase">
                      {(
                        selectedTargetPackage?.jornada ||
                        carreraInfo.jornada ||
                        TOMA_RAMOS_ESTUDIANTE.jornada
                      ).toUpperCase()}
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-0.5">
                    <div className="flex justify-between gap-2 max-w-[260px]">
                      <span>Créditos Totales Curriculum:</span>
                      <strong className="font-bold">
                        {carreraInfo.creditosTotalesCurriculum ?? 418}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2 max-w-[260px]">
                      <span>Créditos Aprobados Optativos Interdisciplinarios:</span>
                      <strong className="font-bold">
                        {carreraInfo.creditosAprobadosOptativosInterdisciplinarios ?? 4}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2 max-w-[260px]">
                      <span>Créditos Aprobados Optativos:</span>
                      <strong className="font-bold">
                        {carreraInfo.creditosAprobadosOptativos ?? 28}
                      </strong>
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-0.5">
                    <div className="flex justify-between gap-2 max-w-[260px]">
                      <span>Créditos Inscritos Aprobados:</span>
                      <strong className="font-bold">
                        {carreraInfo.creditosInscritosAprobados ?? 378}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2 max-w-[260px]">
                      <span>Créditos Aprobados Optativos Formación Cristiana:</span>
                      <strong className="font-bold">
                        {carreraInfo.creditosAprobadosOptativosFormacionCristiana ?? 0}
                      </strong>
                    </div>
                  </div>

                  <div className="md:col-span-3 space-y-0.5">
                    <div className="flex justify-between gap-2 max-w-[250px]">
                      <span>Créditos Totales Optativos:</span>
                      <strong className="font-bold">
                        {carreraInfo.creditosTotalesOptativos ?? 28}
                      </strong>
                    </div>
                    <div className="flex justify-between gap-2 max-w-[250px]">
                      <span>Créditos Aprobados Optativos Profundización:</span>
                      <strong className="font-bold">
                        {carreraInfo.creditosAprobadosOptativosProfundizacion ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>
              </header>

              {sapStatusMessage && step !== 'valida' && (
                <div
                  role="status"
                  aria-live="polite"
                  {...getVoiceProps(sapStatusMessage.text)}
                  className="bg-white border-b border-[#9AB2CA] px-3 py-1.5 flex items-center justify-between gap-2 text-[11px] text-slate-900"
                >
                  <div className="flex items-center gap-2">
                    {sapStatusMessage.type === 'success' && (
                      <span className="w-4 h-4 rounded-[2px] bg-[#2E7D32] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        ✓
                      </span>
                    )}
                    {sapStatusMessage.type === 'warning' && (
                      <span className="text-[#E6A100] flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 fill-[#FFD54F] text-[#7A5900]" />
                      </span>
                    )}
                    {sapStatusMessage.type === 'error' && (
                      <span className="w-4 h-4 rounded-[2px] bg-[#C62828] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                        ✕
                      </span>
                    )}
                    <span className="font-normal">{sapStatusMessage.text}</span>
                  </div>
                </div>
              )}

              <div className="flex-1 bg-white p-2 sm:p-3 flex flex-col">
                {/* PANTALLA 1: VALIDA */}
                {step === 'valida' && (
                  <div className="flex-1 border border-[#9CB8D0] bg-white p-4 flex flex-col justify-between min-h-[430px]">
                    <div>
                      <div className="border border-[#8EB0CE] bg-[#E8F1F8] p-2 inline-block rounded-[2px]">
                        <button
                          type="button"
                          onClick={() => {
                            setStep('inscripcion');
                            setLeftPanelView('lista');
                            setIsTimerRunning(true);
                            announce(
                              'Ingresaste al portal de selección de asignaturas. Cronómetro iniciado.',
                              'polite'
                            );
                          }}
                          {...getVoiceProps('Haz Click Para Continuar al portal de asignaturas')}
                          className="bg-gradient-to-b from-[#F5F5F5] to-[#DCDCDC] hover:from-white hover:to-[#E8E8E8] border border-[#8E8E8E] rounded-[2px] px-3.5 py-1.5 text-xs font-bold text-[#003366] flex items-center gap-2.5 shadow-2xs active:scale-[0.98] cursor-pointer"
                        >
                          <span>Haz Click Para Continuar</span>
                          <SapContinueArrowsIcon className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </div>

                    {simulationMode === 'asistido' && (
                      <div
                        {...getVoiceProps(
                          'Tutor Guiado: Verifica tu nombre, RUT y créditos curriculares, luego presiona Haz Click Para Continuar.'
                        )}
                        className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-950 flex items-center justify-between gap-2 max-w-2xl"
                      >
                        <span>
                          <strong>Tutor Guiado:</strong> Verifica arriba tu nombre, RUT y créditos
                          curriculares, luego presiona{' '}
                          <strong>&ldquo;Haz Click Para Continuar&rdquo;</strong> para acceder a tu
                          carga académica.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* BARRA DE BOTONES SAP COMPARTIDA */}
                {(step === 'inscripcion' || step === 'estados' || step === 'confirmado') && (
                  <div className="bg-gradient-to-b from-[#BDCEE0] to-[#9EB6D0] border border-[#7E9BB8] px-2 py-1 flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        disabled={step !== 'estados' || isGrabado}
                        onClick={handleAnteriorToInscripcion}
                        {...getVoiceProps('Anterior, volver a selección de asignaturas')}
                        className={`h-[24px] px-2.5 border rounded-[2px] text-[11px] font-bold flex items-center gap-1 ${
                          step === 'estados' && !isGrabado
                            ? 'bg-gradient-to-b from-[#F5F5F5] to-[#DCDCDC] hover:from-white hover:to-[#E8E8E8] border-[#888888] text-slate-900 cursor-pointer active:scale-95'
                            : 'bg-[#DAE3EC] border-[#A8BACB] text-[#8FA1B3] cursor-not-allowed'
                        }`}
                      >
                        <span>◀ Anterior</span>
                      </button>

                      <button
                        type="button"
                        disabled={step !== 'inscripcion' || isGrabado}
                        onClick={handleSiguienteToEstados}
                        {...getVoiceProps('Siguiente, avanzar al resumen de Malla Alumno')}
                        className={`h-[24px] px-2.5 border rounded-[2px] text-[11px] font-bold flex items-center gap-1 ${
                          step === 'inscripcion' && !isGrabado
                            ? 'bg-gradient-to-b from-[#FFF3BA] to-[#FAD35A] hover:from-[#FFF8D6] hover:to-[#FFE07D] border-[#9C7A14] text-slate-900 cursor-pointer active:scale-95'
                            : 'bg-[#DAE3EC] border-[#A8BACB] text-[#8FA1B3] cursor-not-allowed'
                        }`}
                      >
                        <span>Siguiente ▶</span>
                      </button>

                      <span className="h-4 w-px bg-[#7E9BB8] mx-0.5" aria-hidden="true" />

                      <button
                        type="button"
                        disabled={step !== 'estados' || isGrabado}
                        onClick={() => {
                          setShowInfoModal(true);
                          announce('Abriendo confirmación de inscripción.', 'polite');
                        }}
                        {...getVoiceProps('Inscribir asignaturas seleccionadas')}
                        className={`h-[24px] px-2.5 border rounded-[2px] text-[11px] font-bold flex items-center gap-1.5 ${
                          step === 'estados' && !isGrabado
                            ? 'bg-gradient-to-b from-[#F5F5F5] to-[#DCDCDC] hover:from-white hover:to-[#E8E8E8] border-[#888888] text-slate-900 cursor-pointer active:scale-95'
                            : 'bg-[#DAE3EC] border-[#A8BACB] text-[#8FA1B3] cursor-not-allowed'
                        }`}
                      >
                        <SapInscribirIcon className="w-3.5 h-3.5" />
                        <span>Inscribir</span>
                      </button>

                      <span className="h-4 w-px bg-[#7E9BB8] mx-0.5" aria-hidden="true" />

                      <button
                        type="button"
                        disabled={!isHorarioUnlocked}
                        onClick={() => {
                          if (!isHorarioUnlocked) return;
                          setStep('boletin');
                          announce('Abriendo Boletín Oficial de Carga Académica.', 'polite');
                        }}
                        {...getVoiceProps('Ver Horario y Boletín Oficial de Carga Académica')}
                        className={`h-[24px] px-2.5 border rounded-[2px] text-[11px] font-bold flex items-center gap-1.5 ${
                          isHorarioUnlocked
                            ? 'bg-gradient-to-b from-[#FFF3BA] to-[#FAD35A] hover:from-[#FFF8D6] hover:to-[#FFE07D] border-[#9C7A14] text-slate-950 cursor-pointer active:scale-95 shadow-xs'
                            : 'bg-[#DAE3EC] border-[#A8BACB] text-[#8FA1B3] cursor-not-allowed'
                        }`}
                        title={
                          isHorarioUnlocked
                            ? 'Ver Boletín Oficial de Carga Académica'
                            : 'Se habilita al confirmar la inscripción'
                        }
                      >
                        <SapVerHorarioIcon className="w-3.5 h-3.5" />
                        <span>Ver Horario</span>
                      </button>
                    </div>

                    {step === 'inscripcion' && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-900 font-medium">
                        <label className="flex items-center gap-1.5">
                          <span>Total Créditos inscritos:</span>
                          <input
                            type="text"
                            readOnly
                            value={totalCreditosInscritos}
                            {...getVoiceProps(`Total créditos inscritos: ${totalCreditosInscritos}`)}
                            className="w-11 h-5 bg-white border border-[#8FA9C4] text-right px-1.5 font-sans font-semibold text-slate-900 text-[11px]"
                          />
                        </label>
                        <label className="flex items-center gap-1.5">
                          <span>Total Créditos seleccionados:</span>
                          <input
                            type="text"
                            readOnly
                            value={totalCreditosSeleccionados}
                            {...getVoiceProps(
                              `Total créditos seleccionados: ${totalCreditosSeleccionados}`
                            )}
                            className="w-11 h-5 bg-white border border-[#8FA9C4] text-right px-1.5 font-sans font-semibold text-slate-900 text-[11px]"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* PANTALLA 2: SELECCIÓN / MODIFICACIÓN DE ASIGNATURAS */}
                {step === 'inscripcion' && (
                  <div className="space-y-2 flex-1">
                    {simulationMode === 'asistido' && (
                      <div className="bg-blue-50 border border-blue-300 text-blue-950 px-3 py-1.5 text-[11px] rounded-[2px] flex items-center justify-between gap-2">
                        <span>
                          <strong className="font-bold text-blue-900">Tutor Guiado: </strong>
                          {leftPanelView === 'seccion'
                            ? `Revisa las secciones de ${currentAsignatura?.nombre} y haz clic en la primera columna para agregarla sin topes.`
                            : processType === 'modificacion'
                            ? 'Estás en Modificación de Asignaturas: puedes eliminar un ramo inscrito con el ícono de documento con X roja (2ª columna) o cambiar su sección desde la 1ª columna. Luego pulsa "Siguiente ▶".'
                            : 'Haz clic en el ícono de cubo con mano (1ª columna) de cada asignatura para elegir su sección. Al completar tus ramos, pulsa "Siguiente ▶".'}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
                      {/* PANEL IZQUIERDO */}
                      <div className="lg:col-span-6 space-y-2">
                        {leftPanelView === 'lista' && (
                          <div className="space-y-2">
                            <div className="bg-white border border-[#91B1CC]">
                              <div className="overflow-x-auto max-h-[390px]">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                  <thead className="bg-gradient-to-b from-[#DFE8F2] to-[#CAD9E9] border-b border-[#A8C2D8] text-slate-900 font-bold sticky top-0 z-10 text-[10px]">
                                    <tr>
                                      <th scope="col" className="p-1 border-r border-[#A8C2D8] w-7 text-center" />
                                      <th scope="col" className="p-1 border-r border-[#A8C2D8] w-7 text-center" />
                                      <th scope="col" className="p-1 border-r border-[#A8C2D8] w-11 text-center">
                                        Estado
                                      </th>
                                      <th scope="col" className="p-1 border-r border-[#A8C2D8] w-16">
                                        Sigla
                                      </th>
                                      <th scope="col" className="p-1 border-r border-[#A8C2D8] w-16">
                                        Sigla Eq...
                                      </th>
                                      <th scope="col" className="p-1 border-r border-[#A8C2D8]">
                                        Nombre de la Asignatura
                                      </th>
                                      <th scope="col" className="p-1 text-center w-10">
                                        Créd.
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#D7E4F0] text-[10px]">
                                    {asignaturasParaTomar.map((asig, rowIdx) => {
                                      const estaInscrito = cursosInscritos.some(
                                        (c) => c.sigla === asig.sigla
                                      );
                                      const selCurso = cursosSeleccionados.find(
                                        (c) => c.sigla === asig.sigla
                                      );
                                      const estaSeleccionado = Boolean(selCurso);
                                      const pendingModification = Boolean(selCurso?.wasEnrolled);
                                      const rowBg = rowIdx % 2 === 1 ? 'bg-[#EDF3F9]' : 'bg-white';

                                      return (
                                        <tr
                                          key={asig.sigla}
                                          {...getVoiceProps(
                                            `Asignatura ${asig.sigla}, ${asig.nombre}, ${asig.creditos} créditos`
                                          )}
                                          className={`${rowBg} hover:bg-[#DCEAF7]`}
                                        >
                                          <td className="p-1 text-center border-r border-[#D7E4F0]">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenSeccionesInPlace(asig)}
                                              disabled={
                                                isGrabado ||
                                                (processType === 'inscripcion' && estaInscrito)
                                              }
                                              {...getVoiceProps(`Selecciona opción para ${asig.nombre}`)}
                                              className={`w-5 h-5 flex items-center justify-center mx-auto rounded-[2px] ${
                                                isGrabado ||
                                                (processType === 'inscripcion' && estaInscrito)
                                                  ? 'opacity-35 cursor-not-allowed'
                                                  : 'hover:bg-[#C6DDF2] cursor-pointer active:scale-95'
                                              }`}
                                              title="Selecciona Opción"
                                              aria-label={`Selecciona opción para ${asig.nombre}`}
                                            >
                                              <SapSelectBoxIcon className="w-4 h-4" />
                                            </button>
                                          </td>

                                          <td className="p-1 text-center border-r border-[#D7E4F0]">
                                            {processType === 'modificacion' &&
                                            estaInscrito &&
                                            !estaSeleccionado ? (
                                              <button
                                                type="button"
                                                onClick={() => handleDropEnrolledCourse(asig)}
                                                disabled={isGrabado}
                                                {...getVoiceProps(`Eliminar asignatura ${asig.sigla}`)}
                                                className="w-5 h-5 flex items-center justify-center mx-auto hover:bg-red-100 rounded-[2px] cursor-pointer active:scale-95"
                                                title={`Eliminar asignatura ${asig.sigla}`}
                                                aria-label={`Eliminar asignatura ${asig.sigla}`}
                                              >
                                                <SapDeleteEnrolledIcon className="w-4 h-4" />
                                              </button>
                                            ) : null}
                                          </td>

                                          <td className="p-1 text-center border-r border-[#D7E4F0]">
                                            <div className="flex items-center justify-center">
                                              {getEstadoRowIcon(
                                                pendingModification,
                                                estaInscrito,
                                                estaSeleccionado
                                              )}
                                            </div>
                                          </td>

                                          <td className="p-1 font-sans text-slate-900 border-r border-[#D7E4F0] font-medium">
                                            {asig.sigla}
                                          </td>
                                          <td className="p-1 text-slate-500 border-r border-[#D7E4F0] text-center">
                                            {asig.siglaEq || ''}
                                          </td>
                                          <td className="p-1 text-slate-900 border-r border-[#D7E4F0] uppercase">
                                            {asig.nombre}
                                          </td>
                                          <td className="p-1 text-right pr-2 text-slate-900 font-medium">
                                            {asig.creditos}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="inline-grid grid-cols-2 border border-black text-[10px] font-normal text-slate-950">
                              <div className="bg-white px-2.5 py-0.5 border-r border-b border-black min-w-[78px]">
                                Optativo
                              </div>
                              <div className="bg-white px-2.5 py-0.5 border-b border-black min-w-[78px]">
                                Práctica
                              </div>
                              <div className="bg-[#4CAF50] px-2.5 py-0.5 border-r border-black min-w-[78px]">
                                Certificable
                              </div>
                              <div className="bg-[#FFFF00] px-2.5 py-0.5 min-w-[78px]">&nbsp;</div>
                            </div>
                          </div>
                        )}

                        {leftPanelView === 'seccion' && currentAsignatura && (
                          <div className="bg-white border border-[#91B1CC] p-2 space-y-2 min-h-[410px]">
                            <div>
                              <button
                                type="button"
                                onClick={handleVolverALista}
                                {...getVoiceProps('Volver al listado de asignaturas')}
                                className="bg-gradient-to-b from-[#F5F5F5] to-[#DCDCDC] hover:from-white hover:to-[#E6E6E6] border border-[#8E8E8E] rounded-[2px] px-3 py-0.5 text-[11px] font-bold text-slate-900 flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <span>◀ Volver</span>
                              </button>
                            </div>

                            <div className="bg-gradient-to-b from-[#6F96BE] to-[#4C77A4] text-white px-2 py-1 text-[11px] font-bold flex items-center justify-between border border-[#3C628A]">
                              <span>* Seleccione una Sección para su Asignatura</span>
                              <div className="flex items-center gap-1 text-[10px] bg-[#365B82] px-1.5 py-0.5 rounded-[1px]">
                                <span>◀</span>
                                <span>▶</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 px-1 py-0.5 border-b border-[#C5D6E6]">
                              <span>
                                {currentAsignatura.sigla} &nbsp; {currentAsignatura.nombre}
                              </span>
                              <span>Créditos &nbsp; {currentAsignatura.creditos}</span>
                            </div>

                            {topeHorarioError && (
                              <div
                                role="alert"
                                aria-live="assertive"
                                {...getVoiceProps(topeHorarioError)}
                                className="p-2.5 bg-red-50 border border-red-400 text-[11px] text-red-900 font-semibold flex items-start justify-between gap-2"
                              >
                                <span>{topeHorarioError}</span>
                                <button
                                  type="button"
                                  onClick={() => setTopeHorarioError('')}
                                  {...getVoiceProps('Cerrar aviso de error')}
                                  className="underline font-bold shrink-0 cursor-pointer"
                                >
                                  Cerrar
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-950 font-medium">
                              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                              <span>
                                <strong>Tip de selección:</strong> La forma más rápida de escoger tu sección es revisar la letra final: <strong>D</strong> para horario <strong>Diurno</strong> y <strong>V</strong> para horario <strong>Vespertino</strong>.
                              </span>
                            </div>

                            <div className="border border-[#A8C2D8] overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead className="bg-gradient-to-b from-[#DFE8F2] to-[#CAD9E9] border-b border-[#A8C2D8] text-slate-900 font-bold text-[10px]">
                                  <tr>
                                    <th scope="col" className="p-1 border-r border-[#A8C2D8] w-7 text-center" />
                                    <th scope="col" className="p-1 border-r border-[#A8C2D8] w-24">
                                      Sección
                                    </th>
                                    <th scope="col" className="p-1 border-r border-[#A8C2D8] w-20">
                                      Cupos
                                    </th>
                                    <th scope="col" className="p-1 border-r border-[#A8C2D8] w-24">
                                      Sala
                                    </th>
                                    <th scope="col" className="p-1 border-r border-[#A8C2D8]">
                                      Profesor
                                    </th>
                                    <th scope="col" className="p-1">
                                      Horario
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#D7E4F0] text-[10px]">
                                  {currentAsignatura.secciones?.every((s) => s.sinCupos) ? (
                                    <tr>
                                      <td colSpan={6} className="p-3 text-slate-700 font-semibold bg-slate-50">
                                        A esta asignatura ya no le quedan vacantes disponibles.
                                      </td>
                                    </tr>
                                  ) : (
                                    currentAsignatura.secciones?.map((sec, sIdx) => (
                                      <tr
                                        key={sec.seccion}
                                        {...getVoiceProps(
                                          `Sección ${currentAsignatura.sigla}-${sec.seccion}, ${
                                            sec.sinCupos
                                              ? 'sin cupos'
                                              : `${sec.cuposDisponibles} cupos`
                                          }, profesor ${sec.profesor}, horario ${sec.horarioTexto}`
                                        )}
                                        className={`${
                                          sIdx % 2 === 1 ? 'bg-[#EDF3F9]' : 'bg-white'
                                        } hover:bg-[#DCEAF7]`}
                                      >
                                        <td className="p-1 text-center border-r border-[#D7E4F0]">
                                          {sec.sinCupos ? (
                                            <span className="text-red-700 font-bold text-[9px]">0</span>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleSelectSeccion(currentAsignatura, sec)
                                              }
                                              {...getVoiceProps(
                                                `Agregar sección ${currentAsignatura.sigla}-${sec.seccion}`
                                              )}
                                              className="w-5 h-5 flex items-center justify-center mx-auto hover:bg-[#C6DDF2] rounded-[2px] cursor-pointer active:scale-95"
                                              title="Agregar sección a Cursos seleccionados"
                                              aria-label={`Agregar sección ${currentAsignatura.sigla}-${sec.seccion} a Cursos seleccionados`}
                                            >
                                              <SapSelectBoxIcon className="w-4 h-4" />
                                            </button>
                                          )}
                                        </td>
                                        <td className="p-1 font-bold text-slate-900 border-r border-[#D7E4F0] whitespace-nowrap">
                                          {currentAsignatura.sigla}-{sec.seccion}
                                        </td>
                                        <td className="p-1 border-r border-[#D7E4F0] whitespace-nowrap">
                                          {sec.sinCupos ? (
                                            <span className="text-red-700 font-bold">Sin cupos</span>
                                          ) : (
                                            <span className="text-slate-900 font-semibold">
                                              {sec.cuposDisponibles} / {sec.cuposTotales}
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-1 text-slate-800 border-r border-[#D7E4F0]">
                                          {sec.sala}
                                        </td>
                                        <td className="p-1 text-slate-900 border-r border-[#D7E4F0]">
                                          {sec.profesor}
                                        </td>
                                        <td className="p-1 text-slate-800 text-[9px]">
                                          {sec.horarioTexto}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* PANEL DERECHO */}
                      <div className="lg:col-span-6 space-y-4 pt-2">
                        <div className="border border-[#7DA2C5] bg-[#EBF2F8] p-2 relative">
                          <div
                            className="inline-flex items-center gap-1.5 bg-gradient-to-b from-[#AFC7DD] to-[#95B2CE] border-t border-l border-r border-[#4C749A] text-[#1B365D] font-bold text-xs py-0.5 -mt-5 -ml-2 mb-1"
                            style={{
                              clipPath: 'polygon(12px 0%, 100% 0%, 100% 100%, 0% 100%)',
                              paddingLeft: '16px',
                              paddingRight: '14px',
                            }}
                          >
                            <SapHorarioTabIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Horario</span>
                          </div>

                          <div className="bg-white border border-[#90AFC9] overflow-x-auto max-h-[245px]">
                            <table className="w-full text-center text-[10px] border-collapse min-w-[540px]">
                              <thead className="bg-gradient-to-b from-[#DFE8F2] to-[#CAD9E9] border-b border-[#A8C2D8] text-slate-900 font-bold sticky top-0 z-10">
                                <tr>
                                  <th scope="col" className="p-1 border-r border-[#A8C2D8] w-20 text-left">
                                    Hora
                                  </th>
                                  {DIAS_GRILLA.map((dia) => (
                                    <th
                                      key={dia}
                                      scope="col"
                                      className="p-1 border-r border-[#A8C2D8] last:border-r-0"
                                    >
                                      {dia}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#D0DCE5] text-[10px]">
                                {BLOQUES_HORARIOS_TOMA.map((bloque) => (
                                  <tr key={bloque.id} className="hover:bg-[#F6F9FC]">
                                    <td className="p-1 text-left font-sans font-semibold text-slate-800 bg-[#F4F7FA] border-r border-[#D0DCE5] whitespace-nowrap">
                                      {bloque.hora.replace(' - ', '-')}
                                    </td>
                                    {DIAS_GRILLA.map((dia) => {
                                      const match = getCeldaContenido(dia, bloque.id);
                                      return (
                                        <td
                                          key={dia}
                                          className={`p-1 border-r border-[#D0DCE5] last:border-r-0 whitespace-nowrap ${
                                            match?.tipo === 'inscrito'
                                              ? 'bg-[#E3F2FD] text-[#0D47A1] font-bold'
                                              : match?.tipo === 'seleccionado'
                                              ? 'bg-[#FFF59D] text-slate-950 font-bold'
                                              : ''
                                          }`}
                                        >
                                          {match ? match.texto : null}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="border border-[#7DA2C5] bg-[#EBF2F8] p-2 relative">
                          <div
                            className="inline-flex items-center gap-1.5 bg-gradient-to-b from-[#AFC7DD] to-[#95B2CE] border-t border-l border-r border-[#4C749A] text-[#1B365D] font-bold text-xs py-0.5 -mt-5 -ml-2 mb-1"
                            style={{
                              clipPath: 'polygon(12px 0%, 100% 0%, 100% 100%, 0% 100%)',
                              paddingLeft: '16px',
                              paddingRight: '14px',
                            }}
                          >
                            <SapCursosTabIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Cursos seleccionados</span>
                          </div>

                          <div className="bg-white border border-[#90AFC9] overflow-x-auto min-h-[140px] max-h-[180px]">
                            <table className="w-full text-left border-collapse min-w-[480px]">
                              <thead className="bg-gradient-to-b from-[#DFE8F2] to-[#CAD9E9] border-b border-[#A8C2D8] text-slate-900 font-bold text-[10px] sticky top-0 z-10">
                                <tr>
                                  <th scope="col" className="p-1 border-r border-[#A8C2D8] w-7 text-center" />
                                  <th scope="col" className="p-1 border-r border-[#A8C2D8] w-16">
                                    Sigla
                                  </th>
                                  <th scope="col" className="p-1 border-r border-[#A8C2D8] w-16">
                                    Sigla Eq...
                                  </th>
                                  <th scope="col" className="p-1 border-r border-[#A8C2D8]">
                                    Nombre de la Asignatura
                                  </th>
                                  <th scope="col" className="p-1 border-r border-[#A8C2D8] text-center w-20">
                                    Sección
                                  </th>
                                  <th scope="col" className="p-1 text-center w-10">
                                    Créd.
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#D0DCE5] text-[10px]">
                                {cursosSeleccionados.map((c) => (
                                  <tr
                                    key={c.sigla}
                                    {...getVoiceProps(
                                      `Curso seleccionado ${c.sigla}-${c.seccion}, ${c.nombre}, ${c.creditos} créditos`
                                    )}
                                    className="bg-[#FFFDE7] hover:bg-[#FFF9C4]"
                                  >
                                    <td className="p-1 text-center border-r border-[#D0DCE5]">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSeleccionado(c.sigla)}
                                        title={`Quitar ${c.sigla} de Cursos seleccionados`}
                                        aria-label={`Quitar ${c.sigla}`}
                                        {...getVoiceProps(`Quitar ${c.sigla} de cursos seleccionados`)}
                                        className="w-5 h-5 inline-flex items-center justify-center rounded-[2px] hover:bg-red-100 cursor-pointer"
                                      >
                                        <SapTrashIcon className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                    <td className="p-1 font-medium text-slate-900 border-r border-[#D0DCE5]">
                                      {c.sigla}
                                    </td>
                                    <td className="p-1 text-slate-400 border-r border-[#D0DCE5] text-center">
                                      {c.siglaEq || ''}
                                    </td>
                                    <td className="p-1 text-slate-900 border-r border-[#D0DCE5] uppercase">
                                      {c.nombre}
                                    </td>
                                    <td className="p-1 text-center font-bold text-slate-900 border-r border-[#D0DCE5] whitespace-nowrap">
                                      {c.sigla}-{c.seccion}
                                    </td>
                                    <td className="p-1 text-center font-semibold">{c.creditos}</td>
                                  </tr>
                                ))}

                                {Array.from({
                                  length: Math.max(0, 5 - cursosSeleccionados.length),
                                }).map((_, idx) => (
                                  <tr key={`empty-${idx}`} className="h-6">
                                    <td className="border-r border-[#D0DCE5]" />
                                    <td className="border-r border-[#D0DCE5]" />
                                    <td className="border-r border-[#D0DCE5]" />
                                    <td className="border-r border-[#D0DCE5]" />
                                    <td className="border-r border-[#D0DCE5]" />
                                    <td />
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PANTALLA 3: MALLA ALUMNO + HORARIO */}
                {step === 'estados' && (
                  <div className="space-y-3 flex-1">
                    {simulationMode === 'asistido' && (
                      <div className="bg-blue-50 border border-blue-300 text-blue-950 px-3 py-1.5 text-[11px] rounded-[2px]">
                        <strong>Tutor Guiado:</strong> Verifica que tus asignaturas marcadas en
                        amarillo (<strong>Inscrito</strong>) y tu horario a la derecha estén sin
                        topes, y luego haz clic en el botón <strong>Inscribir</strong> de la barra
                        superior.
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                      <div className="lg:col-span-7 space-y-2">
                        <div className="border border-[#7E9BB8] bg-white overflow-x-auto">
                          <div className="bg-[#BACDE0] border-b border-[#8FA8C2] px-2 py-1 text-[11px] font-bold text-slate-900">
                            Malla Alumno
                          </div>

                          <table className="w-full text-center border-collapse text-[10px] min-w-[540px]">
                            <thead className="bg-[#DFE8F2] border-b border-[#98B2CC] text-slate-900 font-bold">
                              <tr>
                                {mallaAlumnoGrid.map((col) => (
                                  <th
                                    key={col.semestre}
                                    scope="col"
                                    className="p-1 border-r border-[#B2C6DA] last:border-r-0 whitespace-nowrap"
                                  >
                                    {col.semestre}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const maxRows = Math.max(
                                  ...mallaAlumnoGrid.map((c) => c.asignaturas.length)
                                );
                                return Array.from({ length: maxRows }).map((_, rowIndex) => (
                                  <tr
                                    key={rowIndex}
                                    className="border-b border-[#CFDCE8] last:border-b-0"
                                  >
                                    {mallaAlumnoGrid.map((col) => {
                                      const cell = col.asignaturas[rowIndex];
                                      if (!cell) {
                                        return (
                                          <td
                                            key={`${col.semestre}-${rowIndex}`}
                                            className="p-1 border-r border-[#CFDCE8] last:border-r-0 bg-white"
                                          />
                                        );
                                      }

                                      const statusBg =
                                        MALLA_STATUS_CLASSES[cell.status] ||
                                        MALLA_STATUS_CLASSES['sin-inscribir'];

                                      return (
                                        <td
                                          key={`${col.semestre}-${rowIndex}`}
                                          className={`p-1 border-r border-[#9E9E9E]/50 last:border-r-0 whitespace-nowrap ${statusBg}`}
                                        >
                                          {cell.isInfoPlaceholder ? (
                                            <span className="inline-flex items-center gap-1">
                                              <span className="w-3.5 h-3.5 bg-[#CFD8DC] border border-slate-600 text-slate-900 font-bold text-[9px] inline-flex items-center justify-center leading-none">
                                                i
                                              </span>
                                              <span>-</span>
                                            </span>
                                          ) : (
                                            cell.sigla
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 border border-[#7E9BB8] text-[10px] font-semibold text-center text-slate-950">
                          {MALLA_LEGEND_ITEMS.map((item) => (
                            <div key={item.label} className={`py-1 px-1 ${item.classes}`}>
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-5 border border-[#7E9BB8] bg-white overflow-x-auto">
                        <table className="w-full text-center text-[10px] border-collapse min-w-[480px]">
                          <thead className="bg-[#DFE8F2] border-b border-[#98B2CC] text-slate-900 font-bold">
                            <tr>
                              <th scope="col" className="p-1 border-r border-[#A8C2D8] text-left w-20">
                                Hora
                              </th>
                              {DIAS_GRILLA.map((dia) => (
                                <th
                                  key={dia}
                                  scope="col"
                                  className="p-1 border-r border-[#A8C2D8] last:border-r-0"
                                >
                                  {dia}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#D0DCE5] text-[10px]">
                            {(() => {
                              const allActivosBlocks = [
                                ...cursosInscritos,
                                ...cursosSeleccionados,
                              ].flatMap((c) => c.bloques || []);
                              let minIdx = 0;
                              let maxIdx = 5;
                              if (allActivosBlocks.length > 0) {
                                const indices = allActivosBlocks
                                  .map((b) =>
                                    BLOQUES_HORARIOS_TOMA.findIndex((bh) => bh.id === b.bloqueId)
                                  )
                                  .filter((idx) => idx !== -1);
                                if (indices.length > 0) {
                                  minIdx = Math.min(...indices);
                                  maxIdx = Math.max(Math.max(...indices), minIdx + 4);
                                }
                              }
                              const slice = BLOQUES_HORARIOS_TOMA.slice(
                                minIdx,
                                Math.min(BLOQUES_HORARIOS_TOMA.length, maxIdx + 1)
                              );
                              return slice.map((bloque) => (
                                <tr key={bloque.id} className="bg-[#F4F7FA]">
                                  <td className="p-1 text-left font-sans text-slate-800 border-r border-[#D0DCE5] whitespace-nowrap">
                                    {bloque.hora.replace(' - ', '-')}
                                  </td>
                                  {DIAS_GRILLA.map((dia) => {
                                    const match = getCeldaContenido(dia, bloque.id);
                                    return (
                                      <td
                                        key={dia}
                                        className={`p-1 border-r border-[#D0DCE5] last:border-r-0 whitespace-nowrap ${
                                          match
                                            ? 'bg-[#EAEFF5] text-slate-900 font-semibold'
                                            : 'bg-white'
                                        }`}
                                      >
                                        {match ? match.texto : null}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* PANTALLA 4: CONFIRMADO */}
                {step === 'confirmado' && (
                  <div className="flex-1 flex flex-col justify-between min-h-[380px]">
                    <div className="border border-[#A9C0D6] bg-white p-3 min-h-[260px]">
                      <div className="text-[11px] text-slate-400 border-b border-slate-300 pb-2">
                        :
                      </div>
                      <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                          <span>
                            Inscripción confirmada • Botón &ldquo;Ver Horario&rdquo; habilitado arriba
                          </span>
                        </span>
                        <p className="text-xs text-slate-600 max-w-md">
                          Tal como en el portal SICOL oficial, ya no es posible modificar ramos en
                          esta instancia. Haz clic en <strong>Ver Horario</strong> para descargar o
                          revisar tu Boletín de Carga Académica.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-bold text-slate-800">
                          Logro del Paquete:{' '}
                          <span className="text-emerald-700">{completionPercentage}%</span> (
                          {matchedCount}/{totalTargetCount} ramos)
                        </span>
                        <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-200">
                          {liveScore} pts
                        </span>
                        <span className="font-mono text-slate-600">
                          Tiempo: {formatTimer(timerSeconds)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRepeatSimulation(simulationMode, false)}
                          {...getVoiceProps('Iniciar nueva práctica desde cero')}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          Nueva Práctica (Desde 0)
                        </button>
                        <button
                          type="button"
                          onClick={() => setStep('boletin')}
                          {...getVoiceProps('Abrir Boletín Horario oficial')}
                          className="px-4 py-1.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
                          <span>Abrir Boletín Horario</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* PANTALLA 5: VER HORARIO (BOLETÍN DE CARGA ACADÉMICA PDF DUOC) */}
          {step === 'boletin' && (
            <div className="flex-1 bg-slate-200 p-4 space-y-4">
              {printToastMessage && (
                <div
                  role="alert"
                  {...getVoiceProps(printToastMessage)}
                  className="p-3 bg-amber-100 border-2 border-amber-500 rounded text-xs font-black text-amber-950 flex items-center justify-center gap-2 shadow-md"
                >
                  <Info className="w-4 h-4 text-amber-800 shrink-0" aria-hidden="true" />
                  <span>{printToastMessage}</span>
                </div>
              )}

              <div className="bg-slate-800 text-white p-3 rounded flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-400" aria-hidden="true" />
                  <span className="font-mono font-bold text-slate-200">
                    Boletin_CargaAcademica_DuocUC.pdf
                  </span>
                  <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                    1 / 1
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={triggerPrintToast}
                    {...getVoiceProps('Imprimir boletín oficial')}
                    className="min-h-[44px] px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" aria-hidden="true" />
                    <span>Imprimir</span>
                  </button>

                  <button
                    type="button"
                    onClick={triggerPrintToast}
                    {...getVoiceProps('Descargar boletín oficial en PDF')}
                    className="min-h-[44px] px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>Descargar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('confirmado')}
                    {...getVoiceProps('Volver al portal SICOL')}
                    className="min-h-[44px] px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <span>Volver al Portal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRepeatSimulation('asistido', false)}
                    {...getVoiceProps('Nueva práctica desde cero')}
                    className="min-h-[44px] px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Nueva Práctica (Desde 0)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExitSimulator}
                    {...getVoiceProps('Salir del simulador')}
                    className="min-h-[44px] px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Salir</span>
                  </button>
                </div>
              </div>

              <div className="bg-white max-w-4xl mx-auto p-6 sm:p-10 rounded border border-slate-300 shadow-2xl space-y-6 font-mono text-slate-900">
                <div className="flex items-start justify-between border-b border-black pb-3">
                  <div>
                    <img
                      src="/duoc-uc-logo-boletin.png"
                      alt="Duoc UC"
                      className="h-10 sm:h-12 w-auto object-contain"
                    />
                    <div className="text-xs font-mono font-bold text-slate-900 mt-2 space-y-0.5">
                      <p>
                        SEDE:{' '}
                        {carreraInfo.sede
                          ? carreraInfo.sede.replace(/^Sede\s+/i, '').toUpperCase()
                          : 'ALAMEDA'}
                        , N° 10
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs text-slate-900 space-y-0.5">
                    <p className="font-bold">Dirección de Docencia</p>
                    <p>
                      Fecha emisión{' '}
                      {(() => {
                        const today = new Date();
                        return `${String(today.getDate()).padStart(2, '0')}.${String(
                          today.getMonth() + 1
                        ).padStart(2, '0')}.${today.getFullYear()}`;
                      })()}
                    </p>
                  </div>
                </div>

                <div className="text-center font-mono">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wider">
                    {getBoletinSemesterTitle(new Date())}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-xs text-slate-900 font-mono py-1">
                  <div>
                    <p>
                      Alumno: <strong>{formatStudentNameForBoletin(studentFullName)}</strong>
                    </p>
                    <p>
                      Carrera: &nbsp;&nbsp;&nbsp;
                      <strong>{carreraInfo.nombre || TOMA_RAMOS_ESTUDIANTE.carrera}</strong>
                    </p>
                    <p>
                      Jornada: &nbsp;&nbsp;&nbsp;
                      <strong>
                        {(
                          selectedTargetPackage?.jornada ||
                          carreraInfo.jornada ||
                          TOMA_RAMOS_ESTUDIANTE.jornada
                        ).toUpperCase()}
                      </strong>
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p>
                      Rut: &nbsp;&nbsp;&nbsp;&nbsp;<strong>{studentRutFormatted}</strong>
                    </p>
                    <p>
                      N° <strong>{carreraInfo.codigo || TOMA_RAMOS_ESTUDIANTE.codigoCarrera}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-center font-mono pt-2">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Horario de Clases
                  </h3>
                </div>

                {(() => {
                  const enrolledBlocks = cursosInscritos.flatMap((c) => c.bloques || []);
                  let minBlockIdx = 0;
                  let maxBlockIdx = 6;
                  if (enrolledBlocks.length > 0) {
                    const indices = enrolledBlocks
                      .map((b) => BLOQUES_HORARIOS_TOMA.findIndex((bh) => bh.id === b.bloqueId))
                      .filter((idx) => idx !== -1);
                    if (indices.length > 0) {
                      minBlockIdx = Math.min(...indices);
                      maxBlockIdx = Math.max(...indices);
                    }
                  }
                  const adaptiveBlocks = BLOQUES_HORARIOS_TOMA.slice(minBlockIdx, maxBlockIdx + 1);

                  return (
                    <div className="border border-black overflow-x-auto">
                      <table className="w-full text-center text-xs border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b border-black font-bold text-[11px] bg-white">
                            <th scope="col" className="p-1 border-r border-black w-24 text-center">
                              Módulo
                              <br />
                              Horario
                            </th>
                            {DIAS_GRILLA.map((dia) => (
                              <th
                                key={dia}
                                scope="col"
                                className="p-1 border-r border-black last:border-r-0"
                              >
                                {dia}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black text-[10px]">
                          {adaptiveBlocks.map((bloque) => {
                            const partes = bloque.hora.split(' - ');
                            const horaInicio = partes[0] || '08:31';
                            const horaFin = partes[1] || '09:10';

                            return (
                              <tr key={bloque.id} className="min-h-[44px]">
                                <td className="p-1 text-center font-bold border-r border-black text-[10px] leading-tight align-middle bg-white whitespace-nowrap">
                                  <div>{horaInicio}</div>
                                  <div className="font-normal text-[8px] my-0.5">A</div>
                                  <div>{horaFin}</div>
                                </td>

                                {DIAS_GRILLA.map((dia) => {
                                  const match = getCeldaContenido(dia, bloque.id);

                                  return (
                                    <td
                                      key={dia}
                                      className="p-1 text-center border-r border-black last:border-r-0 text-[9px] leading-tight align-middle bg-white min-w-[90px]"
                                    >
                                      {match ? (
                                        <div className="space-y-0.5 py-1">
                                          <span className="font-bold block uppercase leading-tight">
                                            {match.nombre}
                                          </span>
                                          <span className="font-mono text-[8px] block text-slate-800">
                                            {match.sigla}-{match.seccion}/{match.sala}
                                          </span>
                                        </div>
                                      ) : null}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {(() => {
                  const portafolioCourse = cursosInscritos.find(
                    (c) =>
                      c.tipo === 'portafolio' ||
                      c.sigla === 'PTF6101' ||
                      (c.nombre && c.nombre.toUpperCase().includes('PORTAFOLIO'))
                  );
                  const practicaCourses = cursosInscritos.filter(
                    (c) =>
                      c.tipo === 'practica' ||
                      c.sigla === 'PRL3100' ||
                      c.sigla === 'PPR4100' ||
                      (c.nombre && c.nombre.toUpperCase().includes('PRÁCTICA'))
                  );

                  if (!portafolioCourse && practicaCourses.length === 0) {
                    return null;
                  }

                  return (
                    <div className="space-y-4 font-mono text-xs pt-2">
                      {portafolioCourse && (
                        <div className="space-y-2">
                          <p className="font-semibold text-slate-900">
                            El Detalle de las clases de la asignatura &quot;{portafolioCourse.sigla}-
                            {portafolioCourse.seccion} - {portafolioCourse.nombre}&quot; es:
                          </p>
                          <div className="border border-black overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse min-w-[480px]">
                              <thead className="border-b border-black font-bold text-[11px] bg-white">
                                <tr>
                                  <th scope="col" className="p-1.5 border-r border-black w-28 text-center">
                                    Nro. Clase
                                  </th>
                                  <th scope="col" className="p-1.5 border-r border-black text-center">
                                    Fecha
                                  </th>
                                  <th scope="col" className="p-1.5 border-r border-black w-36 text-center">
                                    Horario
                                  </th>
                                  <th scope="col" className="p-1.5 w-40 text-center">
                                    Sala
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-black text-[11px]">
                                {(
                                  portafolioCourse.clasesPortafolio || [
                                    {
                                      nro: 'Clase 01',
                                      fecha: 'Miércoles 04 de Marzo de 2026',
                                      horario: '08:31 a 09:50',
                                      sala: 'AL-503A',
                                    },
                                    {
                                      nro: 'Clase 02',
                                      fecha: 'Viernes 06 de Marzo de 2026',
                                      horario: '08:31 a 10:40',
                                      sala: 'AL-LAB-IP4',
                                    },
                                  ]
                                ).map((clase, idx) => (
                                  <tr key={idx}>
                                    <td className="p-1.5 border-r border-black font-semibold text-center">
                                      {clase.nro}
                                    </td>
                                    <td className="p-1.5 border-r border-black px-3">{clase.fecha}</td>
                                    <td className="p-1.5 border-r border-black text-center">
                                      {clase.horario}
                                    </td>
                                    <td className="p-1.5 text-center">{clase.sala}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {practicaCourses.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-900 uppercase">Prácticas Inscritas</h4>
                          <div className="border border-black divide-y divide-black">
                            {practicaCourses.map((practica) => (
                              <div
                                key={practica.sigla}
                                className="p-2 flex flex-wrap items-center justify-between gap-2 text-[11px]"
                              >
                                <span className="font-bold">
                                  {practica.sigla}-{practica.seccion} • {practica.nombre}
                                </span>
                                <span>
                                  {practica.detallePractica?.horas || '360 hrs.'} • Horario a
                                  coordinar con centro de práctica
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="pt-4 border-t border-black text-center text-[10px] text-slate-700 font-mono space-y-0.5">
                  <p>
                    Comprobante oficial emitido por el Sistema de Información Curricular Duoc UC -
                    Sede Alameda (SICOL).
                  </p>
                  <p>
                    Duoc UC - Sede Alameda • Periodo{' '}
                    {carreraInfo.periodo || TOMA_RAMOS_ESTUDIANTE.periodo}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL SAP: INFORMACIÓN */}
        {showInfoModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sap-info-modal-title"
            className="absolute inset-0 z-50 bg-slate-900/35 flex items-center justify-center p-4"
          >
            <div
              ref={infoModalRef}
              className="relative w-full max-w-[440px] bg-[#E8EFF6] border-2 border-[#1B5387] shadow-2xl rounded-[2px] overflow-hidden focus:outline-none"
            >
              <div className="bg-gradient-to-b from-[#2A6BA5] to-[#174A7A] text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                <span id="sap-info-modal-title">Información</span>
                <button
                  type="button"
                  disabled={isLoadingSap}
                  onClick={() => setShowInfoModal(false)}
                  {...getVoiceProps('Cerrar ventana de información')}
                  className="w-5 h-5 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/15 rounded-[1px] font-bold text-xs cursor-pointer disabled:opacity-40"
                  aria-label="Cerrar ventana de información"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 bg-[#EBF2F8] min-h-[120px] flex flex-col justify-center gap-4 text-xs text-slate-900">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    className="w-5 h-5 fill-[#FFD54F] text-[#7A5900] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <p className="font-normal text-slate-900 text-xs leading-relaxed">
                    Una vez aceptada esta ventana no podra volver a inscribir los ramos.
                  </p>
                </div>

                {isLoadingSap && (
                  <div className="flex justify-center py-2" role="status" aria-label="Procesando en SICOL">
                    <div
                      className="w-9 h-9 rounded-full border-[4px] border-transparent border-t-[#1976D2] border-r-[#1976D2] border-b-[#1976D2] animate-spin"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </div>

              <div className="bg-[#DCE6F0] px-3 py-2 border-t border-[#B0C4D8] flex justify-end gap-2">
                <button
                  ref={infoAcceptBtnRef}
                  type="button"
                  disabled={isLoadingSap}
                  onClick={handleAceptarInformacion}
                  {...getVoiceProps('Aceptar y confirmar inscripción de ramos')}
                  className="px-4 py-1 bg-gradient-to-b from-[#FFE680] to-[#F7C631] hover:from-[#FFF0A6] hover:to-[#FAD252] border border-[#9E7B12] rounded-[2px] text-xs font-bold text-slate-900 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  disabled={isLoadingSap}
                  onClick={() => setShowInfoModal(false)}
                  {...getVoiceProps('Cancelar confirmación')}
                  className="px-4 py-1 bg-gradient-to-b from-[#FFF1A8] to-[#F2CA52] hover:from-[#FFF6C4] hover:to-[#FAD96E] border border-[#9E7B12] rounded-[2px] text-xs font-bold text-slate-900 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE PRE-FLUJO CONTENIDO DENTRO DEL SIMULADOR */}
        {isPreFlowActive && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preflow-title"
            className="absolute inset-0 z-40 flex items-start sm:items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs overflow-y-auto"
          >
            <div
              ref={preFlowModalRef}
              className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-4 max-h-[94%] overflow-y-auto focus:outline-none"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#002B49] uppercase tracking-wider mb-1">
                    <Building2 className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
                    <span>Simulador Oficial Duoc UC - Sede Alameda • {studentCareer}</span>
                  </div>
                  <h2 id="preflow-title" className="text-lg sm:text-2xl font-black text-slate-900">
                    {preFlowStep === 1
                      ? 'Paso 1: Elige Proceso, Modo de Simulación y Dificultad'
                      : 'Paso 2: Paquete Horario Objetivo'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    {preFlowStep === 1
                      ? 'Selecciona primero si deseas practicar Toma de Ramos desde cero o Modificación de Asignaturas ya inscritas.'
                      : 'Elige tu paquete horario objetivo para practicar su armado sin topes.'}
                  </p>
                </div>

                {onExit && (
                  <button
                    type="button"
                    onClick={onExit}
                    {...getVoiceProps('Volver al menú anterior')}
                    className="self-start sm:self-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Volver
                  </button>
                )}
              </div>

              {/* PASO 1 */}
              {preFlowStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      1.1 ¿Qué proceso deseas practicar?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          setProcessType('inscripcion');
                          setActiveTutorialTab('inscripcion');
                        }}
                        {...getVoiceProps(
                          'Inscripción de Asignaturas, Toma de Ramos. Comienzas con 0 créditos inscritos para tomar tu paquete horario completo.'
                        )}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                          processType === 'inscripcion'
                            ? 'border-[#002B49] bg-blue-50/70 ring-2 ring-[#002B49]/25 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002B49] bg-blue-100 px-2.5 py-0.5 rounded-full">
                              <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Desde 0 ramos</span>
                            </span>
                            <span className="text-xs font-bold text-[#002B49]">
                              {processType === 'inscripcion' ? '● Seleccionado' : '○ Elegir'}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            Inscripción de Asignaturas (Toma de Ramos)
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            Comienzas con <strong>0 créditos inscritos</strong> para tomar tu paquete
                            horario completo desde el inicio.
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProcessType('modificacion');
                          setActiveTutorialTab('modificacion');
                        }}
                        {...getVoiceProps(
                          'Modificación de Asignaturas. Comienzas con tu carga ya inscrita para practicar eliminar asignaturas o cambiar secciones.'
                        )}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                          processType === 'modificacion'
                            ? 'border-[#002B49] bg-amber-50/70 ring-2 ring-[#002B49]/25 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                              <ClipboardEdit className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Con ramos ya tomados</span>
                            </span>
                            <span className="text-xs font-bold text-[#002B49]">
                              {processType === 'modificacion' ? '● Seleccionado' : '○ Elegir'}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            Modificación de Asignaturas
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            Comienzas con tu <strong>carga ya inscrita</strong> para practicar
                            eliminar asignaturas (ícono X roja) o cambiar secciones.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      1.2 Selecciona el Modo de Simulación
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setSelectedModeOption('guiado')}
                        {...getVoiceProps(
                          'Modo Guiado, recomendado. Indicaciones paso a paso dentro del portal SICOL.'
                        )}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                          selectedModeOption === 'guiado'
                            ? 'border-[#002B49] bg-blue-50/60 ring-2 ring-[#002B49]/20 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 font-bold text-sm text-slate-900">
                            <Sparkles className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
                            <span>Modo Guiado</span>
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Indicaciones paso a paso dentro del portal SICOL sobre qué botón pulsar en
                          cada pantalla.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedModeOption('realista')}
                        {...getVoiceProps(
                          'Modo Realista, desafío oficial. Entorno SAP idéntico al día de inscripción oficial sin ayudas.'
                        )}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                          selectedModeOption === 'realista'
                            ? 'border-[#002B49] bg-blue-50/60 ring-2 ring-[#002B49]/20 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 font-bold text-sm text-slate-900">
                            <Flame className="w-4 h-4 text-amber-600" aria-hidden="true" />
                            <span>Modo Realista</span>
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                            Desafío Oficial
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Entorno SAP idéntico al día de inscripción oficial, sin ayudas ni avisos
                          adicionales.
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
                      <span>1.3 Nivel de Dificultad Académica</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {DIFFICULTY_LEVELS.map((diff) => {
                        const isSelected = selectedDifficulty === diff.id;
                        const badgeClass =
                          DIFFICULTY_BADGE_CLASSES[diff.id] || DIFFICULTY_BADGE_CLASSES['muy-dificil'];

                        return (
                          <button
                            key={diff.id}
                            type="button"
                            onClick={() => handleSelectDifficulty(diff.id)}
                            {...getVoiceProps(
                              `Dificultad ${diff.name}. ${diff.badge}. ${diff.description}`
                            )}
                            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                              isSelected
                                ? 'border-[#002B49] bg-blue-50/70 ring-2 ring-[#002B49]/20 shadow-sm'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                                  {diff.badge}
                                </span>
                                <span className="text-xs font-bold text-[#002B49]">
                                  {isSelected ? '●' : '○'}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-slate-900">{diff.name}</h4>
                              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                                {diff.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setSimulationMode(selectedModeOption === 'guiado' ? 'asistido' : 'real');
                        setPreFlowStep(2);
                      }}
                      {...getVoiceProps('Continuar al Paquete Objetivo')}
                      className="min-h-[44px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>Continuar al Paquete Objetivo</span>
                      <ArrowRight className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 2: SELECCIÓN DE PAQUETE OBJETIVO */}
              {preFlowStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {targetPackages.map((pkg) => {
                      const isSelected = selectedTargetPackage?.id === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedTargetPackage(pkg)}
                          {...getVoiceProps(
                            `${pkg.name}. ${pkg.badge}. ${pkg.targetCourses?.length || 0} asignaturas.`
                          )}
                          className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'border-[#002B49] bg-blue-50/80 ring-2 ring-[#002B49]/25 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#002B49] text-white">
                              {pkg.badge}
                            </span>
                            <span className="text-[11px] font-bold text-[#002B49]">
                              {isSelected ? '✓ Activo' : 'Elegir'}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 leading-snug">
                              {pkg.name}
                            </h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                              {pkg.description}
                            </p>
                          </div>
                          <div className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-center">
                            {pkg.targetCourses?.length || 0} Asignaturas
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedTargetPackage && (
                    <div className="rounded-xl border-2 border-black overflow-hidden shadow-sm bg-white">
                      <div className="bg-[#1b5e20] text-white px-4 py-2 flex items-center justify-between font-mono font-black text-xs sm:text-sm border-b-2 border-emerald-950">
                        <span>{carreraInfo.codigo || '1446114-6-D'}</span>
                        <span>{selectedTargetPackage.name}</span>
                      </div>

                      <div className="bg-amber-50 px-4 py-2 flex items-center gap-2 border-b border-amber-200 text-xs text-amber-950 font-sans font-medium">
                        <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                        <span>
                          <strong>Tip institucional:</strong> La forma más fácil de escoger una sección es revisar su letra final: <strong>D</strong> para horario <strong>Diurno</strong> y <strong>V</strong> para horario <strong>Vespertino</strong>.
                        </span>
                      </div>

                      <div className="bg-[#FFB81C] text-slate-950 px-4 py-1.5 grid grid-cols-12 font-black text-xs border-b border-black">
                        <div className="col-span-3 sm:col-span-2 border-r border-black pr-2">
                          Sección:
                        </div>
                        <div className="col-span-5 sm:col-span-6 px-2">Nom. Asignatura:</div>
                        <div className="col-span-4 sm:col-span-4 text-right">Horario y Sala</div>
                      </div>

                      <div className="divide-y divide-black text-xs font-mono max-h-60 overflow-y-auto">
                        {selectedTargetPackage.targetCourses.map((tc) => {
                          const isOptativo = tc.tipo === 'optativo' || tc.tipo === 'practica';
                          return (
                            <div
                              key={tc.sigla}
                              {...getVoiceProps(
                                `Bloque objetivo ${tc.sigla}, ${tc.nombre}, sección ${tc.seccion}, horario ${tc.horarioTexto}`
                              )}
                              className={`px-4 py-2 grid grid-cols-12 items-center ${
                                isOptativo ? 'bg-[#bbdefb]' : 'bg-white'
                              }`}
                            >
                              <div className="col-span-3 sm:col-span-2 font-bold text-slate-900 border-r border-black pr-2 truncate">
                                {tc.sigla}
                              </div>
                              <div className="col-span-5 sm:col-span-6 px-2">
                                <span className="font-bold text-slate-900 uppercase block truncate">
                                  {tc.nombre}
                                </span>
                                <span className="text-[10px] text-slate-600 font-sans block truncate">
                                  Sección Meta: {tc.seccion} • {tc.profesor}
                                </span>
                              </div>
                              <div className="col-span-4 sm:col-span-4 text-right font-sans text-[11px] text-slate-700 truncate">
                                <span className="font-semibold block">{tc.horarioTexto}</span>
                                <span className="text-[10px] text-slate-500 font-mono block">
                                  Sala: {tc.sala}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPreFlowStep(1)}
                      {...getVoiceProps('Volver al Paso 1')}
                      className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                    >
                      ← Volver al Paso 1
                    </button>

                    <button
                      type="button"
                      onClick={handleStartSimulationFromPreFlow}
                      {...getVoiceProps(
                        processType === 'modificacion'
                          ? 'Iniciar modificación de asignaturas'
                          : 'Iniciar toma de ramos'
                      )}
                      className="min-h-[46px] px-7 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-black text-sm rounded-xl flex items-center gap-2 shadow-lg cursor-pointer active:scale-95"
                    >
                      <span>
                        {processType === 'modificacion'
                          ? 'Iniciar modificación de asignaturas'
                          : 'Iniciar toma de ramos'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* 3. PANEL LATERAL DERECHO: HOJA DE RUTA / PAQUETE OBJETIVO */}
        {!isPreFlowActive && selectedTargetPackage && step !== 'boletin' && (
          <aside
            role="region"
            aria-label="Hoja de referencia del paquete objetivo"
            className="w-full lg:w-[350px] xl:w-[380px] shrink-0 lg:sticky lg:top-20 bg-white border-2 border-[#002B49] rounded-2xl shadow-lg overflow-hidden transition-all"
          >
            {/* Cabecera compacta + progreso */}
            <div className="px-3.5 py-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#002B49] text-white flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-900 block leading-snug">
                      {selectedTargetPackage.name}
                    </span>
                    <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                      {processType === 'modificacion' ? 'Modificación' : 'Toma de Ramos'} •{' '}
                      {simulationMode === 'asistido' ? 'Modo Guiado' : 'Modo Realista'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  aria-expanded={isReferenceSheetExpanded}
                  onClick={() => setIsReferenceSheetExpanded((prev) => !prev)}
                  {...getVoiceProps(
                    isReferenceSheetExpanded
                      ? 'Ocultar lista del paquete objetivo'
                      : 'Ver lista del paquete objetivo'
                  )}
                  className="min-h-[32px] px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>{isReferenceSheetExpanded ? 'Ocultar' : 'Ver Lista'}</span>
                  {isReferenceSheetExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-600 leading-snug">
                Hoja de Ruta de Referencia • Logra las secciones indicadas para alcanzar el 100%
              </p>

              <div className="flex items-center justify-between gap-2.5 pt-0.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-1 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${getProgressBarColor(
                        completionPercentage
                      )}`}
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-slate-900 shrink-0">
                    {completionPercentage}%
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                    ({matchedCount}/{totalTargetCount})
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-slate-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span>{liveScore} pts</span>
                </div>
              </div>
            </div>

            {isReferenceSheetExpanded && (
              <div className="p-2.5 bg-slate-100/70">
                <div className="rounded-lg border-2 border-black overflow-hidden bg-white">
                  <div className="bg-[#1b5e20] text-white px-3 py-1.5 flex items-center justify-between gap-2 font-mono font-black text-[11px] border-b-2 border-emerald-950">
                    <span className="shrink-0">{carreraInfo.codigo || '1446114-6-D'}</span>
                    <span className="text-right">{selectedTargetPackage.name}</span>
                  </div>
                  <div className="bg-amber-50 px-3 py-1.5 flex items-center gap-1.5 border-b border-amber-200 text-[11px] text-amber-950 font-sans font-medium">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                    <span>
                      <strong>Tip:</strong> Revisa la letra final (<strong>D</strong> = Diurno, <strong>V</strong> = Vespertino).
                    </span>
                  </div>
                  <div className="bg-[#FFB81C] text-slate-950 px-3 py-1 grid grid-cols-12 items-center font-black text-[11px] border-b border-black">
                    <div className="col-span-3 border-r border-black pr-1.5">Sigla:</div>
                    <div className="col-span-5 px-2">Nom. Asignatura:</div>
                    <div className="col-span-4 text-right">Estado</div>
                  </div>
                  <div className="divide-y divide-black text-xs font-mono max-h-[60vh] lg:max-h-[calc(100vh-15rem)] overflow-y-auto">
                    {targetCourses.map((tc) => {
                      const hasExactMatch = allCurrentCourses.some(
                        (c) => c.sigla === tc.sigla && c.seccion === tc.seccion
                      );
                      const hasWrongSection = allCurrentCourses.some(
                        (c) => c.sigla === tc.sigla && c.seccion !== tc.seccion
                      );
                      const currentSelected = allCurrentCourses.find((c) => c.sigla === tc.sigla);
                      const isOptativo = tc.tipo === 'optativo' || tc.tipo === 'practica';

                      return (
                        <div
                          key={tc.sigla}
                          {...getVoiceProps(
                            getTargetCourseVoiceLabel(
                              tc,
                              hasExactMatch,
                              hasWrongSection,
                              currentSelected
                            )
                          )}
                          className={`px-3 py-2 flex flex-col gap-1.5 ${getTargetCourseRowBg(
                            hasExactMatch,
                            isOptativo
                          )}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-slate-950 text-xs">{tc.sigla}</span>
                              <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-800">
                                Secc. {tc.seccion}
                              </span>
                            </div>

                            <div className="shrink-0 font-sans text-right">
                              <TargetCourseStatusBadge
                                tc={tc}
                                hasExactMatch={hasExactMatch}
                                hasWrongSection={hasWrongSection}
                                currentSelected={currentSelected}
                              />
                            </div>
                          </div>

                          <div className="font-bold text-slate-900 uppercase text-[11px] leading-snug break-words">
                            {tc.nombre}
                          </div>

                          <div className="text-[11px] text-slate-700 font-sans leading-snug">
                            Meta: <strong>{tc.seccion}</strong> • {tc.horarioTexto}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </section>
  );
};
