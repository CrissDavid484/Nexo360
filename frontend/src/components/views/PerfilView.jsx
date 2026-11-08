import React, { useState } from 'react';
import { VIVO_STUDENT_PROFILE } from '../../data/vivoDuocData';
import { Camera, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const PerfilView = () => {
  const { announce } = useAccessibility();
  const [profile, setProfile] = useState(VIVO_STUDENT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    direccion: profile.direccion,
    telefonoPersonal: profile.telefonoPersonal,
    emailPersonal: profile.emailPersonal,
  });
  const [saveAlert, setSaveAlert] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setProfile({
      ...profile,
      ...editForm,
    });
    setIsEditing(false);
    setSaveAlert(true);
    announce('Datos de contacto actualizados exitosamente en tu perfil institucional.', 'polite');
    setTimeout(() => setSaveAlert(false), 4000);
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      announce(`Foto seleccionada: ${e.target.files[0].name}`, 'polite');
    }
  };

  return (
    // A11y: Elemento semántico <section> con encabezado accesible asociado
    <section aria-labelledby="perfil-view-heading" className="space-y-6 max-w-4xl mx-auto">
      {/* Alerta de guardado con role="status" y aria-live="polite" */}
      {saveAlert && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-3 shadow-xs"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
          <span>¡Datos de contacto actualizados exitosamente en el portal institucional Duoc UC!</span>
        </div>
      )}

      {/* TARJETA OFICIAL: PERFIL DuocUC */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002B49] via-[#09355c] to-[#001f35] text-white p-8 sm:p-10 shadow-xl border-4 border-[#FFB81C]">
        {/* Curvas decorativas con aria-hidden="true" */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" aria-hidden="true">
          <svg className="w-full h-full" viewBox="0 0 800 500" fill="none" preserveAspectRatio="none">
            <path
              d="M0 300 C 200 150, 500 450, 800 200 L 800 500 L 0 500 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-8">
          {/* Lado izquierdo: Título, Nombre y Datos */}
          <div className="space-y-6 flex-1">
            <div>
              <span className="text-xs font-black tracking-widest text-[#FFB81C] uppercase block">
                PERFIL OFICIAL DUOC UC • ESTUDIANTE REGULAR
              </span>
              <h2 id="perfil-view-heading" className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                {profile.nombre}
              </h2>
            </div>

            {/* Campos de información */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <span className="text-slate-300 font-bold block text-xs">Dirección Particular</span>
                <span className="text-white font-black text-sm sm:text-base">
                  {profile.direccion}
                </span>
              </div>

              <div>
                <span className="text-slate-300 font-bold block text-xs">Email Duoc Institucional</span>
                <span className="text-white font-black text-sm sm:text-base">
                  {profile.emailDuoc}
                </span>
              </div>

              {/* Subsección: Datos de Contacto */}
              <div className="pt-3 border-t border-white/20 space-y-3">
                <div>
                  <h3 className="text-base font-black text-white">
                    Datos de Contacto Actualizables
                  </h3>
                  <span className="text-xs text-amber-300 font-semibold">
                    Campos obligatorios (*)
                  </span>
                </div>

                <div>
                  <span className="text-slate-300 font-bold block text-xs">
                    Teléfono personal*
                  </span>
                  <span className="text-white font-black text-sm sm:text-base">
                    {profile.telefonoPersonal}
                  </span>
                </div>

                <div>
                  <span className="text-slate-300 font-bold block text-xs">
                    Email Personal*
                  </span>
                  <span className="text-white font-black text-sm sm:text-base">
                    {profile.emailPersonal}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón blanco: Editar con target size >= 44px */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="min-h-[44px] px-7 py-2.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
              >
                Editar Datos de Contacto
              </button>
            </div>
          </div>

          {/* Lado derecho: Recuadro Subir Foto accesible */}
          <div className="shrink-0 flex flex-col items-center">
            {/* A11y: Reemplazo del <div> clickable por un <label> con <input type="file"> accesible por teclado */}
            <label
              htmlFor="foto-perfil-upload"
              className="w-32 h-36 rounded-2xl border-2 border-white/80 bg-white/10 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white/20 transition-all focus-within:ring-4 focus-within:ring-[#FFB81C] min-h-[44px]"
            >
              <Camera className="w-8 h-8 text-white mb-2" aria-hidden="true" />
              <span className="text-xs font-black text-white underline">
                Subir foto
              </span>
              <input
                id="foto-perfil-upload"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </label>
            <span className="text-xs text-slate-300 mt-2 text-center max-w-[140px] font-medium">
              Formato JPG/PNG máx 2MB
            </span>
          </div>
        </div>
      </div>

      {/* TARJETA: Ficha y Ajustes Razonables de Accesibilidad */}
      <article className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-950 font-black text-xl" aria-hidden="true">
            ♿
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Ficha y Ajustes Razonables de Accesibilidad
            </h3>
            <p className="text-xs text-slate-700 font-bold">
              Registrado en Sede Alameda • Carrera de Ingeniería en Informática
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1">
              Acompañamiento Institucional
            </span>
            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
              <span>Inclusión y Accesibilidad • Sede Alameda</span>
            </p>
            <p className="text-xs text-slate-700 mt-1 font-medium">
              Portal adaptado con accesibilidad universal, autonomía digital y tramitación directa.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1">
              Adecuaciones / Ajustes Aprobados
            </span>
            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>{profile.preferenciasAccesibilidad?.diagnosticoDeclarado || profile.ajustes?.diagnosticoDeclarado || 'Ajustes de Accesibilidad Universal'}</span>
            </p>
            <p className="text-xs text-slate-700 mt-1 font-medium">
              Acreditación institucional vigente para el año académico 2026.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            Ajustes Razonables Registrados:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(profile.preferenciasAccesibilidad?.ajustesAprobados || profile.ajustes?.ajustesAprobados || [
              { tipo: 'Tiempo Adicional', descripcion: '50% de tiempo adicional en certámenes y evaluaciones teóricas' },
              { tipo: 'Material Digital Accesible', descripcion: 'Entrega de material en formatos compatibles con lectores de pantalla' },
              { tipo: 'Mobiliario y Aula', descripcion: 'Ubicación preferencial en primera fila y salas de estudio adaptadas' },
            ]).map((ajuste, idx) => (
              <div key={idx} className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs">
                <span className="font-black text-amber-950 block text-sm">{ajuste.tipo}</span>
                <span className="text-slate-800 font-medium block mt-1 leading-relaxed">{ajuste.descripcion}</span>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* MODAL PARA EDITAR DATOS DE CONTACTO */}
      {isEditing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-profile-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
        >
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-slate-300">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4 mb-4">
              <h3 id="modal-edit-profile-title" className="text-xl font-black text-slate-900">
                Editar Datos de Contacto
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                aria-label="Cerrar ventana de edición"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                {/* A11y: <label> explícito con htmlFor coincidiendo con el id del input */}
                <label htmlFor="edit-direccion" className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Dirección particular: <span className="text-red-700" aria-hidden="true">*</span>
                </label>
                <input
                  id="edit-direccion"
                  type="text"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                  className="w-full min-h-[44px] text-xs sm:text-sm p-3 border-2 border-slate-300 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] text-slate-900 font-bold"
                  required
                />
              </div>

              <div>
                {/* A11y: <label> explícito con htmlFor coincidiendo con el id del input */}
                <label htmlFor="edit-telefono" className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Teléfono personal: <span className="text-red-700" aria-hidden="true">*</span>
                </label>
                <input
                  id="edit-telefono"
                  type="tel"
                  value={editForm.telefonoPersonal}
                  onChange={(e) => setEditForm({ ...editForm, telefonoPersonal: e.target.value })}
                  className="w-full min-h-[44px] text-xs sm:text-sm p-3 border-2 border-slate-300 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] text-slate-900 font-bold"
                  required
                />
              </div>

              <div>
                {/* A11y: <label> explícito con htmlFor coincidiendo con el id del input */}
                <label htmlFor="edit-email" className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Email Personal: <span className="text-red-700" aria-hidden="true">*</span>
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editForm.emailPersonal}
                  onChange={(e) => setEditForm({ ...editForm, emailPersonal: e.target.value })}
                  className="w-full min-h-[44px] text-xs sm:text-sm p-3 border-2 border-slate-300 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] text-slate-900 font-bold"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001f35] text-white font-black text-xs sm:text-sm rounded-xl shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
