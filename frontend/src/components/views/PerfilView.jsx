import React, { useState } from 'react';
import { VIVO_STUDENT_PROFILE } from '../../data/vivoDuocData';
import { Camera, ShieldCheck, HeartHandshake, CheckCircle2, Edit3, X, Save } from 'lucide-react';

export const PerfilView = () => {
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
    setTimeout(() => setSaveAlert(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Alerta de guardado */}
      {saveAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>¡Datos de contacto actualizados exitosamente en el portal institucional!</span>
        </div>
      )}

      {/* TARJETA OFICIAL: PERFIL DuocUC (Screenshot 1) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002B49] via-[#09355c] to-[#001f35] text-white p-8 sm:p-10 shadow-xl border-2 border-slate-700/50">
        {/* Curvas de fondo decorativas simuladas con gradientes y SVG */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 800 500" fill="none" preserveAspectRatio="none">
            <path
              d="M0 300 C 200 150, 500 450, 800 200 L 800 500 L 0 500 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Lado izquierdo: Título, Nombre y Datos */}
          <div className="space-y-6 flex-1">
            <div>
              <span className="text-sm font-extrabold tracking-widest text-slate-300 uppercase block">
                PERFIL DuocUC
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                {profile.nombre}
              </h1>
            </div>

            {/* Campos de información */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <span className="text-slate-300 font-bold block text-xs">Dirección</span>
                <span className="text-white font-medium text-sm sm:text-base">
                  {profile.direccion}
                </span>
              </div>

              <div>
                <span className="text-slate-300 font-bold block text-xs">Email Duoc</span>
                <span className="text-white font-medium text-sm sm:text-base">
                  {profile.emailDuoc}
                </span>
              </div>

              {/* Subsección: Datos de Contacto */}
              <div className="pt-2 border-t border-white/10 space-y-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Datos de Contacto
                  </h2>
                  <span className="text-[11px] text-slate-300 italic">
                    Campos requeridos (*)
                  </span>
                </div>

                <div>
                  <span className="text-slate-300 font-bold block text-xs">
                    Teléfono personal*
                  </span>
                  <span className="text-white font-medium text-sm sm:text-base">
                    {profile.telefonoPersonal}
                  </span>
                </div>

                <div>
                  <span className="text-slate-300 font-bold block text-xs">
                    Email Personal*
                  </span>
                  <span className="text-white font-medium text-sm sm:text-base">
                    {profile.emailPersonal}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón blanco: Editar (Screenshot 1) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs sm:text-sm font-black transition-transform active:scale-95 shadow-md focus:ring-4 focus:ring-amber-400"
              >
                Editar
              </button>
            </div>
          </div>

          {/* Lado derecho: Recuadro Subir Foto (Screenshot 1) */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-lg border-2 border-white/60 bg-white/10 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-white/20 transition-colors group">
              <Camera className="w-8 h-8 text-white group-hover:scale-110 transition-transform mb-2" aria-hidden="true" />
              <span className="text-[11px] font-bold text-white underline">
                Subir foto
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-2 text-center max-w-[140px]">
              Formato JPG/PNG máx 2MB
            </span>
          </div>
        </div>
      </div>

      {/* TARJETA ESPECIAL: Ficha y Ajustes Razonables PAEDIS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 font-black">
            ♿
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              Ficha de Inclusión y Acompañamiento PAEDIS 2026
            </h2>
            <p className="text-xs text-slate-500">
              Registrado en Sede Alameda • Carrera Ingeniería en Informática
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Programa de Inclusión Institucional
            </span>
            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
              PAEDIS • Sede Alameda
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Portal adaptado para accesibilidad universal, autonomía digital y tramitación directa.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Diagnóstico / Ajustes Aprobados
            </span>
            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              {profile.paedis.diagnosticoDeclarado}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Acreditación institucional vigente para el año académico 2026.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-700 block">
            Ajustes Razonables Registrados:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {profile.paedis.ajustesAprobados.map((ajuste, idx) => (
              <div key={idx} className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs">
                <span className="font-black text-amber-950 block">{ajuste.tipo}</span>
                <span className="text-amber-800 text-[11px] block mt-0.5">{ajuste.descripcion}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL PARA EDITAR DATOS DE CONTACTO */}
      {isEditing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-black text-slate-900">
                Editar Datos de Contacto
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección:
                </label>
                <input
                  type="text"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono personal*:
                </label>
                <input
                  type="tel"
                  value={editForm.telefonoPersonal}
                  onChange={(e) => setEditForm({ ...editForm, telefonoPersonal: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Personal*:
                </label>
                <input
                  type="email"
                  value={editForm.emailPersonal}
                  onChange={(e) => setEditForm({ ...editForm, emailPersonal: e.target.value })}
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49]"
                  required
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#002B49] hover:bg-slate-800 text-white font-black text-xs rounded-lg shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
