import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Play,
  Volume2,
  VolumeX,
  MapPin,
  LogIn,
  LogOut,
  HelpCircle,
  User,
  Glasses,
  Users,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

const BIBLIOTECA_RESERVA_URL = 'https://bibliotecas.duoc.cl/reserva-sala';
const BIBLIOTECA_VIDEO_WATCH_URL = 'https://www.youtube.com/watch?v=SxU_2BFHVI4';
const BIBLIOTECA_VIDEO_EMBED_URL = 'https://www.youtube-nocookie.com/embed/SxU_2BFHVI4?rel=0';

export const BibliotecaView = () => {
  const { announce } = useAccessibility();
  const [activePortalTab, setActivePortalTab] = useState('salas'); // 'salas' | 'vr'
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Limpiar lectura por voz al desmontar la vista (WCAG 1.4.2 Audio Control)
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Función accesible de lectura por voz (emulando el botón "Escuchar" del portal de Biblioteca Duoc UC)
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      announce('Tu navegador no soporta lectura por voz automática.', 'assertive');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      announce('Lectura por voz detenida.', 'polite');
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead =
      'Instrucciones para Reserva de Salas en Biblioteca Duoc UC. ' +
      'Paso 1: Ingresa a bibliotecas punto duoc punto cl slash reserva guion sala y elige la pestaña Salas de estudio o Lentes VR. ' +
      'Paso 2: Haz clic en el botón amarillo Selecciona tu sede, elige Sede Alameda, selecciona la sala, fecha y bloque horario. ' +
      'Paso 3: Ingresa tu correo institucional y confirma tu reserva. Recibirás un código en tu correo. ' +
      'Paso 4: Al llegar a la biblioteca, presiona el botón Registra el ingreso con el código recibido en tu correo. Al finalizar tu bloque de 60 minutos, presiona Registra la salida. ' +
      'Condiciones generales: Cada reserva corresponde a un módulo de 1 hora reloj, 60 minutos. Si finalmente no ocuparás la sala o el equipo, cancela tu reserva para que otro estudiante pueda usarla.';

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'es-CL';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section aria-labelledby="biblioteca-view-title" className="space-y-6">
      {/* 1. Encabezado limpio de Bibliotecas Duoc UC */}
      <div className="bg-white px-6 sm:px-8 py-6 sm:py-7 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-xs font-semibold text-[#002B49] block mb-1">
            Bibliotecas Duoc UC • Reserva de Salas
          </span>
          <h2
            id="biblioteca-view-title"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
          >
            Reserva de salas de estudio y lentes VR
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
            Revisa cómo reservar tu sala en{' '}
            <strong className="text-slate-900 font-semibold">bibliotecas.duoc.cl/reserva-sala</strong>, cómo registrar tu ingreso y salida, o mira el video paso a paso.
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-3">
          <a
            href={BIBLIOTECA_RESERVA_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ir directamente a Reserva de Salas en bibliotecas.duoc.cl/reserva-sala (nueva pestaña)"
            className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <span>Ir a Reserva de Salas</span>
            <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* 2. Video Tutorial + Pasos */}
      <article
        aria-labelledby="biblioteca-tutorial-heading"
        className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-slate-100 text-[#002B49] flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="biblioteca-tutorial-heading"
                className="text-lg sm:text-xl font-bold text-slate-900"
              >
                Cómo hacer tu reserva paso a paso
              </h3>
              <p className="text-xs text-slate-500">
                Video explicativo y guía rápida de uso.
              </p>
            </div>
          </div>

          <a
            href={BIBLIOTECA_VIDEO_WATCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir video tutorial en YouTube (nueva pestaña)"
            className="min-h-[38px] px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-200/80 transition-colors self-start sm:self-auto"
          >
            <span>Ver en YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          </a>
        </div>

        {/* Grilla: Reproductor de Video + 4 Pasos Precisos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Video Embebido */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-300 shadow-md">
              <iframe
                src={BIBLIOTECA_VIDEO_EMBED_URL}
                title="Video tutorial oficial: Cómo reservar una sala de estudio en Biblioteca Duoc UC"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <p className="text-xs text-slate-700 font-semibold flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>
                Puedes activar los subtítulos del reproductor de YouTube presionando la tecla{' '}
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[11px] font-black">
                  C
                </kbd>{' '}
                o el botón <strong>CC</strong>.
              </span>
            </p>
          </div>

          {/* Columna Derecha: Los 4 Pasos Exactos del Portal */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Paso 1 */}
            <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-full bg-[#002B49] text-[#FFB81C] font-black text-sm flex items-center justify-center">
                    1
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    Pestaña Inicial
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-base mb-1.5">
                  Elige &quot;Salas de estudio&quot; o &quot;Lentes VR&quot;
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  Ingresa a{' '}
                  <a
                    href={BIBLIOTECA_RESERVA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-black text-[#002B49] underline hover:text-amber-800"
                  >
                    bibliotecas.duoc.cl/reserva-sala
                  </a>{' '}
                  y selecciona la pestaña <strong>Salas de estudio</strong> (o{' '}
                  <strong>Lentes VR</strong> si deseas usar realidad virtual).
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-full bg-[#002B49] text-[#FFB81C] font-black text-sm flex items-center justify-center">
                    2
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 bg-[#FFB81C]/30 px-2.5 py-1 rounded-md border border-amber-400">
                    Botón Amarillo
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-base mb-1.5">
                  Pulsa &quot;Selecciona tu sede ▾&quot;
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  Haz clic en el botón amarillo <strong>Selecciona tu sede</strong>, elige tu sede
                  (ej: <strong>Alameda</strong>), escoge la sala, el día en el calendario y el
                  bloque de <strong>1 hora reloj (60 min)</strong>.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-full bg-[#002B49] text-[#FFB81C] font-black text-sm flex items-center justify-center">
                    3
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    Confirmación
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-base mb-1.5">
                  Revisa tu Correo Institucional
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  Completa tus datos e inscríbela. Recibirás de inmediato un{' '}
                  <strong>correo de confirmación</strong> en tu bandeja <code>@duocuc.cl</code> con
                  los datos para activar tu ingreso.
                </p>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-full bg-[#002B49] text-[#FFB81C] font-black text-sm flex items-center justify-center">
                    4
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
                    Check-in / Out
                  </span>
                </div>
                <h4 className="font-black text-slate-900 text-base mb-1.5">
                  Registra el Ingreso y la Salida
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  Al iniciar tu hora, entra a la misma página y pulsa{' '}
                  <strong>&quot;Registra el ingreso&quot;</strong> con el código de tu correo. Al
                  terminar tu bloque, pulsa <strong>&quot;Registra la salida&quot;</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* 3. Vista Previa Interactiva Idéntica al Portal Oficial (https://bibliotecas.duoc.cl/reserva-sala) */}
      <article
        aria-labelledby="replica-portal-biblioteca-title"
        className="bg-white rounded-3xl border-2 border-slate-300 overflow-hidden shadow-md"
      >
        {/* Barra negra superior idéntica a la captura de Bibliotecas Duoc UC */}
        <div className="bg-[#111111] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="font-serif font-black text-xl tracking-tight text-white block leading-none">
                Duoc<span className="text-[#FFB81C]">UC</span>
              </span>
              <span className="text-[11px] text-slate-300 font-medium">Bibliotecas</span>
            </div>
            <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-200">
              <span>Estudiantes</span>
              <span>Docentes</span>
              <span>Investigadores</span>
              <span>Titulados</span>
              <span>Campus Virtual</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://bibliotecas.duoc.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-3 py-1.5 rounded-lg hover:bg-white/10 inline-flex items-center gap-1.5 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
            >
              <HelpCircle className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
              <span>Consúltanos</span>
            </a>
            <a
              href={BIBLIOTECA_RESERVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-3 py-1.5 rounded-lg hover:bg-white/10 inline-flex items-center gap-1.5 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
            >
              <User className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
              <span>Mi cuenta</span>
            </a>
          </div>
        </div>

        {/* Franja Amarilla "Reservas" idéntica a la captura */}
        <div className="bg-[#F5B316] py-5 px-6 text-center border-b border-amber-500">
          <h3
            id="replica-portal-biblioteca-title"
            className="text-2xl sm:text-3xl font-serif font-bold text-slate-950 tracking-tight"
          >
            Reservas
          </h3>
        </div>

        {/* Contenido interior del portal de Reservas */}
        <div className="p-6 sm:p-10 max-w-6xl mx-auto">
          {/* Migas de pan y botón funcional "Escuchar" (ReadSpeaker accesible) */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <span className="text-blue-700">Biblioteca</span>
              <span aria-hidden="true">/</span>
              <span className="text-slate-800">Reservas</span>
            </div>

            <button
              type="button"
              onClick={handleToggleSpeech}
              aria-pressed={isSpeaking}
              aria-label={
                isSpeaking
                  ? 'Detener lectura en voz alta de las instrucciones y condiciones de reserva'
                  : 'Escuchar en voz alta las instrucciones y condiciones de reserva'
              }
              className="min-h-[44px] px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-400 rounded-lg text-xs font-black inline-flex items-center gap-2 shadow-xs transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-700 shrink-0" aria-hidden="true" />
                  <span>Detener lectura</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
                  <span>Escuchar</span>
                  <Play className="w-3.5 h-3.5 text-emerald-700 fill-current" aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Columna Izquierda: Pestañas, Botones de Acción y Condiciones Generales (Idéntico a la captura) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Pestañas accesibles WAI-ARIA: Salas de estudio | Lentes VR */}
              <div
                role="tablist"
                aria-label="Tipo de recurso a reservar en Biblioteca"
                className="bg-slate-50 p-2 rounded-xl border border-slate-200 grid grid-cols-2 gap-2"
              >
                <button
                  id="tab-biblioteca-salas"
                  type="button"
                  role="tab"
                  aria-selected={activePortalTab === 'salas'}
                  aria-controls="panel-biblioteca-recursos"
                  onClick={() => setActivePortalTab('salas')}
                  className={`min-h-[48px] px-4 py-2.5 rounded-lg font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
                    activePortalTab === 'salas'
                      ? 'bg-white text-slate-950 shadow-xs border-b-4 border-[#F5B316]'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Salas de estudio</span>
                </button>
                <button
                  id="tab-biblioteca-vr"
                  type="button"
                  role="tab"
                  aria-selected={activePortalTab === 'vr'}
                  aria-controls="panel-biblioteca-recursos"
                  onClick={() => setActivePortalTab('vr')}
                  className={`min-h-[48px] px-4 py-2.5 rounded-lg font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
                    activePortalTab === 'vr'
                      ? 'bg-white text-slate-950 shadow-xs border-b-4 border-[#F5B316]'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  <Glasses className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Lentes VR</span>
                </button>
              </div>

              {/* Panel de pestaña activa con los 3 botones oficiales del portal */}
              <div
                id="panel-biblioteca-recursos"
                role="tabpanel"
                aria-labelledby={activePortalTab === 'salas' ? 'tab-biblioteca-salas' : 'tab-biblioteca-vr'}
                className="space-y-3"
              >
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                  Acciones directas en el portal oficial ({activePortalTab === 'salas' ? 'Salas de estudio' : 'Lentes VR'}):
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={BIBLIOTECA_RESERVA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ir a Selecciona tu sede en bibliotecas.duoc.cl/reserva-sala (se abre en una nueva pestaña)"
                    className="min-h-[48px] px-5 py-2.5 bg-[#F5B316] hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xs inline-flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#002B49]"
                  >
                    <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Selecciona tu sede ▾</span>
                  </a>

                  <a
                    href={BIBLIOTECA_RESERVA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ir a Registra el ingreso en bibliotecas.duoc.cl/reserva-sala (se abre en una nueva pestaña)"
                    className="min-h-[48px] px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm rounded-xl border-2 border-slate-300 shadow-xs inline-flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  >
                    <LogIn className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>Registra el ingreso</span>
                  </a>

                  <a
                    href={BIBLIOTECA_RESERVA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ir a Registra la salida en bibliotecas.duoc.cl/reserva-sala (se abre en una nueva pestaña)"
                    className="min-h-[48px] px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs sm:text-sm rounded-xl border-2 border-slate-300 shadow-xs inline-flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  >
                    <LogOut className="w-4 h-4 text-amber-800 shrink-0" aria-hidden="true" />
                    <span>Registra la salida</span>
                  </a>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* CONDICIONES GENERALES exactas de la página oficial */}
              <div className="space-y-4">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800">
                  CONDICIONES GENERALES
                </h4>

                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
                  <li className="flex items-start gap-3">
                    <span className="text-[#F5B316] font-black text-base leading-tight shrink-0" aria-hidden="true">
                      ◆
                    </span>
                    <span>
                      Cada reserva corresponde a un módulo de{' '}
                      <strong className="font-black text-slate-950">1 hora reloj (60 minutos)</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#F5B316] font-black text-base leading-tight shrink-0" aria-hidden="true">
                      ◆
                    </span>
                    <span>
                      Para activar tu reserva debes{' '}
                      <strong className="font-black text-slate-950">registrar tu ingreso</strong> con
                      el correo que recibirás al inicio del bloque. Al terminar,{' '}
                      <strong className="font-black text-slate-950">registra la salida</strong> desde
                      este mismo portal.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#F5B316] font-black text-base leading-tight shrink-0" aria-hidden="true">
                      ◆
                    </span>
                    <span>
                      Si finalmente no ocuparás la sala o el equipo,{' '}
                      <strong className="font-black text-slate-950">cancela tu reserva</strong> para
                      que otro estudiante pueda usarla.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#F5B316] font-black text-base leading-tight shrink-0" aria-hidden="true">
                      ◆
                    </span>
                    <span>
                      Se debe mantener una{' '}
                      <strong className="font-black text-slate-950">
                        conducta académica y de estudio
                      </strong>{' '}
                      durante todo el uso del espacio, evitando el ruido, las conversaciones y
                      cualquier actividad que perturbe al resto de los estudiantes.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#F5B316] font-black text-base leading-tight shrink-0" aria-hidden="true">
                      ◆
                    </span>
                    <span>
                      El uso del espacio y de los equipos se rige por el reglamento de Biblioteca y
                      las indicaciones del personal de tu sede.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Columna Derecha: Resumen Visual de Qué hace cada botón y Enlace Directo */}
            <div className="lg:col-span-5 bg-slate-50 rounded-2xl border-2 border-slate-200 p-6 space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div
                  className="w-10 h-10 rounded-xl bg-[#002B49] text-[#FFB81C] flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    ¿Para qué sirve cada botón del portal?
                  </h4>
                  <p className="text-xs text-slate-600 font-bold">
                    Guía rápida antes de entrar al enlace oficial
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <p className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-[#F5B316]" aria-hidden="true" />
                    <span>1. Selecciona tu sede ▾</span>
                  </p>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    Úsalo para crear una <strong>nueva reserva</strong>. Al hacer clic se desplegará la
                    lista de sedes Duoc UC (selecciona <strong>Alameda</strong>) para ver las salas y
                    horarios disponibles.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <p className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <LogIn className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>2. Registra el ingreso (Check-in)</span>
                  </p>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    Úsalo cuando ya estés en la biblioteca al inicio de tu bloque horario. Necesitarás
                    el <strong>código de confirmación</strong> que llegó a tu correo institucional.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <p className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <LogOut className="w-4 h-4 text-amber-800 shrink-0" aria-hidden="true" />
                    <span>3. Registra la salida (Check-out)</span>
                  </p>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    Úsalo al terminar tus 60 minutos de estudio o al desocupar la sala para liberar el
                    espacio formalmente en el sistema.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={BIBLIOTECA_RESERVA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir página oficial de Reserva de Salas de Biblioteca Duoc UC en una nueva pestaña"
                  className="w-full min-h-[48px] px-6 py-3.5 bg-[#002B49] hover:bg-[#001f35] text-white rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                >
                  <span>Abrir bibliotecas.duoc.cl/reserva-sala</span>
                  <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
};
