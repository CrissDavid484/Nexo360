import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import {
  PORTAL_INSC_URL,
  TOMA_RAMOS_ESTUDIANTE,
  BLOQUES_HORARIOS_TOMA,
  ASIGNATURAS_DISPONIBLES,
  TOMA_RAMOS_TUTORIAL_VIDEO,
} from '../../data/tomaRamosData';
import {
  SapSelectBoxIcon,
  SapEstadoIcon,
  SapHorarioTabIcon,
  SapCursosTabIcon,
} from './SapSelectBoxIcon';
import { useAccessibility } from '../../context/AccessibilityContext';
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

  // Cursos inscritos en la sesión de práctica (inicia en 0 para permitir libre práctica)
  const [cursosInscritos, setCursosInscritos] = useState([]);

  // Cursos seleccionados en esta sesión (proyectados en el cuadro inferior y horario)
  const [cursosSeleccionados, setCursosSeleccionados] = useState([]);

  // Días de la grilla horaria
  const diasGrilla = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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
      seccion: seccion.seccion,
      creditos: asig.creditos,
      sala: seccion.sala,
      profesor: seccion.profesor,
      bloques: seccion.bloques.map((b) => ({
        ...b,
        texto: `${asig.sigla}-${seccion.seccion}`,
      })),
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
  const handleRepeatSimulation = (mode = 'asistido') => {
    setSimulationMode(mode);
    setIsGrabado(false);
    setIsHorarioUnlocked(false);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setCursosSeleccionados([]);
    setCursosInscritos([]); // Inicia siempre en 0 para practicar limpiamente
    setLeftPanelView('lista');
    setCurrentAsignatura(null);
    setTopeHorarioError('');
    setStep('bienvenida');

    // Asegurar limpieza de la base de datos para la nueva sesión
    api.saveTomaRamos([]).catch(() => {});

    announce(
      `Simulador reiniciado desde cero en ${mode === 'asistido' ? 'Modo Tutor Guiado' : 'Modo Prueba Real'}.`,
      'polite'
    );
  };

  // Reiniciar simulador al inicio empezando desde 0
  const handleReset = () => {
    handleRepeatSimulation(simulationMode);
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

  // Cursos filtrados para la tabla de asignaturas
  const asignaturasFiltradas = ASIGNATURAS_DISPONIBLES.filter((asig) => {
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

  return (
    <div
      role="region"
      aria-label="Simulador Oficial de Toma de Ramos Duoc UC (SAP WebDynpro SICOL)"
      className="bg-slate-200 min-h-screen text-slate-900 flex flex-col font-sans select-none"
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

        <div className="flex items-center gap-2 text-xs">
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
            <span>PERIODO {TOMA_RAMOS_ESTUDIANTE.periodo}</span>
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
              {TOMA_RAMOS_ESTUDIANTE.codigoCarrera} {TOMA_RAMOS_ESTUDIANTE.carrera}
            </strong>
            <span>{TOMA_RAMOS_ESTUDIANTE.sede}</span><br />
            <span>{TOMA_RAMOS_ESTUDIANTE.jornada}</span>
          </div>
          <div>
            <span>Créditos Totales Currículum: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosTotalesCurriculum}</strong></span><br />
            <span>Créditos Aprobados Optativos Interdisciplinarios: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativosInterdisciplinarios}</strong></span><br />
            <span>Créditos Aprobados Optativos: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativos}</strong></span>
          </div>
          <div>
            <span>Créditos Inscritos Aprobados: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosInscritosAprobados}</strong></span><br />
            <span>Créditos Aprobados Optativos Formación Cristiana: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativosFormacionCristiana}</strong></span>
          </div>
          <div>
            <span>Créditos Totales Optativos: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosTotalesOptativos}</strong></span><br />
            <span>Créditos Aprobados Optativos Profundización: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativosProfundizacion}</strong></span>
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
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 flex flex-col justify-start">
          {/* Contenedor oficial blanco con marco azul claro (Fiel a Imagen 3) */}
          <div className="bg-white border border-[#9CB8D0] shadow-2xs p-3 min-h-[460px] rounded-xs">
            {/* Recuadro con el botón "Haz Click Para Continuar" (Fiel a Imagen 3) */}
            <div className="border border-[#7FA5C5] bg-[#E8F1F8] p-1.5 inline-block rounded-xs shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setStep('inscripcion');
                  setLeftPanelView('lista');
                  setIsTimerRunning(true);
                  announce('Simulación iniciada. Cronómetro en marcha.', 'polite');
                }}
                className="bg-gradient-to-b from-[#EEEEEE] to-[#DDDDDD] hover:from-white hover:to-[#E5E5E5] border border-slate-500 rounded-xs px-3 py-1 text-xs font-bold text-slate-800 flex items-center gap-2.5 shadow-xs transition-transform active:scale-95"
              >
                <span>Haz Click Para Continuar</span>
                <span className="w-5 h-5 bg-[#3B8E32] rounded-xs flex items-center justify-center text-white font-black text-xs">
                  ▶
                </span>
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
        <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 space-y-4">
          <div className="bg-white border-2 border-slate-300 rounded p-6 shadow-md space-y-5">
            <header className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Revisión y Estados de Asignaturas
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Verifica el estado de cada una de tus asignaturas antes de confirmar la inscripción oficial.
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

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep('inscripcion')}
                className="px-4 py-2 border border-slate-400 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded"
              >
                ◀ Volver a Modificar
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowInfoModal(true);
                  announce('Abriendo confirmación de grabación.', 'polite');
                }}
                className="px-6 py-2.5 bg-gradient-to-b from-[#2E7D32] to-[#1B5E20] hover:from-[#388E3C] hover:to-[#2E7D32] text-white font-black text-xs sm:text-sm rounded shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
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
            {/* Membrete Institucional (Fiel a PDF oficial) */}
            <div className="flex items-start justify-between border-b border-black pb-3">
              <div>
                <div className="flex items-center gap-2 font-sans font-black text-3xl tracking-tight text-[#002B49]">
                  <span>Duoc</span>
                  <span className="text-[#002B49]">UC</span>
                  <span className="w-6 h-6 rounded-full border border-slate-600 inline-flex items-center justify-center text-[10px] font-serif text-slate-700 ml-1">
                    ✠
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 mt-2 space-y-0.5">
                  <p>SEDE: {TOMA_RAMOS_ESTUDIANTE.sede}</p>
                  <p>N°SEDE: {TOMA_RAMOS_ESTUDIANTE.numeroSede}</p>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-slate-900 space-y-0.5">
                <p className="font-bold">Dirección de Docencia</p>
                <p>Fecha emisión 17.01.2024</p>
              </div>
            </div>

            {/* Título Oficial Centrado (Fiel a PDF oficial) */}
            <div className="text-center font-mono">
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wider">
                BOLETIN DE CARGA ACADEMICA 1er Sem. &nbsp;&nbsp; 2024
              </h2>
            </div>

            {/* Datos del Alumno en mayúsculas (Fiel a PDF oficial) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-xs text-slate-900 font-mono py-1">
              <div>
                <p>Alumno: <strong>{TOMA_RAMOS_ESTUDIANTE.nombreBoletin}</strong></p>
                <p>Carrera: &nbsp;&nbsp;&nbsp;<strong>{TOMA_RAMOS_ESTUDIANTE.carrera}</strong></p>
                <p>Jornada: &nbsp;&nbsp;&nbsp;<strong>{TOMA_RAMOS_ESTUDIANTE.jornada}</strong></p>
              </div>
              <div className="sm:text-right">
                <p>Rut: &nbsp;&nbsp;&nbsp;&nbsp;<strong>{TOMA_RAMOS_ESTUDIANTE.rutFormateado}</strong></p>
                <p>N°<strong>{TOMA_RAMOS_ESTUDIANTE.codigoCarrera}</strong></p>
              </div>
            </div>

            {/* Título de Sección Horario de Clases */}
            <div className="text-center font-mono pt-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Horario de Clases
              </h3>
            </div>

            {/* Tabla Horario de Clases Fiel al PDF Institucional */}
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
                  {BLOQUES_HORARIOS_TOMA.slice(0, 7).map((bloque) => {
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

            {/* Detalle de las Clases de la Asignatura (Fiel a PDF oficial página 1) */}
            {cursosInscritos.length > 0 && (
              <div className="space-y-2 font-mono text-xs pt-2">
                <p className="font-semibold text-slate-900">
                  El Detalle de las clases de la asignatura &quot;{cursosInscritos[0].sigla}-{cursosInscritos[0].sigla}-{cursosInscritos[0].seccion}-{cursosInscritos[0].nombre}&quot; es:
                </p>
                <p className="font-semibold text-slate-900">
                  Docente: {cursosInscritos[0].profesor || 'Mauricio Gómez Arratia'}
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
                      <tr>
                        <td className="p-1.5 border-r border-black font-semibold text-center">Clase 01</td>
                        <td className="p-1.5 border-r border-black px-3">Miércoles 04 de Marzo de 2026</td>
                        <td className="p-1.5 border-r border-black text-center">08:31 a 09:50</td>
                        <td className="p-1.5 text-center">AL-503A</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border-r border-black font-semibold text-center">Clase 02</td>
                        <td className="p-1.5 border-r border-black px-3">Viernes 06 de Marzo de 2026</td>
                        <td className="p-1.5 border-r border-black text-center">08:31 a 10:40</td>
                        <td className="p-1.5 text-center">AL-LAB-IP4</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border-r border-black font-semibold text-center">Clase 03</td>
                        <td className="p-1.5 border-r border-black px-3">Miércoles 11 de Marzo de 2026</td>
                        <td className="p-1.5 border-r border-black text-center">08:31 a 09:50</td>
                        <td className="p-1.5 text-center">AL-503A</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border-r border-black font-semibold text-center">Clase 04</td>
                        <td className="p-1.5 border-r border-black px-3">Viernes 13 de Marzo de 2026</td>
                        <td className="p-1.5 border-r border-black text-center">08:31 a 10:40</td>
                        <td className="p-1.5 text-center">AL-LAB-IP4</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detalle Resumido de todas las Asignaturas Inscritas */}
            <div className="space-y-2 font-mono text-xs pt-2">
              <h4 className="font-black uppercase text-center">Detalle de Asignaturas Inscritas</h4>
              <div className="border border-black overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-black font-bold bg-white text-[11px]">
                    <tr>
                      <th scope="col" className="p-1.5 border-r border-black w-20">Sigla</th>
                      <th scope="col" className="p-1.5 border-r border-black">Nombre Asignatura</th>
                      <th scope="col" className="p-1.5 border-r border-black text-center w-16">Secc.</th>
                      <th scope="col" className="p-1.5 border-r border-black">Docente</th>
                      <th scope="col" className="p-1.5 border-r border-black text-center w-28">Sala</th>
                      <th scope="col" className="p-1.5 text-center w-14">Créd.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black text-[11px]">
                    {cursosInscritos.map((c) => (
                      <tr key={c.sigla}>
                        <td className="p-1.5 font-bold border-r border-black">{c.sigla}</td>
                        <td className="p-1.5 border-r border-black">{c.nombre}</td>
                        <td className="p-1.5 font-bold border-r border-black text-center">{c.seccion}</td>
                        <td className="p-1.5 border-r border-black">{c.profesor}</td>
                        <td className="p-1.5 border-r border-black text-center">{c.sala}</td>
                        <td className="p-1.5 text-center font-bold">{c.creditos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Opción 1: Repetir Modo Asistido */}
              <button
                type="button"
                onClick={() => handleRepeatSimulation('asistido')}
                className="p-4 rounded-xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-amber-100/60 hover:from-amber-100 hover:to-amber-200 text-left transition-all active:scale-[0.99] shadow-xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🎓</span>
                  <span className="text-[10px] font-black uppercase text-amber-950 bg-amber-200/90 px-2 py-0.5 rounded">
                    Recomendado • Desde 0
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-900 group-hover:text-amber-950">
                  Volver a Repetir en Modo Asistido (Desde 0)
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Borra todos los ramos anteriores e inicia un nuevo entrenamiento con tutor paso a paso y consejos visuales.
                </p>
              </button>

              {/* Opción 2: Repetir Modo Prueba Real */}
              <button
                type="button"
                onClick={() => handleRepeatSimulation('real')}
                className="p-4 rounded-xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-emerald-100/60 hover:from-emerald-100 hover:to-emerald-200 text-left transition-all active:scale-[0.99] shadow-xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">⚡</span>
                  <span className="text-[10px] font-black uppercase text-emerald-950 bg-emerald-200/90 px-2 py-0.5 rounded">
                    Entorno Real • Desde 0
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-900 group-hover:text-emerald-950">
                  Volver a Repetir en Modo Prueba Real (Desde 0)
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Reinicia en blanco con cronómetro y sin ayudas para medir tu agilidad en la plataforma oficial Duoc UC.
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
  );
};
