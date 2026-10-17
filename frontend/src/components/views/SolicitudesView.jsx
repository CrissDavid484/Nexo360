import React, { useState } from 'react';
import { VIVO_SOLICITUDES_CATALOGO, VIVO_STUDENT_PROFILE } from '../../data/vivoDuocData';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export const SolicitudesView = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('nuevo'); // 'nuevo' | 'consultar'
  const [formData, setFormData] = useState({
    matricula: '2026 - INGENIERÍA EN INFORMÁTICA - Sede Alameda',
    categoria: '',
    servicio: '',
    subServicio: '',
    tipo: '',
    comentarios: '',
  });

  const [files, setFiles] = useState([]);
  const [successMessage, setSuccessMessage] = useState(null);

  // Lista simulada de solicitudes enviadas previamente
  const [history, setHistory] = useState([
    {
      id: 'SOL-2026-0921',
      categoria: 'Ajustes PAEDIS / Inclusión',
      servicio: 'Ficha de Ajustes y Accesibilidad Digital',
      tipo: 'Prioridad Inclusiva PAEDIS',
      fecha: '08/10/2026',
      estado: 'Aprobada por Coordinación Alameda',
      estadoColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    },
    {
      id: 'SOL-2026-0842',
      categoria: 'Académica',
      servicio: 'Adaptación de Materiales y Libros Accesibles',
      tipo: 'Ordinaria',
      fecha: '24/09/2026',
      estado: 'Entregado y Habilitado',
      estadoColor: 'bg-blue-100 text-blue-900 border-blue-300',
    },
  ]);

  const handleCategoryChange = (e) => {
    const cat = e.target.value;
    setFormData({
      ...formData,
      categoria: cat,
      servicio: '', // Reset servicio on category change
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selected].slice(0, 4));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.categoria || !formData.servicio || !formData.comentarios) {
      alert('Por favor completa todos los campos requeridos (*)');
      return;
    }

    const newSolId = `SOL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry = {
      id: newSolId,
      categoria: formData.categoria,
      servicio: formData.servicio,
      tipo: formData.tipo || 'Ordinaria',
      fecha: '16/10/2026',
      estado: 'En Revisión por Coordinación Docente',
      estadoColor: 'bg-amber-100 text-amber-900 border-amber-300',
    };

    setHistory([newEntry, ...history]);
    setSuccessMessage(`¡Solicitud ${newSolId} creada exitosamente! Recibirás la respuesta en tu correo institucional.`);
    setActiveTab('consultar');

    // Reset
    setFormData({
      matricula: '2026 - INGENIERÍA EN INFORMÁTICA - Sede Alameda',
      categoria: '',
      servicio: '',
      subServicio: '',
      tipo: '',
      comentarios: '',
    });
    setFiles([]);
  };

  const serviciosDisponibles = formData.categoria
    ? VIVO_SOLICITUDES_CATALOGO.servicios[formData.categoria] || []
    : [];

  return (
    <div className="space-y-6">
      {/* Texto superior oficial (Screenshot 6) */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 tracking-tight">
          Solicitudes
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-4xl leading-relaxed">
          Acá podrás crear y dar seguimiento a tus solicitudes académicas. Para solicitudes de Vida Estudiantil, Financiamiento y Titulados, deberás crearlas en el nuevo{' '}
          <button
            type="button"
            onClick={() => onNavigate('ayuda')}
            className="text-[#002B49] font-bold underline hover:text-amber-600 focus:ring-2 focus:ring-amber-400 rounded px-0.5"
          >
            Centro de Ayuda
          </button>
          .
        </p>
      </div>

      {/* Alerta de Éxito al enviar */}
      {successMessage && (
        <div
          role="status"
          className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-bold text-emerald-800 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Contenedor Oficial de Solicitudes (Screenshot 6) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Barra superior azul marino con botones [Nuevo] y [Consultar] */}
        <div className="bg-[#002B49] text-white px-6 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-wide">
            Solicitudes
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('nuevo')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all focus:ring-2 focus:ring-amber-400 ${
                activeTab === 'nuevo'
                  ? 'bg-white text-[#002B49] shadow-sm font-black'
                  : 'bg-transparent text-white border border-white/40 hover:bg-white/10'
              }`}
            >
              Nuevo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('consultar')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all focus:ring-2 focus:ring-amber-400 ${
                activeTab === 'consultar'
                  ? 'bg-white text-[#002B49] shadow-sm font-black'
                  : 'bg-transparent text-white border border-white/40 hover:bg-white/10'
              }`}
            >
              Consultar
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: FORMULARIO NUEVA SOLICITUD (Screenshot 6) */}
        {activeTab === 'nuevo' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Campo 1: Matrícula */}
            <div>
              <label htmlFor="sol-matricula" className="block text-xs font-bold text-slate-700 mb-1">
                Matrícula
              </label>
              <select
                id="sol-matricula"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-[#002B49] focus:outline-none"
              >
                <option value="2026 - INGENIERÍA EN INFORMÁTICA - Sede San Joaquín">
                  2026 - INGENIERÍA EN INFORMÁTICA - Sede San Joaquín
                </option>
              </select>
            </div>

            {/* Campo 2: Categoría */}
            <div>
              <label htmlFor="sol-categoria" className="block text-xs font-bold text-slate-700 mb-1">
                Categoría *
              </label>
              <select
                id="sol-categoria"
                value={formData.categoria}
                onChange={handleCategoryChange}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-[#002B49] focus:outline-none"
                required
              >
                <option value="">Por favor seleccione una opción</option>
                {VIVO_SOLICITUDES_CATALOGO.categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo 3: Servicio */}
            <div>
              <label htmlFor="sol-servicio" className="block text-xs font-bold text-slate-700 mb-1">
                Servicio *
              </label>
              <select
                id="sol-servicio"
                value={formData.servicio}
                onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                disabled={!formData.categoria}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-[#002B49] focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                required
              >
                <option value="">Por favor seleccione una opción</option>
                {serviciosDisponibles.map((srv) => (
                  <option key={srv} value={srv}>
                    {srv}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo 4: Sub-Servicio */}
            <div>
              <label htmlFor="sol-subservicio" className="block text-xs font-bold text-slate-700 mb-1">
                Sub-Servicio
              </label>
              <select
                id="sol-subservicio"
                value={formData.subServicio}
                onChange={(e) => setFormData({ ...formData, subServicio: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-[#002B49] focus:outline-none"
              >
                <option value="">Por favor seleccione una opción</option>
                {VIVO_SOLICITUDES_CATALOGO.subServicios.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo 5: Tipo */}
            <div>
              <label htmlFor="sol-tipo" className="block text-xs font-bold text-slate-700 mb-1">
                Tipo
              </label>
              <select
                id="sol-tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-[#002B49] focus:outline-none"
              >
                <option value="">Por favor seleccione una opción</option>
                {VIVO_SOLICITUDES_CATALOGO.tipos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo 6: Comentarios (Máximo 1000 caracteres) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="sol-comentarios" className="block text-xs font-bold text-slate-700">
                  Comentarios (Máximo 1000 caracteres) *
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {formData.comentarios.length} / 1000
                </span>
              </div>
              <textarea
                id="sol-comentarios"
                rows={4}
                maxLength={1000}
                value={formData.comentarios}
                onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                placeholder="Describe los antecedentes y detalles de tu solicitud..."
                className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-[#002B49] focus:outline-none font-sans"
                required
              />
            </div>

            {/* Campo 7: Archivos asociados a la solicitud (Screenshot 6) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Archivos asociados a la solicitud realizada (Máximo 4 archivos, máximo 5MB cada archivo)
              </label>
              <div className="border border-slate-300 rounded-md p-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                <div className="text-xs text-slate-500">
                  {files.length === 0 ? (
                    <span>Elija un archivo o suéltelo aquí ...</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {files.map((file, idx) => (
                        <span key={idx} className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-mono text-[11px]">
                          {file.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <label className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded cursor-pointer transition-colors shrink-0">
                  Examinar..
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Se permiten únicamente archivos con la extensión: pdf, doc, docx, jpg, png.
              </p>
            </div>

            {/* Botones Enviar y Cancelar oficiales */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white text-xs sm:text-sm font-black rounded-md shadow-sm transition-colors focus:ring-4 focus:ring-amber-400"
              >
                Enviar
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    matricula: '2026 - INGENIERÍA EN INFORMÁTICA - Sede San Joaquín',
                    categoria: '',
                    servicio: '',
                    subServicio: '',
                    tipo: '',
                    comentarios: '',
                  })
                }
                className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-md transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* PESTAÑA 2: CONSULTAR HISTORIAL DE SOLICITUDES */}
        {activeTab === 'consultar' && (
          <div className="p-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Historial de Solicitudes Registradas
            </h3>

            <div className="space-y-3">
              {history.map((sol) => (
                <div
                  key={sol.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#002B49] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-[#002B49]">
                        {sol.id}
                      </span>
                      <span className="text-xs text-slate-400">• {sol.fecha}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                        {sol.tipo}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{sol.servicio}</p>
                    <p className="text-xs text-slate-500">{sol.categoria}</p>
                  </div>

                  <div>
                    <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border ${sol.estadoColor}`}>
                      {sol.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
