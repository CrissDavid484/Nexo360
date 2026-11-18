import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  LogIn,
  Play,
  Volume2,
  VolumeX,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { DEFAULT_CAMPUS, splitStudentName, getStudentRut } from '../../utils/studentUtils';
import { isSpeechSupported, speak, stopSpeech } from '../../utils/speechService';

const BIBLIOTECA_RESERVA_URL = 'https://bibliotecas.duoc.cl/reserva-sala';
const BIBLIOTECA_ALAMEDA_URL = 'https://agenda-bibliotecas.duoc.cl/reserve/spaces/alameda';
const BIBLIOTECA_CHECKIN_URL = 'https://duoc.libcal.com/r/checkin';
const BIBLIOTECA_VIDEO_WATCH_URL = 'https://www.youtube.com/watch?v=SxU_2BFHVI4';
const BIBLIOTECA_VIDEO_EMBED_URL = 'https://www.youtube-nocookie.com/embed/SxU_2BFHVI4?rel=0';
const BIBLIOTECA_STEPS_SPEECH_TEXT =
  'Instrucciones para Reserva de Salas en Bibliotecas Duoc UC - Sede Alameda. ' +
  'Paso 1: Elige Salas de estudio o Lentes VR. ' +
  'Paso 2: Haz clic en Selecciona tu sede, elige Sede Alameda, la sala y el bloque de 60 minutos. ' +
  'Paso 3: Ingresa tu correo institucional y confirma tu reserva. ' +
  'Paso 4: Al llegar a Sede Alameda, registra tu ingreso con el código recibido en tu correo institucional.';

const TIME_SLOTS = [
  '09:00 - 09:50',
  '10:00 - 10:50',
  '11:00 - 11:50',
  '12:00 - 12:50',
  '13:00 - 13:50',
  '14:00 - 14:50',
  '15:00 - 15:50',
  '16:00 - 16:50',
  '17:00 - 17:50',
];

const ROOMS = [
  { id: 1, name: 'Sala de estudio 1', capacity: 6, accessibility: true, power: true },
  { id: 2, name: 'Sala de estudio 2', capacity: 6, accessibility: true, power: true },
  { id: 3, name: 'Sala de estudio 3', capacity: 6, accessibility: true, power: true },
  { id: 4, name: 'Sala de estudio 4', capacity: 6, accessibility: true, power: true },
];

