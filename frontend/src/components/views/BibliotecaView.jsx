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
  Copy,
  Check,
  Glasses,
  Users,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { DEFAULT_CAMPUS, splitStudentName, getStudentRut } from '../../utils/studentUtils';
import { isSpeechSupported, speak, stopSpeech } from '../../utils/speechService';
import { YouTubeTutorialPlayer } from '../common/YouTubeTutorialPlayer';
import {
  LIBCAL_ALAMEDA_CONFIG,
  BIBLIOTECA_ALAMEDA_CATEGORIES,
  BIBLIOTECA_TIME_SLOTS,
  INITIAL_OCCUPIED_SLOTS,
  generateRealisticLibcalCode,
  getLibCalAccessibleUrl,
  BIBLIOTECA_VOICE_GUIDE_TEXT,
} from '../../data/bibliotecaAlamedaData';

export const BibliotecaView = () => {
  const { user } = useAuth();
  const { announce, getVoiceProps } = useAccessibility();

  // Datos coordinados con la sesión real y base de datos
  const studentEmail = user?.email || user?.vivoStudentProfile?.correo || 'estudiante@duocuc.cl';
  const { firstName: initialFirstName, lastName: initialLastName } = splitStudentName(user);
  const studentRut = getStudentRut(user) || '21.987.654-3';

  // Categoría seleccionada (Salas de estudio gid=31398 o Lentes VR gid=52104)
  const [selectedCategoryId, setSelectedCategoryId] = useState('salas-estudio');
  const currentCategory =
    BIBLIOTECA_ALAMEDA_CATEGORIES.find((cat) => cat.id === selectedCategoryId) ||
    BIBLIOTECA_ALAMEDA_CATEGORIES[0];

  // Pestaña principal: 'reserva' | 'checkin'
  const [activeTab, setActiveTab] = useState('reserva');
  // Pasos dentro de 'reserva': 'grid' | 'form' | 'success'
  const [reservaStep, setReservaStep] = useState('grid');

  // Espacio y bloque seleccionado en la grilla
  const [selectedSlot, setSelectedSlot] = useState({
    roomId: 1,
    roomName: 'Sala de estudio 1',
    categoryName: 'Salas de estudio - Alameda',
    gid: 31398,
    time: '09:00 - 09:50',
    date: 'lunes, noviembre 16, 2026',
  });

  // Ocupaciones de demostración
  const [occupiedSlots] = useState(INITIAL_OCCUPIED_SLOTS);

  // Formulario de reserva
  const [formData, setFormData] = useState({
    nombre: initialFirstName,
    apellido: initialLastName,
    email: studentEmail,
    rut: studentRut,
  });

  // Reserva confirmada activa
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Código de check-in activo (código estilo LibCal como '2VF')
  const [checkinInputCode, setCheckinInputCode] = useState('');
  const [savedBookingCode, setSavedBookingCode] = useState(() => {
    try {
      return localStorage.getItem('nexo360_biblioteca_active_code') || '2VF';
    } catch {
      return '2VF';
    }
  });
  const [codeCopied, setCodeCopied] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  // Accesibilidad por voz
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (user) {
      const email = user.email || user.vivoStudentProfile?.correo || 'estudiante@duocuc.cl';
      const { firstName, lastName } = splitStudentName(user);
      const rutVal = getStudentRut(user) || '21.987.654-3';
      setFormData({
        nombre: firstName,
        apellido: lastName,
        email,
        rut: rutVal,
      });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Al cambiar categoría, reiniciar selección al primer espacio de esa categoría
  const handleSelectCategory = (categoryId) => {
    setSelectedCategoryId(categoryId);
    const cat = BIBLIOTECA_ALAMEDA_CATEGORIES.find((c) => c.id === categoryId);
    if (cat && cat.spaces.length > 0) {
      const firstSpace = cat.spaces[0];
      setSelectedSlot({
        roomId: firstSpace.id,
        roomName: firstSpace.name,
        categoryName: cat.name,
        gid: cat.gid,
        time: '09:00 - 09:50',
        date: 'lunes, noviembre 16, 2026',
      });
      announce(`Categoría cambiada a ${cat.name}. Mostrando espacios disponibles.`, 'polite');
    }
  };

  const handleSelectGridSlot = (space, time) => {
    const slotKey = `${space.id}-${time}`;
    if (occupiedSlots[slotKey]) {
      announce('Este bloque horario no está disponible. Por favor elige otro.', 'assertive');
      return;
    }
    setSelectedSlot({
      roomId: space.id,
      roomName: space.name,
      categoryName: currentCategory.name,
      gid: currentCategory.gid,
      time,
      date: 'lunes, noviembre 16, 2026',
    });
    announce(`Seleccionaste ${space.name} de ${time}.`, 'polite');
  };

  const handleConfirmReservation = (e) => {
    e.preventDefault();
    const newCode = generateRealisticLibcalCode(); // ej: '2VF'
    const booking = {
      ...selectedSlot,
      ...formData,
      code: newCode,
    };
    setConfirmedBooking(booking);
    setSavedBookingCode(newCode);
    try {
      localStorage.setItem('nexo360_biblioteca_active_code', newCode);
    } catch {
      // Ignorar fallback si localStorage no está disponible
    }
    setReservaStep('success');
    announce(`Reserva confirmada con éxito. Tu código de ingreso oficial es ${newCode}`, 'assertive');
  };

  const handleCopyCode = (codeToCopy) => {
    const code = codeToCopy || savedBookingCode || '2VF';
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCodeCopied(true);
        announce(`Código ${code} copiado al portapapeles.`, 'polite');
        setTimeout(() => setCodeCopied(false), 2500);
      }).catch(() => {
        announce(`Código de reserva: ${code}`, 'polite');
      });
    } else {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    }
  };

  const handlePerformCheckin = (e) => {
    e.preventDefault();
    if (!checkinInputCode.trim()) return;
    setCheckinSuccess(true);
    announce(`Ingreso registrado con éxito en Biblioteca Duoc UC ${DEFAULT_CAMPUS}.`, 'assertive');
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
    const started = speak(BIBLIOTECA_VOICE_GUIDE_TEXT, {
      force: true,
      lang: 'es-CL',
      rate: 1.0,
    });
    setIsSpeaking(started);
    if (started) {
      announce('Reproduciendo instrucciones de reserva de biblioteca.', 'polite');
    }
  };

  // URL accesible oficial para la categoría activa
  const currentAccessibleUrl = getLibCalAccessibleUrl(currentCategory.gid);

  return (
    <section aria-labelledby="biblioteca-view-title" className="space-y-6 w-full max-w-none overflow-x-clip">
      {/* 1. Encabezado Oficial con Acceso a Rutas Oficiales LibCal */}
      <div className="bg-neutral-0 px-6 sm:px-8 py-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 border border-neutral-200/90 shadow-xs">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-brand-navy bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/80">
              Bibliotecas Duoc UC • {DEFAULT_CAMPUS}
            </span>
            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
              Simulador de Práctica Formativa • No es Reserva Oficial
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Espacios Disponibles
            </span>
          </div>

          <h2
            id="biblioteca-view-title"
            {...getVoiceProps(`Reserva de salas de estudio y lentes VR en Duoc UC ${DEFAULT_CAMPUS}`)}
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900"
          >
            Reserva de salas de estudio y lentes VR
          </h2>

          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
            Entorno interactivo de práctica formativa para <strong>Duoc UC - {DEFAULT_CAMPUS}</strong>. Permite ejercitar la selección de bloques horarios y validación de check-in sin alterar el sistema de inventario oficial. Para reservas vinculantes, accede directamente a LibCal mediante los accesos oficiales contiguos.
          </p>

          <div
            role="note"
            aria-label="Aviso legal de simulación formativa de biblioteca"
            className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50 text-amber-950 text-xs font-medium flex items-center gap-2.5 shadow-xs mt-2"
          >
            <span className="w-4 h-4 text-amber-700 font-bold shrink-0">ℹ</span>
            <span>
              <strong>Simulación formativa de reserva — No vinculante con Springshare LibCal:</strong> Las reservas reales de salas y recursos se realizan exclusivamente en el portal oficial de Bibliotecas Duoc UC.
            </span>
          </div>
        </div>

        {/* Botones directos a las rutas oficiales de Duoc UC */}
        <div className="shrink-0 flex flex-wrap items-center gap-2.5">
          <a
            href={LIBCAL_ALAMEDA_CONFIG.urls.alamedaSpaces}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir portal oficial de reserva de espacios en Biblioteca Alameda (nueva pestaña)"
            {...getVoiceProps('Ir a Portal Oficial de Reserva Alameda')}
            className="min-h-[44px] px-4 py-2 bg-brand-navy hover:bg-brand-navyDark text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy"
          >
            <span>Portal Oficial Alameda</span>
            <ExternalLink className="w-4 h-4 text-brand-gold shrink-0" aria-hidden="true" />
          </a>

          <a
            href={currentAccessibleUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir versión accesible oficial para ${currentCategory.name} (nueva pestaña)`}
            {...getVoiceProps(`Abrir versión accesible oficial para ${currentCategory.name}`)}
            className="min-h-[44px] px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs flex items-center gap-2 border border-slate-300 transition-all active:scale-[0.98]"
          >
            <span>Modo Accesible Oficial</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-600 shrink-0" aria-hidden="true" />
          </a>

          <a
            href={LIBCAL_ALAMEDA_CONFIG.urls.checkin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir pantalla oficial de ingreso y check-in (nueva pestaña)"
            {...getVoiceProps('Abrir pantalla oficial de Check-in')}
            className="min-h-[44px] px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4 text-emerald-200 shrink-0" aria-hidden="true" />
            <span>Check-in Oficial</span>
          </a>
        </div>
      </div>

      {/* 2. Video Tutorial Oficial + 4 Pasos Clave */}
      <article
        aria-labelledby="biblioteca-tutorial-heading"
        className="bg-neutral-0 rounded-3xl border border-neutral-200/90 p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl bg-neutral-100 text-brand-navy flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Play className="w-5 h-5 fill-current" aria-hidden="true" />
            </div>
            <div>
              <h3
                id="biblioteca-tutorial-heading"
                {...getVoiceProps(`Cómo hacer tu reserva paso a paso en Duoc UC ${DEFAULT_CAMPUS}`)}
                className="text-lg sm:text-xl font-bold text-neutral-900"
              >
                Guía oficial paso a paso y video explicativo
              </h3>
              <p className="text-xs text-neutral-500">
                Instrucciones institucionales para Biblioteca Alameda y check-in con código alfanumérico.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSpeech}
              aria-pressed={isSpeaking}
              {...getVoiceProps(
                isSpeaking ? 'Silenciar instrucciones de reserva' : 'Escuchar instrucciones de reserva'
              )}
              className="min-h-[38px] px-3.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-neutral-200 cursor-pointer"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-600" aria-hidden="true" />
                  <span>Silenciar</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-brand-navy" aria-hidden="true" />
                  <span>Escuchar</span>
                </>
              )}
            </button>

            <a
              href={LIBCAL_ALAMEDA_CONFIG.urls.videoWatch}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir video tutorial en YouTube (nueva pestaña)"
              {...getVoiceProps('Ver video tutorial en YouTube')}
              className="min-h-[38px] px-3.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-neutral-200"
            >
              <span>Ver en YouTube</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Grilla: Video a la Izquierda + 4 Pasos a la Derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Video */}
          <div className="lg:col-span-6 space-y-3">
            <YouTubeTutorialPlayer
              embedUrl={LIBCAL_ALAMEDA_CONFIG.urls.videoTutorial}
              watchUrl={LIBCAL_ALAMEDA_CONFIG.urls.videoWatch}
              title="Video tutorial oficial: Cómo reservar una sala de estudio en Biblioteca Duoc UC"
              voiceProps={getVoiceProps('Abrir tutorial en YouTube en una nueva pestaña')}
              containerClassName="rounded-2xl bg-neutral-950 border border-neutral-200 shadow-xs"
            />
            <p className="text-xs text-neutral-700 font-medium flex items-center gap-2 bg-neutral-50 px-3.5 py-2.5 rounded-xl border border-neutral-200/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>
                Subtítulos accesibles disponibles con la tecla{' '}
                <kbd className="px-1.5 py-0.5 bg-neutral-0 border border-neutral-200 rounded text-[11px] font-semibold">
                  C
                </kbd>{' '}
                o el botón <strong>CC</strong> en el reproductor.
              </span>
            </p>
          </div>

          {/* 4 Pasos */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Paso 1 */}
            <div
              {...getVoiceProps(
                'Paso 1: Elige Salas de estudio o Lentes VR según lo que requieras para tu jornada en Sede Alameda.'
              )}
              className="p-4 bg-neutral-50/70 border border-neutral-200/80 rounded-2xl flex flex-col justify-between hover:bg-neutral-50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-full bg-brand-navy text-brand-gold font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-0 px-2 py-0.5 rounded border border-neutral-200">
                    Recurso
                  </span>
                </div>
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  Salas de estudio o Lentes VR
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                  Selecciona la categoría: Salas de estudio 1 a 4 o visores de Realidad Virtual.
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div
              {...getVoiceProps(
                `Paso 2: En Duoc UC ${DEFAULT_CAMPUS}, selecciona la sala y el bloque disponible de 60 minutos.`
              )}
              className="p-4 bg-neutral-50/70 border border-neutral-200/80 rounded-2xl flex flex-col justify-between hover:bg-neutral-50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-full bg-brand-navy text-brand-gold font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {DEFAULT_CAMPUS}
                  </span>
                </div>
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  Bloque de 60 minutos
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                  Elige tu sala y bloque horario disponible (50 minutos de uso + 10 de recambio).
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div
              {...getVoiceProps(
                'Paso 3: Confirma con tu correo institucional. Recibirás tu código de reserva alfanumérico como 2VF.'
              )}
              className="p-4 bg-neutral-50/70 border border-neutral-200/80 rounded-2xl flex flex-col justify-between hover:bg-neutral-50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-full bg-brand-navy text-brand-gold font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-0 px-2 py-0.5 rounded border border-neutral-200">
                    Código 2VF
                  </span>
                </div>
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  Correo y código oficial
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                  Recibirás en tu correo institucional tu código alfanumérico corto (ej. <strong>2VF</strong>) para el ingreso.
                </p>
              </div>
            </div>

            {/* Paso 4 */}
            <div
              {...getVoiceProps(
                `Paso 4: Registra tu Check-in al llegar a Sede Alameda antes de 15 minutos para que la sala no se libere automáticamente.`
              )}
              className="p-4 bg-neutral-50/70 border border-neutral-200/80 rounded-2xl flex flex-col justify-between hover:bg-neutral-50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-7 h-7 rounded-full bg-brand-navy text-brand-gold font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    15 Minutos
                  </span>
                </div>
                <h4 className="font-bold text-neutral-900 text-sm mb-1">
                  Check-in obligatorio
                </h4>
                <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                  Al llegar al espacio, pulsa Check-in e ingresa tu código de ingreso. Tienes hasta 15 min de tolerancia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* 3. Barra de Control de Pestañas (Reserva de Espacios vs Check-in & Códigos) */}
      <div className="bg-neutral-0 p-3 rounded-2xl border border-neutral-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Secciones del módulo de biblioteca" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reserva'}
            onClick={() => setActiveTab('reserva')}
            {...getVoiceProps('Pestaña Consulta y Simulación de Reserva de Espacios')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy ${
              activeTab === 'reserva'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === 'reserva' ? 'text-brand-gold' : 'text-neutral-500'}`} />
            <span>Reserva de Espacios (Simulador Alameda)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'checkin'}
            onClick={() => setActiveTab('checkin')}
            {...getVoiceProps('Pestaña Check-in Oficial y Gestión de Código de Reserva')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy ${
              activeTab === 'checkin'
                ? 'bg-brand-navy text-white shadow-xs'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
            }`}
          >
            <LogIn className={`w-4 h-4 ${activeTab === 'checkin' ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span>Check-in y Código de Reserva ({savedBookingCode || '2VF'})</span>
          </button>
        </div>

        {/* Recordatorio de Código Rápido en Barra */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 font-medium hidden md:inline">Tu código activo:</span>
          <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1 rounded-xl border border-neutral-200 font-mono font-bold text-brand-navy">
            <span>{savedBookingCode || '2VF'}</span>
            <button
              type="button"
              onClick={() => handleCopyCode(savedBookingCode)}
              title="Copiar código al portapapeles"
              aria-label={`Copiar código de reserva ${savedBookingCode}`}
              className="text-neutral-400 hover:text-neutral-800 p-0.5 rounded cursor-pointer"
            >
              {codeCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      {activeTab === 'reserva' && (
        <article
          aria-label={`Simulador interactivo de Bibliotecas Duoc UC ${DEFAULT_CAMPUS}`}
          className="bg-neutral-0 rounded-3xl border border-neutral-200/90 overflow-hidden shadow-xs space-y-6"
        >
          {/* Barra Institucional Superior */}
          <div className="bg-[#111111] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="font-serif font-black text-xl tracking-tight text-white block leading-none">
                Duoc<span className="text-brand-gold">UC</span>
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Bibliotecas • {DEFAULT_CAMPUS}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-slate-200 font-mono text-[11px] bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                {studentEmail}
              </span>
              <a
                href={LIBCAL_ALAMEDA_CONFIG.urls.consultas}
                target="_blank"
                rel="noopener noreferrer"
                {...getVoiceProps('Consúltanos en Bibliotecas Duoc UC')}
                className="text-slate-300 hover:text-white flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-brand-gold" aria-hidden="true" />
                <span>Consúltanos</span>
              </a>
            </div>
          </div>

          {/* Selector de Categorías LibCal Oficiales: Salas de estudio (gid=31398) vs Lentes VR (gid=52104) */}
          <div className="px-6 sm:px-8 pt-2">
            <div className="bg-neutral-50 p-2 rounded-2xl border border-neutral-200/90">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BIBLIOTECA_ALAMEDA_CATEGORIES.map((category) => {
                  const isSelected = category.id === selectedCategoryId;
                  const Icon = category.type === 'vr-headset' ? Glasses : Users;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleSelectCategory(category.id)}
                      {...getVoiceProps(`${category.name}. ${category.description}`)}
                      className={`min-h-[56px] p-3 rounded-xl text-left flex items-start gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-brand-navy text-white shadow-xs'
                          : 'bg-neutral-0 hover:bg-neutral-100 text-neutral-800 border border-neutral-200/80'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-neutral-0/15 text-brand-gold' : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold block truncate ${isSelected ? 'text-white' : 'text-neutral-900'}`}>
                            {category.name}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-neutral-0/20 text-white'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {category.type === 'vr-headset' ? 'Visores VR' : 'Salas Grupales'}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-0.5 leading-snug line-clamp-1 ${isSelected ? 'text-slate-200' : 'text-neutral-500'}`}>
                          {category.capacityLabel} • {category.equipmentSummary}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PASO 1: GRILLA HORARIA DE DISPONIBILIDAD */}
          {reservaStep === 'grid' && (
            <div className="px-6 sm:px-8 pb-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3
                      {...getVoiceProps(`Espacios para ${currentCategory.name}`)}
                      className="text-base font-bold text-neutral-900"
                    >
                      {currentCategory.name}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Duoc UC - {DEFAULT_CAMPUS} • Fecha: lunes, noviembre 16, 2026
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/80">
                    Capacidad máxima: {currentCategory.maxCapacity} {currentCategory.maxCapacity > 1 ? 'estudiantes' : 'estudiante'}
                  </span>
                </div>
              </div>

              {/* Tabla de Horarios */}
              <div className="overflow-x-auto border-2 border-neutral-200 rounded-2xl shadow-xs">
                <table className="w-full text-xs text-left border-collapse min-w-[780px]">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-800 font-bold">
                      <th scope="col" className="p-2 sm:p-3.5 sticky left-0 bg-neutral-100 z-10 w-[124px] max-w-[128px] sm:w-56 sm:max-w-none lg:w-64 border-r border-neutral-200">
                        Espacio / Recurso
                      </th>
                      {BIBLIOTECA_TIME_SLOTS.map((slot) => (
                        <th key={slot} scope="col" className="p-2 text-center border-r border-neutral-200 whitespace-nowrap">
                          {slot}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentCategory.spaces.map((space) => (
                      <tr key={space.id} className="border-b border-neutral-200 hover:bg-neutral-50/50">
                        <td className="p-2 sm:p-3.5 font-bold text-neutral-900 sticky left-0 bg-neutral-0 border-r border-neutral-200 z-10 w-[124px] max-w-[128px] sm:w-56 sm:max-w-none lg:w-64 whitespace-normal sm:whitespace-nowrap">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                            <div>
                              <span className="block">{space.name}</span>
                              <span className="text-[10px] text-neutral-500 font-normal block">
                                Capacidad: {space.capacity} {space.capacity > 1 ? 'personas' : 'persona'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-neutral-500 text-xs">
                              {space.accessible && <span title="Accesible">♿</span>}
                              {space.power && <span title="Tomas eléctricas">🔌</span>}
                              {space.screen && <span title="Pantalla / visor">🖥️</span>}
                            </div>
                          </div>
                        </td>
                        {BIBLIOTECA_TIME_SLOTS.map((time) => {
                          const isOccupied = occupiedSlots[`${space.id}-${time}`];
                          const isSelected =
                            selectedSlot?.roomId === space.id && selectedSlot?.time === time;

                          let bgClass = 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer';
                          let titleText = 'Disponible - Clic para reservar';

                          if (isOccupied) {
                            bgClass = 'bg-rose-600 text-white cursor-not-allowed';
                            titleText = 'No disponible';
                          } else if (isSelected) {
                            bgClass = 'bg-amber-400 text-slate-950 font-black ring-2 ring-slate-900 cursor-pointer';
                            titleText = 'Su Reserva seleccionada';
                          }

                          return (
                            <td key={time} className="p-1.5 text-center border-r border-neutral-200">
                              <button
                                type="button"
                                disabled={isOccupied}
                                onClick={() => handleSelectGridSlot(space, time)}
                                title={`${space.name} ${time}: ${titleText}`}
                                aria-label={`${space.name} bloque ${time}: ${titleText}`}
                                {...getVoiceProps(`${space.name} bloque ${time}: ${titleText}`)}
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
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-neutral-700 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-4 rounded bg-emerald-600 inline-block shadow-2xs" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-4 rounded bg-amber-400 inline-block shadow-2xs" />
                  <span>Su Selección</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-4 rounded bg-rose-600 inline-block shadow-2xs" />
                  <span>Ocupado / No disponible</span>
                </div>
              </div>

              {/* Resumen del bloque seleccionado */}
              {selectedSlot && (
                <div className="bg-neutral-50 border-2 border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-navy text-brand-gold flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                        Espacio &amp; Bloque Seleccionado
                      </p>
                      <p className="font-extrabold text-neutral-900 text-sm sm:text-base">
                        {selectedSlot.roomName} ({currentCategory.shortName}): {selectedSlot.time}, {selectedSlot.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedSlot(null)}
                      aria-label="Descartar selección"
                      {...getVoiceProps('Descartar selección de horario')}
                      className="min-h-[44px] px-3.5 py-2 bg-neutral-0 hover:bg-neutral-100 text-neutral-700 rounded-xl font-bold text-xs border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span className="hidden sm:inline">Descartar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReservaStep('form')}
                      {...getVoiceProps('Hacer una reserva con el horario seleccionado')}
                      className="min-h-[44px] flex-1 sm:flex-initial px-6 py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white font-extrabold text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Continuar con la reserva
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: FORMULARIO COORDINADO CON LA BD */}
          {reservaStep === 'form' && (
            <div className="p-6 sm:p-10 space-y-6">
              <div className="text-xs font-bold text-neutral-600 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <span className="text-brand-navy">Biblioteca Duoc UC</span>
                <span>/</span>
                <span className="text-brand-navy">{DEFAULT_CAMPUS}</span>
                <span>/</span>
                <span className="text-neutral-800">{currentCategory.name}</span>
              </div>

              <div>
                <h3
                  {...getVoiceProps(`Detalles de la reserva en Biblioteca Sede Alameda para ${selectedSlot.roomName}`)}
                  className="text-2xl font-serif font-bold text-slate-950"
                >
                  Detalles de la reserva
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                  Verifica tus datos institucionales para generar tu código oficial de check-in (ej. 2VF).
                </p>
              </div>

              {/* Resumen del bloque */}
              <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                <table className="w-full text-xs text-left min-w-[500px]">
                  <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-800 font-bold">
                    <tr>
                      <th className="p-3">Recurso</th>
                      <th className="p-3">Tipo de Espacio</th>
                      <th className="p-3">Horario</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100">
                      <td className="p-3 font-bold text-neutral-900">{selectedSlot.roomName}</td>
                      <td className="p-3 text-neutral-600">{currentCategory.name}</td>
                      <td className="p-3 text-neutral-800 font-medium">{selectedSlot.time}</td>
                      <td className="p-3 text-neutral-800 font-medium">{selectedSlot.date}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setReservaStep('grid')}
                          {...getVoiceProps('Cambiar horario y volver a la grilla')}
                          className="min-h-[38px] px-3.5 py-1.5 bg-neutral-0 hover:bg-neutral-100 text-neutral-700 font-bold text-xs rounded-lg border border-slate-300 cursor-pointer"
                        >
                          Cambiar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Formulario */}
              <form onSubmit={handleConfirmReservation} className="space-y-4 max-w-2xl">
                <h4 className="text-sm font-bold text-neutral-900 pt-2">
                  Datos de contacto institucional (Sincronizados con tu sesión):
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="res-nombre" className="block text-xs font-bold text-neutral-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      id="res-nombre"
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      {...getVoiceProps(`Nombre, ${formData.nombre}`)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-neutral-50 focus:bg-neutral-0 focus:ring-2 focus:ring-[#002B49]"
                      placeholder="Nombre"
                    />
                  </div>

                  <div>
                    <label htmlFor="res-apellido" className="block text-xs font-bold text-neutral-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      id="res-apellido"
                      type="text"
                      required
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      {...getVoiceProps(`Apellido, ${formData.apellido}`)}
                      className="w-full min-h-[44px] px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-neutral-50 focus:bg-neutral-0 focus:ring-2 focus:ring-[#002B49]"
                      placeholder="Apellido"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="res-email" className="block text-xs font-bold text-neutral-700 mb-1">
                    Correo institucional Duoc UC *
                  </label>
                  <input
                    id="res-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    {...getVoiceProps(`Correo institucional, ${formData.email}`)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-neutral-50 focus:bg-neutral-0 focus:ring-2 focus:ring-[#002B49]"
                  />
                </div>

                <div>
                  <label htmlFor="res-rut" className="block text-xs font-bold text-neutral-700 mb-1">
                    RUT Institucional (ejemplo 21.987.654-3) *
                  </label>
                  <input
                    id="res-rut"
                    type="text"
                    required
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    {...getVoiceProps(`RUT institucional, ${formData.rut}`)}
                    className="w-full min-h-[44px] px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-neutral-50 focus:bg-neutral-0 focus:ring-2 focus:ring-[#002B49]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <button
                    type="submit"
                    {...getVoiceProps('Confirmar reserva y generar código de check-in')}
                    className="min-h-[44px] px-6 py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white font-black text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Confirmar Reserva (Generar Código)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReservaStep('grid')}
                    {...getVoiceProps('Volver a la Grilla de Selección')}
                    className="min-h-[44px] px-5 py-2.5 bg-neutral-0 hover:bg-neutral-100 text-neutral-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 cursor-pointer"
                  >
                    Volver a la Grilla
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PASO 3: CONFIRMACIÓN EXITOSA CON CÓDIGO TIPO 2VF */}
          {reservaStep === 'success' && confirmedBooking && (
            <div className="p-6 sm:p-10 space-y-6">
              <div className="flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <h3
                  {...getVoiceProps(`Reserva confirmada. Tu código de ingreso oficial es ${confirmedBooking.code}`)}
                  className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-slate-950"
                >
                  ¡Reserva confirmada con éxito!
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-neutral-700 max-w-2xl leading-relaxed">
                Tu solicitud para <strong>{confirmedBooking.roomName}</strong> en Duoc UC - {DEFAULT_CAMPUS} está lista. Aquí tienes tu código para registrar tu ingreso al llegar:
              </p>

              {/* Tarjeta de Código Destacado */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 max-w-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                    Tu Código de Ingreso
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl font-black font-mono tracking-widest text-brand-navy">
                      {confirmedBooking.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(confirmedBooking.code)}
                      {...getVoiceProps(`Copiar código ${confirmedBooking.code}`)}
                      className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {codeCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <span className="text-[11px] text-amber-800 font-medium block mt-1">
                    Recuerda registrarlo dentro de los primeros 15 minutos en Biblioteca Alameda.
                  </span>
                </div>

                <a
                  href={LIBCAL_ALAMEDA_CONFIG.urls.checkin}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...getVoiceProps('Abrir pantalla oficial de check-in')}
                  className="min-h-[42px] px-4 py-2 bg-brand-navy text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <LogIn className="w-4 h-4 text-emerald-400" />
                  <span>Check-in Oficial</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
              </div>

              {/* Información espacial y de usuario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
                <div className="p-5 bg-neutral-50 border-2 border-neutral-200 rounded-2xl space-y-2">
                  <h4 className="text-sm font-extrabold text-neutral-900 border-b border-neutral-200 pb-2">
                    Detalles del Espacio
                  </h4>
                  <div className="text-xs space-y-1 text-neutral-700">
                    <p><strong>Sede:</strong> Duoc UC - {DEFAULT_CAMPUS}</p>
                    <p><strong>Categoría:</strong> {confirmedBooking.categoryName}</p>
                    <p><strong>Espacio:</strong> {confirmedBooking.roomName}</p>
                    <p><strong>Fecha:</strong> {confirmedBooking.date}</p>
                    <p><strong>Bloque:</strong> {confirmedBooking.time}</p>
                  </div>
                </div>

                <div className="p-5 bg-neutral-50 border-2 border-neutral-200 rounded-2xl space-y-2">
                  <h4 className="text-sm font-extrabold text-neutral-900 border-b border-neutral-200 pb-2">
                    Datos del Estudiante
                  </h4>
                  <div className="text-xs space-y-1 text-neutral-700">
                    <p><strong>Nombre:</strong> {confirmedBooking.nombre} {confirmedBooking.apellido}</p>
                    <p><strong>Correo:</strong> {confirmedBooking.email}</p>
                    <p><strong>RUT:</strong> {confirmedBooking.rut}</p>
                    <p><strong>Estado:</strong> Confirmada (Pendiente de Check-in)</p>
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
                  className="min-h-[44px] px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ir a Registrar Ingreso con este Código</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReservaStep('grid')}
                  {...getVoiceProps('Hacer otra simulación de reserva')}
                  className="min-h-[44px] px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 cursor-pointer"
                >
                  Hacer otra simulación
                </button>
              </div>
            </div>
          )}
        </article>
      )}

      {/* 5. PESTAÑA: CHECK-IN Y GESTIÓN DE CÓDIGO (Apoyo Práctico y Cancelación) */}
      {activeTab === 'checkin' && (
        <article
          aria-label="Panel de Check-in y gestión de código de reserva"
          className="bg-neutral-0 rounded-3xl border border-neutral-200/90 p-6 sm:p-10 shadow-xs space-y-8"
        >
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <LogIn className="w-7 h-7" />
            </div>

            <h3
              {...getVoiceProps(`Registra tu Ingreso Check-in en Biblioteca Duoc UC ${DEFAULT_CAMPUS}`)}
              className="text-2xl sm:text-3xl font-serif font-black text-slate-950"
            >
              Registra tu Ingreso (Check-in) en Biblioteca Alameda
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Ingresa el código alfanumérico enviado a tu correo institucional (ej. <strong>2VF</strong>) para confirmar tu asistencia presencial y activar tu espacio de estudio.
            </p>
          </div>

          {/* Formulario de Check-in */}
          <div className="max-w-md mx-auto">
            {checkinSuccess ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-400 rounded-2xl space-y-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-emerald-950 text-lg">
                  ¡Ingreso Validado Exitosamente!
                </h4>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Tu espacio en <strong>Biblioteca Duoc UC - {DEFAULT_CAMPUS}</strong> ha quedado activado. Dispones del bloque de 60 minutos de estudio.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckinSuccess(false);
                      setActiveTab('reserva');
                      setReservaStep('grid');
                    }}
                    {...getVoiceProps('Volver a Reserva')}
                    className="min-h-[40px] px-5 py-2 bg-brand-navy text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Volver a Reserva
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePerformCheckin} className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="input-checkin-code" className="text-xs font-bold text-neutral-700">
                      Código de reserva (ej: 2VF) *
                    </label>
                    {savedBookingCode && (
                      <button
                        type="button"
                        onClick={() => setCheckinInputCode(savedBookingCode)}
                        className="text-[11px] font-bold text-brand-navy hover:underline cursor-pointer"
                      >
                        Usar mi código ({savedBookingCode})
                      </button>
                    )}
                  </div>
                  <input
                    id="input-checkin-code"
                    type="text"
                    required
                    value={checkinInputCode}
                    onChange={(e) => setCheckinInputCode(e.target.value.toUpperCase())}
                    placeholder="Ej. 2VF"
                    maxLength={10}
                    {...getVoiceProps(`Código de confirmación${checkinInputCode ? `, ${checkinInputCode}` : ''}`)}
                    className="w-full min-h-[48px] px-4 py-2 text-center text-2xl font-mono font-black uppercase tracking-widest border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-[#002B49] bg-neutral-0"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    {...getVoiceProps('Validar Ingreso en Simulador')}
                    className="w-full min-h-[46px] px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Validar Ingreso en Simulador
                  </button>

                  <a
                    href={LIBCAL_ALAMEDA_CONFIG.urls.checkin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleCopyCode(checkinInputCode || savedBookingCode)}
                    {...getVoiceProps('Copiar código e ir a pantalla oficial de Check-in')}
                    className="w-full min-h-[46px] px-6 py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <ExternalLink className="w-4 h-4 text-brand-gold" />
                    <span>Copiar e ir a Check-in Oficial</span>
                  </a>
                </div>
              </form>
            )}
          </div>

          {/* Tarjetas de Apoyo: Regla de los 15 Minutos y Gestión de Cancelación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-none pt-4 border-t border-neutral-200">
            {/* Regla de los 15 minutos */}
            <div className="p-5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2.5 text-amber-950 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <h4>Regla de los 15 minutos de tolerancia</h4>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                En Bibliotecas Duoc UC, dispones de hasta <strong>15 minutos</strong> desde la hora de inicio de tu reserva para registrar tu ingreso presencial. Si no realizas el check-in en ese período, el sistema libera automáticamente la sala para que otros compañeros puedan utilizarla.
              </p>
            </div>

            {/* Cancelación Oportuna */}
            <div className="p-5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2.5 text-blue-950 font-bold text-sm">
                <Info className="w-5 h-5 text-brand-navy shrink-0" />
                <h4>¿No vas a poder asistir? Cancela a tiempo</h4>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                En el correo de confirmación enviado a tu casilla institucional encontrarás el enlace directo de <strong>cancelación</strong>. Al cancelar oportunamente, liberas la sala para que compañeros de Sede Alameda que la necesiten puedan utilizarla.
              </p>
              <div className="pt-1">
                <a
                  href={LIBCAL_ALAMEDA_CONFIG.urls.alamedaSpaces}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-brand-navy hover:underline inline-flex items-center gap-1"
                >
                  <span>Gestionar reservas en Portal Alameda</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </article>
      )}

      {/* 6. Barra Institucional Inferior */}
      <footer className="bg-neutral-50 border border-neutral-200/90 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Bibliotecas Duoc UC • Sede Alameda • Ley N° 21.719</span>
        </div>
        <div className="flex items-center gap-4 font-semibold">
          <a
            href={LIBCAL_ALAMEDA_CONFIG.urls.basePortal}
            target="_blank"
            rel="noopener noreferrer"
            {...getVoiceProps('Ir a bibliotecas.duoc.cl reserva de sala')}
            className="hover:text-neutral-900 underline"
          >
            bibliotecas.duoc.cl/reserva-sala
          </a>
        </div>
      </footer>
    </section>
  );
};
