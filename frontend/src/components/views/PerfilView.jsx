import React, { useState, useEffect, useRef } from 'react';
import { VIVO_STUDENT_PROFILE } from '../../data/vivoDuocData';
import { Camera, ShieldCheck, CheckCircle2, X, AlertCircle, HeartHandshake, Pencil } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const PerfilView = () => {
  const { announce } = useAccessibility();
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(() => ({
    ...VIVO_STUDENT_PROFILE,
    ...(user || {}),
    nombre: user?.nombre || user?.fullName || VIVO_STUDENT_PROFILE.nombre,
    emailDuoc: user?.email || user?.emailDuoc || VIVO_STUDENT_PROFILE.emailDuoc,
    direccion: user?.direccion || user?.address || VIVO_STUDENT_PROFILE.direccion,
    telefonoPersonal: user?.telefonoPersonal || user?.phone || VIVO_STUDENT_PROFILE.telefonoPersonal,
    emailPersonal: user?.emailPersonal || user?.personalEmail || VIVO_STUDENT_PROFILE.emailPersonal,
  }));

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    direccion: profile.direccion,
    telefonoPersonal: profile.telefonoPersonal,
    emailPersonal: profile.emailPersonal,
  });
  const [saveAlert, setSaveAlert] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);

  const editButtonRef = useRef(null);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      const nextDireccion = user.direccion || user.address || VIVO_STUDENT_PROFILE.direccion;
      const nextTelefono = user.telefonoPersonal || user.phone || VIVO_STUDENT_PROFILE.telefonoPersonal;
      const nextEmailPersonal = user.emailPersonal || user.personalEmail || VIVO_STUDENT_PROFILE.emailPersonal;

      setProfile((prev) => ({
        ...prev,
        ...user,
        nombre: user.nombre || user.fullName || prev.nombre,
        emailDuoc: user.email || user.emailDuoc || prev.emailDuoc,
        direccion: nextDireccion,
        telefonoPersonal: nextTelefono,
        emailPersonal: nextEmailPersonal,
      }));
      setEditForm({
        direccion: nextDireccion,
        telefonoPersonal: nextTelefono,
        emailPersonal: nextEmailPersonal,
      });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    if (!isEditing) return;

    const focusTimer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        announce('Edición cancelada', 'polite');
        editButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
        if (focusables.length === 0) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, announce]);

  const handleCloseModal = () => {
    setIsEditing(false);
    editButtonRef.current?.focus();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedData = {
      direccion: editForm.direccion.trim(),
      telefonoPersonal: editForm.telefonoPersonal.trim(),
      emailPersonal: editForm.emailPersonal.trim(),
      phone: editForm.telefonoPersonal.trim(),
      address: editForm.direccion.trim(),
      personalEmail: editForm.emailPersonal.trim(),
    };

    try {
      const res = await api.updateProfile(updatedData);
      const mergedProfile = {
        ...profile,
        ...updatedData,
        ...(res?.user || {}),
      };
      setProfile(mergedProfile);
      updateUser(mergedProfile);
    } catch {
      const mergedProfile = { ...profile, ...updatedData };
      setProfile(mergedProfile);
      updateUser(mergedProfile);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
      setSaveAlert(true);
      announce('Datos de contacto actualizados exitosamente.', 'polite');
      editButtonRef.current?.focus();
      setTimeout(() => setSaveAlert(false), 4000);
    }
  };

  const handlePhotoChange = (e) => {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      const msg = 'Formato no válido. Solo se permiten imágenes JPG o PNG.';
      setPhotoError(msg);
      announce(msg, 'assertive');
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      const msg = 'El archivo supera el tamaño máximo permitido de 2 MB.';
      setPhotoError(msg);
      announce(msg, 'assertive');
      return;
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    const nextUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(nextUrl);
    announce(`Fotografía actualizada: ${file.name}`, 'polite');
  };

  return (
    <section aria-labelledby="perfil-view-heading" className="space-y-6 max-w-4xl mx-auto">
      {saveAlert && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-2xs animate-fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Datos de contacto actualizados correctamente.</span>
        </div>
      )}

      {photoError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-2xs animate-fade-in"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" aria-hidden="true" />
          <span>{photoError}</span>
        </div>
      )}

      {/* TARJETA DE PERFIL PRINCIPAL (Limpia, moderna y humana) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-9 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="space-y-6 flex-1">
            <div>
              <span className="text-xs font-semibold text-[#002B49] bg-slate-100 px-3 py-1 rounded-full inline-block mb-2">
                {profile.isPaedis
                  ? profile.roleLabel || 'Estudiante Regular'
                  : (profile.roleLabel || 'Estudiante Regular').replace(/\s*•\s*PAEDIS/gi, '')}
              </span>
              <h2 id="perfil-view-heading" className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {profile.nombre}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {profile.career || profile.carrera || 'Ingeniería en Informática'} • {profile.campus || profile.sede || 'Sede Alameda'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60">
                <span className="text-slate-500 font-medium block text-xs">Correo institucional</span>
                <span className="text-slate-900 font-semibold text-sm block mt-0.5">
                  {profile.emailDuoc}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60">
                <span className="text-slate-500 font-medium block text-xs">Dirección particular</span>
                <span className="text-slate-900 font-semibold text-sm block mt-0.5">
                  {profile.direccion}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60">
                <span className="text-slate-500 font-medium block text-xs">Teléfono personal</span>
                <span className="text-slate-900 font-semibold text-sm block mt-0.5">
                  {profile.telefonoPersonal}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60">
                <span className="text-slate-500 font-medium block text-xs">Correo personal</span>
                <span className="text-slate-900 font-semibold text-sm block mt-0.5">
                  {profile.emailPersonal}
                </span>
              </div>
            </div>

            <div>
              <button
                ref={editButtonRef}
                type="button"
                onClick={() => setIsEditing(true)}
                aria-haspopup="dialog"
                className="min-h-[42px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all shadow-2xs active:scale-[0.98]"
              >
                <Pencil className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
                <span>Editar datos de contacto</span>
              </button>
            </div>
          </div>

          {/* Fotografía de perfil */}
          <div className="shrink-0 flex flex-col items-center">
            <label
              htmlFor="foto-perfil-upload"
              className="w-32 h-36 rounded-2xl border border-dashed border-slate-300 hover:border-[#002B49] bg-slate-50 hover:bg-slate-100/70 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all overflow-hidden relative group"
            >
              {photoPreviewUrl ? (
                <img
                  src={photoPreviewUrl}
                  alt={`Fotografía de perfil de ${profile.nombre}`}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <>
                  <Camera className="w-7 h-7 text-slate-400 group-hover:text-[#002B49] transition-colors mb-2" aria-hidden="true" />
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-[#002B49]">
                    Cambiar foto
                  </span>
                </>
              )}
              <input
                id="foto-perfil-upload"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </label>
            <span className="text-[11px] text-slate-400 mt-2 text-center">
              JPG o PNG (máx. 2 MB)
            </span>
          </div>
        </div>
      </div>

      {/* TARJETA: Acompañamiento y Ajustes Razonables (Solo visible si el estudiante cuenta con perfil PAEDIS activo) */}
      {Boolean(profile.isPaedis) && (
        <article className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#002B49] flex items-center justify-center shrink-0" aria-hidden="true">
              <HeartHandshake className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Acompañamiento e inclusión académica (PAEDIS)
              </h3>
              <p className="text-xs text-slate-500">
                Estado de apoyos registrados para el periodo académico vigente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
              <span className="text-xs font-medium text-slate-500 block mb-1">
                Unidad de acompañamiento
              </span>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
                <span>{profile.tutorParAsignado || 'Inclusión y Bienestar • Sede Alameda'}</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
              <span className="text-xs font-medium text-slate-500 block mb-1">
                Estado en programa PAEDIS
              </span>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>Adscrito/a con ajustes académicos activos</span>
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Ajustes académicos registrados
            </span>
            {Array.isArray(profile.ajustesAprobados) && profile.ajustesAprobados.length === 0 ? (
              <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl text-xs text-slate-600">
                No registras ajustes individuales en este momento. Puedes utilizar las preferencias de lectura en la barra superior cuando lo necesites.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(profile.ajustesAprobados || [
                  { tipo: 'Tiempo adicional', descripcion: '50% de tiempo adicional en certámenes y evaluaciones teóricas.' },
                  { tipo: 'Material accesible', descripcion: 'Material de clases compatible con lectores de pantalla.' },
                  { tipo: 'Ubicación en aula', descripcion: 'Ubicación preferencial en primera fila y salas adaptadas.' },
                ]).map((ajuste, idx) => (
                  <div key={idx} className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs">
                    <span className="font-bold text-slate-900 block text-sm">{ajuste.tipo}</span>
                    <span className="text-slate-600 block mt-1 leading-relaxed">{ajuste.descripcion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      )}

      {/* MODAL PARA EDITAR DATOS DE CONTACTO */}
      {isEditing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-edit-profile-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
        >
          <div
            ref={modalRef}
            className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 animate-scale-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 id="modal-edit-profile-title" className="text-lg font-bold text-slate-900">
                Editar datos de contacto
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Cerrar ventana"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="edit-direccion" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dirección particular
                </label>
                <input
                  ref={firstInputRef}
                  id="edit-direccion"
                  type="text"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                  className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 focus:border-[#002B49] rounded-xl text-slate-900 font-medium"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-telefono" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Teléfono personal
                </label>
                <input
                  id="edit-telefono"
                  type="tel"
                  value={editForm.telefonoPersonal}
                  onChange={(e) => setEditForm({ ...editForm, telefonoPersonal: e.target.value })}
                  className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 focus:border-[#002B49] rounded-xl text-slate-900 font-medium"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Correo personal
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editForm.emailPersonal}
                  onChange={(e) => setEditForm({ ...editForm, emailPersonal: e.target.value })}
                  className="w-full min-h-[42px] text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 focus:border-[#002B49] rounded-xl text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-[40px] px-5 py-2 bg-[#002B49] hover:bg-[#001D33] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all disabled:opacity-60"
                >
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
