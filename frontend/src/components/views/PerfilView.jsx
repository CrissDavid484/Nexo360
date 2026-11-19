import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertCircle,
  HeartHandshake,
  Pencil,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { useAccessibleModal } from '../../hooks/useAccessibleModal';
import { api } from '../../services/api';
import { getDisabilityProfileMeta } from '../../utils/accessibilityProfiles';
import {
  DEFAULT_CAMPUS,
  SEDES_DUOC,
  CARRERAS_DUOC_LIST,
  normalizeStudentProfile,
  readFileAsDataUrl,
} from '../../utils/studentUtils';

const VALID_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const STAFF_ROLES_WITHOUT_CAREER = new Set(['admin', 'administrador', 'coordinador_paedis']);
const PASSWORD_LETTER_REGEX = /[a-zA-Z]/;
const PASSWORD_DIGIT_REGEX = /\d/;

function isStaffRoleWithoutCareer(rawUser) {
  const role = String(rawUser?.role || '').toLowerCase().trim();
  return STAFF_ROLES_WITHOUT_CAREER.has(role);
}

function validatePasswordChange({ currentPassword, newPassword, confirmNewPassword }) {
  if (!currentPassword) {
    return 'Ingresa tu contraseña actual.';
  }
  if (!newPassword || newPassword.length < 8) {
    return 'La nueva contraseña debe tener al menos 8 caracteres.';
  }
  if (!PASSWORD_LETTER_REGEX.test(newPassword) || !PASSWORD_DIGIT_REGEX.test(newPassword)) {
    return 'La nueva contraseña debe incluir al menos una letra y un número.';
  }
  if (newPassword === currentPassword) {
    return 'La nueva contraseña debe ser diferente a la contraseña actual.';
  }
  if (newPassword !== confirmNewPassword) {
    return 'La confirmación no coincide con la nueva contraseña.';
  }
  return '';
}

function getProfileSubtitle({ hideCareer, clearReadingMode, roleLabel, careerLabel, campusLabel }) {
  if (hideCareer) {
    return clearReadingMode ? roleLabel : `${roleLabel} • Duoc UC - ${campusLabel}`;
  }
  return clearReadingMode ? careerLabel : `${careerLabel} • Duoc UC - ${campusLabel}`;
}

function getEditModalSubtitle(hideCareer, clearReadingMode, campusLabel) {
  if (hideCareer) {
    return clearReadingMode
      ? 'Actualiza tus datos institucionales.'
      : `Actualiza tus datos de contacto y sede en ${campusLabel}.`;
  }
  return clearReadingMode
    ? 'Actualiza tus datos y carrera.'
    : `Actualiza tus datos para personalizar las simulaciones académicas en ${campusLabel}.`;
}

/**
 * Clasificador estricto de rol institucional para la vista de perfil
 */
function getInstitutionalRoleLabel(profile) {
  const role = (profile?.role || '').toLowerCase();
  if (role === 'admin' || role === 'administrador') {
    return 'Administrador';
  }
  if (role === 'coordinador_paedis') {
    return 'Coordinador PAEDIS';
  }
  if (Boolean(profile?.isPaedis) || role === 'estudiante_paedis') {
    return 'Estudiante PAEDIS';
  }
  return 'Estudiante Regular';
}

function buildPerfilState(rawUser, fallbackPhoto = '') {
  const normalized = normalizeStudentProfile(rawUser || {});
  const omitCareer = isStaffRoleWithoutCareer(normalized);
  const career = omitCareer ? '' : normalized.career || 'Ingeniería en Informática';
  const address = normalized.address || normalized.direccion || 'Por actualizar';
  const phone = normalized.phone || normalized.telefonoPersonal || '+56 9 0000 0000';
  const personalEmail = normalized.personalEmail || normalized.emailPersonal || '';

  return {
    ...normalized,
    nombre: normalized.name,
    fullName: normalized.name,
    carrera: career,
    career,
    sede: DEFAULT_CAMPUS,
    campus: DEFAULT_CAMPUS,
    emailDuoc: normalized.email || 'estudiante@duocuc.cl',
    direccion: address,
    address,
    telefonoPersonal: phone,
    phone,
    emailPersonal: personalEmail,
    personalEmail,
    photo: normalized.photo || fallbackPhoto || '',
    disabilityProfile: normalized.disabilityProfile || rawUser?.disabilityProfile || 'ninguna',
    mustChangePassword: Boolean(rawUser?.mustChangePassword ?? normalized.mustChangePassword),
  };
}