export const BibliotecaView = () => {
  const { user } = useAuth();
  const { announce, getVoiceProps } = useAccessibility();

  // Datos coordinados con la sesión real y base de datos
  const studentEmail = user?.email || user?.vivoStudentProfile?.correo || 'estudiante@duocuc.cl';
  const { firstName: initialFirstName, lastName: initialLastName } = splitStudentName(user);
  const studentRut = getStudentRut(user);

  // Estados de navegación del simulador (SIN CHECKOUT)
  const [activeTab, setActiveTab] = useState('reserva'); // 'reserva' | 'checkin'
  const [reservaStep, setReservaStep] = useState('grid'); // 'grid' | 'form' | 'success'

  // Selección en la grilla interactiva
  const [selectedSlot, setSelectedSlot] = useState({
    roomId: 1,
    roomName: 'Sala de estudio 1',
    time: '09:00 - 09:50',
    date: 'lunes, noviembre 16, 2026',
  });

  // Ocupaciones de demostración
  const [occupiedSlots] = useState({
    '1-10:00 - 10:50': true,
    '1-11:00 - 11:50': true,
    '1-12:00 - 12:50': true,
    '2-14:00 - 14:50': true,
    '3-16:00 - 16:50': true,
  });

  // Formulario sincronizado con la base de datos
  const [formData, setFormData] = useState({
    nombre: initialFirstName,
    apellido: initialLastName,
    email: studentEmail,
    rut: studentRut,
  });

  useEffect(() => {
    if (user) {
      const email = user.email || user.vivoStudentProfile?.correo || 'estudiante@duocuc.cl';
      const { firstName, lastName } = splitStudentName(user);
      setFormData({
        nombre: firstName,
        apellido: lastName,
        email,
        rut: getStudentRut(user),
      });
    }
  }, [user]);

  // Reserva confirmada activa
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [checkinInputCode, setCheckinInputCode] = useState('');
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  // Accesibilidad por voz
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const handleSelectGridSlot = (room, time) => {
    const slotKey = `${room.id}-${time}`;
    if (occupiedSlots[slotKey]) {
      announce('Este bloque horario no está disponible. Por favor elige otro.', 'assertive');
      return;
    }
    setSelectedSlot({
      roomId: room.id,
      roomName: room.name,
      time,
      date: 'lunes, noviembre 16, 2026',
    });
    announce(`Seleccionaste ${room.name} de ${time}.`, 'polite');
  };

  const handleConfirmReservation = (e) => {
    e.preventDefault();
    const newCode = `CHK-${Math.floor(1000 + Math.random() * 9000)}`;
    const booking = {
      ...selectedSlot,
      ...formData,
      code: newCode,
    };
    setConfirmedBooking(booking);
    setReservaStep('success');
    announce(`Reserva confirmada con éxito. Tu código de ingreso es ${newCode}`, 'assertive');
  };

  const handlePerformCheckin = (e) => {
    e.preventDefault();
    if (!checkinInputCode.trim()) return;
    setCheckinSuccess(true);
    announce(`Ingreso registrado con éxito en Biblioteca ${DEFAULT_CAMPUS}.`, 'assertive');
  };

  const handleToggleSpeech = () => {
    if (!isSpeechSupported()) {
      announce('Tu navegador no soporta lectura por voz automática.', 'assertive');
      return;
    }
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      announce('Lectura por voz detenida.', 'polite');
      return;
    }
    const started = speak(BIBLIOTECA_STEPS_SPEECH_TEXT, {
      force: true,
      lang: 'es-CL',
      rate: 1.0,
    });
    setIsSpeaking(started);
    if (started) {
      announce('Reproduciendo instrucciones de reserva de biblioteca.', 'polite');
    }
  };

  return (
    <section aria-labelledby="biblioteca-view-title" className="space-y-6">
      {/* 1. Encabezado Oficial con Botón Directo al Portal Real */}
      <div className="bg-white px-6 sm:px-8 py-6 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#002B49] block">
            Bibliotecas Duoc UC - {DEFAULT_CAMPUS} • Reserva de Salas
          </span>
          <h2
            id="biblioteca-view-title"
            {...getVoiceProps(`Reserva de salas de estudio y lentes VR en Duoc UC ${DEFAULT_CAMPUS}`)}
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900"
          >
            Reserva de salas de estudio y lentes VR
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Revisa cómo reservar tu sala en{' '}
            <strong className="text-slate-900 font-semibold">bibliotecas.duoc.cl/reserva-sala</strong> para Duoc UC - {DEFAULT_CAMPUS}, cómo registrar tu ingreso, o practica en el simulador a continuación.
          </p>
        </div>

        {/* Botones de acción directos a la pantalla oficial de Duoc UC */}
        <div className="shrink-0 flex flex-wrap items-center gap-3">
          <a
            href={BIBLIOTECA_RESERVA_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ir directamente a Reserva de Salas en bibliotecas.duoc.cl/reserva-sala (nueva pestaña)"
            {...getVoiceProps('Ir a Reserva de Salas Oficial en bibliotecas.duoc.cl')}
            className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
          >
            <span>Ir a Reserva de Salas Oficial</span>
            <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* 2. Video Tutorial a la Izquierda + Instrucciones a la Derecha */}
      <article
        aria-labelledby="biblioteca-tutorial-heading"
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
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
                {...getVoiceProps('Cómo hacer tu reserva paso a paso en Sede Alameda')}
                className="text-lg sm:text-xl font-bold text-slate-900"
              >
                Cómo hacer tu reserva paso a paso
              </h3>
              <p className="text-xs text-slate-500">
                Video explicativo y guía rápida de uso institucional para {DEFAULT_CAMPUS}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSpeech}
              aria-pressed={isSpeaking}
              {...getVoiceProps(isSpeaking ? 'Silenciar instrucciones de reserva' : 'Escuchar instrucciones de reserva')}
              className="min-h-[38px] px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-red-600" aria-hidden="true" />
                  <span>Silenciar</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
                  <span>Escuchar</span>
                </>
              )}
            </button>

            <a
              href={BIBLIOTECA_VIDEO_WATCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir video tutorial en YouTube (nueva pestaña)"
              {...getVoiceProps('Ver video tutorial en YouTube')}
              className="min-h-[38px] px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-200 transition-colors"
            >
              <span>Ver en YouTube</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Grilla: Video Embebido a la Izquierda + 4 Pasos a la Derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Video Embebido */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-sm">
              <iframe
                src={BIBLIOTECA_VIDEO_EMBED_URL}
                title="Video tutorial oficial: Cómo reservar una sala de estudio en Biblioteca Duoc UC"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <p className="text-xs text-slate-700 font-medium flex items-center gap-2 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>
                Puedes activar los subtítulos del reproductor de YouTube presionando la tecla{' '}
                <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-semibold">
                  C
                </kbd>{' '}
                o el botón <strong>CC</strong>.
              </span>
            </p>
          </div>

          {/* Columna Derecha: Los 4 Pasos Exactos */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Paso 1 */}
            <div
              {...getVoiceProps('Paso 1: Elige Salas de estudio o Lentes VR. Ingresa al portal oficial y selecciona el recurso de estudio que necesitas para tu jornada.')}
              className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:bg-slate-50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#002B49] text-[#FFB81C] font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200/70">
                    Paso Inicial
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Elige &quot;Salas de estudio&quot; o &quot;Lentes VR&quot;
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Ingresa al portal oficial y selecciona el recurso de estudio que necesitas para tu jornada.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div
              {...getVoiceProps(`Paso 2: Pulsa Selecciona tu sede. Elige Duoc UC ${DEFAULT_CAMPUS}, la sala disponible y el bloque de 60 minutos.`)}
              className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:bg-slate-50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#002B49] text-[#FFB81C] font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {DEFAULT_CAMPUS} &amp; Bloque
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Pulsa &quot;Selecciona tu sede ▾&quot;
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Elige <strong>Duoc UC - {DEFAULT_CAMPUS}</strong>, la sala disponible y el bloque de{' '}
                  <strong>1 hora reloj (60 min)</strong>.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div
              {...getVoiceProps('Paso 3: Revisa tu Correo Institucional. Recibirás de inmediato un correo de confirmación con tu código de validación.')}
              className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:bg-slate-50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#002B49] text-[#FFB81C] font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200/70">
                    Confirmación
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Revisa tu Correo Institucional
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Recibirás de inmediato un correo de confirmación con tu código de validación para activar el uso.
                </p>
              </div>
            </div>

            {/* Paso 4 */}
            <div
              {...getVoiceProps(`Paso 4: Registra tu Ingreso Check-in. Al llegar a Biblioteca ${DEFAULT_CAMPUS}, pulsa Registra el ingreso con tu código.`)}
              className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:bg-slate-50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="w-7 h-7 rounded-full bg-[#002B49] text-[#FFB81C] font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Check-in
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">
                  Registra tu Ingreso (Check-in)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Al llegar al espacio en {DEFAULT_CAMPUS}, pulsa &quot;Registra el ingreso&quot; con el código que llegó a tu correo institucional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* 3. Banner Informativo Limpio de Simulación */}
      <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
            <strong>Entorno de Práctica:</strong> Esta es una simulación interactiva para que puedas conocer cómo se realiza la reserva de salas en Bibliotecas Duoc UC - {DEFAULT_CAMPUS} antes de hacerlo en el portal oficial.
          </p>
        </div>

        <a
          href={BIBLIOTECA_ALAMEDA_URL}
          target="_blank"
          rel="noopener noreferrer"
          {...getVoiceProps('Abrir Portal Alameda Oficial de Bibliotecas')}
          className="min-h-[40px] px-4 py-2 bg-[#002B49] hover:bg-[#001D33] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shrink-0 shadow-xs transition-all active:scale-95"
        >
          <span>Abrir Portal Alameda Oficial</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
        </a>
      </div>

      {/* 4. Barra de Navegación de Pestañas del Simulador (SIN CHECKOUT) */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Secciones del simulador" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reserva'}
            onClick={() => setActiveTab('reserva')}
            {...getVoiceProps('Pestaña Reserva de Salas, grilla horaria')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
              activeTab === 'reserva'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === 'reserva' ? 'text-[#FFB81C]' : 'text-slate-500'}`} />
            <span>Reserva de Salas (Grilla Horaria)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'checkin'}
            onClick={() => setActiveTab('checkin')}
            {...getVoiceProps('Pestaña Registra Ingreso, Check-in')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
              activeTab === 'checkin'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <LogIn className={`w-4 h-4 ${activeTab === 'checkin' ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>Registra Ingreso (Check-in)</span>
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          Duoc UC - {DEFAULT_CAMPUS} • Capacidad 6 por sala
        </span>
      </div>

      {/* 5. SIMULADOR INTERACTIVO DE BIBLIOTECA */}
      <article
        aria-label={`Simulador interactivo de Bibliotecas Duoc UC ${DEFAULT_CAMPUS}`}
        className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"
      >
        {/* Barra negra superior */}
        <div className="bg-[#111111] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-serif font-black text-xl tracking-tight text-white block leading-none">
              Duoc<span className="text-[#FFB81C]">UC</span>
            </span>
            <span className="text-xs text-slate-300 font-medium">Bibliotecas • {DEFAULT_CAMPUS}</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {/* Correo coordinado dinámicamente con la base de datos */}
            <span className="text-slate-200 font-mono text-[11px] bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
              {studentEmail}
            </span>
            <a
              href="https://bibliotecas.duoc.cl"
              target="_blank"
              rel="noopener noreferrer"
              {...getVoiceProps('Consúltanos en Bibliotecas Duoc UC')}
              className="text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
              <span>Consúltanos</span>
            </a>
          </div>
        </div>

        {/* PESTAÑA: RESERVA DE SALAS (Grilla -> Formulario -> Confirmación) */}
        {activeTab === 'reserva' && (
          <div>
            {/* PASO 1: GRILLA DE DISPONIBILIDAD */}
            {reservaStep === 'grid' && (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <button
                    type="button"
                    {...getVoiceProps('Ir a la fecha')}
                    className="min-h-[40px] px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-bold border border-slate-300 inline-flex items-center gap-2 shadow-2xs"
                  >
                    <Calendar className="w-4 h-4 text-slate-600" />
                    <span>Ir a la fecha</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="Día anterior"
                      {...getVoiceProps('Día anterior')}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold border border-slate-300"
                    >
                      &lt;
                    </button>
                    <h3
                      {...getVoiceProps('lunes, noviembre 16, 2026')}
                      className="text-xl sm:text-2xl font-serif font-bold text-slate-900 tracking-tight"
                    >
                      lunes, noviembre 16, 2026
                    </h3>
                    <button
                      type="button"
                      aria-label="Día siguiente"
                      {...getVoiceProps('Día siguiente')}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold border border-slate-300"
                    >
                      &gt;
                    </button>
                  </div>

                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    Duoc UC - {DEFAULT_CAMPUS}
                  </span>
                </div>

                {/* Tabla de Horarios */}
                <div className="overflow-x-auto border-2 border-slate-200 rounded-2xl shadow-xs">
                  <table className="w-full text-xs text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                        <th scope="col" className="p-3.5 sticky left-0 bg-slate-100 z-10 w-56 border-r border-slate-200">
                          Reserva de sala
                        </th>
                        {TIME_SLOTS.map((slot) => (
                          <th key={slot} scope="col" className="p-2 text-center border-r border-slate-200 whitespace-nowrap">
                            {slot}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ROOMS.map((room) => (
                        <tr key={room.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                          <td className="p-3.5 font-bold text-slate-900 sticky left-0 bg-white border-r border-slate-200 z-10 whitespace-nowrap">
                            <div className="flex items-center justify-between gap-2">
                              <span>{room.name} (Capacidad {room.capacity})</span>
                              <span className="text-slate-400 text-sm">♿🔌</span>
                            </div>
                          </td>
                          {TIME_SLOTS.map((time) => {
                            const isOccupied = occupiedSlots[`${room.id}-${time}`];
                            const isSelected =
                              selectedSlot?.roomId === room.id && selectedSlot?.time === time;

                            let bgClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
                            let titleText = 'Disponible - Clic para reservar';

                            if (isOccupied) {
                              bgClass = 'bg-red-600 text-white cursor-not-allowed';
                              titleText = 'No disponible';
                            } else if (isSelected) {
                              bgClass = 'bg-amber-500 text-slate-950 font-black ring-2 ring-slate-900';
                              titleText = 'Su Reserva seleccionada';
                            }

                            return (
                              <td key={time} className="p-1.5 text-center border-r border-slate-200">
                                <button
                                  type="button"
                                  disabled={isOccupied}
                                  onClick={() => handleSelectGridSlot(room, time)}
                                  title={`${room.name} ${time}: ${titleText}`}
                                  aria-label={`${room.name} bloque ${time}: ${titleText}`}
                                  {...getVoiceProps(`${room.name} bloque ${time}: ${titleText}`)}
                                  className={`w-full h-10 rounded-md transition-transform active:scale-95 flex items-center justify-center font-bold text-[10px] ${bgClass}`}
                                >
                                  {isSelected ? '✓' : ''}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Leyenda de Colores */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-700 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-4 rounded bg-emerald-600 inline-block shadow-2xs" />
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-4 rounded bg-amber-500 inline-block shadow-2xs" />
                    <span>Su Reserva</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-4 rounded bg-red-600 inline-block shadow-2xs" />
                    <span>No disponible</span>
                  </div>
                </div>

                {/* Resumen & Botón Hacer una Reserva */}
                {selectedSlot && (
                  <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#002B49] text-[#FFB81C] flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                          Horario Seleccionado
                        </p>
                        <p className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {selectedSlot.roomName}: {selectedSlot.time}, {selectedSlot.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedSlot(null)}
                        aria-label="Descartar selección"
                        {...getVoiceProps('Descartar selección de horario')}
                        className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs border border-slate-300 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                        <span className="hidden sm:inline">Descartar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReservaStep('form')}
                        {...getVoiceProps('Hacer una reserva con el horario seleccionado')}
                        className="min-h-[44px] flex-1 sm:flex-initial px-6 py-2.5 bg-[#236bb3] hover:bg-[#1b5590] text-white font-extrabold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                      >
                        Hacer una reserva
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PASO 2: FORMULARIO COORDINADO CON LA BD */}
            {reservaStep === 'form' && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <span className="text-blue-700">Biblioteca</span>
                  <span>/</span>
                  <span className="text-blue-700">Biblioteca {DEFAULT_CAMPUS}</span>
                  <span>/</span>
                  <span className="text-slate-800">Finalizar Reserva de Espacios</span>
                </div>

                <div>
                  <h3
                    {...getVoiceProps('Detalles de la reserva en Biblioteca Sede Alameda')}
                    className="text-2xl font-serif font-bold text-slate-950"
                  >
                    Detalles de la reserva
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Estos tiempos se mantendrán para usted hasta completar la reserva.
                  </p>
                </div>

                {/* Resumen del bloque */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                      <tr>
                        <th className="p-3">Artículo</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Desde</th>
                        <th className="p-3">A</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="p-3 font-bold text-slate-900">{selectedSlot.roomName}</td>
                        <td className="p-3 text-slate-600">Salas de estudio - {DEFAULT_CAMPUS}</td>
                        <td className="p-3 text-slate-800 font-medium">{selectedSlot.time.split(' - ')[0]} {selectedSlot.date}</td>
                        <td className="p-3 text-slate-800 font-medium">{selectedSlot.time.split(' - ')[1]} {selectedSlot.date}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => setReservaStep('grid')}
                            {...getVoiceProps('Eliminar selección y volver a la grilla')}
                            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-300"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Formulario */}
                <form onSubmit={handleConfirmReservation} className="space-y-4 max-w-2xl">
                  <h4 className="text-sm font-bold text-slate-900 pt-2">
                    Rellene este formulario antes de completar la reserva:
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="res-nombre" className="block text-xs font-bold text-slate-700 mb-1">
                        Nombre completo *
                      </label>
                      <input
                        id="res-nombre"
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        {...getVoiceProps(`Nombre completo, ${formData.nombre}`)}
                        className="w-full min-h-[42px] px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#002B49]"
                        placeholder="Nombre"
                      />
                    </div>

                    <div>
                      <label htmlFor="res-apellido" className="block text-xs font-bold text-slate-700 mb-1">
                        Apellido *
                      </label>
                      <input
                        id="res-apellido"
                        type="text"
                        required
                        value={formData.apellido}
                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        {...getVoiceProps(`Apellido, ${formData.apellido}`)}
                        className="w-full min-h-[42px] px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#002B49]"
                        placeholder="Apellido"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="res-email" className="block text-xs font-bold text-slate-700 mb-1">
                      Correo electrónico * (Sincronizado con tu cuenta)
                    </label>
                    <input
                      id="res-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      {...getVoiceProps(`Correo electrónico institucional, ${formData.email}`)}
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#002B49]"
                    />
                  </div>

                  <div>
                    <label htmlFor="res-rut" className="block text-xs font-bold text-slate-700 mb-1">
                      RUT (ejemplo 21.987.654-3) *
                    </label>
                    <input
                      id="res-rut"
                      type="text"
                      required
                      value={formData.rut}
                      onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                      {...getVoiceProps(`RUT, ${formData.rut}`)}
                      className="w-full min-h-[42px] px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#002B49]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      {...getVoiceProps('Confirmar y reservar sala')}
                      className="min-h-[44px] px-6 py-2.5 bg-[#236bb3] hover:bg-[#1b5590] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                    >
                      Reservar
                    </button>
                    <button
                      type="button"
                      onClick={() => setReservaStep('grid')}
                      {...getVoiceProps('Volver a la Grilla')}
                      className="min-h-[44px] px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300"
                    >
                      Volver a la Grilla
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PASO 3: CONFIRMACIÓN EXITOSA */}
            {reservaStep === 'success' && confirmedBooking && (
              <div className="p-6 sm:p-10 space-y-6">
                <div className="flex items-center gap-3 text-emerald-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <h3
                    {...getVoiceProps(`Reserva confirmada. Código check-in: ${confirmedBooking.code}`)}
                    className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-slate-950"
                  >
                    Reserva confirmada
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 max-w-2xl leading-relaxed">
                  Tu reserva ha sido enviada con éxito. También recibirás un email de confirmación en{' '}
                  <strong className="text-slate-950">{confirmedBooking.email}</strong>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
                  {/* Tarjeta Información Espacial */}
                  <div
                    {...getVoiceProps(`Información espacial: Duoc UC ${DEFAULT_CAMPUS}, ${confirmedBooking.roomName}, ${confirmedBooking.date}, ${confirmedBooking.time}`)}
                    className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2"
                  >
                    <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">
                      Información espacial
                    </h4>
                    <div className="text-xs space-y-1 text-slate-700">
                      <p><strong>Sede:</strong> Duoc UC - {DEFAULT_CAMPUS}</p>
                      <p><strong>Reserva de sala:</strong> {confirmedBooking.roomName}</p>
                      <p><strong>Fecha:</strong> {confirmedBooking.date}</p>
                      <p><strong>Hora:</strong> {confirmedBooking.time}</p>
                    </div>
                  </div>

                  {/* Tarjeta Información del Usuario */}
                  <div
                    {...getVoiceProps(`Información del usuario: ${confirmedBooking.nombre} ${confirmedBooking.apellido}, código check-in ${confirmedBooking.code}`)}
                    className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2"
                  >
                    <h4 className="text-sm font-extrabold text-slate-900 border-b border-slate-200 pb-2">
                      Información del usuario
                    </h4>
                    <div className="text-xs space-y-1 text-slate-700">
                      <p><strong>Nombre completo:</strong> {confirmedBooking.nombre} {confirmedBooking.apellido}</p>
                      <p><strong>Correo electrónico:</strong> {confirmedBooking.email}</p>
                      <p><strong>RUT:</strong> {confirmedBooking.rut}</p>
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-md inline-block">
                          Código Check-in: <strong>{confirmedBooking.code}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckinInputCode(confirmedBooking.code);
                      setActiveTab('checkin');
                    }}
                    {...getVoiceProps('Ir a Registrar Ingreso con este Código')}
                    className="min-h-[44px] px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs inline-flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Ir a Registrar Ingreso con este Código</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReservaStep('grid')}
                    {...getVoiceProps('Hacer otra reserva')}
                    className="min-h-[44px] px-5 py-2.5 bg-[#236bb3] hover:bg-[#1b5590] text-white font-bold text-xs sm:text-sm rounded-xl"
                  >
                    Hacer otra reserva
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: CHECK-IN OFICIAL */}
        {activeTab === 'checkin' && (
          <div className="p-6 sm:p-10 space-y-6 max-w-xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <LogIn className="w-7 h-7" />
            </div>

            <div>
              <h3
                {...getVoiceProps(`Registra tu Ingreso Check-in en Biblioteca ${DEFAULT_CAMPUS}`)}
                className="text-2xl font-serif font-black text-slate-950"
              >
                Registra tu Ingreso (Check-in)
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Ingresa el código alfanumérico enviado a tu correo institucional ({studentEmail}) para activar tu sala de estudio en {DEFAULT_CAMPUS}.
              </p>
            </div>

            {checkinSuccess ? (
              <div className="p-5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-emerald-950 text-base">
                  ¡Ingreso Validado Exitosamente!
                </h4>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Tu sala de estudio en {DEFAULT_CAMPUS} ha quedado activada. Recuerda que dispones de un bloque de 60 minutos de estudio.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCheckinSuccess(false);
                    setActiveTab('reserva');
                    setReservaStep('grid');
                  }}
                  {...getVoiceProps('Volver al inicio')}
                  className="min-h-[40px] px-5 py-2 bg-[#002B49] text-white font-bold text-xs rounded-xl"
                >
                  Volver al inicio
                </button>
              </div>
            ) : (
              <form onSubmit={handlePerformCheckin} className="space-y-4">
                <div>
                  <label htmlFor="input-checkin-code" className="block text-xs font-bold text-slate-700 mb-1 text-left">
                    Código de confirmación (ej: CHK-7492)
                  </label>
                  <input
                    id="input-checkin-code"
                    type="text"
                    required
                    value={checkinInputCode}
                    onChange={(e) => setCheckinInputCode(e.target.value)}
                    placeholder="Ej. CHK-7492"
                    {...getVoiceProps(`Código de confirmación${checkinInputCode ? `, ${checkinInputCode}` : ''}`)}
                    className="w-full min-h-[46px] px-4 py-2.5 text-center text-lg font-mono font-black border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002B49]"
                  />
                </div>

                <button
                  type="submit"
                  {...getVoiceProps('Confirmar Ingreso a la Sala')}
                  className="w-full min-h-[46px] px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Confirmar Ingreso a la Sala
                </button>
              </form>
            )}

            <div className="pt-2 text-xs text-slate-500">
              <a
                href={BIBLIOTECA_CHECKIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                {...getVoiceProps('Abrir portal oficial de Check-in en LibCal')}
                className="hover:underline flex items-center justify-center gap-1"
              >
                <span>Abrir portal oficial de Check-in en LibCal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Barra inferior */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>Bibliotecas Duoc UC • {DEFAULT_CAMPUS}</span>
          <div className="flex items-center gap-4 font-semibold">
            <a
              href={BIBLIOTECA_RESERVA_URL}
              target="_blank"
              rel="noopener noreferrer"
              {...getVoiceProps('Ir a bibliotecas.duoc.cl reserva de sala')}
              className="hover:text-slate-900 underline"
            >
              bibliotecas.duoc.cl/reserva-sala
            </a>
          </div>
        </div>
      </article>
    </section>
  );
};
