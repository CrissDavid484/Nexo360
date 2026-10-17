import React, { useState } from 'react';
import {
  DUOC_BIBLIOTECAS_SEDES,
  VIVO_STUDENT_PROFILE,
} from '../../data/vivoDuocData';
import {
  Volume2,
  Play,
  Search,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  X,
  LogIn,
  LogOut,
  Calendar,
} from 'lucide-react';

export const BibliotecaView = () => {
  const [activeSubTab, setActiveSubTab] = useState('salas'); // 'salas' | 'vr'
  const [selectedSede, setSelectedSede] = useState('Biblioteca Alameda');
  const [isSedeDropdownOpen, setIsSedeDropdownOpen] = useState(false);
  const [sedeSearchTerm, setSedeSearchTerm] = useState('');

  // Modales de Registro de Ingreso / Salida (Screenshots 9 y 10)
  const [activeModal, setActiveModal] = useState(null); // null | 'ingreso' | 'salida' | 'reservar'
  const [checkinCode, setCheckinCode] = useState('');
  const [checkoutCode, setCheckoutCode] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Estado del formulario interactivo de reserva
  const [bookingData, setBookingData] = useState({
    fecha: '2026-10-19',
    horario: '14:00 - 15:00 hrs',
    tipo: 'paedis', // 'grupal' | 'individual' | 'paedis'
  });
  const [myReservations, setMyReservations] = useState([
    {
      id: 'RES-ALM-8942',
      sede: 'Biblioteca Alameda',
      sala: 'Sala Inclusiva PAEDIS 01 (Mobiliario Accesible)',
      fecha: '2026-10-19',
      horario: '14:00 - 15:00 hrs',
      estado: 'Confirmada',
    },
  ]);

  const filteredSedes = DUOC_BIBLIOTECAS_SEDES.filter((sede) =>
    sede.toLowerCase().includes(sedeSearchTerm.toLowerCase())
  );

  const handleSelectSede = (sede) => {
    setSelectedSede(sede);
    setIsSedeDropdownOpen(false);
    setSedeSearchTerm('');
  };

  const handleConfirmReservation = (e) => {
    e.preventDefault();
    const newCode = `RES-ALM-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRes = {
      id: newCode,
      sede: selectedSede,
      sala:
        bookingData.tipo === 'paedis'
          ? 'Sala Inclusiva PAEDIS (Software NVDA / ZoomText)'
          : bookingData.tipo === 'grupal'
          ? 'Sala de Estudio Grupal (hasta 6 pers)'
          : 'Sala de Estudio Individual',
      fecha: bookingData.fecha,
      horario: bookingData.horario,
      estado: 'Confirmada',
    };

    setMyReservations([newRes, ...myReservations]);
    setActiveModal(null);
    setFeedbackMessage({
      type: 'success',
      text: `¡Reserva exitosa en ${selectedSede}! Código: ${newCode}. Ha sido guardado en tus reservas activas.`,
    });
  };

  const handleProcessCheckin = (e) => {
    e.preventDefault();
    if (!checkinCode.trim()) return;

    setFeedbackMessage({
      type: 'success',
      text: `Ingreso registrado exitosamente para el código ${checkinCode}. Disfruta tu sesión de estudio.`,
    });
    setCheckinCode('');
    setActiveModal(null);
  };

  const handleProcessCheckout = (e) => {
    e.preventDefault();
    if (!checkoutCode.trim()) return;

    setFeedbackMessage({
      type: 'info',
      text: `Salida registrada exitosamente para el código ${checkoutCode}. La sala ha quedado liberada.`,
    });
    setCheckoutCode('');
    setActiveModal(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Oficial de Bibliotecas Duoc UC (Screenshot 7) */}
      <div className="bg-black text-white px-4 sm:px-6 py-2.5 rounded-t-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-serif font-black text-base tracking-wide text-white">
            DuocUC
          </span>
          <span className="text-[10px] text-slate-400 font-sans tracking-widest uppercase border-l border-slate-700 pl-3">
            Bibliotecas
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-300 font-medium">
          <span className="hover:text-amber-400 cursor-pointer hidden md:inline">Estudiantes</span>
          <span className="hover:text-amber-400 cursor-pointer hidden md:inline">Docentes</span>
          <span className="hover:text-amber-400 cursor-pointer hidden md:inline">Campus Virtual</span>
          <span className="text-amber-400 font-bold border border-amber-400/40 px-2 py-0.5 rounded">
            {selectedSede}
          </span>
        </div>
      </div>

      {/* 2. Barra Dorada Oficial "Reservas" (Screenshot 7) */}
      <div className="bg-[#FFAA00] text-slate-950 px-6 py-3.5 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight font-serif text-slate-950">
          Reservas
        </h1>

        <div className="flex items-center gap-2">
          {/* Botón Escuchar (Accesibilidad) */}
          <button
            type="button"
            className="flex items-center gap-1.5 bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 px-3 py-1 rounded-md text-xs font-bold border border-slate-900/20 focus:ring-2 focus:ring-slate-900"
            aria-label="Escuchar condiciones de reserva con sintetizador de voz"
          >
            <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Escuchar</span>
            <Play className="w-3 h-3 fill-current" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mensaje de feedback tras reservar o check-in/out */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-blue-50 text-blue-900 border-blue-300'
          }`}
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="p-1 rounded hover:bg-black/5"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Pestañas Principales: Salas de Estudio / Lentes VR (Screenshot 7) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="border-b border-slate-200 flex items-center gap-8 text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveSubTab('salas')}
            className={`pb-3 border-b-4 transition-all focus:outline-none ${
              activeSubTab === 'salas'
                ? 'border-[#FFAA00] text-slate-950 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Salas de estudio
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('vr')}
            className={`pb-3 border-b-4 transition-all focus:outline-none ${
              activeSubTab === 'vr'
                ? 'border-[#FFAA00] text-slate-950 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Lentes VR
          </button>
        </div>

        {/* 4. Barra de Acciones: Selecciona tu sede | Registra el ingreso | Registra la salida */}
        <div className="py-6 flex flex-wrap items-center gap-3 relative">
          {/* Botón Selecciona tu sede con dropdown (Screenshot 8) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSedeDropdownOpen(!isSedeDropdownOpen)}
              className="px-4 py-2.5 bg-[#FFAA00] hover:bg-[#e69900] text-slate-950 font-black text-xs sm:text-sm rounded-lg shadow-sm flex items-center gap-2 transition-colors focus:ring-4 focus:ring-amber-300"
              aria-expanded={isSedeDropdownOpen}
              aria-haspopup="listbox"
            >
              <span>{selectedSede}</span>
              <span className="text-xs">▼</span>
            </button>

            {/* Dropdown flotante con buscador de sedes (Screenshot 8) */}
            {isSedeDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-[#FFAA00] p-3 z-30">
                <div className="relative mb-2">
                  <input
                    type="text"
                    value={sedeSearchTerm}
                    onChange={(e) => setSedeSearchTerm(e.target.value)}
                    placeholder="Busca tu biblioteca..."
                    className="w-full text-xs p-2.5 pl-8 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FFAA00] focus:outline-none font-medium"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" aria-hidden="true" />
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {filteredSedes.map((sede) => (
                    <button
                      key={sede}
                      type="button"
                      onClick={() => handleSelectSede(sede)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        selectedSede === sede
                          ? 'bg-amber-100 font-bold text-slate-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {sede}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botón Reservar Ahora (Nexo360) */}
          <button
            type="button"
            onClick={() => setActiveModal('reservar')}
            className="px-4 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm flex items-center gap-2 transition-colors focus:ring-4 focus:ring-amber-400"
          >
            <Calendar className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>Nueva Reserva</span>
          </button>

          {/* Botón Registra el ingreso (Screenshot 9) */}
          <button
            type="button"
            onClick={() => setActiveModal('ingreso')}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-lg border border-slate-300 shadow-xs flex items-center gap-2 transition-colors focus:ring-4 focus:ring-amber-400"
          >
            <LogIn className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Registra el ingreso</span>
          </button>

          {/* Botón Registra la salida (Screenshot 10) */}
          <button
            type="button"
            onClick={() => setActiveModal('salida')}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-lg border border-slate-300 shadow-xs flex items-center gap-2 transition-colors focus:ring-4 focus:ring-amber-400"
          >
            <LogOut className="w-4 h-4 text-red-600" aria-hidden="true" />
            <span>Registra la salida</span>
          </button>
        </div>

        {/* 5. Mis Reservas Activas */}
        {myReservations.length > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
              Tus Reservas Programadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myReservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#002B49]">{res.id}</span>
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {res.estado}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{res.sala}</p>
                    <p className="text-[11px] text-slate-500">{res.sede} • {res.fecha} ({res.horario})</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckinCode(res.id);
                      setActiveModal('ingreso');
                    }}
                    className="text-xs font-bold text-[#002B49] hover:underline"
                  >
                    Check-in
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Layout Oficial de Contenido: Condiciones + Imagen (Screenshot 7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Condiciones Generales oficiales */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase mb-3">
                CONDICIONES GENERALES
              </h2>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FFAA00] font-black text-base shrink-0">◆</span>
                  <span>
                    Cada reserva corresponde a un módulo de <strong>1 hora reloj (60 minutos)</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FFAA00] font-black text-base shrink-0">◆</span>
                  <span>
                    Para activar tu reserva debes <strong>registrar tu ingreso</strong> con el código que recibirás al inicio del bloque. Al terminar, <strong>registra la salida</strong> desde este mismo portal.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FFAA00] font-black text-base shrink-0">◆</span>
                  <span>
                    Si finalmente no ocuparás la sala o el equipo, <strong>cancela tu reserva</strong> para que otro estudiante pueda usarla.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FFAA00] font-black text-base shrink-0">◆</span>
                  <span>
                    Se debe mantener una <strong>conducta académica y de estudio</strong> durante todo el uso del espacio, evitando el ruido y conversaciones que perturben al resto de los estudiantes.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#FFAA00] font-black text-base shrink-0">◆</span>
                  <span>
                    El uso del espacio y de los equipos se rige por el reglamento de Biblioteca y las indicaciones del personal de tu sede.
                  </span>
                </li>
              </ul>
            </div>

            {/* Recuadro Salas de Estudio */}
            <div className="border-t border-slate-200 pt-4">
              <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase mb-2">
                SALAS DE ESTUDIO
              </h2>
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <span className="text-[#FFAA00] font-black text-base shrink-0">◆</span>
                <p>
                  El horario para reservar comienza a las <strong>9:00 hrs.</strong> y termina a las <strong>21:00 hrs. del viernes</strong>. Si necesitas la sala un sábado, verifica la última hora de reserva disponible en tu biblioteca.
                </p>
              </div>
            </div>

            {/* Beneficio Inclusivo PAEDIS */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-700" aria-hidden="true" />
                <span>Salas Inclusivas PAEDIS</span>
              </div>
              <p>
                Como estudiante del programa PAEDIS, tienes acceso prioritario a salas con aislamiento sensorial, computadores con magnificación de pantalla, software lector y asistencia del personal de biblioteca.
              </p>
            </div>
          </div>

          {/* Columna Derecha: Foto Oficial de Estudiantes en Biblioteca (Screenshot 7) */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop&q=80"
                alt="Estudiantes trabajando en sala de estudio de biblioteca Duoc UC"
                className="w-full h-80 lg:h-[420px] object-cover"
              />
            </div>
            <div className="mt-3 text-center">
              <span className="text-[11px] text-slate-400 font-medium">
                Espacios colaborativos y salas de estudio • Duoc UC Bibliotecas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: REGISTRAR EL INGRESO (Screenshot 9) */}
      {activeModal === 'ingreso' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ingreso-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 id="ingreso-title" className="text-xl font-black text-slate-900">
                Registra el ingreso
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              Ingresa el <strong>"código de la reserva"</strong> que fue enviado por correo electrónico al momento de crear la reserva.
            </p>

            <form onSubmit={handleProcessCheckin} className="space-y-4">
              <div>
                <label htmlFor="codigo-ingreso" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Código de la reserva:
                </label>
                <input
                  id="codigo-ingreso"
                  type="text"
                  value={checkinCode}
                  onChange={(e) => setCheckinCode(e.target.value)}
                  placeholder="Ej: RES-SJ-8942"
                  className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49] focus:outline-none uppercase font-mono font-bold"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white rounded-lg text-xs font-black shadow-md focus:ring-4 focus:ring-amber-400"
                >
                  Registra el ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR LA SALIDA (Screenshot 10) */}
      {activeModal === 'salida' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="salida-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 id="salida-title" className="text-xl font-black text-slate-900">
                Registra la salida
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              Para registrar la salida, ingresa el <strong>"código de la reserva"</strong> que fue enviado por correo electrónico al momento de crear la reserva.
            </p>

            <form onSubmit={handleProcessCheckout} className="space-y-4">
              <div>
                <label htmlFor="codigo-salida" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Código de la reserva:
                </label>
                <input
                  id="codigo-salida"
                  type="text"
                  value={checkoutCode}
                  onChange={(e) => setCheckoutCode(e.target.value)}
                  placeholder="Ej: RES-SJ-8942"
                  className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49] focus:outline-none uppercase font-mono font-bold"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white rounded-lg text-xs font-black shadow-md focus:ring-4 focus:ring-amber-400"
                >
                  Registra la salida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NUEVA RESERVA INTERACTIVA */}
      {activeModal === 'reservar' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="nueva-reserva-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 id="nueva-reserva-title" className="text-xl font-black text-slate-900">
                  Reservar Sala de Estudio
                </h2>
                <p className="text-xs text-slate-500">{selectedSede}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReservation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo de Sala Requerida:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingData({ ...bookingData, tipo: 'paedis' })}
                    className={`p-3 rounded-lg border text-left text-xs font-bold transition-all ${
                      bookingData.tipo === 'paedis'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-amber-800 mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>PAEDIS</span>
                    </div>
                    <span className="font-semibold block text-[11px]">Inclusiva / Asistiva</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingData({ ...bookingData, tipo: 'grupal' })}
                    className={`p-3 rounded-lg border text-left text-xs font-bold transition-all ${
                      bookingData.tipo === 'grupal'
                        ? 'border-[#002B49] bg-slate-50 text-[#002B49] ring-2 ring-[#002B49]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[#002B49] mb-1">
                      <Users className="w-4 h-4" />
                      <span>Grupal</span>
                    </div>
                    <span className="font-semibold block text-[11px]">Hasta 6 pers.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBookingData({ ...bookingData, tipo: 'individual' })}
                    className={`p-3 rounded-lg border text-left text-xs font-bold transition-all ${
                      bookingData.tipo === 'individual'
                        ? 'border-[#002B49] bg-slate-50 text-[#002B49] ring-2 ring-[#002B49]'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[#002B49] mb-1">
                      <Clock className="w-4 h-4" />
                      <span>Individual</span>
                    </div>
                    <span className="font-semibold block text-[11px]">1 persona</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="res-fecha" className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha:
                  </label>
                  <input
                    id="res-fecha"
                    type="date"
                    value={bookingData.fecha}
                    onChange={(e) => setBookingData({ ...bookingData, fecha: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49]"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="res-horario" className="block text-xs font-bold text-slate-700 mb-1">
                    Bloque Horario (60 min):
                  </label>
                  <select
                    id="res-horario"
                    value={bookingData.horario}
                    onChange={(e) => setBookingData({ ...bookingData, horario: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49]"
                  >
                    <option value="10:00 - 11:00 hrs">10:00 - 11:00 hrs</option>
                    <option value="11:00 - 12:00 hrs">11:00 - 12:00 hrs</option>
                    <option value="14:00 - 15:00 hrs">14:00 - 15:00 hrs</option>
                    <option value="15:00 - 16:00 hrs">15:00 - 16:00 hrs</option>
                    <option value="16:00 - 17:00 hrs">16:00 - 17:00 hrs</option>
                    <option value="18:00 - 19:00 hrs">18:00 - 19:00 hrs</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#FFAA00] hover:bg-[#e69900] text-slate-950 font-black text-xs rounded-lg shadow-md focus:ring-4 focus:ring-amber-300"
                >
                  Confirmar y Generar Código
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