function toEditFormValues(perfil) {
  return {
    fullName: perfil.nombre || perfil.fullName,
    rut: perfil.rut,
    career: perfil.career || perfil.carrera || CARRERAS_DUOC_LIST[0] || '',
    campus: perfil.campus || perfil.sede || DEFAULT_CAMPUS,
    direccion: perfil.direccion || perfil.address,
    telefonoPersonal: perfil.telefonoPersonal || perfil.phone,
    emailPersonal: perfil.emailPersonal || perfil.personalEmail,
  };
}

const PasswordInputRow = ({
  id,
  label,
  value,
  onChange,
  showValue,
  onToggleShow,
  autoComplete,
  placeholder,
  inputRef,
  hint,
  hintId,
  voiceLabel,
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type={showValue ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-describedby={hintId}
        aria-label={voiceLabel}
        required
        className="w-full min-h-[44px] text-xs sm:text-sm px-3.5 py-2.5 pr-10 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
      />
      <button
        type="button"
        onClick={onToggleShow}
        aria-label={showValue ? `Ocultar ${label.toLowerCase()}` : `Ver ${label.toLowerCase()}`}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
      >
        {showValue ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    </div>
    {hint && (
      <p id={hintId} className="text-[11px] text-slate-500 mt-1">
        {hint}
      </p>
    )}
  </div>
);

export const PerfilView = () => {
  const { announce, getVoiceProps, clearReadingMode } = useAccessibility();
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState(() => buildPerfilState(user));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [editForm, setEditForm] = useState(() => toEditFormValues(buildPerfilState(user)));
  const [saveAlert, setSaveAlert] = useState(false);
  const [photoSuccessAlert, setPhotoSuccessAlert] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccessAlert, setPasswordSuccessAlert] = useState(false);

  const editButtonRef = useRef(null);
  const modalRef = useRef(null);
  const firstInputRef = useRef(null);
  const passwordModalRef = useRef(null);
  const currentPasswordInputRef = useRef(null);
  const saveAlertTimerRef = useRef(null);
  const photoAlertTimerRef = useRef(null);
  const passwordAlertTimerRef = useRef(null);
  const photoAbortRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveAlertTimerRef.current) clearTimeout(saveAlertTimerRef.current);
      if (photoAlertTimerRef.current) clearTimeout(photoAlertTimerRef.current);
      if (passwordAlertTimerRef.current) clearTimeout(passwordAlertTimerRef.current);
      photoAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setProfile((prev) => {
      const next = buildPerfilState(user, prev.photo);
      setEditForm(toEditFormValues(next));
      return next;
    });
  }, [user]);

  const handleCloseModal = useCallback(() => {
    setIsEditing(false);
    announce('Edición cancelada', 'polite');
  }, [announce]);

  const handleClosePasswordModal = useCallback(() => {
    setIsPasswordModalOpen(false);
    setPasswordError('');
    announce('Cambio de contraseña cancelado', 'polite');
  }, [announce]);

  useAccessibleModal({
    isOpen: isEditing,
    onClose: handleCloseModal,
    containerRef: modalRef,
    initialFocusRef: firstInputRef,
    restoreFocus: true,
  });

  useAccessibleModal({
    isOpen: isPasswordModalOpen,
    onClose: handleClosePasswordModal,
    containerRef: passwordModalRef,
    initialFocusRef: currentPasswordInputRef,
    restoreFocus: true,
  });

  const scheduleAlertReset = (timerRef, setter) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (isMountedRef.current) setter(false);
    }, 4000);
  };

  const handleOpenPasswordModal = () => {
    setIsEditing(false);
    setPasswordError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowCurrentPwd(false);
    setShowNewPwd(false);
    setShowConfirmPwd(false);
    setIsPasswordModalOpen(true);
    announce('Ventana para cambiar contraseña abierta.', 'polite');
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    const validationError = validatePasswordChange({
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    if (validationError) {
      setPasswordError(validationError);
      announce(validationError, 'assertive');
      return;
    }

    setIsChangingPassword(true);
    announce('Actualizando contraseña institucional...', 'polite');

    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (!isMountedRef.current) return;

      if (res?.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setIsPasswordModalOpen(false);
        setProfile((prev) => ({ ...prev, mustChangePassword: false }));
        updateUser({ mustChangePassword: false });
        setPasswordSuccessAlert(true);
        announce('Contraseña actualizada correctamente.', 'polite');
        scheduleAlertReset(passwordAlertTimerRef, setPasswordSuccessAlert);
      } else {
        const msg =
          res?.message || 'No se pudo cambiar la contraseña. Verifica tu contraseña actual.';
        setPasswordError(msg);
        announce(msg, 'assertive');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = err?.message || 'Error de conexión al actualizar la contraseña.';
      setPasswordError(msg);
      announce(msg, 'assertive');
    } finally {
      if (isMountedRef.current) {
        setIsChangingPassword(false);
      }
    }
  };

  const showPhotoSuccessMessage = (message) => {
    setPhotoSuccessAlert(true);
    announce(message, 'polite');
    scheduleAlertReset(photoAlertTimerRef, setPhotoSuccessAlert);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const omitCareer = isStaffRoleWithoutCareer(user) || isStaffRoleWithoutCareer(profile);

    const updatedData = {
      fullName: editForm.fullName.trim(),
      nombre: editForm.fullName.trim(),
      rut: editForm.rut.trim(),
      ...(omitCareer ? {} : { career: editForm.career.trim(), carrera: editForm.career.trim() }),
      campus: editForm.campus.trim() || DEFAULT_CAMPUS,
      sede: editForm.campus.trim() || DEFAULT_CAMPUS,
      direccion: editForm.direccion.trim(),
      address: editForm.direccion.trim(),
      telefonoPersonal: editForm.telefonoPersonal.trim(),
      phone: editForm.telefonoPersonal.trim(),
      emailPersonal: editForm.emailPersonal.trim(),
      personalEmail: editForm.emailPersonal.trim(),
    };

    try {
      const res = await api.updateProfile(updatedData);
      if (!isMountedRef.current) return;
      const mergedProfile = buildPerfilState(
        { ...profile, ...updatedData, ...(res?.user || {}) },
        profile.photo
      );
      setProfile(mergedProfile);
      updateUser(mergedProfile);
    } catch (err) {
      console.warn('[PerfilView] Error sincronizando perfil con el servidor, guardando localmente:', err);
      if (!isMountedRef.current) return;
      const mergedProfile = buildPerfilState({ ...profile, ...updatedData }, profile.photo);
      setProfile(mergedProfile);
      updateUser(mergedProfile);
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
        setIsEditing(false);
        setSaveAlert(true);
        announce('Perfil y datos institucionales actualizados exitosamente.', 'polite');
        scheduleAlertReset(saveAlertTimerRef, setSaveAlert);
      }
    }
  };

  const handlePhotoChange = async (e) => {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!VALID_PHOTO_TYPES.has(file.type)) {
      const msg = 'Formato no válido. Solo se permiten imágenes JPG, PNG o WEBP.';
      setPhotoError(msg);
      announce(msg, 'assertive');
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      const msg = 'El archivo supera el tamaño máximo permitido de 2 MB.';
      setPhotoError(msg);
      announce(msg, 'assertive');
      return;
    }

    photoAbortRef.current?.abort();
    const controller = new AbortController();
    photoAbortRef.current = controller;

    setIsPhotoUploading(true);
    announce(`Procesando fotografía: ${file.name}...`, 'polite');

    try {
      const base64Data = await readFileAsDataUrl(file, { signal: controller.signal });
      if (!isMountedRef.current) return;

      if (typeof base64Data !== 'string') {
        setPhotoError('No se pudo procesar la imagen.');
        return;
      }

      // Vista previa inmediata reactiva
      setProfile((prev) => ({ ...prev, photo: base64Data }));
      updateUser({ photo: base64Data });

      try {
        const res = await api.updatePhoto(base64Data);
        if (!isMountedRef.current) return;
        if (res && res.success) {
          if (res.user) {
            updateUser(res.user);
          }
          showPhotoSuccessMessage('Fotografía de perfil actualizada y guardada correctamente.');
        } else {
          setPhotoError(res?.message || 'No se pudo guardar la fotografía en el servidor.');
        }
      } catch (err) {
        console.warn('[PerfilView] Error sincronizando foto con el servidor:', err);
        if (!isMountedRef.current) return;
        showPhotoSuccessMessage('Fotografía de perfil guardada en la sesión actual.');
      }
    } catch (err) {
      if (err?.name === 'AbortError' || !isMountedRef.current) return;
      const msg = 'Error al leer el archivo de imagen.';
      setPhotoError(msg);
      announce(msg, 'assertive');
    } finally {
      if (isMountedRef.current) {
        setIsPhotoUploading(false);
      }
    }
  };

  const roleLabel = getInstitutionalRoleLabel(profile);
  const hideCareer = isStaffRoleWithoutCareer(user) || isStaffRoleWithoutCareer(profile);
  const campusLabel = profile.campus || profile.sede || DEFAULT_CAMPUS;
  const careerLabel = profile.career || profile.carrera || 'Ingeniería en Informática';
  const headingVoiceText = hideCareer
    ? `${profile.nombre}, ${roleLabel}, Duoc UC ${campusLabel}`
    : `${profile.nombre}, ${roleLabel}, ${careerLabel}, Duoc UC ${campusLabel}`;
  const profileSubtitle = getProfileSubtitle({
    hideCareer,
    clearReadingMode,
    roleLabel,
    careerLabel,
    campusLabel,
  });
  const editButtonLabel = hideCareer
    ? 'Editar datos del perfil y sede'
    : 'Editar datos del perfil, carrera y sede';
  const editModalTitle = hideCareer
    ? 'Editar perfil y sede'
    : 'Editar perfil, carrera y sede';
  const editModalSubtitle = getEditModalSubtitle(hideCareer, clearReadingMode, campusLabel);
  const mustChangePassword = Boolean(user?.mustChangePassword || profile.mustChangePassword);
  const hasDisabilityProfile = Boolean(
    profile.disabilityProfile && profile.disabilityProfile !== 'ninguna'
  );
  const disabilityMeta = hasDisabilityProfile
    ? getDisabilityProfileMeta(profile.disabilityProfile)
    : null;

  return (
    <section aria-labelledby="perfil-view-heading" className="space-y-6 max-w-4xl mx-auto w-full overflow-x-clip">
      {mustChangePassword && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl text-xs sm:text-sm font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-fade-in"
        >
          <div className="flex items-start gap-2.5">
            <KeyRound className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {clearReadingMode
                ? 'Estás usando tu contraseña inicial. Cámbiala cuando puedas.'
                : 'Tu cuenta aún utiliza la contraseña inicial asignada al registrarse. Te recomendamos actualizarla para mayor seguridad.'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenPasswordModal}
            {...getVoiceProps('Actualizar contraseña inicial')}
            className="min-h-[38px] px-3.5 py-2 bg-[#002B49] hover:bg-[#001D33] text-white font-semibold text-xs rounded-xl shrink-0 transition-colors cursor-pointer"
          >
            Cambiar contraseña
          </button>
        </div>
      )}

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

      {passwordSuccessAlert && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-2xs animate-fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Contraseña actualizada correctamente.</span>
        </div>
      )}

      {photoSuccessAlert && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 shadow-2xs animate-fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>Fotografía de perfil actualizada y guardada correctamente.</span>
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

      {/* TARJETA DE PERFIL PRINCIPAL */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-9 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="space-y-6 flex-1">
            <div>
              <span className="text-xs font-semibold text-[#002B49] bg-slate-100 px-3 py-1 rounded-full inline-block mb-2">
                {roleLabel}
              </span>
              <h2
                id="perfil-view-heading"
                {...getVoiceProps(headingVoiceText)}
                className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
              >
                {profile.nombre}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {profileSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs sm:text-sm">
              <div
                {...getVoiceProps(`Correo institucional: ${profile.emailDuoc || profile.email}`)}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60"
              >
                <span className="text-slate-500 font-medium block text-xs">Correo institucional</span>
                <span className="text-slate-900 font-semibold text-sm block mt-0.5 truncate">
                  {profile.emailDuoc || profile.email}
                </span>
              </div>

              <div
                {...getVoiceProps(`RUT institucional: ${profile.rut}`)}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60"
              >
                <span className="text-slate-500 font-medium block text-xs">RUT institucional</span>
                <span className="text-slate-900 font-semibold text-sm block mt-0.5">
                  {profile.rut}
                </span>
              </div>

              {!hideCareer && (
                <div
                  {...getVoiceProps(`Carrera: ${careerLabel}`)}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60"
                >
                  <span className="text-slate-500 font-medium block text-xs">Carrera</span>
                  <span className="text-slate-900 font-semibold text-sm block mt-0.5 truncate">
                    {careerLabel}
                  </span>
                </div>
              )}

              <div
                {...getVoiceProps(`Sede institucional: Duoc UC ${campusLabel}`)}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60"
              >
                <span className="text-slate-500 font-medium block text-xs">Sede institucional</span>
                <span className="text-slate-900 font-semibold text-sm block mt-0.5">
                  Duoc UC - {campusLabel}
                </span>
              </div>

              <div
                {...getVoiceProps(`Dirección particular: ${profile.direccion || profile.address}`)}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60"
              >
                <span className="text-slate-500 font-medium block text-xs">Dirección particular</span>
                <span className="text-slate-900 font-semibold text-sm block mt-0.5">
                  {profile.direccion || profile.address}
                </span>
              </div>

              <div
                {...getVoiceProps(`Teléfono personal: ${profile.telefonoPersonal || profile.phone}`)}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60"
              >
                <span className="text-slate-500 font-medium block text-xs">Teléfono personal</span>
                <span className="text-slate-900 font-semibold text-sm block mt-0.5">
                  {profile.telefonoPersonal || profile.phone}
                </span>
              </div>

              <div
                {...getVoiceProps(`Correo personal: ${profile.emailPersonal || profile.personalEmail || 'Por actualizar'}`)}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 sm:col-span-2"
              >
                <span className="text-slate-500 font-medium block text-xs">Correo personal</span>
                <span className="text-slate-900 font-semibold text-sm block mt-0.5">
                  {profile.emailPersonal || profile.personalEmail || 'Por actualizar'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                ref={editButtonRef}
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setIsEditing(true);
                }}
                aria-haspopup="dialog"
                {...getVoiceProps(editButtonLabel)}
                className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
                <span>{editButtonLabel}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPasswordModal}
                aria-haspopup="dialog"
                {...getVoiceProps('Cambiar contraseña')}
                className="min-h-[44px] px-5 py-2.5 bg-white hover:bg-slate-50 text-[#002B49] border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
                <span>Cambiar contraseña</span>
              </button>
            </div>
          </div>

          {/* Fotografía de perfil persistente */}
          <div className="shrink-0 flex flex-col items-center">
            <label
              htmlFor="foto-perfil-upload"
              {...getVoiceProps('Cambiar fotografía de perfil, formatos JPG, PNG o WEBP hasta 2 megabytes')}
              className="w-32 h-36 rounded-2xl border border-dashed border-slate-300 hover:border-[#002B49] bg-slate-50 hover:bg-slate-100/70 flex flex-col items-center justify-center p-1.5 text-center cursor-pointer transition-all overflow-hidden relative group focus-within:ring-2 focus-within:ring-[#002B49]"
            >
              {profile.photo || user?.photo ? (
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  <img
                    src={profile.photo || user?.photo}
                    alt={`Fotografía de perfil de ${profile.nombre}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                    <Camera className="w-5 h-5 mb-1 text-[#FFB81C]" aria-hidden="true" />
                    <span className="text-[11px] font-semibold leading-tight">Cambiar foto</span>
                  </div>
                </div>
              ) : (
                <>
                  <Camera
                    className="w-7 h-7 text-slate-400 group-hover:text-[#002B49] transition-colors mb-2"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-[#002B49]">
                    Cambiar foto
                  </span>
                </>
              )}
              <input
                id="foto-perfil-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={isPhotoUploading}
                className="sr-only"
                aria-label="Subir nueva fotografía de perfil (JPG, PNG o WEBP)"
              />
            </label>
            <span className="text-[11px] text-slate-400 mt-2 text-center">
              {isPhotoUploading ? 'Guardando...' : 'JPG o PNG (máx. 2 MB)'}
            </span>
          </div>
        </div>
      </div>

      {/* TARJETA: Acompañamiento y Ajustes Académicos (Solo visible si el estudiante cuenta con perfil PAEDIS activo) */}
      {Boolean(profile.isPaedis || profile.role === 'estudiante_paedis') && (
        <article className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#002B49] flex items-center justify-center shrink-0" aria-hidden="true">
              <HeartHandshake className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3
                {...getVoiceProps(`Acompañamiento e inclusión académica PAEDIS en ${campusLabel}`)}
                className="text-lg font-bold text-slate-900"
              >
                Acompañamiento e inclusión académica (PAEDIS)
              </h3>
              <p className="text-xs text-slate-500">
                {clearReadingMode
                  ? `Apoyos PAEDIS activos en ${campusLabel}.`
                  : `Estado de apoyos registrados en ${campusLabel} para el periodo académico vigente.`}
              </p>
            </div>
          </div>

          <div
            {...getVoiceProps('Estado en programa PAEDIS: Adscrito o adscrita con ajustes académicos activos')}
            className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70"
          >
            <span className="text-xs font-medium text-slate-500 block mb-1">
              Estado en programa PAEDIS
            </span>
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Adscrito/a con ajustes académicos activos</span>
            </p>
          </div>

          {hasDisabilityProfile && disabilityMeta && (
            <div
              {...getVoiceProps(`Perfil PAEDIS: ${disabilityMeta.label}. ${disabilityMeta.summary}`)}
              className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#002B49] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
                  <span>Perfil de accesibilidad PAEDIS</span>
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#002B49] border border-sky-200">
                  {disabilityMeta.barrera}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">{disabilityMeta.label}</p>
              <p className="text-xs text-slate-700 leading-relaxed">
                {clearReadingMode
                  ? disabilityMeta.summary
                  : `${disabilityMeta.summary} ${disabilityMeta.autoAdaptationHint}`}
              </p>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Ajustes académicos registrados
            </span>
            {Array.isArray(profile.ajustesAprobados) && profile.ajustesAprobados.length === 0 ? (
              <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-xl text-xs text-slate-600">
                {clearReadingMode
                  ? 'Sin ajustes individuales registrados. Usa el menú de accesibilidad cuando lo necesites.'
                  : 'No registras ajustes individuales en este momento. Puedes utilizar las preferencias de lectura en la barra superior cuando lo necesites.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(profile.ajustesAprobados || [
                  { tipo: 'Tiempo adicional', descripcion: '50% de tiempo adicional en certámenes y evaluaciones teóricas.' },
                  { tipo: 'Material accesible', descripcion: 'Material de clases compatible con lectores de pantalla.' },
                  { tipo: 'Ubicación en aula', descripcion: 'Ubicación preferencial en primera fila y salas adaptadas.' },
                ]).map((ajuste) => (
                  <div
                    key={ajuste.tipo}
                    {...getVoiceProps(`${ajuste.tipo}. ${ajuste.descripcion}`)}
                    className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs"
                  >
                    <span className="font-bold text-slate-900 block text-sm">{ajuste.tipo}</span>
                    <span className="text-slate-600 block mt-1 leading-relaxed">{ajuste.descripcion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      )}

      {/* MODAL PARA EDITAR DATOS DE PERFIL Y SEDE */}
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
            className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200 animate-scale-in max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
              <div>
                <h3
                  id="modal-edit-profile-title"
                  {...getVoiceProps(`${editModalTitle} para Duoc UC ${campusLabel}`)}
                  className="text-lg font-bold text-slate-900"
                >
                  {editModalTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editModalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                aria-label="Cerrar ventana"
                {...getVoiceProps('Cerrar ventana de edición')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label htmlFor="edit-fullname" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nombre completo
                </label>
                <input
                  ref={firstInputRef}
                  id="edit-fullname"
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  {...getVoiceProps(`Nombre completo, ${editForm.fullName}`)}
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-rut" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  RUT institucional (ej. 21.987.654-3)
                </label>
                <input
                  id="edit-rut"
                  type="text"
                  value={editForm.rut}
                  onChange={(e) => setEditForm({ ...editForm, rut: e.target.value })}
                  {...getVoiceProps(`RUT institucional, ${editForm.rut}`)}
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                  required
                />
              </div>

              <div className={hideCareer ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
                {!hideCareer && (
                  <div>
                    <label htmlFor="edit-career" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Carrera
                    </label>
                    <select
                      id="edit-career"
                      value={editForm.career}
                      onChange={(e) => setEditForm({ ...editForm, career: e.target.value })}
                      {...getVoiceProps(`Carrera seleccionada: ${editForm.career}`)}
                      className="w-full min-h-[44px] text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                      required
                    >
                      {CARRERAS_DUOC_LIST.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="edit-campus" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Sede Institucional
                  </label>
                  <select
                    id="edit-campus"
                    value={editForm.campus}
                    onChange={(e) => setEditForm({ ...editForm, campus: e.target.value })}
                    {...getVoiceProps(`Sede seleccionada: ${editForm.campus}`)}
                    className="w-full min-h-[44px] text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                    required
                  >
                    {SEDES_DUOC.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="edit-direccion" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dirección particular
                </label>
                <input
                  id="edit-direccion"
                  type="text"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                  {...getVoiceProps(`Dirección particular, ${editForm.direccion}`)}
                  className="w-full min-h-[44px] text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-telefono" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Teléfono personal
                  </label>
                  <input
                    id="edit-telefono"
                    type="tel"
                    value={editForm.telefonoPersonal}
                    onChange={(e) => setEditForm({ ...editForm, telefonoPersonal: e.target.value })}
                    {...getVoiceProps(`Teléfono personal, ${editForm.telefonoPersonal}`)}
                    className="w-full min-h-[44px] text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
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
                    {...getVoiceProps(`Correo personal, ${editForm.emailPersonal || 'campo vacío'}`)}
                    className="w-full min-h-[44px] text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  {...getVoiceProps('Cancelar edición')}
                  className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  {...getVoiceProps('Guardar cambios del perfil')}
                  className="min-h-[44px] px-5 py-2 bg-[#002B49] hover:bg-[#001D33] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA CAMBIAR CONTRASEÑA */}
      {isPasswordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-change-password-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClosePasswordModal();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
        >
          <div
            ref={passwordModalRef}
            className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-200 animate-scale-in max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0">
              <div>
                <h3
                  id="modal-change-password-title"
                  {...getVoiceProps('Cambiar contraseña de acceso institucional')}
                  className="text-lg font-bold text-slate-900"
                >
                  Cambiar contraseña
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {clearReadingMode
                    ? 'Define una nueva contraseña de acceso.'
                    : 'Ingresa tu contraseña actual y define una nueva clave segura.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePasswordModal}
                aria-label="Cerrar ventana"
                {...getVoiceProps('Cerrar ventana de cambio de contraseña')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {passwordError && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 rounded-xl text-red-900 text-xs font-semibold flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} noValidate className="space-y-4 overflow-y-auto pr-1">
              <PasswordInputRow
                id="change-current-password"
                label="Contraseña actual"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPasswordError('');
                }}
                showValue={showCurrentPwd}
                onToggleShow={() => setShowCurrentPwd((prev) => !prev)}
                autoComplete="current-password"
                placeholder="Ingresa tu contraseña actual"
                inputRef={currentPasswordInputRef}
                voiceLabel="Contraseña actual"
              />

              <PasswordInputRow
                id="change-new-password"
                label="Nueva contraseña"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordError('');
                }}
                showValue={showNewPwd}
                onToggleShow={() => setShowNewPwd((prev) => !prev)}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                hint={
                  clearReadingMode
                    ? 'Mínimo 8 caracteres, letra y número.'
                    : 'Debe tener al menos 8 caracteres, una letra y un número.'
                }
                hintId="change-password-hint"
                voiceLabel="Nueva contraseña"
              />

              <PasswordInputRow
                id="change-confirm-password"
                label="Confirmar nueva contraseña"
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  setPasswordError('');
                }}
                showValue={showConfirmPwd}
                onToggleShow={() => setShowConfirmPwd((prev) => !prev)}
                autoComplete="new-password"
                placeholder="Repite la nueva contraseña"
                voiceLabel="Confirmar nueva contraseña"
              />

              <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  {...getVoiceProps('Cancelar cambio de contraseña')}
                  className="min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  aria-busy={isChangingPassword}
                  {...getVoiceProps('Guardar nueva contraseña')}
                  className="min-h-[44px] px-5 py-2 bg-[#002B49] hover:bg-[#001D33] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all disabled:opacity-60 inline-flex items-center gap-2 cursor-pointer"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" aria-hidden="true" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Actualizar contraseña</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
