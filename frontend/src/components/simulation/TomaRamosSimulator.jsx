import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Calendar,
  LogOut,
  Package,
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  TOMA_RAMOS_ESTUDIANTE,
  BLOQUES_HORARIOS_TOMA,
  ASIGNATURAS_DISPONIBLES,
  TOMA_RAMOS_TUTORIAL_VIDEO,
} from '../../data/tomaRamosData';
import { useAccessibility } from '../../context/AccessibilityContext';
import { api } from '../../services/api';

export const TomaRamosSimulator = ({ onExit }) => {
  const { announce } = useAccessibility();

  // Estados del flujo: 'bienvenida' | 'seleccion' | 'secciones' | 'revision' | 'boletin'
  const [step, setStep] = useState('bienvenida');
  const [selectedAsignatura, setSelectedAsignatura] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(true);
  const [topeHorarioError, setTopeHorarioError] = useState('');
  const videoModalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Focus Trap y tecla Escape para el modal de video tutorial (WCAG 2.1.2 / 2.4.3)
  useEffect(() => {
    if (!showVideoModal) return;

    previousFocusRef.current = document.activeElement;
    const modalEl = videoModalRef.current;

    const focusTimer = setTimeout(() => {
      if (!modalEl) return;
      const closeBtn = modalEl.querySelector('button');
      if (closeBtn) closeBtn.focus();
    }, 30);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowVideoModal(false);
        return;
      }

      if (e.key === 'Tab' && modalEl) {
        const focusable = Array.from(
          modalEl.querySelectorAll(
            'button:not([disabled]), a[href], iframe, [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl || !modalEl.contains(document.activeElement)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else if (document.activeElement === lastEl || !modalEl.contains(document.activeElement)) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [showVideoModal]);

  // Asignaturas inscritas en la simulación (respaldadas en MongoDB)
  const [cursosInscritos, setCursosInscritos] = useState([
    {
      sigla: 'PTY4614',
      siglaEq: '',
      nombre: 'PROYECTO CAPSTONE',
      seccion: '001D',
      creditos: 10,
      sala: 'AL-503A / AL-LAB-IP4',
      profesor: 'Mauricio Gómez Arratia',
      bloques: [
        { dia: 'Miércoles', bloqueId: 'b1', texto: 'PTY4614-001D', sala: 'AL-503A' },
        { dia: 'Miércoles', bloqueId: 'b2', texto: 'PTY4614-001D', sala: 'AL-503A' },
        { dia: 'Viernes', bloqueId: 'b1', texto: 'PTY4614-001D', sala: 'AL-LAB-IP4' },
        { dia: 'Viernes', bloqueId: 'b2', texto: 'PTY4614-001D', sala: 'AL-LAB-IP4' },
        { dia: 'Viernes', bloqueId: 'b3', texto: 'PTY4614-001D', sala: 'AL-LAB-IP4' },
      ],
    },
  ]);

  // Sincronización con contenedor MongoDB al cargar el simulador
  useEffect(() => {
    let isMounted = true;
    api
      .getTomaRamos()
      .then((res) => {
        if (isMounted && res?.success && Array.isArray(res.enrolledCourses) && res.enrolledCourses.length > 0) {
          setCursosInscritos(res.enrolledCourses);
        }
      })
      .catch(() => {
        // Fallback silencioso a datos locales si el servidor está iniciando
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Asignaturas seleccionadas en la sesión actual pero aún no grabadas
  const [cursosSeleccionados, setCursosSeleccionados] = useState([]);
  const [mensajeGrabado, setMensajeGrabado] = useState(false);

  // Total de créditos seleccionados e inscritos
  const totalCreditosSeleccionados = cursosSeleccionados.reduce((acc, c) => acc + c.creditos, 0);
  const totalCreditosInscritos = cursosInscritos.reduce((acc, c) => acc + c.creditos, 0);

  // Días de la grilla
  const diasGrilla = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Función para verificar si una sección tiene tope de horario con ramos inscritos o seleccionados
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

  // Función para abrir la selección de secciones de una asignatura
  const handleOpenSecciones = (asig) => {
    setTopeHorarioError('');
    setSelectedAsignatura(asig);
    setStep('secciones');
    announce(`Abriendo secciones disponibles para ${asig.nombre}`, 'polite');
  };

  // Función para seleccionar una sección
  const handleSelectSeccion = (asig, seccion) => {
    setTopeHorarioError('');

    if (seccion.sinCupos) {
      announce('A esta asignatura ya no le quedan vacantes disponibles.', 'assertive');
      return;
    }

    const yaExiste =
      cursosSeleccionados.some((c) => c.sigla === asig.sigla) ||
      cursosInscritos.some((c) => c.sigla === asig.sigla);
    if (yaExiste) {
      announce(`La asignatura ${asig.nombre} ya se encuentra en tu lista de selección o inscripción.`, 'polite');
      setStep('seleccion');
      return;
    }

    const colision = findScheduleCollision(seccion);
    if (colision) {
      const msg = `Tope de horario detectado: la sección ${seccion.seccion} choca el día ${colision.dia} (${colision.hora}) con ${colision.cursoConflicto.nombre} (${colision.cursoConflicto.sigla}-${colision.cursoConflicto.seccion}).`;
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
    setStep('seleccion');
    announce(`Asignatura ${asig.nombre} sección ${seccion.seccion} añadida a cursos seleccionados. Se ha proyectado en tu cuadrícula de horario.`, 'polite');
  };

  // Función para eliminar un curso seleccionado
  const handleRemoveSeleccionado = (sigla) => {
    setCursosSeleccionados(cursosSeleccionados.filter((c) => c.sigla !== sigla));
    announce('Curso removido de la selección', 'polite');
  };

  // Función para grabar la toma de ramos (y respaldar en MongoDB)
  const handleGrabar = () => {
    if (cursosSeleccionados.length === 0) {
      announce('No tienes nuevas asignaturas seleccionadas para grabar.', 'polite');
      return;
    }

    const nuevosInscritos = [...cursosInscritos, ...cursosSeleccionados];
    setCursosInscritos(nuevosInscritos);
    setCursosSeleccionados([]);
    setMensajeGrabado(true);
    announce('¡Toma de ramos grabada exitosamente en la base de datos! Tu horario ha sido actualizado.', 'polite');
    api.saveTomaRamos(nuevosInscritos).catch(() => {});
    setTimeout(() => setMensajeGrabado(false), 5000);
  };

  // Reiniciar simulador
  const handleReset = () => {
    setCursosSeleccionados([]);
    setStep('bienvenida');
    announce('Simulador reiniciado al estado inicial.', 'polite');
  };

  // Determinar contenido de una celda del horario
  const getCeldaContenido = (dia, bloqueId) => {
    for (const curso of cursosInscritos) {
      const match = curso.bloques?.find((b) => b.dia === dia && b.bloqueId === bloqueId);
      if (match) {
        return { texto: match.texto, tipo: 'inscrito', sala: match.salaCorta || match.sala };
      }
    }

    for (const curso of cursosSeleccionados) {
      const match = curso.bloques?.find((b) => b.dia === dia && b.bloqueId === bloqueId);
      if (match) {
        return { texto: match.texto, tipo: 'seleccionado', sala: match.salaCorta || match.sala };
      }
    }

    return null;
  };

  return (
    // A11y: Contenedor semántico principal de la simulación
    <div
      role="region"
      aria-label="Simulador interactivo de Toma de Ramos Duoc UC"
      className="bg-slate-100 min-h-screen text-slate-900 flex flex-col font-sans"
    >
      {/* 1. Encabezado Oficial Fiel a Duoc UC (Azul cielo superior) */}
      <header className="bg-gradient-to-b from-[#bcd4e6] to-[#a2c2d8] border-b-2 border-slate-400 px-4 py-2 text-xs sm:text-sm text-slate-900 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
          {/* Identidad del Estudiante */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-black">
            <span className="text-sm tracking-wide uppercase font-serif text-[#002B49]">
              {TOMA_RAMOS_ESTUDIANTE.nombre}
            </span>
            <span>RUT {TOMA_RAMOS_ESTUDIANTE.rut}</span>
            <span>PERIODO {TOMA_RAMOS_ESTUDIANTE.periodo}</span>
          </div>

          {/* Botones de Cabecera: Video Tutorial & Cerrar Sesión */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => {
                setShowVideoModal(true);
                announce('Abriendo video tutorial explicativo de Toma de Ramos', 'polite');
              }}
              className="min-h-[44px] px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 border-2 border-amber-500 rounded text-xs font-black flex items-center gap-1.5 text-amber-950 shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#002B49]"
              aria-label="Ver video tutorial de toma de ramos"
            >
              <Play className="w-3.5 h-3.5 text-amber-800" aria-hidden="true" />
              <span>Video Tutorial</span>
            </button>

            {onExit ? (
              <button
                type="button"
                onClick={onExit}
                className="min-h-[44px] px-4 py-1.5 bg-slate-200 hover:bg-slate-300 border-2 border-slate-500 rounded text-xs font-black flex items-center gap-1.5 text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                aria-label="Salir del simulador y regresar al portal"
              >
                <span>Cerrar Sesión</span>
                <span className="text-red-700 font-black">!</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[44px] px-4 py-1.5 bg-slate-200 hover:bg-slate-300 border-2 border-slate-500 rounded text-xs font-black flex items-center gap-1.5 text-slate-900 shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                aria-label="Reiniciar simulador"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reiniciar</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-barra de Metadatos Curriculares (Idéntica a Capturas 1 y 2) */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-400/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 text-[11px] leading-tight text-slate-800 font-semibold">
          <div>
            <strong className="text-slate-950 font-black block">
              {TOMA_RAMOS_ESTUDIANTE.codigoCarrera} {TOMA_RAMOS_ESTUDIANTE.carrera}
            </strong>
            <span>{TOMA_RAMOS_ESTUDIANTE.sede} • {TOMA_RAMOS_ESTUDIANTE.jornada}</span>
          </div>
          <div>
            <span>Créditos Totales Curriculum: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosTotalesCurriculum}</strong></span><br />
            <span>Créditos Inscritos Aprobados: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosInscritosAprobados}</strong></span>
          </div>
          <div>
            <span>Créditos Totales Optativos: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosTotalesOptativos}</strong></span><br />
            <span>Créditos Aprobados Optativos: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativos}</strong></span>
          </div>
          <div>
            <span>Créditos Interdisciplinarios: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativosInterdisciplinarios}</strong></span><br />
            <span>Créditos Formación Cristiana: <strong>{TOMA_RAMOS_ESTUDIANTE.creditosAprobadosOptativosFormacionCristiana}</strong></span>
          </div>
        </div>
      </header>

      {/* Banner de Accesibilidad y Guía de Autonomía */}
      <aside aria-label="Guía de uso accesible del simulador" className="bg-[#002B49] text-white px-4 py-2 text-xs border-b-2 border-[#FFB81C]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-[#FFB81C] text-slate-950 font-black text-[10px]">SIMULADOR</span>
            <span className="font-medium text-slate-100">
              Entrenamiento de Autonomía Digital: Realiza tu toma de ramos paso a paso sin riesgo.
            </span>
          </div>
          <span className="text-[#FFB81C] font-bold text-[11px]">
            100% Accesible para Lectores de Pantalla y Navegación por Teclado
          </span>
        </div>
      </aside>

      {/* Alerta dinámica de confirmación al grabar */}
      {mensajeGrabado && (
        <div
          role="status"
          aria-live="polite"
          className="bg-emerald-100 border-b-2 border-emerald-500 text-emerald-950 px-4 py-3 text-xs sm:text-sm font-black text-center flex items-center justify-center gap-2 shadow-xs"
        >
          <CheckCircle className="w-5 h-5 text-emerald-700" aria-hidden="true" />
          <span>¡Inscripción de asignaturas guardada exitosamente! Ya puedes hacer clic en &quot;Ver Horario&quot;.</span>
        </div>
      )}

      {/* MODAL CON EL VIDEO TUTORIAL (DISPONIBLE EN CUALQUIER MOMENTO) */}
      {showVideoModal && (
        <div
          ref={videoModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        >
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden my-auto">
            <header className="bg-slate-900 text-white p-5 border-b-2 border-[#FFB81C] flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-[#FFB81C] block">
                  Material Audiovisual Oficial
                </span>
                <h3 id="video-modal-title" className="text-base sm:text-lg font-black text-white mt-0.5">
                  {TOMA_RAMOS_TUTORIAL_VIDEO.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="min-h-[44px] min-w-[44px] p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                aria-label="Cerrar video tutorial"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </header>

            <div className="p-4 sm:p-6 bg-slate-950">
              {/* Reproductor de YouTube responsivo accesible */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-black">
                <iframe
                  src={TOMA_RAMOS_TUTORIAL_VIDEO.embedUrl}
                  title="Video tutorial oficial: Cómo inscribir tus ramos en Duoc UC"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <a
                href={TOMA_RAMOS_TUTORIAL_VIDEO.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                aria-label="Abrir video directamente en YouTube (abre en nueva pestaña)"
              >
                <span>Ver en YouTube</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
              </a>

              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="min-h-[44px] px-6 py-2 bg-[#002B49] hover:bg-[#001f35] text-white font-black rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              >
                Cerrar y Continuar en el Simulador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL POR ETAPAS (div en vez de main anidado para cumplir WCAG 1.3.1) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* ======================================================== */}
        {/* ETAPA 1: PANTALLA DE BIENVENIDA (Captura 1 + Video Tutorial) */}
        {/* ======================================================== */}
        {step === 'bienvenida' && (
          <div className="max-w-4xl mx-auto space-y-6 py-4 sm:py-8">
            {/* Tarjeta del Video Tutorial Embebido (Explicación del Proceso) */}
            <article className="bg-white rounded-3xl border-2 border-slate-300 shadow-md overflow-hidden">
              <header className="bg-slate-900 text-white p-5 border-b-2 border-[#FFB81C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase text-[#FFB81C] block">
                    Inducción Audiovisual Oficial
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                    {TOMA_RAMOS_TUTORIAL_VIDEO.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVideoExpanded(!isVideoExpanded)}
                    aria-expanded={isVideoExpanded}
                    aria-controls="welcome-video-player"
                    className="min-h-[44px] px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-[#FFB81C] rounded-xl text-xs font-black inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  >
                    <span>{isVideoExpanded ? 'Ocultar video' : 'Mostrar video'}</span>
                    {isVideoExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <a
                    href={TOMA_RAMOS_TUTORIAL_VIDEO.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-3.5 py-1.5 bg-[#FFB81C] text-slate-950 hover:bg-amber-300 rounded-xl text-xs font-black inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                    aria-label="Abrir este video en YouTube (abre en nueva pestaña)"
                  >
                    <span>YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              </header>

              {/* Reproductor de Video Desplegable */}
              {isVideoExpanded && (
                <div id="welcome-video-player" className="p-4 sm:p-6 bg-slate-950">
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-black">
                    <iframe
                      src={TOMA_RAMOS_TUTORIAL_VIDEO.embedUrl}
                      title="Video tutorial oficial de Toma de Ramos Duoc UC"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                </div>
              )}

              {/* Pasos clave explicados en el video */}
              <div className="p-6 bg-slate-50 border-t border-slate-300">
                <h3 className="text-sm font-black text-slate-900 mb-3">
                  Resumen de Pasos del Tutorial para tu Inscripción:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {TOMA_RAMOS_TUTORIAL_VIDEO.pasosClave.map((p, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200">
                      <strong className="text-[#002B49] block font-black">{p.paso}</strong>
                      <p className="text-slate-700 mt-1 leading-relaxed font-medium">{p.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* Caja de Bienvenida e Inicio Práctico (Fiel a Captura 1) */}
            <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden text-center p-8 sm:p-12 space-y-6">
              <div>
                <span className="text-xs font-black uppercase text-amber-800 tracking-wider block">
                  Simulador de Práctica • Periodo {TOMA_RAMOS_ESTUDIANTE.periodo}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Portal de Inscripción de Asignaturas
                </h1>
                <p className="text-xs sm:text-sm text-slate-700 font-medium max-w-xl mx-auto mt-2 leading-relaxed">
                  A continuación ingresarás a la interfaz interactiva. Podrás elegir asignaturas, revisar las secciones con cupos disponibles y generar tu horario tentativo.
                </p>
              </div>

              {/* Botón Oficial idéntico a Captura 1 */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('seleccion');
                    announce('Iniciando toma de ramos. Pantalla de selección cargada.', 'polite');
                  }}
                  className="min-h-[52px] px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm sm:text-base rounded-xl shadow-lg border-2 border-emerald-900 inline-flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 hover:scale-[1.02]"
                >
                  <span>Haz Click Para Continuar</span>
                  <ArrowRight className="w-5 h-5 text-[#FFB81C]" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 2: GRILLA DE SELECCIÓN DE ASIGNATURAS (Captura 2) */}
        {/* ======================================================== */}
        {step === 'seleccion' && (
          <div className="space-y-4">
            {/* Barra de Herramientas Oficial (Idéntica a Captura 2) */}
            <div className="bg-[#bcd4e6] border-2 border-slate-400 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep('bienvenida')}
                  className="min-h-[44px] px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 border border-slate-500 rounded text-xs font-black flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Anterior</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('revision');
                    announce('Revisión de horario tentativo', 'polite');
                  }}
                  className="min-h-[44px] px-4 py-1.5 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 border border-amber-600 rounded text-xs font-black flex items-center gap-1.5 shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#002B49]"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={handleGrabar}
                  disabled={cursosSeleccionados.length === 0}
                  className={`min-h-[44px] px-4 py-1.5 rounded text-xs font-black flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
                    cursosSeleccionados.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-800 shadow-sm'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-400'
                  }`}
                  aria-label="Grabar y confirmar asignaturas seleccionadas"
                >
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Grabar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('boletin');
                    announce('Abriendo Boletín Oficial de Carga Académica en PDF', 'polite');
                  }}
                  className="min-h-[44px] px-4 py-1.5 bg-[#002B49] hover:bg-[#001f35] text-white border border-slate-700 rounded text-xs font-black flex items-center gap-1.5 shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
                  <span>Ver Horario</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="min-h-[44px] px-3.5 py-1.5 bg-white hover:bg-slate-100 text-[#002B49] border border-slate-400 rounded text-xs font-bold flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  aria-label="Ver video tutorial con ayuda"
                >
                  <Play className="w-3 h-3 text-amber-700" aria-hidden="true" />
                  <span>Ayuda en Video</span>
                </button>
              </div>

              {/* Contadores de Créditos en la barra superior */}
              <div className="flex items-center gap-4 text-xs font-black text-slate-900 bg-white/70 px-3 py-1.5 rounded-lg border border-slate-400">
                <span>Total Créditos Inscritos: <strong>{totalCreditosInscritos}</strong></span>
                <span className="border-l border-slate-400 pl-4">
                  Total Créditos seleccionados: <strong className="text-emerald-800 text-sm">{totalCreditosSeleccionados}</strong>
                </span>
              </div>
            </div>

            {/* Grilla Principal en 2 Paneles (Izquierda: Asignaturas / Derecha: Horario y Cursos) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* PANEL IZQUIERDO: TABLA DE ASIGNATURAS DISPONIBLES (col-span-6) */}
              <div className="lg:col-span-6 bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
                <div>
                  <header className="bg-slate-200 border-b border-slate-300 px-4 py-2.5 flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase text-slate-900">
                      Asignaturas Disponibles para Inscripción
                    </h2>
                    <span className="text-[11px] text-slate-600 font-bold">
                      Haz clic en 🖐️📦 para ver secciones
                    </span>
                  </header>

                  {/* Tabla de asignaturas accesibles */}
                  <div className="overflow-x-auto max-h-[480px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-black sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="p-2 text-center w-12" title="Seleccionar sección">
                            Selec.
                          </th>
                          <th scope="col" className="p-2 w-12 text-center">Estado</th>
                          <th scope="col" className="p-2 w-16">Sigla</th>
                          <th scope="col" className="p-2">Nombre de la Asignatura</th>
                          <th scope="col" className="p-2 w-12 text-center">Créd.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {ASIGNATURAS_DISPONIBLES.map((asig) => {
                          const estaInscrito = cursosInscritos.some((c) => c.sigla === asig.sigla);
                          const estaSeleccionado = cursosSeleccionados.some((c) => c.sigla === asig.sigla);

                          return (
                            <tr
                              key={asig.sigla}
                              className={`hover:bg-amber-50/60 transition-colors ${
                                estaInscrito
                                  ? 'bg-blue-50/70 font-semibold'
                                  : estaSeleccionado
                                  ? 'bg-emerald-50/70 font-semibold'
                                  : ''
                              }`}
                            >
                              {/* Botón de la manito con cubito 🖐️📦 */}
                              <td className="p-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSecciones(asig)}
                                  disabled={estaInscrito}
                                  className={`min-h-[44px] min-w-[44px] p-2 rounded-lg text-lg flex items-center justify-center mx-auto transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
                                    estaInscrito
                                      ? 'opacity-40 cursor-not-allowed bg-slate-200'
                                      : 'bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-900 shadow-2xs hover:scale-105'
                                  }`}
                                  aria-label={`Ver secciones disponibles y horarios para ${asig.nombre}`}
                                  title={`Ver secciones disponibles para ${asig.nombre}`}
                                >
                                  <span aria-hidden="true">🖐️📦</span>
                                </button>
                              </td>

                              {/* Estado */}
                              <td className="p-2 text-center">
                                {estaInscrito ? (
                                  <span className="inline-block w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black leading-4" title="Asignatura inscrita">
                                    ✓
                                  </span>
                                ) : estaSeleccionado ? (
                                  <span className="inline-block w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black leading-4" title="Seleccionada pendiente de grabar">
                                    +
                                  </span>
                                ) : (
                                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-600" title="Disponible para inscribir" />
                                )}
                              </td>

                              <td className="p-2 font-mono font-black text-slate-800">
                                {asig.sigla}
                              </td>

                              <td className="p-2 text-slate-900 font-bold">
                                {asig.nombre}
                              </td>

                              <td className="p-2 text-center font-black text-slate-700">
                                {asig.creditos}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Leyenda Inferior Oficial (Optativo verde, Práctica amarillo, etc.) */}
                <div className="p-2.5 bg-slate-100 border-t border-slate-300 text-[11px] flex flex-wrap items-center gap-4 text-slate-700 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-emerald-200 border border-emerald-600 rounded-xs" aria-hidden="true" />
                    <span>Optativo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-amber-200 border border-amber-600 rounded-xs" aria-hidden="true" />
                    <span>Práctica</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 bg-white border border-slate-400 rounded-xs" aria-hidden="true" />
                    <span>Certificable</span>
                  </div>
                </div>
              </div>

              {/* PANEL DERECHO: CUADRÍCULA DE HORARIO Y CURSOS SELECCIONADOS (col-span-6) */}
              <div className="lg:col-span-6 space-y-4">
                {/* Cuadrícula de Horario Semanal */}
                <div className="bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-xs">
                  <header className="bg-slate-200 border-b border-slate-300 px-4 py-2 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-700" aria-hidden="true" />
                      <span>Horario</span>
                    </h3>
                    <span className="text-[11px] text-slate-600 font-semibold">
                      Proyección semanal en vivo
                    </span>
                  </header>

                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-center text-[10px] sm:text-xs border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-black sticky top-0 z-10">
                        <tr>
                          <th scope="col" className="p-1.5 w-20 text-left">Hora</th>
                          {diasGrilla.map((dia) => (
                            <th key={dia} scope="col" className="p-1.5">{dia}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {BLOQUES_HORARIOS_TOMA.map((bloque) => (
                          <tr key={bloque.id} className="hover:bg-slate-50">
                            <td className="p-1.5 text-left font-mono font-bold text-slate-600 whitespace-nowrap bg-slate-50/70 border-r border-slate-200">
                              {bloque.hora}
                            </td>
                            {diasGrilla.map((dia) => {
                              const match = getCeldaContenido(dia, bloque.id);

                              return (
                                <td
                                  key={dia}
                                  className={`p-1 border border-slate-200 ${
                                    match?.tipo === 'inscrito'
                                      ? 'bg-blue-100 text-blue-950 font-black'
                                      : match?.tipo === 'seleccionado'
                                      ? 'bg-emerald-100 text-emerald-950 font-black border-2 border-emerald-500'
                                      : ''
                                  }`}
                                >
                                  {match ? (
                                    <div className="leading-tight">
                                      <span className="block">{match.texto}</span>
                                      <span className="text-[9px] text-slate-700 block">{match.sala}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-[10px]">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabla de Cursos Seleccionados (Pendientes de grabar) */}
                <div className="bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-xs">
                  <header className="bg-slate-200 border-b border-slate-300 px-4 py-2 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-slate-900">
                      Cursos seleccionados ({cursosSeleccionados.length})
                    </h3>
                    <span className="text-[11px] text-emerald-800 font-bold">
                      {totalCreditosSeleccionados} créditos por confirmar
                    </span>
                  </header>

                  <div className="overflow-x-auto min-h-[120px] max-h-[200px]">
                    {cursosSeleccionados.length > 0 ? (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                          <tr>
                            <th scope="col" className="p-2">Sigla</th>
                            <th scope="col" className="p-2">Nombre de la Asignatura</th>
                            <th scope="col" className="p-2">Sección</th>
                            <th scope="col" className="p-2 text-center">Créd.</th>
                            <th scope="col" className="p-2 text-center">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {cursosSeleccionados.map((curso) => (
                            <tr key={curso.sigla} className="bg-emerald-50/50">
                              <td className="p-2 font-mono font-black text-slate-900">{curso.sigla}</td>
                              <td className="p-2 font-bold text-slate-900">{curso.nombre}</td>
                              <td className="p-2 font-black text-emerald-900">{curso.seccion}</td>
                              <td className="p-2 text-center font-bold">{curso.creditos}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSeleccionado(curso.sigla)}
                                  className="min-h-[44px] min-w-[44px] px-2 py-1 text-red-700 hover:text-red-900 font-black text-xs underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500 rounded"
                                  aria-label={`Quitar ${curso.nombre} de la selección`}
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-800 font-medium">
                        <p>No tienes cursos seleccionados en este momento.</p>
                        <p className="mt-1 text-slate-700 font-semibold">
                          Haz clic en el icono 🖐️📦 de cualquier asignatura a la izquierda para inscribir secciones.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 3: MODAL / VISTA DE SELECCIÓN DE SECCIÓN (Captura 4) */}
        {/* ======================================================== */}
        {step === 'secciones' && selectedAsignatura && (
          <div className="max-w-4xl mx-auto bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden space-y-4">
            {/* Barra superior con botón volver */}
            <header className="bg-[#bcd4e6] border-b-2 border-slate-400 p-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('seleccion')}
                className="min-h-[44px] px-4 py-1.5 bg-slate-200 hover:bg-slate-300 border border-slate-500 rounded text-xs font-black flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Volver a Asignaturas</span>
              </button>

              <span className="text-xs font-black text-slate-900">
                Créditos: {selectedAsignatura.creditos}
              </span>
            </header>

            <div className="p-6 space-y-6">
              {/* Título Oficial idéntico a Captura 4 */}
              <div className="border-b border-slate-200 pb-4">
                <span className="text-xs font-black text-blue-900 uppercase block tracking-wider">
                  * Seleccione una Sección para su Asignatura
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {selectedAsignatura.sigla} - {selectedAsignatura.nombre}
                </h2>
              </div>

              {topeHorarioError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-4 bg-red-50 border-2 border-red-600 rounded-xl text-xs sm:text-sm text-red-950 font-black flex items-start gap-2.5"
                >
                  <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{topeHorarioError}</span>
                </div>
              )}

              {/* Tabla de Secciones Disponibles */}
              <div className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-black">
                    <tr>
                      <th scope="col" className="p-3">Sección</th>
                      <th scope="col" className="p-3">Cupos</th>
                      <th scope="col" className="p-3">Sala</th>
                      <th scope="col" className="p-3">Profesor</th>
                      <th scope="col" className="p-3">Horario</th>
                      <th scope="col" className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedAsignatura.secciones?.map((sec) => (
                      <tr key={sec.seccion} className="hover:bg-slate-50">
                        <td className="p-3 font-black text-slate-900">{sec.seccion}</td>
                        <td className="p-3">
                          {sec.sinCupos ? (
                            <span className="text-red-700 font-black">0 / {sec.cuposTotales} (Sin vacantes)</span>
                          ) : (
                            <span className="text-emerald-800 font-bold">{sec.cuposDisponibles} de {sec.cuposTotales}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-700 font-bold">{sec.sala}</td>
                        <td className="p-3 text-slate-900 font-semibold">{sec.profesor}</td>
                        <td className="p-3 text-slate-800 font-mono text-xs">{sec.horarioTexto}</td>
                        <td className="p-3 text-center">
                          {sec.sinCupos ? (
                            <span className="text-xs text-red-700 font-black block">
                              No disponible
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectSeccion(selectedAsignatura, sec)}
                              className="min-h-[44px] px-4 py-2 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#002B49]"
                              aria-label={`Inscribir sección ${sec.seccion} de ${selectedAsignatura.nombre}`}
                            >
                              Inscribir Sección
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mensaje cuando una asignatura no tiene cupos (como en Captura 4) */}
              {selectedAsignatura.secciones?.some((s) => s.sinCupos) && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Información institucional:</strong> Si una sección indica &quot;A esta asignatura ya no le quedan vacantes disponibles&quot;, consulta con tu coordinación docente para solicitudes de apertura de cupo.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 4: REVISIÓN DE HORARIO TENTATIVO */}
        {/* ======================================================== */}
        {step === 'revision' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border-2 border-slate-300 shadow-xl p-6 sm:p-8 space-y-6">
            <header className="border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-black text-slate-900">
                Revisión de Horario Tentativo
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1">
                Verifica tus cursos seleccionados antes de confirmar y grabar.
              </p>
            </header>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl">
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wide block">
                  ✓ Validación de Horario Exitosa
                </span>
                <p className="text-xs sm:text-sm text-slate-800 font-medium mt-1">
                  No se detectaron topes de horario en las asignaturas seleccionadas para la Sede Alameda.
                </p>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-black">
                    <tr>
                      <th scope="col" className="p-3">Asignatura</th>
                      <th scope="col" className="p-3">Sección</th>
                      <th scope="col" className="p-3">Docente</th>
                      <th scope="col" className="p-3 text-center">Créditos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[...cursosInscritos, ...cursosSeleccionados].map((c) => (
                      <tr key={c.sigla}>
                        <td className="p-3 font-black text-slate-900">
                          {c.nombre} <span className="font-mono text-slate-600 font-normal">({c.sigla})</span>
                        </td>
                        <td className="p-3 font-bold text-slate-800">{c.seccion}</td>
                        <td className="p-3 text-slate-700">{c.profesor}</td>
                        <td className="p-3 text-center font-black">{c.creditos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep('seleccion')}
                  className="min-h-[48px] px-6 py-2.5 border-2 border-slate-400 text-slate-800 font-bold text-xs sm:text-sm rounded-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                >
                  ◀ Volver a Modificar
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleGrabar();
                    setStep('boletin');
                  }}
                  className="min-h-[48px] px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  <span>Confirmar y Grabar Horario</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ETAPA 5: BOLETÍN DE CARGA ACADÉMICA EN PDF (Captura 3) */}
        {/* ======================================================== */}
        {step === 'boletin' && (
          <div className="space-y-4">
            {/* Barra superior del visor PDF (Idéntica a Captura 3) */}
            <div className="bg-slate-800 text-white p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#FFB81C]" aria-hidden="true" />
                <span className="font-mono font-bold">Horario4793107495204184729.pdf</span>
                <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px]">1 / 1</span>
                <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px]">100%</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="min-h-[44px] px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  aria-label="Imprimir o guardar como PDF"
                >
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('seleccion')}
                  className="min-h-[44px] px-4 py-2 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 font-black rounded-lg flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                >
                  <span>Volver al Simulador</span>
                </button>
              </div>
            </div>

            {/* Hoja Oficial del Boletín de Carga Académica (Idéntica a Captura 3) */}
            <div className="bg-white max-w-4xl mx-auto p-8 sm:p-12 rounded-2xl border-2 border-slate-300 shadow-2xl space-y-8 font-serif">
              {/* Encabezado Institucional Oficial */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2 font-sans font-black text-3xl tracking-tight text-[#002B49]">
                    <span>Duoc</span><span className="text-[#FFB81C]">UC</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-2">
                    <p>SEDE: {TOMA_RAMOS_ESTUDIANTE.sede}</p>
                    <p>N° SEDE: {TOMA_RAMOS_ESTUDIANTE.numeroSede}</p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs text-slate-800">
                  <p className="font-bold">Dirección de Docencia</p>
                  <p>Fecha emisión 08.11.2026</p>
                </div>
              </div>

              {/* Título del Boletín */}
              <div className="text-center font-mono">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide">
                  BOLETIN DE CARGA ACADEMICA 2do Sem. 2026
                </h2>
              </div>

              {/* Datos del Alumno en dos columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs sm:text-sm text-slate-900 border border-slate-300 p-4 rounded bg-slate-50">
                <div>
                  <p><strong>Alumno:</strong> {TOMA_RAMOS_ESTUDIANTE.nombreBoletin}</p>
                  <p><strong>Carrera:</strong> {TOMA_RAMOS_ESTUDIANTE.carrera}</p>
                  <p><strong>Jornada:</strong> {TOMA_RAMOS_ESTUDIANTE.jornada}</p>
                </div>
                <div>
                  <p><strong>Rut:</strong> {TOMA_RAMOS_ESTUDIANTE.rutFormateado}</p>
                  <p><strong>N°:</strong> {TOMA_RAMOS_ESTUDIANTE.codigoCarrera}</p>
                </div>
              </div>

              {/* Tabla Oficial de Horario de Clases (Fiel a Captura 3) */}
              <div className="space-y-2 font-mono">
                <h3 className="text-center font-black text-sm uppercase">
                  Horario de Clases
                </h3>

                <div className="border-2 border-slate-800 overflow-x-auto">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-800 bg-slate-100 font-bold">
                        <th scope="col" className="p-2 border-r border-slate-800 w-28 text-left">Módulo Horario</th>
                        {diasGrilla.map((dia) => (
                          <th key={dia} scope="col" className="p-2 border-r border-slate-800 last:border-r-0">
                            {dia}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-[11px]">
                      {BLOQUES_HORARIOS_TOMA.map((bloque) => (
                        <tr key={bloque.id}>
                          <td className="p-2 text-left font-bold border-r border-slate-800 whitespace-nowrap bg-slate-50">
                            {bloque.labelPdf}
                          </td>
                          {diasGrilla.map((dia) => {
                            const match = getCeldaContenido(dia, bloque.id);

                            return (
                              <td key={dia} className="p-2 border-r border-slate-800 last:border-r-0">
                                {match ? (
                                  <div className="leading-tight">
                                    <span className="font-black block">{match.texto}</span>
                                    <span className="text-[10px] text-slate-700 block">{match.sala}</span>
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

              {/* Pie de comprobante institucional */}
              <div className="pt-6 border-t border-slate-400 text-center text-xs text-slate-600 font-mono">
                <p>Comprobante generado electrónicamente por Sistema de Registro Curricular Duoc UC.</p>
                <p className="mt-0.5">Sede Alameda • Av. España 8, Santiago • Periodo 2026 - 002</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
