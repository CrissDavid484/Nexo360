import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Calendar,
  LogOut,
  CheckCircle,
  AlertCircle,
  Printer,
  Download,
  Info,
  HelpCircle,
  FileText,
  RotateCcw,
  Play,
  X,
  ExternalLink,
  Search,
  Lock,
  RefreshCw,
  Check,
  CheckSquare,
  Building2,
  Sparkles,
  Trophy,
  Target,
  ChevronUp,
  ChevronDown,
  Flame,
  Zap,
  Clock,
} from 'lucide-react';
import {
  PORTAL_INSC_URL,
  TOMA_RAMOS_ESTUDIANTE,
  BLOQUES_HORARIOS_TOMA,
  ASIGNATURAS_DISPONIBLES,
  TOMA_RAMOS_TUTORIAL_VIDEO,
  CARRERAS_DUOC,
  getRandomCoursesForCareer,
  generateTargetPackages,
  DIFFICULTY_LEVELS,
  getBoletinSemesterTitle,
  formatStudentNameForBoletin,
  PRACTICA_LABORAL_COURSE,
  PRACTICA_PROFESIONAL_COURSE,
  PORTAFOLIO_TITULO_COURSE,
} from '../../data/tomaRamosData';
import {
  SapSelectBoxIcon,
  SapEstadoIcon,
  SapHorarioTabIcon,
  SapCursosTabIcon,
} from './SapSelectBoxIcon';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export const TomaRamosSimulator = ({ onExit }) => {
  const { announce, readingGuide, toggleReadingGuide } = useAccessibility();

  // Modo de simulación:
  // 'asistido': con tutor guiado, explicaciones paso a paso y ayudas visuales
  // 'real': simulación idéntica al día oficial con cronómetro y sin ayudas
  const [simulationMode, setSimulationMode] = useState('asistido');

  // Cronómetro de sesión para la simulación
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Estados del flujo principal:
  // 'bienvenida' (Imagen 3) | 'inscripcion' (Imagen 1 y 2) | 'estados' (revisión de estados con colores) | 'boletin' (horario oficial PDF)
  const [step, setStep] = useState('bienvenida');

  // Subvista del panel izquierdo en 'inscripcion':
  // 'lista' (tabla de asignaturas disponibles, Imagen 1) | 'seccion' (selección de sección in-place, Imagen 2)
  const [leftPanelView, setLeftPanelView] = useState('lista');
  const [currentAsignatura, setCurrentAsignatura] = useState(null);

  // Estados de confirmación institucional:
  // 1. showInfoModal: Ventana emergente "Información" ("Una vez aceptada esta ventana no podrá volver a inscribir los ramos")
  // 2. isLoadingSap: Círculo incompleto azul girando
  // 3. showSuccessModal: Ticket dentro de checkbox verde ("Se ha realizado la toma de asignaturas")
  // 4. isGrabado: Deshabilita las demás opciones (Anterior, Siguiente, Grabar, selección) al grabar
  // 5. isHorarioUnlocked: Desbloquea el botón "Ver Horario"
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isLoadingSap, setIsLoadingSap] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isGrabado, setIsGrabado] = useState(false);
  const [isHorarioUnlocked, setIsHorarioUnlocked] = useState(false);

  // Mensaje flotante de impresión / descarga en el Boletín
  const [printToastMessage, setPrintToastMessage] = useState('');

  // Modal de video oficial e instrucciones
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Notificación de tope de horario en la selección de sección
  const [topeHorarioError, setTopeHorarioError] = useState('');

  // Filtro de asignaturas
  const [filtroAsignaturas, setFiltroAsignaturas] = useState('');

  // Cronómetro de sesión (inicia únicamente al pulsar "Haz Click Para Continuar" y se detiene al grabar o al ver horario)
  useEffect(() => {
    let interval;
    if (isTimerRunning && !isGrabado && (step === 'inscripcion' || step === 'estados')) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isGrabado, step]);

  // Formato mm:ss para el cronómetro
  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Carrera real del estudiante extraída desde Vivo Duoc / Auth
  const { user } = useAuth();
  const studentCareer =
    user?.career ||
    user?.carrera ||
    user?.vivoStudentProfile?.carrera ||
    'Ingeniería en Informática';

  const matchedInitialCarrera =
    CARRERAS_DUOC.find(
      (c) =>
        c.nombre.toLowerCase().includes(studentCareer.toLowerCase()) ||
        studentCareer.toLowerCase().includes(c.nombre.toLowerCase())
    ) || CARRERAS_DUOC[0];

  // Carrera seleccionada para la simulación
  const [selectedCarrera, setSelectedCarrera] = useState(matchedInitialCarrera.nombre);
  const [carreraInfo, setCarreraInfo] = useState(matchedInitialCarrera);

  // Nivel de dificultad académica: 'facil' (3) | 'intermedio' (4 + práctica) | 'dificil' (8) | 'muy-dificil' (8 + 2 prácticas)
  const [selectedDifficulty, setSelectedDifficulty] = useState('facil');

  // Asignaturas activas para la simulación (generadas aleatoriamente o desde BD)
  const [availableCourses, setAvailableCourses] = useState(() =>
    getRandomCoursesForCareer(matchedInitialCarrera.nombre, 8, 'facil')
  );

  // Pre-flujo interactivo con fondo desenfocado (blur):
  // isPreFlowActive: true hasta que el estudiante completa los pasos y pulsa "Iniciar toma de ramos"
  // preFlowStep: 1 (Elección de Modo y Dificultad) | 2 (Selección de Paquete Objetivo con vista previa institucional)
  const [isPreFlowActive, setIsPreFlowActive] = useState(true);
  const [preFlowStep, setPreFlowStep] = useState(1);
  const [selectedModeOption, setSelectedModeOption] = useState('guiado'); // 'guiado' o 'realista'
  const [targetPackages, setTargetPackages] = useState(() => generateTargetPackages(availableCourses, 'facil'));
  const [selectedTargetPackage, setSelectedTargetPackage] = useState(null);
  const [isReferenceSheetExpanded, setIsReferenceSheetExpanded] = useState(true);

  // Inicializar o actualizar paquetes objetivos cuando se cargan las asignaturas de la carrera o cambia la dificultad
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

  // Garantizar coherencia absoluta: si cualquier ramo del paquete seleccionado no existe en availableCourses,
  // re-vincular inmediatamente al paquete correspondiente generado desde availableCourses.
  useEffect(() => {
    if (!selectedTargetPackage?.targetCourses || !availableCourses || availableCourses.length === 0) return;
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

  // Actualizar la carrera y asignaturas cuando cambia o se carga el perfil del estudiante
  useEffect(() => {
    if (studentCareer) {
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
          sede: user?.campus || user?.sede || user?.vivoStudentProfile?.sede || 'Sede Alameda',
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
      refreshRandomCourses(match.nombre, selectedDifficulty);
    }
  }, [studentCareer]);

  // Cursos inscritos en la sesión de práctica
  const [cursosInscritos, setCursosInscritos] = useState([]);

  // Cursos seleccionados en esta sesión (proyectados en el cuadro inferior y horario)
  const [cursosSeleccionados, setCursosSeleccionados] = useState([]);

  // Días de la grilla horaria
  const diasGrilla = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Gamificación y Cálculo de Logro del Paquete Objetivo
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
  const speedBonus = isTimerRunning || isGrabado
    ? Math.max(0, 300 - Math.floor(timerSeconds * 1.5))
    : 300;
  const penalty = wrongSectionCourses.length * 100;
  const rawScore = Math.max(0, baseScore + perfectBonus + speedBonus - penalty);
  const liveScore = Math.round(rawScore * (diffConfig.multiplier || 1.0));

  const [personalRecordSeconds, setPersonalRecordSeconds] = useState(() => {
    const saved = localStorage.getItem('nexo360_toma_ramos_record_seconds');
    return saved ? parseInt(saved, 10) : null;
  });
  const [isNewRecordBeaten, setIsNewRecordBeaten] = useState(false);

  useEffect(() => {
    if (completionPercentage === 100 && (isGrabado || step === 'boletin')) {
      if (!personalRecordSeconds || timerSeconds < personalRecordSeconds) {
        localStorage.setItem('nexo360_toma_ramos_record_seconds', timerSeconds.toString());
        setPersonalRecordSeconds(timerSeconds);
        setIsNewRecordBeaten(true);
      }
    }
  }, [completionPercentage, isGrabado, step, timerSeconds, personalRecordSeconds]);

  // Transición desde el pre-flujo: desbloquea el fondo y pasa a la pantalla oficial de bienvenida
  const handleStartSimulationFromPreFlow = () => {
    setIsPreFlowActive(false);
    announce(
      'Simulador desbloqueado. Te encuentras en la pantalla de bienvenida. Haz clic en "Haz Click Para Continuar" para iniciar.',
      'polite'
    );
  };

  // Inicializar curso pre-inscrito para realismo SAP
  useEffect(() => {
    const preInscrito = availableCourses.find((c) => c.yaInscrito);
    if (preInscrito && preInscrito.secciones?.[0]) {
      const sec =
        preInscrito.secciones.find((s) => s.seccion === preInscrito.seccionInscrita) ||
        preInscrito.secciones[0];
      setCursosInscritos([
        {
          sigla: preInscrito.sigla,
          nombre: preInscrito.nombre,
          creditos: preInscrito.creditos,
          seccion: sec.seccion,
          profesor: sec.profesor,
          sala: sec.sala,
          bloques: sec.bloques,
          estado: 'inscrito',
        },
      ]);
    } else {
      setCursosInscritos([]);
    }
  }, [availableCourses]);

  // Generar combinación aleatoria de asignaturas según carrera y dificultad
  const refreshRandomCourses = async (carreraName = selectedCarrera, difficulty = selectedDifficulty) => {
    try {
      const res = await api.getCourses({ carrera: carreraName, random: true, limit: 12 }).catch(() => null);
      if (res?.success && Array.isArray(res.courses) && res.courses.length > 0) {
        setCursosSeleccionados([]);
        let coursesList = [...res.courses];
        if (difficulty === 'intermedio' || difficulty === 'muy-dificil') {
          if (!coursesList.some((c) => c.sigla === PRACTICA_LABORAL_COURSE.sigla)) {
            coursesList.push(PRACTICA_LABORAL_COURSE);
          }
        }
        if (difficulty === 'muy-dificil') {
          if (!coursesList.some((c) => c.sigla === PRACTICA_PROFESIONAL_COURSE.sigla)) {
            coursesList.push(PRACTICA_PROFESIONAL_COURSE);
          }
        }
        setAvailableCourses(coursesList);
        const pkgs = generateTargetPackages(coursesList, difficulty);
        setTargetPackages(pkgs);
        if (pkgs.length > 0) setSelectedTargetPackage(pkgs[0]);
        announce(`Nuevos ramos aleatorios cargados para ${carreraName}.`, 'polite');
        return;
      }
    } catch (e) {
      // fallback
    }
    const localRandom = getRandomCoursesForCareer(carreraName, 8, difficulty);
    setCursosSeleccionados([]);
    setAvailableCourses(localRandom);
    const pkgs = generateTargetPackages(localRandom, difficulty);
    setTargetPackages(pkgs);
    if (pkgs.length > 0) setSelectedTargetPackage(pkgs[0]);
    announce(`Nuevos ramos cargados para ${carreraName} en dificultad ${DIFFICULTY_LEVELS.find((d) => d.id === difficulty)?.name || difficulty}.`, 'polite');
  };

  // Cambio de dificultad
  const handleSelectDifficulty = (diffId) => {
    setSelectedDifficulty(diffId);
    refreshRandomCourses(selectedCarrera, diffId);
  };

  // Cambio de carrera
  const handleSelectCarrera = (newCarreraName) => {
    const info = CARRERAS_DUOC.find((c) => c.nombre === newCarreraName) || CARRERAS_DUOC[0];
    setSelectedCarrera(newCarreraName);
    setCarreraInfo(info);
    setCursosSeleccionados([]);
    refreshRandomCourses(newCarreraName);
  };

  // Al entrar al simulador, asegurar un lienzo 100% limpio (empezar desde 0 para practicar)
  useEffect(() => {
    let isMounted = true;
    api.saveTomaRamos([]).catch(() => {});
    return () => {
      isMounted = false;
      api.saveTomaRamos([]).catch(() => {});
    };
  }, []);

  // Totales de créditos
  const totalCreditosInscritos = cursosInscritos.reduce((acc, c) => acc + (c.creditos || 0), 0);
  const totalCreditosSeleccionados = cursosSeleccionados.reduce((acc, c) => acc + (c.creditos || 0), 0);

  // Verificación de tope de horario
  const findScheduleCollision = (seccion) => {
    const todosLosCursos = [...cursosInscritos, ...cursosSeleccionados];
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

  // Abrir la vista de selección de sección para una asignatura (Imagen 2)
  const handleOpenSeccionesInPlace = (asig) => {
    setTopeHorarioError('');
    setCurrentAsignatura(asig);
    setLeftPanelView('seccion');
    announce(`Desplegando secciones para ${asig.nombre}`, 'polite');
  };

  // Volver a la lista de asignaturas (botón Volver de Imagen 2)
  const handleVolverALista = () => {
    setTopeHorarioError('');
    setCurrentAsignatura(null);
    setLeftPanelView('lista');
    announce('Regresando al listado de asignaturas disponibles.', 'polite');
  };

  // Seleccionar una sección en la vista de Imagen 2
  const handleSelectSeccion = (asig, seccion) => {
    setTopeHorarioError('');

    if (seccion.sinCupos) {
      setTopeHorarioError(`A esta asignatura ya no le quedan vacantes disponibles (sección ${seccion.seccion}).`);
      announce('A esta asignatura ya no le quedan vacantes disponibles.', 'assertive');
      return;
    }

    const yaExiste =
      cursosSeleccionados.some((c) => c.sigla === asig.sigla) ||
      cursosInscritos.some((c) => c.sigla === asig.sigla);

    if (yaExiste) {
      setTopeHorarioError(`La asignatura ${asig.nombre} ya se encuentra en tu lista de cursos inscritos o seleccionados.`);
      announce('Esta asignatura ya se encuentra seleccionada o inscrita.', 'assertive');
      return;
    }

    const colision = findScheduleCollision(seccion);
    if (colision) {
      const msg = `Tope de Horario Detectado: La sección ${seccion.seccion} choca el día ${colision.dia} (${colision.hora}) con "${colision.cursoConflicto.nombre}" (${colision.cursoConflicto.sigla}-${colision.cursoConflicto.seccion}).`;
      setTopeHorarioError(msg);
      announce(msg, 'assertive');
      return;
    }

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
      clasesPortafolio: seccion.clasesPortafolio || asig.clasesPortafolio,
      detallePractica: seccion.detallePractica || asig.detallePractica,
    };

    setCursosSeleccionados([...cursosSeleccionados, nuevoCurso]);
    setLeftPanelView('lista');
    setCurrentAsignatura(null);
    announce(
      `Asignatura ${asig.nombre} sección ${seccion.seccion} agregada a Cursos Seleccionados y proyectada en el Horario.`,
      'polite'
    );
  };

  // Quitar una asignatura de Cursos Seleccionados
  const handleRemoveSeleccionado = (sigla) => {
    setCursosSeleccionados(cursosSeleccionados.filter((c) => c.sigla !== sigla));
    announce('Curso removido de la selección.', 'polite');
  };

  // Confirmar grabación de la toma de ramos (Ventana Información -> Círculo Azul -> Check Verde)
  const handleAceptarInformacion = () => {
    setShowInfoModal(false);
    setIsLoadingSap(true);
    announce('Grabando toma de asignaturas en la sesión de práctica...', 'polite');

    setTimeout(() => {
      const nuevosInscritos = [...cursosInscritos, ...cursosSeleccionados];
      setCursosInscritos(nuevosInscritos);
      setCursosSeleccionados([]);
      setIsLoadingSap(false);
      setIsGrabado(true); // Deshabilita las otras opciones al grabar
      setShowSuccessModal(true);
      setIsHorarioUnlocked(true);
      announce('Se ha realizado la toma de asignaturas simulada. Horario oficial desbloqueado para revisión.', 'polite');
    }, 1800);
  };

  // Función para volver a repetir la simulación limpia desde 0 (Asistida o Prueba Real)
  const handleRepeatSimulation = (mode = 'asistido', newRandom = false) => {
    setSimulationMode(mode);
    setSelectedModeOption(mode === 'real' ? 'realista' : 'guiado');
    setIsGrabado(false);
    setIsHorarioUnlocked(false);
    setShowSuccessModal(false);
    setShowInfoModal(false);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setCursosSeleccionados([]);
    setLeftPanelView('lista');
    setCurrentAsignatura(null);
    setTopeHorarioError('');
    setStep('bienvenida');
    setIsPreFlowActive(true);
    setPreFlowStep(1);
    setIsNewRecordBeaten(false);

    if (newRandom) {
      refreshRandomCourses(selectedCarrera, selectedDifficulty);
    } else {
      const preInscrito = availableCourses.find((c) => c.yaInscrito);
      if (preInscrito && preInscrito.secciones?.[0]) {
        const sec =
          preInscrito.secciones.find((s) => s.seccion === preInscrito.seccionInscrita) ||
          preInscrito.secciones[0];
        setCursosInscritos([
          {
            sigla: preInscrito.sigla,
            nombre: preInscrito.nombre,
            tipo: preInscrito.tipo || 'obligatorio',
            creditos: preInscrito.creditos,
            seccion: sec.seccion,
            profesor: sec.profesor,
            sala: sec.sala,
            bloques: sec.bloques,
            estado: 'inscrito',
            clasesPortafolio: sec.clasesPortafolio || preInscrito.clasesPortafolio,
            detallePractica: sec.detallePractica || preInscrito.detallePractica,
          },
        ]);
      } else {
        setCursosInscritos([]);
      }
    }

    // Asegurar limpieza de la base de datos para la nueva sesión
    api.saveTomaRamos([]).catch(() => {});

    announce(
      `Simulador reiniciado desde cero en ${mode === 'asistido' ? 'Modo Tutor Guiado' : 'Modo Prueba Real'}.`,
      'polite'
    );
  };

  // Reiniciar simulador al inicio empezando desde 0
  const handleReset = () => {
    handleRepeatSimulation(simulationMode, true);
  };

  // Salir del simulador garantizando borrado de ramos para la próxima visita
  const handleExitSimulator = () => {
    api.saveTomaRamos([]).catch(() => {});
    if (onExit) {
      onExit();
    } else {
      handleReset();
    }
  };

  // Obtener contenido de cada celda del horario
  const getCeldaContenido = (dia, bloqueId) => {
    for (const curso of cursosInscritos) {
      const match = curso.bloques?.find((b) => b.dia === dia && b.bloqueId === bloqueId);
      if (match) {
        return {
          texto: match.texto,
          tipo: 'inscrito',
          sala: match.salaCorta || match.sala || '',
          profesor: curso.profesor,
          nombre: curso.nombre,
          sigla: curso.sigla,
          seccion: curso.seccion,
        };
      }
    }

    for (const curso of cursosSeleccionados) {
      const match = curso.bloques?.find((b) => b.dia === dia && b.bloqueId === bloqueId);
      if (match) {
        return {
          texto: match.texto,
          tipo: 'seleccionado',
          sala: match.salaCorta || match.sala || '',
          profesor: curso.profesor,
          nombre: curso.nombre,
          sigla: curso.sigla,
          seccion: curso.seccion,
        };
      }
    }

    return null;
  };

  // Asignaturas requeridas por los paquetes objetivos de la sesión
  const packageCourseSiglas = useMemo(() => {
    const set = new Set();
    (targetPackages || []).forEach((pkg) => {
      (pkg.targetCourses || []).forEach((tc) => set.add(tc.sigla));
    });
    return set;
  }, [targetPackages]);

  // Cursos disponibles para la inscripción:
  // Requisito oficial del usuario: "Pon solo para seleccionar, los ramos que salen en los paquetes, con sus respectivos horarios"
  const asignaturasParaTomar = useMemo(() => {
    if (!packageCourseSiglas.size) return availableCourses;
    return availableCourses.filter(
      (asig) => asig.yaInscrito || packageCourseSiglas.has(asig.sigla)
    );
  }, [availableCourses, packageCourseSiglas]);

  // Cursos filtrados para la tabla de asignaturas
  const asignaturasFiltradas = asignaturasParaTomar.filter((asig) => {
    if (!filtroAsignaturas.trim()) return true;
    const q = filtroAsignaturas.toLowerCase();
    return asig.sigla.toLowerCase().includes(q) || asig.nombre.toLowerCase().includes(q);
  });

  // Mostrar mensaje flotante de impresión / descarga en el Boletín
  const triggerPrintToast = () => {
    setPrintToastMessage('Desde aquí puedes imprimir o descargar tu Boletín Oficial de Carga Académica en PDF.');
    announce('Desde aquí puedes imprimir o descargar tu Boletín Oficial de Carga Académica en PDF.', 'polite');
    setTimeout(() => {
      setPrintToastMessage('');
    }, 4500);
  };

  // Control de Acceso Institucional: Si el usuario NO está registrado en BD (isRegisteredInDb is false)
  if (user && user.isRegisteredInDb === false) {
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
            className="min-h-[44px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Volver al Centro de Ayuda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Simulador Oficial de Toma de Ramos Duoc UC (SAP WebDynpro SICOL)"
      className="bg-slate-200 min-h-screen text-slate-900 flex flex-col font-sans select-none relative"
    >
      {/* Contenedor principal con desenfoque en pre-flujo */}
      <div
        className={`flex-1 flex flex-col transition-all duration-500 ${
          isPreFlowActive ? 'filter blur-md pointer-events-none select-none opacity-60' : 'filter blur-0'
        } ${selectedTargetPackage && step === 'inscripcion' ? 'pb-48' : ''}`}
      >
        {/* ======================================================== */}
        {/* 1. BARRA DE NAVEGADOR SIMULADO (URL OFICIAL DUOC UC)      */}
        {/* ======================================================== */}
      <div className="bg-slate-800 text-slate-200 px-3 py-1 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-700">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 flex items-center gap-2 flex-1 max-w-3xl text-slate-300 font-mono text-[11px] overflow-hidden">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{PORTAL_INSC_URL}</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            title="Recargar simulador oficial"
            className="p-1 hover:text-white rounded hover:bg-slate-700"
            aria-label="Recargar página de inscripción"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          {/* Selector de Carrera y Generador Aleatorio */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px]">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <select
              value={selectedCarrera}
              onChange={(e) => handleSelectCarrera(e.target.value)}
              className="bg-transparent text-white font-medium text-[11px] focus:outline-none cursor-pointer max-w-[170px] sm:max-w-[220px] truncate"
              aria-label="Seleccionar Carrera para la simulación"
            >
              {CARRERAS_DUOC.map((c) => (
                <option key={c.codigo} value={c.nombre} className="bg-slate-900 text-white">
                  {c.nombreCorto || c.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => refreshRandomCourses(selectedCarrera)}
              title="Generar nueva combinación aleatoria de ramos para esta carrera"
              className="ml-1 px-1.5 py-0.5 bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Nuevos Ramos</span>
            </button>
          </div>

          {/* Botón Accesibilidad Cognitiva: Guía de Enfoque Visual */}
          <button
            type="button"
            onClick={toggleReadingGuide}
            className={`px-2 py-0.5 rounded font-bold transition-all border text-[11px] flex items-center gap-1 ${
              readingGuide
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-2xs font-black'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
            }`}
            aria-pressed={readingGuide}
            title="Activar/desactivar regla visual de lectura para enfocar líneas sin perderte"
          >
            <span>📖</span>
            <span className="hidden md:inline">Guía de Enfoque</span>
            <span className="text-[10px] font-mono px-1 rounded bg-black/30">
              {readingGuide ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Botón Reiniciar desde 0 */}
          <button
            type="button"
            onClick={handleReset}
            className="px-2 py-0.5 rounded font-bold transition-colors border text-[11px] bg-slate-900 hover:bg-rose-950 text-rose-300 border-rose-700/60 flex items-center gap-1"
            title="Reiniciar la simulación actual y empezar de 0"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" aria-hidden="true" />
            <span className="hidden sm:inline">Empezar de 0</span>
          </button>

          {/* Selector de Modo: Asistido vs Prueba Real */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => handleRepeatSimulation('asistido')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                simulationMode === 'asistido'
                  ? 'bg-amber-400 text-slate-950 shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modo Asistido con Tutor Guiado y explicaciones"
            >
              🎓 Tutor Guiado
            </button>
            <button
              type="button"
              onClick={() => handleRepeatSimulation('real')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                simulationMode === 'real'
                  ? 'bg-emerald-500 text-slate-950 shadow-2xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modo Prueba Real con cronómetro oficial"
            >
              ⚡ Prueba Real
            </button>
          </div>

          {/* Cronómetro de sesión de toma de ramos */}
          <div
            className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-slate-300 font-mono text-[11px] flex items-center gap-1.5"
            title="Tiempo transcurrido de sesión"
          >
            <span className="text-slate-500 text-[10px]">⏱️</span>
            <span className="font-bold text-amber-400">{formatTimer(timerSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded text-[11px] flex items-center gap-1 shadow-2xs"
            aria-label="Abrir video oficial e instrucciones"
          >
            <Play className="w-3 h-3 fill-slate-950" aria-hidden="true" />
            <span className="hidden sm:inline">Video Oficial</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ENCABEZADO SAP WEBDYNPRO OFICIAL (Idéntico a Imagen 3) */}
      {/* ======================================================== */}
      <header className="bg-gradient-to-b from-[#B8D1E6] via-[#A8C5DC] to-[#99B9D2] border-b border-[#7A9EB9] px-4 py-2 text-xs text-slate-900 shadow-2xs">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          {/* Identidad del Alumno en mayúsculas cursivas (Fiel a Imagen 1, 2 y 3) */}
          <div className="font-serif italic font-black text-sm tracking-wide text-slate-900 flex items-center gap-6">
            <span>{TOMA_RAMOS_ESTUDIANTE.nombre}</span>
            <span>RUT {TOMA_RAMOS_ESTUDIANTE.rut}</span>
            <span>PERIODO {carreraInfo.periodo || TOMA_RAMOS_ESTUDIANTE.periodo}</span>
          </div>

          {/* Botón Cerrar Sesión con recuadro y signo de exclamación (Fiel a Imagen 3) */}
          <div>
            <button
              type="button"
              onClick={handleExitSimulator}
              className="bg-gradient-to-b from-[#EAEAEA] to-[#D5D5D5] hover:from-white hover:to-[#E0E0E0] border border-slate-500 rounded px-3 py-1 text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs active:scale-95"
            >
              <span>Cerrar Sesión</span>
              <span className="w-4 h-4 bg-slate-600 text-white rounded-xs font-black text-[11px] flex items-center justify-center leading-none">
                !
              </span>
            </button>
          </div>
        </div>

        {/* Sub-barra de Metadatos Curriculares en dos filas (Fiel a Imagen 1, 2 y 3) */}
        <div className="max-w-[1400px] mx-auto mt-2 pt-1 border-t border-slate-400/40 grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-0.5 text-[10px] leading-tight text-slate-800 font-semibold">
          <div>
            <strong className="text-slate-950 font-black block">
              {carreraInfo.codigo || TOMA_RAMOS_ESTUDIANTE.codigoCarrera} {carreraInfo.nombre || TOMA_RAMOS_ESTUDIANTE.carrera}
            </strong>
            <span>{carreraInfo.sede || TOMA_RAMOS_ESTUDIANTE.sede}</span><br />
            <span>{carreraInfo.jornada || TOMA_RAMOS_ESTUDIANTE.jornada}</span>
          </div>
          <div>
            <span>Créditos Totales Currículum: <strong>{carreraInfo.creditosTotalesCurriculum || TOMA_RAMOS_ESTUDIANTE.creditosTotalesCurriculum}</strong></span><br />
            <span>Créditos Aprobados Optativos Interdisciplinarios: <strong>{carreraInfo.creditosAprobadosOptativosInterdisciplinarios ?? TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativosInterdisciplinarios}</strong></span><br />
            <span>Créditos Aprobados Optativos: <strong>{carreraInfo.creditosAprobadosOptativos ?? TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativos}</strong></span>
          </div>
          <div>
            <span>Créditos Inscritos Aprobados: <strong>{carreraInfo.creditosInscritosAprobados || TOMA_RAMOS_ESTUDIANTE.creditosInscritosAprobados}</strong></span><br />
            <span>Créditos Aprobados Optativos Formación Cristiana: <strong>{carreraInfo.creditosAprobadosOptativosFormacionCristiana ?? TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativosFormacionCristiana}</strong></span>
          </div>
          <div>
            <span>Créditos Totales Optativos: <strong>{carreraInfo.creditosTotalesOptativos || TOMA_RAMOS_ESTUDIANTE.creditosTotalesOptativos}</strong></span><br />
            <span>Créditos Aprobados Optativos Profundización: <strong>{carreraInfo.creditosAprobadosOptativosProfundizacion ?? TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativosProfundizacion}</strong></span>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2.1 GUÍA VISUAL COGNITIVA / STEPPER (W3C COGA & TDAH)    */}
      {/* ======================================================== */}
      <nav
        aria-label="Progreso del proceso de inscripción"
        className="bg-slate-900 border-b border-slate-700 px-3 py-2 text-white shadow-2xs"
      >
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto py-0.5">
            {[
              { id: 'bienvenida', num: '1', title: 'Bienvenida', desc: 'Inicio y reglas' },
              { id: 'inscripcion', num: '2', title: 'Selección de Ramos', desc: 'Vacantes y horario' },
              { id: 'estados', num: '3', title: 'Grabado y Revisión', desc: 'Confirmación SAP' },
              { id: 'boletin', num: '4', title: 'Horario y Boletín', desc: 'Carga oficial' },
            ].map((st) => {
              const isActive = step === st.id;
              const isPast =
                (st.id === 'bienvenida' && step !== 'bienvenida') ||
                (st.id === 'inscripcion' && (step === 'estados' || step === 'boletin')) ||
                (st.id === 'estados' && step === 'boletin');

              return (
                <div
                  key={st.id}
                  aria-current={isActive ? 'step' : undefined}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    isActive
                      ? 'bg-[#FFB81C] text-slate-950 font-black shadow-md ring-2 ring-white/70'
                      : isPast
                      ? 'bg-emerald-600/90 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 font-semibold'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      isActive
                        ? 'bg-slate-950 text-[#FFB81C]'
                        : isPast
                        ? 'bg-white text-emerald-700'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isPast ? '✓' : st.num}
                  </span>
                  <div className="text-left">
                    <span className="block leading-none text-xs">{st.title}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-300 font-mono hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Simulador Interactivo de Práctica Libre</span>
          </div>
        </div>
      </nav>

      {/* ======================================================== */}
      {/* 2.2 MENSAJE DE SEGURIDAD COGNITIVA (Reduce la ansiedad)   */}
      {/* ======================================================== */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-950 text-xs shadow-2xs">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-base" aria-hidden="true">🛡️</span>
            <p className="font-semibold text-[11px] sm:text-xs">
              <strong className="text-amber-900 font-black">Entorno Seguro de Práctica:</strong> Este simulador es exclusivamente de entrenamiento. Las asignaturas que inscribas aquí no alteran tu matrícula real en Duoc UC. Al salir o reiniciar, la simulación se borra y vuelve a empezar desde 0.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-bold text-amber-900 underline hover:text-black shrink-0"
          >
            Reiniciar a 0 ahora
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE VIDEO OFICIAL E INSTRUCCIONES                   */}
      {/* ======================================================== */}
      {showVideoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-video-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-fade-in"
        >
          <div className="relative w-full max-w-5xl xl:max-w-6xl bg-white rounded-2xl shadow-2xl border-2 border-slate-300 overflow-hidden my-auto">
            {/* Encabezado del Modal */}
            <header className="bg-[#002B49] text-white px-5 py-3.5 border-b-2 border-amber-400 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-xs"
                  aria-hidden="true"
                >
                  ▶
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-300 block tracking-wider leading-none">
                    Material Institucional Oficial • Duoc UC
                  </span>
                  <h3 id="tutorial-video-modal-title" className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
                    {TOMA_RAMOS_TUTORIAL_VIDEO.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="p-2 text-slate-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Cerrar video e instrucciones"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Contenido en 2 Columnas (Video a la izquierda, Instrucciones a la derecha) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white">
              {/* Columna Izquierda: Reproductor del Video Oficial */}
              <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
                    <iframe
                      src={TOMA_RAMOS_TUTORIAL_VIDEO.embedUrl}
                      title="Video oficial de Toma de Ramos Duoc UC"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                      Duración oficial: <strong>{TOMA_RAMOS_TUTORIAL_VIDEO.duracion}</strong>
                    </span>
                    <a
                      href={TOMA_RAMOS_TUTORIAL_VIDEO.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 transition-colors"
                    >
                      <span>Ver en YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                  <span className="text-amber-400 font-bold">💡 Tip de práctica:</span> Puedes consultar los 6 pasos oficiales a la derecha mientras ves el video o antes de continuar con la simulación interactiva.
                </div>
              </div>

              {/* Columna Derecha: Instrucciones y Pasos Clave a la derecha */}
              <div className="lg:col-span-5 bg-slate-50 p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>Pasos clave del proceso</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Secuencia paso a paso del portal SAP oficial
                      </p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#002B49] px-2 py-0.5 rounded-full border border-blue-200">
                      6 Pasos
                    </span>
                  </div>

                  {/* Lista de pasos con scroll suave y sin sobrecarga visual */}
                  <div className="mt-3 space-y-2.5 max-h-[360px] lg:max-h-[420px] overflow-y-auto pr-1">
                    {TOMA_RAMOS_TUTORIAL_VIDEO.pasosClave.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-amber-400 hover:shadow-xs transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-[#002B49] text-[#FFB81C] font-black text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {p.paso.replace(/^\d+\.\s*/, '')}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded shrink-0">
                            ⏱ {p.tiempo}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                          {p.descripcion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Pie del Modal */}
            <footer className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <p className="text-[11px] text-slate-500 text-center sm:text-left">
                Puedes volver a abrir este video e instrucciones en cualquier momento pulsando <strong>&ldquo;Video Oficial&rdquo;</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="w-full sm:w-auto px-5 py-2 bg-[#002B49] hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Cerrar y Volver al Simulador
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PANTALLA INICIAL: BIENVENIDA (Fiel a Imagen 3)        */}
      {/* ======================================================== */}
      {step === 'bienvenida' && (
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 flex flex-col justify-start space-y-4">
          {/* Contenedor oficial blanco con marco azul claro (Fiel a Imagen 3) */}
          <div className="bg-white border border-[#9CB8D0] shadow-2xs p-5 min-h-[460px] rounded-xs space-y-4">
            {/* Recuadro con el botón "Haz Click Para Continuar" (Fiel a Imagen 3 y Portal Oficial Duoc UC) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="border border-[#7FA5C5] bg-[#E8F1F8] p-2 inline-block rounded-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('inscripcion');
                    setLeftPanelView('lista');
                    setIsTimerRunning(true);
                    announce('Simulación iniciada. Cronómetro en marcha.', 'polite');
                  }}
                  className="bg-gradient-to-b from-[#EEEEEE] to-[#DDDDDD] hover:from-white hover:to-[#E5E5E5] border border-slate-500 rounded-xs px-4 py-2 text-xs font-black text-[#002B49] flex items-center gap-2.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Haz Click Para Continuar</span>
                  <span className="w-5 h-5 bg-[#3B8E32] rounded-xs flex items-center justify-center text-white font-black text-xs">
                    ▶
                  </span>
                </button>
              </div>

              {/* Botón rápido para barajar ramos de la carrera */}
              <button
                type="button"
                onClick={() => refreshRandomCourses(selectedCarrera)}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-md flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>🎲 Generar otra combinación de ramos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. PANTALLA PRINCIPAL: INSCRIPCIÓN (Fiel a Imagen 1, 2 y 5) */}
      {/* ======================================================== */}
      {step === 'inscripcion' && (
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-2 space-y-1.5">
          {/* Barra Superior de Botones de Navegación SAP (Fiel a Imagen 1 y 4) */}
          <div className="bg-gradient-to-b from-[#B8D1E6] to-[#A3C0D8] border border-[#7A9EB9] px-2 py-1 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={isGrabado}
                onClick={() => setStep('bienvenida')}
                className={`min-h-[25px] px-2.5 py-0.5 border rounded-xs text-[11px] font-bold flex items-center gap-1 shadow-2xs ${
                  isGrabado
                    ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400 border-slate-300'
                    : 'bg-gradient-to-b from-[#F2F2F2] to-[#DDDDDD] hover:from-white hover:to-[#E5E5E5] border-slate-500 text-slate-800 active:scale-95'
                }`}
                title={isGrabado ? 'Opciones deshabilitadas tras grabar' : 'Volver a la pantalla anterior'}
              >
                <span>◀ Anterior</span>
              </button>

              <button
                type="button"
                disabled={isGrabado}
                onClick={() => {
                  setStep('estados');
                  announce('Avanzando a la revisión de estados de inscripción.', 'polite');
                }}
                className={`min-h-[25px] px-3 py-0.5 border rounded-xs text-[11px] font-bold flex items-center gap-1 shadow-2xs ${
                  isGrabado
                    ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400 border-slate-300'
                    : 'bg-gradient-to-b from-[#FFF2B2] to-[#FED650] hover:from-white hover:to-[#FDD835] border-[#B38F00] text-slate-900 active:scale-95'
                }`}
                title={isGrabado ? 'Opciones deshabilitadas tras grabar' : 'Avanzar a revisión de estados'}
              >
                <span>Siguiente ▶</span>
              </button>

              <button
                type="button"
                disabled={isGrabado}
                onClick={() => {
                  setShowInfoModal(true);
                  announce('Abriendo confirmación de grabación.', 'polite');
                }}
                className={`min-h-[25px] px-3 py-0.5 border rounded-xs text-[11px] font-bold flex items-center gap-1.5 shadow-2xs ${
                  isGrabado
                    ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500 border-slate-300'
                    : 'bg-gradient-to-b from-[#F2F2F2] to-[#DDDDDD] hover:from-white hover:to-[#E5E5E5] border-slate-500 text-slate-800 active:scale-95'
                }`}
                title={isGrabado ? 'Asignaturas ya grabadas oficialmente' : 'Grabar asignaturas'}
              >
                <Save className="w-3.5 h-3.5 text-blue-900" aria-hidden="true" />
                <span>{isGrabado ? '✓ Grabado' : 'Grabar'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isHorarioUnlocked) {
                    announce('El horario se desbloqueará una vez que confirmes y grabes tu toma de asignaturas.', 'assertive');
                    alert('El horario oficial se desbloqueará una vez que presiones "Siguiente", confirmes y grabes tu toma de ramos.');
                    return;
                  }
                  setStep('boletin');
                  announce('Abriendo Boletín Oficial de Horario.', 'polite');
                }}
                className={`min-h-[25px] px-3 py-0.5 border rounded-xs text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                  isHorarioUnlocked
                    ? 'bg-gradient-to-b from-[#E3F2FD] to-[#BBDEFB] border-blue-600 text-blue-950 hover:from-white hover:to-[#90CAF9] cursor-pointer ring-2 ring-blue-500/60 shadow-md font-black'
                    : 'bg-slate-200 border-slate-400 text-slate-500 cursor-not-allowed opacity-75'
                }`}
                title={isHorarioUnlocked ? 'Ver Boletín Oficial de Horario' : 'Se desbloqueará al grabar asignaturas'}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-800" aria-hidden="true" />
                <span>Ver Horario</span>
                {!isHorarioUnlocked && <Lock className="w-3 h-3 text-slate-500 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="min-h-[25px] px-2.5 py-0.5 bg-gradient-to-b from-[#F2F2F2] to-[#DDDDDD] hover:from-white hover:to-[#E5E5E5] border border-slate-500 rounded-xs text-[11px] font-bold text-slate-800 flex items-center gap-1 shadow-2xs active:scale-95"
                title="Cerrar sesión o reiniciar simulación"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>

          {/* Banner de Tutor Guiado (Sólo visible en Modo Asistido) */}
          {simulationMode === 'asistido' && (
            <div className="bg-blue-50 border border-blue-300 text-blue-950 px-3 py-1.5 text-xs rounded-xs flex items-center justify-between gap-2 shadow-2xs animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="font-black text-blue-800 bg-blue-200 px-1.5 py-0.5 rounded text-[10px] uppercase">
                  {isGrabado ? 'Completado' : 'Tutor Guiado'}
                </span>
                <span className="font-semibold text-[11px]">
                  {isGrabado
                    ? '¡Asignaturas grabadas exitosamente! Las opciones de edición han quedado deshabilitadas. Presiona "Ver Horario" para revisar tu Boletín Oficial.'
                    : leftPanelView === 'seccion'
                    ? `Revisa las vacantes de ${currentAsignatura?.nombre} y haz clic en el icono 📦🖐️ para agregar la sección que no tenga tope horario.`
                    : 'Paso 1: Haz clic en el icono 📦🖐️ de la primera columna para abrir las secciones de la asignatura. Luego pulsa "Siguiente ▶" para revisar estados y "Grabar".'}
                </span>
              </div>
              <span className="text-[10px] text-blue-700 font-bold hidden sm:inline">
                {isGrabado ? 'Horario oficial listo' : 'Paso a paso'}
              </span>
            </div>
          )}

          {/* Grilla Principal: Panel Izquierdo (50%) y Panel Derecho (50%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-start">
            {/* ==================================================== */}
            {/* PANEL IZQUIERDO (col-span-6): CAMBIA ENTRE LISTA Y SECCIÓN */}
            {/* ==================================================== */}
            <div className="lg:col-span-6 space-y-2">
              {/* SUBVISTA A: LISTA DE ASIGNATURAS (Fiel a Imagen 1) */}
              {leftPanelView === 'lista' && (
                <div className="bg-white border border-[#91B1CC] shadow-2xs">
                  <div className="overflow-x-auto max-h-[460px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gradient-to-b from-[#DFE8F2] to-[#CAD9E9] border-b border-[#A8C2D8] text-slate-800 font-bold sticky top-0 z-10 text-[10px]">
                        <tr>
                          {/* Columna de selección sin texto (Fiel a Imagen 1 y zoom) */}
                          <th scope="col" className="p-1 border-r border-[#A8C2D8] text-center w-8"></th>
                          <th scope="col" className="p-1 border-r border-[#A8C2D8] text-center w-8">Estado</th>
                          <th scope="col" className="p-1 border-r border-[#A8C2D8] w-14">Sigla</th>
                          <th scope="col" className="p-1 border-r border-[#A8C2D8] w-14 text-slate-500">Sigla Eq...</th>
                          <th scope="col" className="p-1 border-r border-[#A8C2D8]">Nombre de la Asignatura</th>
                          <th scope="col" className="p-1 text-center w-10">Créd.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E0EBF5] text-[10px]">
                        {asignaturasFiltradas.map((asig) => {
                          const estaInscrito = cursosInscritos.some((c) => c.sigla === asig.sigla);
                          const estaSeleccionado = cursosSeleccionados.some((c) => c.sigla === asig.sigla);

                          return (
                            <tr
                              key={asig.sigla}
                              className={`hover:bg-[#EAF3FA] ${
                                estaInscrito
                                  ? 'bg-[#E3F2FD] font-semibold'
                                  : estaSeleccionado
                                  ? 'bg-[#E8F5E9] font-semibold'
                                  : 'bg-white'
                              }`}
                            >
                              {/* Icono de mano con caja SAP WebDynpro (Fiel a single_icon_col1.png) */}
                              <td className="p-1 text-center border-r border-[#E0EBF5]">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSeccionesInPlace(asig)}
                                  disabled={estaInscrito}
                                  className={`w-6 h-6 flex items-center justify-center mx-auto rounded-xs transition-colors ${
                                    estaInscrito
                                      ? 'opacity-30 cursor-not-allowed'
                                      : 'hover:bg-[#D3E5F5] active:scale-95'
                                  }`}
                                  aria-label={`Seleccionar sección para ${asig.nombre}`}
                                  title={`Seleccionar sección para ${asig.nombre}`}
                                >
                                  <SapSelectBoxIcon className="w-4 h-4" />
                                </button>
                              </td>

                              {/* Columna Estado con icono oficial (Fiel a single_icon_col2.png) */}
                              <td className="p-1 text-center border-r border-[#E0EBF5]">
                                {estaInscrito ? (
                                  <span
                                    className="inline-block w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] font-black leading-3.5 mx-auto"
                                    title="Inscrito oficialmente"
                                  >
                                    ✓
                                  </span>
                                ) : estaSeleccionado ? (
                                  <span
                                    className="inline-block w-3.5 h-3.5 rounded-full bg-emerald-600 text-white text-[8px] font-black leading-3.5 mx-auto"
                                    title="Seleccionado por confirmar"
                                  >
                                    +
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-center" title="Disponible">
                                    <SapEstadoIcon className="w-3.5 h-3.5" />
                                  </div>
                                )}
                              </td>

                              <td className="p-1 font-mono font-bold text-slate-800 border-r border-[#E0EBF5]">
                                {asig.sigla}
                              </td>

                              <td className="p-1 text-slate-400 border-r border-[#E0EBF5] text-center">
                                —
                              </td>

                              <td className="p-1 text-slate-900 font-semibold border-r border-[#E0EBF5]">
                                {asig.nombre}
                              </td>

                              <td className="p-1 text-center font-bold text-slate-700">
                                {asig.creditos}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Leyenda inferior de la tabla (Fiel a Imagen 1) */}
                  <div className="p-1.5 bg-[#F2F6FA] border-t border-[#A8C2D8] text-[9px] flex items-center gap-4 text-slate-700 font-semibold">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-[#A5D6A7] border border-[#66BB6A] rounded-xs inline-block" />
                      <span>Optativo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-[#FFF59D] border border-[#FFEE58] rounded-xs inline-block" />
                      <span>Práctica</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 bg-white border border-slate-400 rounded-xs inline-block" />
                      <span>Certificable</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVISTA B: SELECCIÓN DE SECCIÓN IN-PLACE (Fiel a Imagen 2) */}
              {leftPanelView === 'seccion' && currentAsignatura && (
                <div className="bg-white border border-[#91B1CC] shadow-2xs p-2.5 space-y-2.5 min-h-[460px]">
                  {/* Botón Volver con estilo SAP (Fiel a Imagen 2) */}
                  <div>
                    <button
                      type="button"
                      onClick={handleVolverALista}
                      className="bg-gradient-to-b from-[#FFF9D6] to-[#FFE082] hover:from-white hover:to-[#FFD54F] border border-[#B38F00] rounded-xs px-3 py-0.5 text-xs font-bold text-slate-900 flex items-center gap-1.5 shadow-2xs active:scale-95"
                    >
                      <span>◀ Volver</span>
                    </button>
                  </div>

                  {/* Franja Azul Oscura con Título Oficial (Fiel a Imagen 2) */}
                  <div className="bg-[#1C5485] text-white px-2 py-1 text-xs font-bold flex items-center justify-between rounded-xs">
                    <div className="flex items-center gap-1">
                      <span>▶</span>
                      <span>* Seleccione una Sección para su Asignatura</span>
                      <span>◀</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] bg-[#133F65] px-1.5 py-0.5 rounded-xs">
                      <span>◀</span>
                      <span>▶</span>
                    </div>
                  </div>

                  {/* Sigla y Nombre de la Asignatura + Créditos (Fiel a Imagen 2) */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 px-1 border-b border-slate-200 pb-1">
                    <span>{currentAsignatura.sigla} {currentAsignatura.nombre}</span>
                    <span>Créditos: {currentAsignatura.creditos}</span>
                  </div>

                  {/* Alerta Accesible y Cognitiva de Tope de Horario */}
                  {topeHorarioError && (
                    <div
                      role="alert"
                      aria-live="assertive"
                      className="p-3 bg-red-50 border-l-4 border-red-600 rounded-md text-xs text-red-950 font-bold flex flex-col gap-1.5 shadow-2xs animate-fade-in"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="leading-snug">{topeHorarioError}</span>
                      </div>
                      <div className="pl-6 text-[11px] font-semibold text-slate-700 flex items-center justify-between gap-2">
                        <span>💡 Sugerencia: Revisa las otras secciones de la tabla inferior o cambia la clase que produce el choque.</span>
                        <button
                          type="button"
                          onClick={() => setTopeHorarioError('')}
                          className="text-[11px] text-red-800 underline hover:text-black shrink-0"
                        >
                          Entendido
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tabla de Secciones Disponibles (Fiel a Imagen 2) */}
                  <div className="border border-[#A8C2D8] overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gradient-to-b from-[#DFE8F2] to-[#CAD9E9] border-b border-[#A8C2D8] text-slate-800 font-bold text-[10px]">
                        <tr>
                          <th scope="col" className="p-1 border-r border-[#A8C2D8] text-center w-8"></th>
                          <th scope="col" className="p-1 border-r border-[#A8C2D8] w-16">Sección</th>
                          <th scope="col" className="p-1 border-r border-[#A8C2D8] w-16">Cupos</th>
                          <th scope="col" className="p-1 border-r border-[#A8C2D8] w-24">Sala</th>
                          <th scope="col" className="p-1 border-r border-[#A8C2D8]">Profesor</th>
                          <th scope="col" className="p-1">Horario</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E0EBF5] text-[10px]">
                        {/* Si la asignatura no tiene secciones o todas están sin cupos */}
                        {currentAsignatura.secciones?.every((s) => s.sinCupos) ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-slate-700 font-semibold bg-slate-50">
                              <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-700 shrink-0" />
                                <span>[ i ] A esta asignatura ya no le quedan vacantes disponibles.</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          currentAsignatura.secciones?.map((sec) => (
                            <tr key={sec.seccion} className="hover:bg-[#EAF3FA]">
                              <td className="p-1 text-center border-r border-[#E0EBF5]">
                                {sec.sinCupos ? (
                                  <span className="text-red-600 font-bold text-[9px]">0</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectSeccion(currentAsignatura, sec)}
                                    className="w-6 h-6 flex items-center justify-center mx-auto hover:bg-[#D3E5F5] rounded-xs transition-colors active:scale-95"
                                    title={`Seleccionar sección ${sec.seccion}`}
                                  >
                                    <SapSelectBoxIcon className="w-4 h-4" />
                                  </button>
                                )}
                              </td>

                              <td className="p-1 font-bold text-slate-900 border-r border-[#E0EBF5]">
                                {sec.seccion}
                              </td>

                              <td className="p-1 border-r border-[#E0EBF5]">
                                {sec.sinCupos ? (
                                  <span className="text-red-700 font-bold">Sin cupos</span>
                                ) : (
                                  <span className="text-emerald-800 font-bold">{sec.cuposDisponibles} de {sec.cuposTotales}</span>
                                )}
                              </td>

                              <td className="p-1 text-slate-700 border-r border-[#E0EBF5]">
                                {sec.sala}
                              </td>

                              <td className="p-1 text-slate-800 border-r border-[#E0EBF5]">
                                {sec.profesor}
                              </td>

                              <td className="p-1 text-slate-700 font-mono text-[9px]">
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

            {/* ==================================================== */}
            {/* PANEL DERECHO (col-span-6): CUADROS EXACTOS (Fiel a Imagen 5) */}
            {/* ==================================================== */}
            <div className="lg:col-span-6 space-y-2">
              {/* Encabezado con Totales de Créditos (Fiel a Imagen 5 arriba a la derecha) */}
              <div className="flex items-center justify-end gap-3 text-[11px] font-medium text-slate-800 pb-0.5">
                <div className="flex items-center gap-1.5">
                  <span>Total Créditos inscritos:</span>
                  <input
                    type="text"
                    readOnly
                    value={totalCreditosInscritos}
                    className="w-11 h-5 bg-white border border-[#8FA9C4] text-right px-1 font-mono font-bold text-slate-900 text-[11px] shadow-inner"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Total Créditos seleccionados:</span>
                  <input
                    type="text"
                    readOnly
                    value={totalCreditosSeleccionados}
                    className="w-11 h-5 bg-white border border-[#8FA9C4] text-right px-1 font-mono font-bold text-blue-900 text-[11px] shadow-inner"
                  />
                </div>
              </div>

              {/* CUADRO 1: HORARIO (Fiel a Imagen 5) */}
              <div className="border border-[#7DA2C5] bg-[#EBF2F8] p-2 relative shadow-2xs">
                {/* Pestaña Superior Izquierda Trapezoide Horario (Fiel a Imagen 5) */}
                <div
                  className="inline-flex items-center gap-1.5 bg-gradient-to-b from-[#AFC7DD] to-[#95B2CE] border-t border-l border-r border-[#4C749A] text-[#1B365D] font-bold text-xs py-0.5 -mt-5 -ml-2 mb-1 shadow-2xs"
                  style={{
                    clipPath: 'polygon(12px 0%, 100% 0%, 100% 100%, 0% 100%)',
                    paddingLeft: '16px',
                    paddingRight: '14px',
                  }}
                >
                  <SapHorarioTabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Horario</span>
                </div>

                {/* Tabla de Horario Semanal con Scrollbar SAP (Fiel a Imagen 5) */}
                <div className="bg-white border border-[#90AFC9] overflow-x-auto max-h-[220px]">
                  <table className="w-full text-center text-[10px] border-collapse">
                    <thead className="bg-gradient-to-b from-[#DFE8F2] to-[#CAD9E9] border-b border-[#A8C2D8] text-slate-800 font-bold sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="p-1 border-r border-[#A8C2D8] w-20 text-left">Hora</th>
                        {diasGrilla.map((dia) => (
                          <th key={dia} scope="col" className="p-1 border-r border-[#A8C2D8] last:border-r-0">
                            {dia}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D0DCE5] text-[10px]">
                      {BLOQUES_HORARIOS_TOMA.slice(0, 9).map((bloque) => (
                        <tr key={bloque.id} className="hover:bg-[#F6F9FC]">
                          <td className="p-1 text-left font-mono font-bold text-slate-700 bg-[#F4F7FA] border-r border-[#D0DCE5] whitespace-nowrap">
                            {bloque.hora.replace(' - ', '-')}
                          </td>
                          {diasGrilla.map((dia) => {
                            const match = getCeldaContenido(dia, bloque.id);

                            return (
                              <td
                                key={dia}
                                className={`p-1 border-r border-[#D0DCE5] last:border-r-0 ${
                                  match?.tipo === 'inscrito'
                                    ? 'bg-[#E3F2FD] text-blue-950 font-bold'
                                    : match?.tipo === 'seleccionado'
                                    ? 'bg-[#FFF9C4] text-amber-950 font-bold border-2 border-amber-500'
                                    : ''
                                }`}
                              >
                                {match ? (
                                  <div className="leading-tight">
                                    <span className="block font-bold">{match.texto}</span>
                                    {match.sala && (
                                      <span className="text-[9px] text-slate-600 block">{match.sala}</span>
                                    )}
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CUADRO 2: CURSOS SELECCIONADOS (Fiel a Imagen 5) */}
              <div className="border border-[#7DA2C5] bg-[#EBF2F8] p-2 relative shadow-2xs">
                {/* Pestaña Superior Izquierda Trapezoide Cursos seleccionados (Fiel a Imagen 5) */}
                <div
                  className="inline-flex items-center gap-1.5 bg-gradient-to-b from-[#AFC7DD] to-[#95B2CE] border-t border-l border-r border-[#4C749A] text-[#1B365D] font-bold text-xs py-0.5 -mt-5 -ml-2 mb-1 shadow-2xs"
                  style={{
                    clipPath: 'polygon(12px 0%, 100% 0%, 100% 100%, 0% 100%)',
                    paddingLeft: '16px',
                    paddingRight: '14px',
                  }}
                >
                  <SapCursosTabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Cursos seleccionados</span>
                </div>

                {/* Tabla de Cursos Seleccionados (Fiel a Imagen 5) */}
                <div className="bg-white border border-[#90AFC9] overflow-x-auto min-h-[140px] max-h-[180px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gradient-to-b from-[#DFE8F2] to-[#CAD9E9] border-b border-[#A8C2D8] text-slate-800 font-bold text-[10px] sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="p-1 border-r border-[#A8C2D8] w-7 text-center"></th>
                        <th scope="col" className="p-1 border-r border-[#A8C2D8] w-14">Sigla</th>
                        <th scope="col" className="p-1 border-r border-[#A8C2D8] w-16 text-slate-500">Sigla Eq...</th>
                        <th scope="col" className="p-1 border-r border-[#A8C2D8]">Nombre de la Asignatura</th>
                        <th scope="col" className="p-1 border-r border-[#A8C2D8] text-center w-14">Sección</th>
                        <th scope="col" className="p-1 text-center w-10">Créd.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D0DCE5] text-[10px]">
                      {cursosSeleccionados.length > 0 ? (
                        cursosSeleccionados.map((c) => (
                          <tr key={c.sigla} className="bg-[#FFFDE7] hover:bg-[#FFF9C4]">
                            <td className="p-1 text-center border-r border-[#D0DCE5]">
                              <button
                                type="button"
                                onClick={() => handleRemoveSeleccionado(c.sigla)}
                                title={`Quitar ${c.sigla}`}
                                className="w-4 h-4 text-red-600 hover:text-red-800 font-black text-xs leading-none inline-flex items-center justify-center rounded-xs hover:bg-red-50"
                              >
                                ✕
                              </button>
                            </td>
                            <td className="p-1 font-mono font-bold text-slate-900 border-r border-[#D0DCE5]">{c.sigla}</td>
                            <td className="p-1 text-slate-400 border-r border-[#D0DCE5] text-center">—</td>
                            <td className="p-1 font-semibold text-slate-900 border-r border-[#D0DCE5]">{c.nombre}</td>
                            <td className="p-1 text-center font-bold text-blue-900 border-r border-[#D0DCE5]">{c.seccion}</td>
                            <td className="p-1 text-center font-bold">{c.creditos}</td>
                          </tr>
                        ))
                      ) : (
                        // Filas vacías para reproducir la apariencia vacía de Imagen 5
                        Array.from({ length: 5 }).map((_, idx) => (
                          <tr key={idx} className="h-6">
                            <td className="border-r border-[#D0DCE5]" />
                            <td className="border-r border-[#D0DCE5]" />
                            <td className="border-r border-[#D0DCE5]" />
                            <td className="border-r border-[#D0DCE5]" />
                            <td className="border-r border-[#D0DCE5]" />
                            <td />
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PANTALLA: REVISIÓN DE ESTADOS (Colores exactos pedidos) */}
      {/* ======================================================== */}
      {step === 'estados' && (
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 space-y-4 pb-24 animate-fade-in">
          {/* Barra de Acciones Superiores de Alta Visibilidad */}
          <div className="bg-[#002B49] text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-slate-200/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                <CheckCircle className="w-6 h-6 text-[#002B49]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>Revisión Final: Confirma tu Carga Académica</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                    Paso Final
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Revisa los estados de cada asignatura. Para finalizar y ver tu horario oficial, pulsa el botón verde <strong>&ldquo;Confirmar y Grabar Asignaturas&rdquo;</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  setStep('inscripcion');
                  announce('Regresando a la pantalla de selección de asignaturas.', 'polite');
                }}
                className="flex-1 md:flex-initial px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>◀ Modificar Ramos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowInfoModal(true);
                  announce('Abriendo confirmación de grabación.', 'polite');
                }}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer ring-2 ring-white/50"
              >
                <Save className="w-4 h-4 text-slate-950" />
                <span>Confirmar y Grabar Asignaturas</span>
              </button>
            </div>
          </div>

          {/* Resumen del Paquete Objetivo y Métricas */}
          {selectedTargetPackage && (
            <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-amber-50/50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-bold text-[#002B49] flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-700" />
                  <span>Meta Elegida:</span>
                </span>
                <span className="font-black text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                  {selectedTargetPackage.name}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                  completionPercentage === 100
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  🎯 {completionPercentage}% completado ({matchedCount}/{totalTargetCount} ramos objetivo)
                </span>
              </div>

              <div className="flex items-center gap-3 font-semibold text-slate-700">
                <span className="bg-amber-100/80 text-amber-900 px-2.5 py-1 rounded-md border border-amber-200 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{liveScore} pts</span>
                </span>
                <span className="font-mono text-slate-600">
                  ⏱️ {formatTimer(timerSeconds)}
                </span>
              </div>
            </div>
          )}

          <div className="bg-white border-2 border-slate-300 rounded p-6 shadow-md space-y-5">
            <header className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Tabla de Estados Académicos de Asignaturas
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Las asignaturas con fondo amarillo corresponden a las seleccionadas en esta toma de ramos.
                </p>
              </div>

              {/* Leyenda de Colores Oficiales Requeridos */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                <span className="px-2 py-0.5 bg-white border border-slate-300 text-slate-800 rounded">Sin inscribir (Blanco)</span>
                <span className="px-2 py-0.5 bg-[#FEF08A] border border-amber-400 text-amber-950 rounded">Inscritos (Amarillo)</span>
                <span className="px-2 py-0.5 bg-[#DCFCE7] border border-emerald-400 text-emerald-950 rounded">Aprobado (Verde)</span>
                <span className="px-2 py-0.5 bg-[#FEE2E2] border border-red-400 text-red-950 rounded">Reprobado (Rojo)</span>
                <span className="px-2 py-0.5 bg-[#FFEDD5] border border-orange-400 text-orange-950 rounded">Pendiente (Naranjo)</span>
                <span className="px-2 py-0.5 bg-[#E2E8F0] border border-slate-400 text-slate-800 rounded">Convalidado (Gris)</span>
              </div>
            </header>

            {/* Tabla con los 6 estados de color requeridos */}
            <div className="border border-slate-300 overflow-x-auto rounded shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#DFE8F2] border-b border-slate-300 text-slate-800 font-bold text-[11px]">
                  <tr>
                    <th scope="col" className="p-2 border-r border-slate-300 w-20">Sigla</th>
                    <th scope="col" className="p-2 border-r border-slate-300">Nombre de la Asignatura</th>
                    <th scope="col" className="p-2 border-r border-slate-300 text-center w-16">Sección</th>
                    <th scope="col" className="p-2 border-r border-slate-300 text-center w-14">Créd.</th>
                    <th scope="col" className="p-2 text-center w-32">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-xs font-semibold">
                  {/* 1. Asignaturas seleccionadas en esta sesión -> INSCRITOS EN AMARILLO */}
                  {cursosSeleccionados.map((c) => (
                    <tr key={c.sigla} className="bg-[#FEF08A] text-amber-950">
                      <td className="p-2 font-mono font-bold border-r border-amber-300">{c.sigla}</td>
                      <td className="p-2 border-r border-amber-300">{c.nombre}</td>
                      <td className="p-2 text-center font-bold border-r border-amber-300">{c.seccion}</td>
                      <td className="p-2 text-center border-r border-amber-300">{c.creditos}</td>
                      <td className="p-2 text-center font-black">Inscrito</td>
                    </tr>
                  ))}

                  {/* 2. Asignatura obligatoria inscrita inicialmente -> INSCRITOS EN AMARILLO */}
                  {cursosInscritos.map((c) => (
                    <tr key={c.sigla} className="bg-[#FEF08A] text-amber-950">
                      <td className="p-2 font-mono font-bold border-r border-amber-300">{c.sigla}</td>
                      <td className="p-2 border-r border-amber-300">{c.nombre}</td>
                      <td className="p-2 text-center font-bold border-r border-amber-300">{c.seccion}</td>
                      <td className="p-2 text-center border-r border-amber-300">{c.creditos}</td>
                      <td className="p-2 text-center font-black">Inscrito</td>
                    </tr>
                  ))}

                  {/* 3. APROBADO EN VERDE */}
                  <tr className="bg-[#DCFCE7] text-emerald-950">
                    <td className="p-2 font-mono font-bold border-r border-emerald-300">ASY4130</td>
                    <td className="p-2 border-r border-emerald-300">DISEÑO Y ARQUITECTURA DE SOFTWARE</td>
                    <td className="p-2 text-center border-r border-emerald-300">001D</td>
                    <td className="p-2 text-center border-r border-emerald-300">10</td>
                    <td className="p-2 text-center font-black">Aprobado</td>
                  </tr>

                  {/* 4. REPROBADO EN ROJO */}
                  <tr className="bg-[#FEE2E2] text-red-950">
                    <td className="p-2 font-mono font-bold border-r border-red-300">MAT1001</td>
                    <td className="p-2 border-r border-red-300">ÁLGEBRA SUPERIOR APLICADA</td>
                    <td className="p-2 text-center border-r border-red-300">002D</td>
                    <td className="p-2 text-center border-r border-red-300">8</td>
                    <td className="p-2 text-center font-black">Reprobado</td>
                  </tr>

                  {/* 5. PENDIENTE EN NARANJO */}
                  <tr className="bg-[#FFEDD5] text-orange-950">
                    <td className="p-2 font-mono font-bold border-r border-orange-300">ING1002</td>
                    <td className="p-2 border-r border-orange-300">INGLÉS INTERMEDIO COMUNICATIVO</td>
                    <td className="p-2 text-center border-r border-orange-300">—</td>
                    <td className="p-2 text-center border-r border-orange-300">6</td>
                    <td className="p-2 text-center font-black">Pendiente</td>
                  </tr>

                  {/* 6. CONVALIDADO EN GRIS */}
                  <tr className="bg-[#E2E8F0] text-slate-800">
                    <td className="p-2 font-mono font-bold border-r border-slate-300">TIC1001</td>
                    <td className="p-2 border-r border-slate-300">HERRAMIENTAS TECNOLÓGICAS DE INFORMACIÓN</td>
                    <td className="p-2 text-center border-r border-slate-300">EQ</td>
                    <td className="p-2 text-center border-r border-slate-300">4</td>
                    <td className="p-2 text-center font-black">Convalidado</td>
                  </tr>

                  {/* 7. SIN INSCRIBIR EN BLANCO */}
                  <tr className="bg-white text-slate-900">
                    <td className="p-2 font-mono font-bold border-r border-slate-300">GPI4121</td>
                    <td className="p-2 border-r border-slate-300">GESTIÓN DE PROYECTOS ÁGILES</td>
                    <td className="p-2 text-center border-r border-slate-300">—</td>
                    <td className="p-2 text-center border-r border-slate-300">10</td>
                    <td className="p-2 text-center font-black text-slate-600">Sin inscribir</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Botones de Acción Inferiores */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t-2 border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setStep('inscripcion');
                  announce('Regresando a la pantalla de selección de asignaturas.', 'polite');
                }}
                className="w-full sm:w-auto px-5 py-2.5 border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>◀ Volver a Modificar Ramos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowInfoModal(true);
                  announce('Abriendo confirmación de grabación.', 'polite');
                }}
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer ring-4 ring-emerald-300/40"
              >
                <Save className="w-5 h-5 text-amber-300" />
                <span>Confirmar y Grabar Asignaturas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL 1: INFORMACIÓN (Ventana emergente requerida)     */}
      {/* ======================================================== */}
      {showInfoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in"
        >
          {/* Ventana de estilo SAP WebDynpro */}
          <div className="relative w-full max-w-md bg-white border-2 border-[#1C5485] shadow-2xl rounded-xs overflow-hidden my-auto">
            {/* Barra de Título Oficial: "Información" */}
            <div className="bg-[#1C5485] text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
              <span>Información</span>
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="text-white hover:text-slate-200 p-0.5"
                aria-label="Cerrar ventana de información"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mensaje Oficial Requerido (Sin textos adicionales, dejando espacio en blanco) */}
            <div className="p-6 space-y-4 text-xs text-slate-800 min-h-[110px] flex items-center">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 shrink-0 font-bold text-sm">
                  i
                </div>
                <p className="font-semibold text-slate-900 leading-relaxed text-sm pt-0.5">
                  Una vez aceptada esta ventana no podrá volver a inscribir los ramos
                </p>
              </div>
            </div>

            {/* Botones Aceptar y Cancelar */}
            <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-300 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-1 bg-white hover:bg-slate-50 border border-slate-400 rounded-xs text-xs font-bold text-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleAceptarInformacion}
                className="px-5 py-1 bg-gradient-to-b from-[#1C5485] to-[#123E63] hover:from-[#24639C] hover:to-[#1C5485] text-white rounded-xs text-xs font-black shadow-xs"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL 2: CARGANDO (Círculo incompleto azul que gira)   */}
      {/* ======================================================== */}
      {isLoadingSap && (
        <div
          role="status"
          aria-live="assertive"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white border-2 border-[#1C5485] p-8 rounded-xs shadow-2xl flex flex-col items-center justify-center gap-4 text-center min-w-[280px]">
            {/* Círculo incompleto de color azul que da vueltas requerido */}
            <div
              className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-[#0054A6] animate-spin"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-black text-slate-900">
                Grabando asignaturas...
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Por favor espere mientras el sistema procesa su carga académica.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. MODAL 3: ÉXITO (Ticket dentro de checkbox verde)      */}
      {/* ======================================================== */}
      {showSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="relative w-full max-w-md bg-white border-2 border-emerald-600 shadow-2xl rounded-xs overflow-hidden my-auto">
            {/* Barra de Título */}
            <div className="bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
              <span>Confirmación de Registro</span>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="text-white hover:text-emerald-100 p-0.5"
                aria-label="Cerrar ventana de éxito"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              {/* Icono de un ticket dentro de un checkbox de color verde requerido */}
              <div className="mx-auto w-14 h-14 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-md border-2 border-emerald-700">
                <CheckSquare className="w-9 h-9 stroke-[2.5]" aria-hidden="true" />
              </div>

              {/* Mensaje Oficial Requerido */}
              <div>
                <h3 className="text-base font-black text-slate-900">
                  se ha realizado la toma de asignaturas
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  A partir de este momento se ha desbloqueado la consulta de tu horario oficial. Las opciones de modificación han quedado cerradas.
                </p>
              </div>

              {/* Resumen de Gamificación y Logro de Paquete */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 text-left">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Logro de Paquete Objetivo:</span>
                  <span className={completionPercentage === 100 ? 'text-emerald-700 font-black' : 'text-blue-700 font-bold'}>
                    {completionPercentage}% ({matchedCount}/{totalTargetCount} ramos)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Puntaje obtenido:</span>
                  <span className="font-bold text-slate-900">{liveScore} pts</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tiempo de sesión:</span>
                  <span className="font-mono font-bold text-slate-900">{formatTimer(timerSeconds)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Récord personal:</span>
                  <span className="font-mono text-slate-700">
                    {personalRecordSeconds ? formatTimer(personalRecordSeconds) : '02:30'}
                  </span>
                </div>
                {isNewRecordBeaten && (
                  <div className="text-center font-black text-emerald-700 text-xs pt-1.5 border-t border-slate-200 flex items-center justify-center gap-1">
                    <span>🏆</span>
                    <span>¡Nuevo récord personal de velocidad establecido!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-300 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setStep('boletin');
                }}
                className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs text-xs font-black shadow-xs flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Ver Horario Oficial ▶</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setStep('inscripcion');
                }}
                className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-400 text-slate-800 rounded-xs text-xs font-bold"
              >
                Permanecer en Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 9. PANTALLA: VER HORARIO (Boletín Oficial Fiel a PDF Duoc) */}
      {/* ======================================================== */}
      {step === 'boletin' && (
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 space-y-4">
          {/* Mensaje Toast Flotante cuando tocan Imprimir / Descargar */}
          {printToastMessage && (
            <div
              role="alert"
              className="p-3 bg-amber-100 border-2 border-amber-500 rounded text-xs font-black text-amber-950 flex items-center justify-center gap-2 shadow-md animate-fade-in"
            >
              <Info className="w-4 h-4 text-amber-800 shrink-0" />
              <span>{printToastMessage}</span>
            </div>
          )}

          {/* Barra Superior del Visor PDF con accesos para Repetir */}
          <div className="bg-slate-800 text-white p-3 rounded flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <span className="font-mono font-bold text-slate-200">Boletin_CargaAcademica_DuocUC_2026.pdf</span>
              <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px]">1 / 1</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={triggerPrintToast}
                className="min-h-[34px] px-3.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded flex items-center gap-1.5"
                aria-label="Imprimir horario"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>

              <button
                type="button"
                onClick={triggerPrintToast}
                className="min-h-[34px] px-3.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded flex items-center gap-1.5"
                aria-label="Descargar horario"
              >
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </button>

              {/* Botón rápido Volver al Portal */}
              <button
                type="button"
                onClick={() => setStep('inscripcion')}
                className="min-h-[34px] px-3.5 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded flex items-center gap-1"
              >
                <span>Volver a Inscripción</span>
              </button>

              {/* Botón rápido Repetir Asistida desde 0 */}
              <button
                type="button"
                onClick={() => handleRepeatSimulation('asistido')}
                className="min-h-[34px] px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded flex items-center gap-1 shadow-2xs"
                title="Volver a repetir la simulación en Modo Asistido empezando desde 0"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>🎓 Nueva Práctica (Desde 0)</span>
              </button>

              {/* Botón rápido Salir y Limpiar */}
              <button
                type="button"
                onClick={handleExitSimulator}
                className="min-h-[34px] px-3.5 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded flex items-center gap-1.5 shadow-2xs"
                title="Finalizar simulación, borrar ramos y volver a Nexo360"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Finalizar y Salir</span>
              </button>
            </div>
          </div>

          {/* Hoja Oficial del Boletín de Carga Académica (Idéntica a PDF Duoc UC) */}
          <div className="bg-white max-w-4xl mx-auto p-8 sm:p-12 rounded border border-slate-300 shadow-2xl space-y-6 font-mono text-slate-900">
            {/* Membrete Institucional (Fiel a PDF oficial con Logo Duoc UC oficial) */}
            <div className="flex items-start justify-between border-b border-black pb-3">
              <div>
                <img
                  src="/duoc-uc-logo-boletin.png"
                  alt="Duoc UC"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
                <div className="text-xs font-mono font-bold text-slate-900 mt-2 space-y-0.5">
                  <p>SEDE: {carreraInfo.sede ? carreraInfo.sede.replace(/^Sede\s+/i, '').toUpperCase() : 'ALAMEDA'}, N° 10</p>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-slate-900 space-y-0.5">
                <p className="font-bold">Dirección de Docencia</p>
                <p>Fecha emisión {(() => {
                  const today = new Date();
                  return `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
                })()}</p>
              </div>
            </div>

            {/* Título Oficial Centrado con Semestre y Año Dinámicos */}
            <div className="text-center font-mono">
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wider">
                {getBoletinSemesterTitle(new Date())}
              </h2>
            </div>

            {/* Datos del Alumno en mayúsculas (Fiel a PDF oficial) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-xs text-slate-900 font-mono py-1">
              <div>
                <p>Alumno: <strong>{formatStudentNameForBoletin(user?.name || user?.nombre || user?.vivoStudentProfile?.nombre || TOMA_RAMOS_ESTUDIANTE.nombre)}</strong></p>
                <p>Carrera: &nbsp;&nbsp;&nbsp;<strong>{carreraInfo.nombre || TOMA_RAMOS_ESTUDIANTE.carrera}</strong></p>
                <p>Jornada: &nbsp;&nbsp;&nbsp;<strong>{(selectedTargetPackage?.jornada || carreraInfo.jornada || TOMA_RAMOS_ESTUDIANTE.jornada).toUpperCase()}</strong></p>
              </div>
              <div className="sm:text-right">
                <p>Rut: &nbsp;&nbsp;&nbsp;&nbsp;<strong>{user?.rut || '21.987.654-3'}</strong></p>
                <p>N° <strong>{carreraInfo.codigo || TOMA_RAMOS_ESTUDIANTE.codigoCarrera}</strong></p>
              </div>
            </div>

            {/* Título de Sección Horario de Clases */}
            <div className="text-center font-mono pt-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Horario de Clases
              </h3>
            </div>

            {/* Grilla Horaria Adaptativa: Solo el rango de módulos requeridos preservando filas vacías internas */}
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
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-black font-bold text-[11px] bg-white">
                        <th scope="col" className="p-1 border-r border-black w-24 text-center">
                          Módulo<br />Horario
                        </th>
                        {diasGrilla.map((dia) => (
                          <th key={dia} scope="col" className="p-1 border-r border-black last:border-r-0">
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
                            {/* Módulo Horario Formateado: Hora Inicio / A / Hora Fin (Fiel al PDF) */}
                            <td className="p-1 text-center font-bold border-r border-black text-[10px] leading-tight align-middle bg-white whitespace-nowrap">
                              <div>{horaInicio}</div>
                              <div className="font-normal text-[8px] my-0.5">A</div>
                              <div>{horaFin}</div>
                            </td>

                            {/* Celdas de los Días */}
                            {diasGrilla.map((dia) => {
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

            {/* Detalle inferior condicional: Portafolio y Práctica (se omite si ninguno está inscrito) */}
            {(() => {
              const portafolioCourse = cursosInscritos.find(
                (c) => c.tipo === 'portafolio' || c.sigla === 'PTF6101' || (c.nombre && c.nombre.toUpperCase().includes('PORTAFOLIO'))
              );
              const practicaCourses = cursosInscritos.filter(
                (c) => c.tipo === 'practica' || c.sigla === 'PRL3100' || c.sigla === 'PPR4100' || (c.nombre && c.nombre.toUpperCase().includes('PRÁCTICA'))
              );

              if (!portafolioCourse && practicaCourses.length === 0) {
                return null;
              }

              return (
                <div className="space-y-4 font-mono text-xs pt-2">
                  {/* Detalle de las Clases de Portafolio */}
                  {portafolioCourse && (
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-900">
                        El Detalle de las clases de la asignatura &quot;{portafolioCourse.sigla}-{portafolioCourse.sigla}-{portafolioCourse.seccion}-{portafolioCourse.nombre}&quot; es:
                      </p>
                      <p className="font-semibold text-slate-900">
                        Docente: {portafolioCourse.profesor || 'Mauricio Gómez Arratia'}
                      </p>

                      <div className="border border-black overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="border-b border-black font-bold text-[11px] bg-white">
                            <tr>
                              <th scope="col" className="p-1.5 border-r border-black w-28 text-center">Nro. Clase</th>
                              <th scope="col" className="p-1.5 border-r border-black text-center">Fecha</th>
                              <th scope="col" className="p-1.5 border-r border-black w-36 text-center">Horario</th>
                              <th scope="col" className="p-1.5 w-40 text-center">Sala</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black text-[11px]">
                            {(portafolioCourse.clasesPortafolio || [
                              { nro: 'Clase 01', fecha: 'Miércoles 04 de Marzo de 2026', horario: '08:31 a 09:50', sala: 'AL-503A' },
                              { nro: 'Clase 02', fecha: 'Viernes 06 de Marzo de 2026', horario: '08:31 a 10:40', sala: 'AL-LAB-IP4' },
                              { nro: 'Clase 03', fecha: 'Miércoles 11 de Marzo de 2026', horario: '08:31 a 09:50', sala: 'AL-503A' },
                              { nro: 'Clase 04', fecha: 'Viernes 13 de Marzo de 2026', horario: '08:31 a 10:40', sala: 'AL-LAB-IP4' },
                            ]).map((clase, idx) => (
                              <tr key={idx}>
                                <td className="p-1.5 border-r border-black font-semibold text-center">{clase.nro}</td>
                                <td className="p-1.5 border-r border-black px-3">{clase.fecha}</td>
                                <td className="p-1.5 border-r border-black text-center">{clase.horario}</td>
                                <td className="p-1.5 text-center">{clase.sala}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Detalle de Prácticas Académicas */}
                  {practicaCourses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 uppercase">Detalle de Prácticas Académicas Enroladas</h4>
                      {practicaCourses.map((practica) => {
                        const det = practica.detallePractica || {
                          centroPractica: 'Empresa TI en Convenio • Sede Alameda',
                          supervisor: 'Coordinador de Prácticas Laborales Escuela Informática',
                          horas: '360 horas cronológicas',
                          periodo: 'Primer y Segundo Semestre 2026',
                        };
                        return (
                          <div key={practica.sigla} className="border border-black p-3 space-y-1.5 bg-slate-50/50">
                            <div className="flex items-center justify-between font-bold border-b border-black pb-1">
                              <span>{practica.sigla} - {practica.nombre} (Secc. {practica.seccion})</span>
                              <span className="text-[10px] uppercase bg-slate-200 px-2 py-0.5 rounded">En Terreno / Empresa</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] pt-1">
                              <p><span className="font-semibold">Centro de práctica:</span> {det.centroPractica}</p>
                              <p><span className="font-semibold">Supervisión:</span> {det.supervisor}</p>
                              <p><span className="font-semibold">Horas acreditadas:</span> {det.horas}</p>
                              <p><span className="font-semibold">Periodo:</span> {det.periodo}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Pie de Firma Institucional */}
            <div className="pt-4 border-t border-black text-center text-[10px] text-slate-700 font-mono space-y-0.5">
              <p>Comprobante oficial emitido por el Sistema de Información Curricular Duoc UC (SICOL).</p>
              <p>Sede Alameda • Av. España 8, Santiago • Periodo 2026 - 002</p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECCIÓN FINAL: VOLVER A REPETIR LA SIMULACIÓN DESDE 0     */}
          {/* ======================================================== */}
          <div className="bg-white border-2 border-slate-300 rounded-xl p-6 shadow-lg max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>¿Deseas volver a practicar tu toma de ramos?</span>
                  <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                    Reinicio a 0 Garantizado
                  </span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Elige una modalidad para comenzar una nueva práctica limpia desde cero, o vuelve al portal de Nexo360.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                Tiempo de simulación: {formatTimer(timerSeconds)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Opción 1: Repetir Modo Asistido */}
              <button
                type="button"
                onClick={() => handleRepeatSimulation('asistido')}
                className="p-3.5 rounded-xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100/60 hover:from-amber-100 hover:to-amber-200 text-left transition-all active:scale-[0.99] shadow-xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🎓</span>
                  <span className="text-[10px] font-black uppercase text-amber-950 bg-amber-200/90 px-1.5 py-0.5 rounded">
                    Recomendado • Desde 0
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-900 group-hover:text-amber-950">
                  Modo Asistido (Desde 0)
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Borra todos los ramos anteriores e inicia un nuevo entrenamiento con tutor paso a paso y consejos visuales.
                </p>
              </button>

              {/* Opción 2: Repetir Modo Prueba Real */}
              <button
                type="button"
                onClick={() => handleRepeatSimulation('real')}
                className="p-3.5 rounded-xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-100/60 hover:from-emerald-100 hover:to-emerald-200 text-left transition-all active:scale-[0.99] shadow-xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">⚡</span>
                  <span className="text-[10px] font-black uppercase text-emerald-950 bg-emerald-200/90 px-1.5 py-0.5 rounded">
                    Entorno Real • Desde 0
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-900 group-hover:text-emerald-950">
                  Prueba Real (Desde 0)
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Reinicia en blanco con cronómetro y sin ayudas para medir tu agilidad en la plataforma oficial Duoc UC.
                </p>
              </button>

              {/* Opción 3: Repetir con Nuevos Ramos al Azar */}
              <button
                type="button"
                onClick={() => handleRepeatSimulation(simulationMode, true)}
                className="p-3.5 rounded-xl border-2 border-blue-300 bg-gradient-to-b from-blue-50 to-blue-100/60 hover:from-blue-100 hover:to-blue-200 text-left transition-all active:scale-[0.99] shadow-xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🎲</span>
                  <span className="text-[10px] font-black uppercase text-blue-950 bg-blue-200/90 px-1.5 py-0.5 rounded">
                    Ramos al Azar
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-900 group-hover:text-blue-950">
                  Nuevos Ramos al Azar
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Baraja aleatoriamente las asignaturas, secciones y horarios de {carreraInfo.nombreCorto || carreraInfo.nombre}.
                </p>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500 font-medium">
                💡 Al finalizar o salir, ningún ramo queda almacenado permanentemente.
              </p>
              <button
                type="button"
                onClick={handleExitSimulator}
                className="px-5 py-2.5 bg-[#002B49] hover:bg-[#001f35] text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-xs"
              >
                <LogOut className="w-4 h-4 text-amber-400" />
                <span>Finalizar y Volver a Nexo360</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ======================================================== */}
      {/* 9. HOJA DE RUTA / PAQUETE OBJETIVO (VISTA DE REFERENCIA INFERIOR ESTILO PDF / CHEAT SHEET) */}
      {/* ======================================================== */}
      {selectedTargetPackage && step === 'inscripcion' && (
        <aside
          role="region"
          aria-label="Hoja de referencia del paquete objetivo"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-[#002B49] shadow-2xl transition-all duration-300"
        >
          {/* Barra superior de la hoja de referencia (Siempre visible, con métricas de gamificación) */}
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#002B49] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <FileText className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">
                    {selectedTargetPackage.name}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {simulationMode === 'asistido' ? 'Modo Guiado' : 'Modo Realista'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Hoja de Ruta de Referencia • Inscribe estas secciones para alcanzar el 100%
                </p>
              </div>
            </div>

            {/* Métricas de Gamificación: % Logro, Puntaje y Récord */}
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Barra de Porcentaje de Logro */}
              <div className="flex items-center gap-2">
                <div className="w-24 sm:w-32 bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      completionPercentage === 100
                        ? 'bg-emerald-500'
                        : completionPercentage >= 60
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-black text-slate-900">
                  {completionPercentage}%
                </span>
                <span className="text-[11px] text-slate-500 hidden md:inline">
                  ({matchedCount}/{totalTargetCount} ramos)
                </span>
              </div>

              {/* Puntaje */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{liveScore} pts</span>
              </div>

              {/* Récord Personal */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hidden lg:flex">
                <span className="text-amber-500">🏆</span>
                <span>
                  Récord:{' '}
                  <strong className="text-slate-900">
                    {personalRecordSeconds ? formatTimer(personalRecordSeconds) : '02:30'}
                  </strong>
                </span>
              </div>

              {/* Botón Minimizar / Desplegar */}
              <button
                type="button"
                onClick={() => setIsReferenceSheetExpanded((prev) => !prev)}
                className="min-h-[32px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                aria-expanded={isReferenceSheetExpanded}
                aria-label={isReferenceSheetExpanded ? 'Minimizar hoja de referencia' : 'Expandir hoja de referencia'}
              >
                <span>{isReferenceSheetExpanded ? 'Ocultar' : 'Ver Lista'}</span>
                {isReferenceSheetExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Contenido desplegable: Lista Oficial del Paquete Objetivo (Fiel a Imagen 2 / Planificación Duoc UC) */}
          {isReferenceSheetExpanded && (
            <div className="border-t border-slate-300 bg-slate-100/90 px-3 sm:px-6 py-3 max-h-72 overflow-y-auto">
              <div className="max-w-4xl mx-auto rounded-lg border-2 border-black overflow-hidden shadow-sm bg-white">
                {/* Encabezado Verde Superior (Fiel a Imagen 2) */}
                <div className="bg-[#1b5e20] text-white px-4 py-2 flex items-center justify-between font-mono font-black text-xs sm:text-sm border-b-2 border-emerald-950">
                  <span>{carreraInfo.codigo || '1446114-6-D'}</span>
                  <span>{selectedTargetPackage.name}</span>
                </div>

                {/* Sub-encabezado Amarillo (Fiel a Imagen 2) */}
                <div className="bg-[#FFB81C] text-slate-950 px-4 py-1.5 grid grid-cols-12 font-black text-xs border-b border-black">
                  <div className="col-span-3 sm:col-span-2 border-r border-black pr-2">Sección:</div>
                  <div className="col-span-5 sm:col-span-6 px-2">Nom. Asignatura:</div>
                  <div className="col-span-4 sm:col-span-4 text-right">Horario / Estado</div>
                </div>

                {/* Lista de Asignaturas del Paquete (Fiel a Imagen 2) */}
                <div className="divide-y divide-black text-xs font-mono">
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
                        className={`px-4 py-1.5 grid grid-cols-12 items-center transition-colors ${
                          hasExactMatch
                            ? 'bg-emerald-50'
                            : isOptativo
                            ? 'bg-[#bbdefb]'
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        {/* Columna Sección */}
                        <div className="col-span-3 sm:col-span-2 font-bold text-slate-900 border-r border-black pr-2 truncate">
                          {tc.sigla}
                        </div>

                        {/* Columna Nom. Asignatura */}
                        <div className="col-span-5 sm:col-span-6 px-2">
                          <span className="font-bold text-slate-900 uppercase block truncate" title={tc.nombre}>
                            {tc.nombre}
                          </span>
                          <span className="text-[10px] text-slate-600 font-sans block truncate">
                            Meta: {tc.seccion} • {tc.horarioTexto}
                          </span>
                        </div>

                        {/* Columna Estado y Horario */}
                        <div className="col-span-4 sm:col-span-4 flex items-center justify-end gap-1.5 text-right font-sans">
                          {hasExactMatch ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                              ✓ Inscrito
                            </span>
                          ) : hasWrongSection ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white" title={`Sección elegida: ${currentSelected?.seccion}`}>
                              ⚠️ Secc. {currentSelected?.seccion}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                              ⏳ Pendiente
                            </span>
                          )}
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

      {/* ======================================================== */}
      {/* 10. MODAL / SCREEN PRE-FLOW CON DESENFOQUE (PASO 1 Y PASO 2) */}
      {/* ======================================================== */}
      {isPreFlowActive && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preflow-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-fade-in-up my-8 max-h-[92vh] overflow-y-auto">
            {/* Encabezado con datos del estudiante y carrera real */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#002B49] uppercase tracking-wider mb-1">
                  <Building2 className="w-4 h-4 text-[#FFB81C]" />
                  <span>Simulador Oficial Duoc UC • {studentCareer}</span>
                </div>
                <h2 id="preflow-title" className="text-xl sm:text-2xl font-black text-slate-900">
                  {preFlowStep === 1
                    ? 'Paso 1: Modo de Simulación y Nivel de Dificultad'
                    : 'Paso 2: Paquete Objetivo de Ramos y Vista Previa Institucional'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {preFlowStep === 1
                    ? 'Elige cómo deseas experimentar la simulación y define la carga académica a coordinar.'
                    : 'Selecciona tu paquete de asignaturas sin colisiones. Verifica el membrete institucional con Nombre de Asignatura y Sección para cada ramo.'}
                </p>
              </div>

              <button
                type="button"
                onClick={onExit}
                className="self-start sm:self-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* PASO 1: MODO GUIADO VS REALISTA + 4 NIVELES DE DIFICULTAD */}
            {preFlowStep === 1 && (
              <div className="space-y-6">
                {/* 1.1 MODO DE SIMULACIÓN */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span>1.1 Selecciona el Modo de Simulación</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Opción A: Modo Guiado */}
                    <button
                      type="button"
                      onClick={() => setSelectedModeOption('guiado')}
                      className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-4 cursor-pointer ${
                        selectedModeOption === 'guiado'
                          ? 'border-[#002B49] bg-blue-50/70 ring-2 ring-[#002B49]/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#002B49] flex items-center justify-center font-bold">
                            <Sparkles className="w-5 h-5 text-[#002B49]" />
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                            Recomendado
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">
                          Modo Guiado
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Acompañamiento interactivo paso a paso, explicaciones detalladas de los botones SAP WebDynpro, advertencias de topes y consejos institucionales.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 text-xs font-semibold text-[#002B49] flex items-center justify-between">
                        <span>Ideal para primera inscripción</span>
                        <span className="text-sm font-bold">
                          {selectedModeOption === 'guiado' ? '● Seleccionado' : '○ Elegir'}
                        </span>
                      </div>
                    </button>

                    {/* Opción B: Modo Realista */}
                    <button
                      type="button"
                      onClick={() => setSelectedModeOption('realista')}
                      className={`p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-4 cursor-pointer ${
                        selectedModeOption === 'realista'
                          ? 'border-[#002B49] bg-blue-50/70 ring-2 ring-[#002B49]/30 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <Flame className="w-5 h-5 text-amber-600" />
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                            Desafío Oficial
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">
                          Modo Realista
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Experiencia idéntica al portal de inscripción oficial Duoc UC. Sin ayudas intermedias, cronómetro activo y presión por vacantes disponibles.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Compite contra tu récord</span>
                        <span className="text-sm font-bold">
                          {selectedModeOption === 'realista' ? '● Seleccionado' : '○ Elegir'}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 1.2 NIVEL DE DIFICULTAD ACADÉMICA (4 NIVELES) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#002B49]" />
                      <span>1.2 Selecciona el Nivel de Dificultad Académica</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">
                      Carga y complejidad variable
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {DIFFICULTY_LEVELS.map((diff) => {
                      const isSelected = selectedDifficulty === diff.id;
                      return (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => handleSelectDifficulty(diff.id)}
                          className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'border-[#002B49] bg-blue-50/80 ring-2 ring-[#002B49]/30 shadow-md'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  diff.id === 'facil'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : diff.id === 'intermedio'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : diff.id === 'dificil'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                                }`}
                              >
                                {diff.badge}
                              </span>
                              <span className="text-xs font-bold text-[#002B49]">
                                {isSelected ? '● Activo' : '○'}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900">
                              {diff.name}
                            </h4>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {diff.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/70 text-[10px] font-bold text-slate-500 flex items-center justify-between">
                            <span>Multiplicador de Puntaje:</span>
                            <span className="font-mono text-slate-800">x{diff.multiplier}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSimulationMode(selectedModeOption === 'guiado' ? 'asistido' : 'real');
                      setPreFlowStep(2);
                      announce('Configuración guardada. Ahora selecciona tu paquete objetivo de ramos.', 'polite');
                    }}
                    className="min-h-[46px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <span>Continuar al Paquete Objetivo</span>
                    <ArrowRight className="w-4 h-4 text-[#FFB81C]" />
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: SELECCIÓN DE PAQUETE OBJETIVO CON VISTA PREVIA INSTITUCIONAL (MEMBRETE VERDE/AMARILLO) */}
            {preFlowStep === 2 && (
              <div className="space-y-4">
                {/* Selector de Paquetes en Tabs Superiores */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Selecciona tu combinación horaria preferida:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {targetPackages.map((pkg) => {
                      const isSelected = selectedTargetPackage?.id === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedTargetPackage(pkg)}
                          className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'border-[#002B49] bg-blue-50/80 ring-2 ring-[#002B49]/30 shadow-md'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
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
                            <h4 className="text-xs font-black text-slate-900 leading-snug">{pkg.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{pkg.description}</p>
                          </div>
                          <div className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-center">
                            {pkg.targetCourses?.length || 0} Asignaturas
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vista Previa Visual Institucional del Paquete con Encabezados Verde/Amarillo y Cards de Horario */}
                {selectedTargetPackage && (
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <span>{selectedTargetPackage.name}</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {selectedTargetPackage.targetCourses?.length} ramos coordinados sin topes
                          </span>
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">{selectedTargetPackage.description}</p>
                      </div>
                      <div className="text-xs font-bold text-[#002B49] bg-white px-3 py-1 rounded-lg border border-slate-200">
                        Jornada: {selectedTargetPackage.jornada || carreraInfo.jornada || 'Diurno'}
                      </div>
                    </div>

                    {/* Lista Oficial del Paquete Objetivo Fiel a Imagen 2 */}
                    <div className="rounded-xl border-2 border-black overflow-hidden shadow-sm bg-white">
                      {/* Encabezado Verde Superior (Fiel a Imagen 2) */}
                      <div className="bg-[#1b5e20] text-white px-4 py-2 flex items-center justify-between font-mono font-black text-xs sm:text-sm border-b-2 border-emerald-950">
                        <span>{carreraInfo.codigo || '1446114-6-D'}</span>
                        <span>{selectedTargetPackage.name}</span>
                      </div>

                      {/* Sub-encabezado Amarillo (Fiel a Imagen 2) */}
                      <div className="bg-[#FFB81C] text-slate-950 px-4 py-1.5 grid grid-cols-12 font-black text-xs border-b border-black">
                        <div className="col-span-3 sm:col-span-2 border-r border-black pr-2">Sección:</div>
                        <div className="col-span-5 sm:col-span-6 px-2">Nom. Asignatura:</div>
                        <div className="col-span-4 sm:col-span-4 text-right">Horario y Sala</div>
                      </div>

                      {/* Lista de Asignaturas del Paquete (Fiel a Imagen 2) */}
                      <div className="divide-y divide-black text-xs font-mono max-h-72 overflow-y-auto">
                        {selectedTargetPackage.targetCourses.map((tc) => {
                          const isOptativo = tc.tipo === 'optativo' || tc.tipo === 'practica';
                          return (
                            <div
                              key={tc.sigla}
                              className={`px-4 py-2 grid grid-cols-12 items-center ${
                                isOptativo ? 'bg-[#bbdefb]' : 'bg-white hover:bg-slate-50'
                              }`}
                            >
                              <div className="col-span-3 sm:col-span-2 font-bold text-slate-900 border-r border-black pr-2 truncate">
                                {tc.sigla}
                              </div>
                              <div className="col-span-5 sm:col-span-6 px-2">
                                <span className="font-bold text-slate-900 uppercase block truncate" title={tc.nombre}>
                                  {tc.nombre}
                                </span>
                                <span className="text-[10px] text-slate-600 font-sans block truncate">
                                  Sección Oficial: {tc.seccion} • {tc.profesor}
                                </span>
                              </div>
                              <div className="col-span-4 sm:col-span-4 text-right font-sans text-[11px] text-slate-700 truncate">
                                <span className="font-semibold block">{tc.horarioTexto}</span>
                                <span className="text-[10px] text-slate-500 font-mono block">Sala: {tc.sala}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPreFlowStep(1)}
                    className="min-h-[42px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    ← Volver al Paso 1
                  </button>

                  <button
                    type="button"
                    onClick={handleStartSimulationFromPreFlow}
                    className="min-h-[46px] px-7 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-black text-sm rounded-xl flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <span>Iniciar toma de ramos</span>
                    <ArrowRight className="w-4 h-4 text-[#FFB81C]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
