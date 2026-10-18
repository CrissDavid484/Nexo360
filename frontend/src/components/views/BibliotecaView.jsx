import React, { useState } from 'react';
import {
  DUOC_BIBLIOTECAS_SEDES,
} from '../../data/vivoDuocData';
import {
  Volume2,
  Play,
  Search,
  CheckCircle2,
  Clock,
  X,
  LogIn,
  LogOut,
  Calendar,
  CheckCircle
} from 'lucide-react';

export const BibliotecaView = () => {
  const [activeSubTab, setActiveSubTab] = useState('salas');
  const [selectedSede, setSelectedSede] = useState('Biblioteca Alameda');
  const [isSedeDropdownOpen, setIsSedeDropdownOpen] = useState(false);
  const [sedeSearchTerm, setSedeSearchTerm] = useState('');

  const [activeModal, setActiveModal] = useState(null);
  const [checkinCode, setCheckinCode] = useState('');
  const [checkoutCode, setCheckoutCode] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Estados del Bot y SSE
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMensaje, setStatusMensaje] = useState(null);

  // ESTADOS DEL FLUJO DE DISPONIBILIDAD (2 PASOS)
  const [bookingStep, setBookingStep] = useState(1); // 1: Elegir Horario, 2: Elegir Sala
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);

  const [bookingData, setBookingData] = useState({
    fecha: '2026-10-19',
    horario: '09:00 - 09:50',
    salaSeleccionada: ''
  });

  const [myReservations, setMyReservations] = useState([
    {
      id: 'RES-ALM-8942',
      sede: 'Biblioteca Alameda',
      sala: 'Sala de estudio 2',
      fecha: '2026-10-19',
      horario: '09:00 - 09:50',
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

  // PASO 1: Simular búsqueda de disponibilidad en la grilla
  const handleCheckAvailability = (e) => {
    e.preventDefault();
    setIsCheckingAvailability(true);

    // Simulamos un micro-delay de consulta al backend
    setTimeout(() => {
      // Simulamos que encuentra un par de salas libres al azar
      const mockSalas = ['Sala de estudio 1', 'Sala de estudio 3', 'Sala de estudio 4'].sort(() => 0.5 - Math.random()).slice(0, 2);
      setAvailableRooms(mockSalas.sort());
      setBookingData({ ...bookingData, salaSeleccionada: mockSalas[0] });
      setIsCheckingAvailability(false);
      setBookingStep(2); // Pasamos al paso 2
    }, 1200);
  };

  // PASO 2: Enviar al bot a reservar la sala específica
  const handleConfirmReservation = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setStatusMensaje({ type: 'info', text: 'Conectando con Nexo360 Bot...' });

    // Enviamos los datos reales elegidos al backend
    const urlParams = new URLSearchParams({
      username: "cri.guzmang@duocuc.cl",
      rut: "19276735-0",
      nombre: "Cristian",
      apellido: "Guzmán",
      horario: bookingData.horario,
      sala: bookingData.salaSeleccionada
    });

    const eventSource = new EventSource(`http://localhost:5000/api/reservar-sala/stream?${urlParams.toString()}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatusMensaje({ type: data.tipo, text: data.texto });

      if (data.tipo === 'exito') {
        const newCode = `RES-ALM-${Math.floor(1000 + Math.random() * 9000)}`;
        const newRes = {
          id: newCode,
          sede: selectedSede,
          sala: bookingData.salaSeleccionada,
          fecha: bookingData.fecha,
          horario: bookingData.horario,
          estado: 'Confirmada',
        };

        setMyReservations((prev) => [newRes, ...prev]);

        setTimeout(() => {
          eventSource.close();
          cerrarModalReserva();
          setFeedbackMessage({
            type: 'success',
            text: `¡Reserva automatizada exitosa en ${selectedSede}! Código: ${newCode}. Ha sido guardado en tus reservas.`,
          });
        }, 2500);
      } else if (data.tipo === 'error') {
        setIsProcessing(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setStatusMensaje({ type: 'error', text: 'Se perdió la conexión con el bot del backend.' });
      setIsProcessing(false);
      eventSource.close();
    };
  };

  const cerrarModalReserva = () => {
    setActiveModal(null);
    setBookingStep(1);
    setIsProcessing(false);
    setStatusMensaje(null);
  };

  const handleProcessCheckin = (e) => {
    e.preventDefault();
    if (!checkinCode.trim()) return;
    setFeedbackMessage({ type: 'success', text: `Ingreso registrado exitosamente para el código ${checkinCode}.` });
    setCheckinCode('');
    setActiveModal(null);
  };

  const handleProcessCheckout = (e) => {
    e.preventDefault();
    if (!checkoutCode.trim()) return;
    setFeedbackMessage({ type: 'info', text: `Salida registrada exitosamente para el código ${checkoutCode}. La sala ha quedado liberada.` });
    setCheckoutCode('');
    setActiveModal(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Oficial de Bibliotecas Duoc UC */}
      <div className="bg-black text-white px-4 sm:px-6 py-2.5 rounded-t-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-serif font-black text-base tracking-wide text-white">DuocUC</span>
          <span className="text-[10px] text-slate-400 font-sans tracking-widest uppercase border-l border-slate-700 pl-3">Bibliotecas</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 font-medium">
          <span className="text-amber-400 font-bold border border-amber-400/40 px-2 py-0.5 rounded">{selectedSede}</span>
        </div>
      </div>

      {/* 2. Barra Dorada Oficial "Reservas" */}
      <div className="bg-[#FFAA00] text-slate-950 px-6 py-3.5 shadow-sm flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight font-serif text-slate-950">Reservas</h1>
        <button type="button" className="flex items-center gap-1.5 bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 px-3 py-1 rounded-md text-xs font-bold border border-slate-900/20">
          <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Escuchar</span>
          <Play className="w-3 h-3 fill-current" aria-hidden="true" />
        </button>
      </div>

      {feedbackMessage && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm border ${feedbackMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-blue-50 text-blue-900 border-blue-300'}`} role="status">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button type="button" onClick={() => setFeedbackMessage(null)} className="p-1 rounded hover:bg-black/5"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* 3. Pestañas Principales */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="border-b border-slate-200 flex items-center gap-8 text-sm font-bold">
          <button type="button" onClick={() => setActiveSubTab('salas')} className={`pb-3 border-b-4 transition-all focus:outline-none ${activeSubTab === 'salas' ? 'border-[#FFAA00] text-slate-950 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>Salas de estudio</button>
          <button type="button" onClick={() => setActiveSubTab('vr')} className={`pb-3 border-b-4 transition-all focus:outline-none ${activeSubTab === 'vr' ? 'border-[#FFAA00] text-slate-950 font-black' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>Lentes VR</button>
        </div>

        {/* 4. Barra de Acciones */}
        <div className="py-6 flex flex-wrap items-center gap-3 relative">
          <div className="relative">
            <button type="button" onClick={() => setIsSedeDropdownOpen(!isSedeDropdownOpen)} className="px-4 py-2.5 bg-[#FFAA00] hover:bg-[#e69900] text-slate-950 font-black text-xs sm:text-sm rounded-lg shadow-sm flex items-center gap-2 transition-colors">
              <span>{selectedSede}</span><span className="text-xs">▼</span>
            </button>
            {isSedeDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-[#FFAA00] p-3 z-30">
                <div className="relative mb-2">
                  <input type="text" value={sedeSearchTerm} onChange={(e) => setSedeSearchTerm(e.target.value)} placeholder="Busca tu biblioteca..." className="w-full text-xs p-2.5 pl-8 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FFAA00] focus:outline-none font-medium" autoFocus />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" aria-hidden="true" />
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {filteredSedes.map((sede) => (
                    <button key={sede} type="button" onClick={() => handleSelectSede(sede)} className={`w-full text-left px-3 py-2 rounded-md transition-colors ${selectedSede === sede ? 'bg-amber-100 font-bold text-slate-900' : 'hover:bg-slate-50 text-slate-700'}`}>{sede}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button type="button" onClick={() => setActiveModal('reservar')} className="px-4 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-lg shadow-sm flex items-center gap-2 transition-colors">
            <Calendar className="w-4 h-4 text-amber-400" aria-hidden="true" /><span>Nueva Reserva</span>
          </button>
          <button type="button" onClick={() => setActiveModal('ingreso')} className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-lg border border-slate-300 flex items-center gap-2 transition-colors">
            <LogIn className="w-4 h-4 text-emerald-600" aria-hidden="true" /><span>Registra el ingreso</span>
          </button>
          <button type="button" onClick={() => setActiveModal('salida')} className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-lg border border-slate-300 flex items-center gap-2 transition-colors">
            <LogOut className="w-4 h-4 text-red-600" aria-hidden="true" /><span>Registra la salida</span>
          </button>
        </div>

        {/* 5. Mis Reservas Activas */}
        {myReservations.length > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#002B49]" aria-hidden="true" /> Tus Reservas Programadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myReservations.map((res) => (
                <div key={res.id} className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-[#002B49]">{res.id}</span>
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">{res.estado}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{res.sala}</p>
                    <p className="text-[11px] text-slate-500">{res.sede} - {res.fecha} ({res.horario})</p>
                  </div>
                  <button type="button" onClick={() => { setCheckinCode(res.id); setActiveModal('ingreso'); }} className="text-xs font-bold text-[#002B49] hover:underline">Check-in</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Layout Oficial de Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase mb-3">CONDICIONES GENERALES</h2>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <li className="flex items-start gap-2.5"><span className="text-[#FFAA00] font-black text-base shrink-0">◆</span><span>Cada reserva corresponde a un módulo de <strong>1 hora reloj (60 minutos)</strong>.</span></li>
                <li className="flex items-start gap-2.5"><span className="text-[#FFAA00] font-black text-base shrink-0">◆</span><span>Para activar tu reserva debes <strong>registrar tu ingreso</strong> con el código que recibirás al inicio del bloque.</span></li>
                <li className="flex items-start gap-2.5"><span className="text-[#FFAA00] font-black text-base shrink-0">◆</span><span>Si finalmente no ocuparás la sala, <strong>cancela tu reserva</strong>.</span></li>
              </ul>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
              <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&auto=format&fit=crop&q=80" alt="Estudiantes en biblioteca" className="w-full h-80 lg:h-[420px] object-cover" />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: REGISTRAR EL INGRESO */}
      {activeModal === 'ingreso' && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xl font-black text-slate-900">Registra el ingreso</h2>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">Ingresa el <strong>"código de la reserva"</strong> que fue enviado por correo electrónico.</p>
            <form onSubmit={handleProcessCheckin} className="space-y-4">
              <div>
                <label htmlFor="codigo-ingreso" className="block text-xs font-bold text-slate-700 mb-1.5">Código de la reserva:</label>
                <input id="codigo-ingreso" type="text" value={checkinCode} onChange={(e) => setCheckinCode(e.target.value)} placeholder="Ej: RES-SJ-8942" className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49] focus:outline-none uppercase font-mono font-bold" required autoFocus />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white rounded-lg text-xs font-black shadow-md focus:ring-4 focus:ring-amber-400">Registra el ingreso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR LA SALIDA */}
      {activeModal === 'salida' && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-xl font-black text-slate-900">Registra la salida</h2>
              <button type="button" onClick={() => setActiveModal(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">Para registrar la salida, ingresa el <strong>"código de la reserva"</strong>.</p>
            <form onSubmit={handleProcessCheckout} className="space-y-4">
              <div>
                <label htmlFor="codigo-salida" className="block text-xs font-bold text-slate-700 mb-1.5">Código de la reserva:</label>
                <input id="codigo-salida" type="text" value={checkoutCode} onChange={(e) => setCheckoutCode(e.target.value)} placeholder="Ej: RES-SJ-8942" className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49] focus:outline-none uppercase font-mono font-bold" required autoFocus />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white rounded-lg text-xs font-black shadow-md focus:ring-4 focus:ring-amber-400">Registra la salida</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NUEVA RESERVA (CON FLUJO DE DISPONIBILIDAD) */}
      {activeModal === 'reservar' && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-slate-200">

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {bookingStep === 1 ? '1. Buscar Disponibilidad' : '2. Seleccionar Sala'}
                </h2>
                <p className="text-xs text-slate-500">{selectedSede}</p>
              </div>
              <button type="button" onClick={cerrarModalReserva} disabled={isProcessing} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SSE Mensajes en vivo del Bot */}
            {statusMensaje && (
              <div className={`p-3 mb-4 text-xs font-bold rounded-lg border flex items-center gap-2 ${statusMensaje.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : statusMensaje.type === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'}`}>
                {statusMensaje.type === 'info' && (
                  <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                <span>{statusMensaje.text}</span>
              </div>
            )}

            {/* PASO 1: Elegir Fecha y Hora */}
            {bookingStep === 1 && (
              <form onSubmit={handleCheckAvailability} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="res-fecha" className="block text-xs font-bold text-slate-700 mb-1">Fecha:</label>
                    <input id="res-fecha" type="date" value={bookingData.fecha} onChange={(e) => setBookingData({ ...bookingData, fecha: e.target.value })} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49]" required />
                  </div>
                  <div>
                    <label htmlFor="res-horario" className="block text-xs font-bold text-slate-700 mb-1">Bloque Horario:</label>
                    <select id="res-horario" value={bookingData.horario} onChange={(e) => setBookingData({ ...bookingData, horario: e.target.value })} className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49]">
                      <option value="09:00 - 09:50">09:00 - 09:50</option>
                      <option value="10:00 - 10:50">10:00 - 10:50</option>
                      <option value="11:00 - 11:50">11:00 - 11:50</option>
                      <option value="12:00 - 12:50">12:00 - 12:50</option>
                      <option value="13:00 - 13:50">13:00 - 13:50</option>
                      <option value="14:00 - 14:50">14:00 - 14:50</option>
                      <option value="15:00 - 15:50">15:00 - 15:50</option>
                      <option value="16:00 - 16:50">16:00 - 16:50</option>
                      <option value="17:00 - 17:50">17:00 - 17:50</option>
                      <option value="18:00 - 18:50">18:00 - 18:50</option>
                      <option value="19:00 - 19:50">19:00 - 19:50</option>
                      <option value="20:00 - 20:50">20:00 - 20:50</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                  <button type="button" onClick={cerrarModalReserva} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button type="submit" disabled={isCheckingAvailability} className="px-5 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white font-black text-xs rounded-lg shadow-md focus:ring-4 focus:ring-blue-300 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isCheckingAvailability ? 'Buscando salas...' : 'Verificar Disponibilidad'}
                  </button>
                </div>
              </form>
            )}

            {/* PASO 2: Elegir Sala Disponible e Iniciar Bot */}
            {bookingStep === 2 && (
              <form onSubmit={handleConfirmReservation} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700">Se encontraron <strong>{availableRooms.length} salas disponibles</strong> para el bloque de las <strong>{bookingData.horario}</strong> el día {bookingData.fecha}.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Selecciona tu sala:</label>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto" aria-live="polite">
                    {availableRooms.map(sala => (
                      <label key={sala} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${bookingData.salaSeleccionada === sala ? 'border-[#002B49] bg-blue-50 ring-1 ring-[#002B49]' : 'border-slate-200 hover:bg-slate-50'}`}>
                        <input type="radio" name="salaSeleccionada" value={sala} checked={bookingData.salaSeleccionada === sala} onChange={(e) => setBookingData({ ...bookingData, salaSeleccionada: e.target.value })} disabled={isProcessing} className="w-4 h-4 text-[#002B49] focus:ring-[#002B49]" />
                        <span className="text-xs font-bold text-slate-800">{sala}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-between gap-3 border-t border-slate-100">
                  <button type="button" disabled={isProcessing} onClick={() => setBookingStep(1)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Volver</button>
                  <button type="submit" disabled={isProcessing} className="px-5 py-2.5 bg-[#FFAA00] hover:bg-[#e69900] text-slate-950 font-black text-xs rounded-lg shadow-md focus:ring-4 focus:ring-amber-300 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isProcessing ? 'Ejecutando Bot...' : 'Reservar con Nexo360'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
};