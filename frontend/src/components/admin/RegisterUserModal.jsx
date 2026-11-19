import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Loader2,
  AlertTriangle,
  ChevronDown,
  Check,
  Shield,
  KeyRound,
  Mail,
  Sparkles,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAccessibleModal } from '../../hooks/useAccessibleModal';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import {
  INSTITUTIONAL_DOMAINS,
  isStudentDomain,
  composeFullName,
  buildInitialPasswordPreview,
} from '../../utils/studentUtils';
import {
  DISABILITY_PROFILES,
  COLOR_BLIND_MODES,
  getDisabilityProfileMeta,
} from '../../utils/accessibilityProfiles';

const INPUT_CLASS =
  'w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-medium transition-all shadow-2xs';

const COLOR_BLIND_FILTER_OPTIONS = COLOR_BLIND_MODES.filter((mode) => mode.id !== 'none');

function createInitialFormState(defaultCampus) {
  return {
    firstName: '',
    paternalLastName: '',
    maternalLastName: '',
    emailLocal: '',
    emailDomain: 'duocuc.cl',
    rut: '',
    isPaedis: false,
    disabilityProfile: 'ninguna',
    colorBlindMode: 'deuteranopia',
    enableVoiceReaderByDefault: true,
    staffRole: 'coordinador_paedis',
    career: '',
    campus: defaultCampus || 'Sede Alameda',
  };
}

function parseEmailLocalChange(rawValue, currentDomain) {
  const atIndex = rawValue.indexOf('@');
  if (atIndex === -1) {
    return { emailLocal: rawValue, emailDomain: currentDomain };
  }

  const localPart = rawValue.slice(0, atIndex).trim();
  const domainPart = rawValue.slice(atIndex + 1).trim().toLowerCase();

  if (INSTITUTIONAL_DOMAINS.includes(domainPart)) {
    return { emailLocal: localPart, emailDomain: domainPart };
  }

  return { emailLocal: rawValue, emailDomain: currentDomain };
}

function resolveEffectiveRole(form) {
  if (!isStudentDomain(form.emailDomain)) {
    return form.staffRole;
  }
  return form.isPaedis ? 'estudiante_paedis' : 'estudiante';
}

function validateStudentOrStaffFields({ form, careerQuery, isAdmin }) {
  if (isStudentDomain(form.emailDomain)) {
    const effectiveCareer = (form.career || careerQuery || '').trim();
    if (!effectiveCareer) {
      return 'Por favor, selecciona o escribe una carrera Duoc UC.';
    }
    return '';
  }

  if (!form.staffRole) {
    return 'Por favor, selecciona un rol institucional.';
  }
  if (form.staffRole === 'admin' && !isAdmin) {
    return 'Acceso restringido: Solo un Administrador puede crear o asignar usuarios con el rol Administrador.';
  }
  return '';
}

function validateRegistrationForm({ form, careerQuery, isAdmin }) {
  if (!form.firstName.trim()) {
    return 'Por favor, ingresa el nombre del usuario.';
  }
  if (!form.paternalLastName.trim()) {
    return 'Por favor, ingresa el apellido paterno del usuario.';
  }

  const emailLocal = form.emailLocal.trim();
  if (!emailLocal || emailLocal.includes('@')) {
    return 'Ingresa un correo institucional Duoc UC válido (@duocuc.cl, @profesor.duoc.cl o @duoc.cl).';
  }
  if (!/^[a-zA-Z0-9._%+-]{1,64}$/.test(emailLocal)) {
    return 'La parte local del correo solo puede contener letras, números y los símbolos . _ % + -.';
  }

  const rut = form.rut.trim();
  if (!rut || !/\d/.test(rut)) {
    return 'Por favor, ingresa un RUT válido (ej. 20.123.456-7).';
  }

  const roleError = validateStudentOrStaffFields({ form, careerQuery, isAdmin });
  if (roleError) {
    return roleError;
  }

  if (!form.campus.trim()) {
    return 'Por favor, selecciona una sede institucional.';
  }

  return '';
}

function buildRegistrationPayload({ form, careerQuery }) {
  const firstName = form.firstName.trim();
  const paternalLastName = form.paternalLastName.trim();
  const maternalLastName = form.maternalLastName.trim();
  const isStudent = isStudentDomain(form.emailDomain);
  const role = resolveEffectiveRole(form);

  const payload = {
    firstName,
    paternalLastName,
    maternalLastName,
    fullName: composeFullName({ firstName, paternalLastName, maternalLastName }),
    email: `${form.emailLocal.trim().toLowerCase()}@${form.emailDomain}`,
    rut: form.rut.trim(),
    role,
    career: isStudent ? (form.career || careerQuery || '').trim() : '',
    campus: form.campus.trim(),
    isPaedis: isStudent && form.isPaedis,
    consentimientoLey21719: {
      aceptado: true,
      fechaAceptacion: new Date(),
      finalidadTratamiento:
        'Gestión académica, acompañamiento PAEDIS y prevención de deserción estudiantil según Ley N° 21.719 de Chile',
    },
  };

  if (isStudent && form.isPaedis) {
    payload.disabilityProfile = form.disabilityProfile || 'ninguna';
    if (form.disabilityProfile === 'daltonismo') {
      payload.colorBlindMode = form.colorBlindMode || 'deuteranopia';
    }
    const meta = getDisabilityProfileMeta(payload.disabilityProfile);
    if (payload.disabilityProfile !== 'ninguna' && meta?.barrera) {
      payload.barreraPaedis = meta.barrera;
    }
    const isVisualCondition =
      payload.disabilityProfile === 'ceguera_total' ||
      payload.disabilityProfile === 'baja_vision';
    const voiceReaderDefault =
      form.enableVoiceReaderByDefault !== undefined
        ? Boolean(form.enableVoiceReaderByDefault)
        : isVisualCondition;

    payload.accessibilityPreferences = {
      ...BASE_ACCESSIBILITY_PREFERENCES,
      ...(meta?.defaults || {}),
      voiceReader: voiceReaderDefault,
      screenReaderOptimized: true,
      disabilityProfile: payload.disabilityProfile,
      colorBlindMode: payload.colorBlindMode || meta?.defaults?.colorBlindMode || 'none',
    };
  }

  return payload;
}

function CareerComboboxField({
  careerQuery,
  selectedCareer,
  filteredCareers,
  isOpen,
  dropdownRef,
  onQueryChange,
  onSelectCareer,
  onToggleOpen,
  onOpen,
  getVoiceProps,
}) {
  const careerInputVoiceProps = getVoiceProps('Carrera Duoc UC. Escribe o selecciona una carrera');

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      <label htmlFor="create-career-input" className="text-xs font-semibold text-slate-700">
        Carrera Duoc UC <span className="text-red-600">*</span>
      </label>
      <div className="relative">
        <input
          id="create-career-input"
          type="text"
          required
          value={careerQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          data-voice-managed={careerInputVoiceProps['data-voice-managed']}
          onMouseEnter={careerInputVoiceProps.onMouseEnter}
          onFocus={(e) => {
            careerInputVoiceProps.onFocus(e);
            onOpen();
          }}
          placeholder="Selecciona una carrera..."
          aria-expanded={isOpen}
          aria-controls="create-career-listbox"
          className={`${INPUT_CLASS} pr-10`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggleOpen}
          {...getVoiceProps('Desplegar lista de carreras')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] rounded-lg"
          aria-label="Desplegar lista de carreras"
        >
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div
          id="create-career-listbox"
          role="listbox"
          aria-label="Carreras Duoc UC disponibles"
          className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl divide-y divide-slate-100 animate-fade-in"
        >
          {filteredCareers.length === 0 ? (
            <div className="p-3 text-xs text-slate-500 font-medium">
              No se encontraron carreras con ese nombre. Puedes escribir una nueva.
            </div>
          ) : (
            filteredCareers.map((c) => {
              const isSelected = selectedCareer === c.name;
              return (
                <button
                  key={c._id || c.id || c.name}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelectCareer(c.name)}
                  {...getVoiceProps(`Seleccionar carrera ${c.name}`)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected ? 'bg-amber-50 text-[#002B49]' : 'text-slate-800'
                  }`}
                >
                  <span>{c.name}</span>
                  {isSelected && <Check className="w-4 h-4 text-amber-600" aria-hidden="true" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function PaedisStudentSection({
  form,
  onPaedisToggle,
  onDisabilityChange,
  onColorBlindChange,
  onVoiceReaderDefaultChange,
  getVoiceProps,
}) {
  const selectedProfileMeta = useMemo(
    () => getDisabilityProfileMeta(form.disabilityProfile),
    [form.disabilityProfile]
  );
  const selectedColorBlindMeta = useMemo(
    () => COLOR_BLIND_MODES.find((mode) => mode.id === form.colorBlindMode),
    [form.colorBlindMode]
  );

  return (
    <div className="space-y-3 p-4 bg-slate-50/90 border border-slate-200 rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span
            id="create-paedis-label"
            className="text-xs font-semibold text-slate-800 block"
          >
            ¿Pertenece a PAEDIS? <span className="text-red-600">*</span>
          </span>
          <span className="text-[11px] text-slate-500 block">
            Rol asignado automáticamente:{' '}
            <strong className="text-[#002B49]">
              {form.isPaedis ? 'Estudiante PAEDIS' : 'Estudiante Regular'}
            </strong>
          </span>
        </div>

        <div
          role="group"
          aria-labelledby="create-paedis-label"
          className="grid grid-cols-2 gap-2 sm:w-auto"
        >
          <button
            type="button"
            aria-pressed={!form.isPaedis}
            onClick={() => onPaedisToggle(false)}
            {...getVoiceProps('No pertenece a PAEDIS, Estudiante Regular')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
              !form.isPaedis
                ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            No — Estudiante Regular
          </button>
          <button
            type="button"
            aria-pressed={form.isPaedis}
            onClick={() => onPaedisToggle(true)}
            {...getVoiceProps('Sí pertenece a PAEDIS, Estudiante PAEDIS')}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] ${
              form.isPaedis
                ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Sí — Estudiante PAEDIS
          </button>
        </div>
      </div>

      {form.isPaedis && (
        <div className="space-y-3 pt-2 border-t border-slate-200/80 animate-fade-in">
          <div className="space-y-1">
            <label
              htmlFor="create-disability-profile"
              className="text-xs font-semibold text-slate-700"
            >
              Condición / Discapacidad PAEDIS
            </label>
            <select
              id="create-disability-profile"
              value={form.disabilityProfile}
              onChange={(e) => onDisabilityChange(e.target.value)}
              {...getVoiceProps('Seleccionar condición o discapacidad PAEDIS')}
              className={`${INPUT_CLASS} bg-white`}
            >
              {DISABILITY_PROFILES.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label}
                </option>
              ))}
            </select>
          </div>

          {form.disabilityProfile === 'daltonismo' && (
            <div className="space-y-1 animate-fade-in">
              <label
                htmlFor="create-color-blind-mode"
                className="text-xs font-semibold text-slate-700"
              >
                Tipo de daltonismo
              </label>
              <select
                id="create-color-blind-mode"
                value={form.colorBlindMode}
                onChange={(e) => onColorBlindChange(e.target.value)}
                {...getVoiceProps('Seleccionar tipo de daltonismo')}
                className={`${INPUT_CLASS} bg-white`}
              >
                {COLOR_BLIND_FILTER_OPTIONS.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedProfileMeta && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#002B49]">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                <span>Adaptación automática al iniciar sesión</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {selectedProfileMeta.autoAdaptationHint || selectedProfileMeta.summary}
              </p>
              {form.disabilityProfile === 'daltonismo' && selectedColorBlindMeta && (
                <p className="text-[11px] font-semibold text-[#002B49]">
                  Filtro activo: {selectedColorBlindMeta.label} — {selectedColorBlindMeta.description}
                </p>
              )}
            </div>
          )}

          {(form.disabilityProfile === 'ceguera_total' || form.disabilityProfile === 'baja_vision') && (
            <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-1.5 text-xs">
              <label
                htmlFor="create-auto-voice-reader"
                aria-label="Activar lector de pantalla o voz asistida por defecto para el estudiante"
                className="flex items-start gap-2.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="create-auto-voice-reader"
                  checked={form.enableVoiceReaderByDefault ?? true}
                  onChange={(e) => onVoiceReaderDefaultChange?.(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#002B49] rounded border-slate-300 focus:ring-[#002B49]"
                />
                <span className="text-slate-900 leading-snug">
                  <strong className="block text-[#002B49]">
                    Lector de pantalla y voz asistida activa por defecto
                  </strong>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    Habilitado automáticamente para personas no videntes o con requerimientos visuales, permitiendo que la plataforma les hable y lea las opciones al ingresar sin requerir interacción visual previa.
                  </span>
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StaffRoleSection({ staffRole, isAdmin, onStaffRoleChange, getVoiceProps }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor="create-staff-role" className="text-xs font-semibold text-slate-700">
        Rol Institucional <span className="text-red-600">*</span>
      </label>
      <select
        id="create-staff-role"
        required
        value={staffRole}
        onChange={(e) => onStaffRoleChange(e.target.value)}
        {...getVoiceProps('Seleccionar rol institucional del funcionario')}
        className={INPUT_CLASS}
      >
        <option value="coordinador_paedis">Coordinador PAEDIS</option>
        {isAdmin ? (
          <option value="admin">Administrador</option>
        ) : (
          <option value="admin" disabled>
            Administrador (Restringido: Solo Administrador puede asignar este rol)
          </option>
        )}
      </select>
      {!isAdmin && (
        <span className="text-[11px] text-slate-500 font-medium block">
          *Por política de seguridad institucional, solo un Administrador puede crear usuarios con
          rol Administrador.
        </span>
      )}
    </div>
  );
}

/**
 * Modal accesible para el registro institucional de estudiantes y funcionarios en Nexo360.
 * Aplica validación por dominio institucional (@duocuc.cl / @profesor.duoc.cl / @duoc.cl),
 * perfilado automático PAEDIS, contraseña inicial derivada del RUT y cumplimiento Ley N° 21.719.
 */
export const RegisterUserModal = ({
  isOpen,
  onClose,
  closeBtnRef,
  sortedCareers = [],
  sortedSedes = [],
  isAdmin = false,
  defaultCampus = 'Sede Alameda',
  isSubmitting = false,
  serverError = '',
  onSubmitUser,
}) => {
  const { announce, getVoiceProps } = useAccessibility();

  const [form, setForm] = useState(() => createInitialFormState(defaultCampus));
  const [careerQuery, setCareerQuery] = useState('');
  const [isCareerDropdownOpen, setIsCareerDropdownOpen] = useState(false);
  const [localError, setLocalError] = useState('');

  const modalRef = useRef(null);
  const internalCloseBtnRef = useRef(null);
  const effectiveCloseBtnRef = closeBtnRef || internalCloseBtnRef;
  const careerDropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setForm(createInitialFormState(defaultCampus));
      setCareerQuery('');
      setIsCareerDropdownOpen(false);
      setLocalError('');
    }
  }, [isOpen, defaultCampus]);

  const handleModalClose = () => {
    setIsCareerDropdownOpen(false);
    setLocalError('');
    onClose?.();
  };

  useOnClickOutside(careerDropdownRef, () => setIsCareerDropdownOpen(false), {
    enabled: isOpen && isCareerDropdownOpen,
  });

  useAccessibleModal({
    isOpen,
    onClose: handleModalClose,
    containerRef: modalRef,
    initialFocusRef: effectiveCloseBtnRef,
  });

  const filteredCareers = useMemo(() => {
    const q = careerQuery.toLowerCase().trim();
    if (!q) return sortedCareers;
    return sortedCareers.filter((item) => (item.name || '').toLowerCase().includes(q));
  }, [sortedCareers, careerQuery]);

  const isStudent = isStudentDomain(form.emailDomain);
  const passwordPreview = useMemo(
    () => buildInitialPasswordPreview(form.rut, form.paternalLastName),
    [form.rut, form.paternalLastName]
  );

  const handleEmailLocalInputChange = (rawValue) => {
    const { emailLocal, emailDomain } = parseEmailLocalChange(rawValue, form.emailDomain);
    const switchingToStaff = emailDomain !== form.emailDomain && !isStudentDomain(emailDomain);
    if (switchingToStaff) {
      setIsCareerDropdownOpen(false);
    }
    setForm((prev) => ({
      ...prev,
      emailLocal,
      emailDomain,
    }));
  };

  const handleDomainSelectChange = (nextDomain) => {
    if (!isStudentDomain(nextDomain)) {
      setIsCareerDropdownOpen(false);
    }
    setForm((prev) => ({
      ...prev,
      emailDomain: nextDomain,
    }));
  };

  const handleDisabilityChange = (nextProfile) => {
    const isVisual = nextProfile === 'ceguera_total' || nextProfile === 'baja_vision';
    setForm((prev) => ({
      ...prev,
      disabilityProfile: nextProfile,
      enableVoiceReaderByDefault: isVisual ? true : prev.enableVoiceReaderByDefault,
      colorBlindMode:
        nextProfile === 'daltonismo' && prev.colorBlindMode === 'none'
          ? 'deuteranopia'
          : prev.colorBlindMode,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const validationError = validateRegistrationForm({ form, careerQuery, isAdmin });
    if (validationError) {
      setLocalError(validationError);
      announce(validationError, 'assertive');
      return;
    }

    const payload = buildRegistrationPayload({ form, careerQuery });
    await onSubmitUser?.(payload);
  };

  if (!isOpen) return null;

  const displayedError = localError || serverError;
  const fullEmailPreview =
    form.emailLocal.trim() && !form.emailLocal.includes('@')
      ? `${form.emailLocal.trim().toLowerCase()}@${form.emailDomain}`
      : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-6 sm:pt-10 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 shadow-xl space-y-5 my-0 sm:my-4 animate-fade-in focus:outline-none"
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#002B49] bg-slate-100 px-2.5 py-0.5 rounded-full inline-block mb-1">
              Registro Institucional Oficial • Duoc UC - {defaultCampus}
            </span>
            <h3 id="create-modal-title" className="text-xl font-bold text-slate-900">
              Registrar Estudiante / Usuario en Nexo360
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Ambiente institucional seguro regulado por la Ley N° 21.719
            </p>
          </div>
          <button
            ref={effectiveCloseBtnRef}
            type="button"
            onClick={handleModalClose}
            {...getVoiceProps('Cerrar modal de registro')}
            className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] cursor-pointer"
            aria-label="Cerrar modal de registro"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            handleSubmit(e).catch((err) => {
              console.error('[RegisterUserModal] Error al enviar formulario:', err);
            });
          }}
          className="space-y-4 text-xs sm:text-sm"
        >
          {/* 1. Identidad en 3 campos separados */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="create-first-name" className="text-xs font-semibold text-slate-700">
                Nombre <span className="text-red-600">*</span>
              </label>
              <input
                id="create-first-name"
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="Ej. Matías"
                {...getVoiceProps('Nombre del usuario')}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="create-paternal-last-name"
                className="text-xs font-semibold text-slate-700"
              >
                Apellido paterno <span className="text-red-600">*</span>
              </label>
              <input
                id="create-paternal-last-name"
                type="text"
                required
                value={form.paternalLastName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, paternalLastName: e.target.value }))
                }
                placeholder="Ej. Soto"
                {...getVoiceProps('Apellido paterno del usuario')}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="create-maternal-last-name"
                className="text-xs font-semibold text-slate-700"
              >
                Apellido materno{' '}
                <span className="text-[11px] font-normal text-slate-400">(Opcional)</span>
              </label>
              <input
                id="create-maternal-last-name"
                type="text"
                value={form.maternalLastName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, maternalLastName: e.target.value }))
                }
                placeholder="Ej. Gómez"
                {...getVoiceProps('Apellido materno del usuario, opcional')}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* 2. Correo Institucional con selector de dominio y RUT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="create-email-local" className="text-xs font-semibold text-slate-700">
                Correo Duoc UC <span className="text-red-600">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="create-email-local"
                  type="text"
                  required
                  value={form.emailLocal}
                  onChange={(e) => handleEmailLocalInputChange(e.target.value)}
                  placeholder="ej. m.soto"
                  {...getVoiceProps('Usuario del correo institucional Duoc UC')}
                  className={`${INPUT_CLASS} flex-1`}
                />
                <select
                  id="create-email-domain"
                  value={form.emailDomain}
                  onChange={(e) => handleDomainSelectChange(e.target.value)}
                  aria-label="Dominio institucional Duoc UC"
                  {...getVoiceProps(`Dominio institucional seleccionado arroba ${form.emailDomain}`)}
                  className="min-h-[44px] px-3 py-2.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 focus:border-[#002B49] rounded-xl text-slate-900 font-bold text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] shrink-0"
                >
                  {INSTITUTIONAL_DOMAINS.map((domain) => (
                    <option key={domain} value={domain}>
                      @{domain}
                    </option>
                  ))}
                </select>
              </div>
              {fullEmailPreview && (
                <span className="text-[11px] text-slate-500 font-medium block">
                  Correo completo: <strong className="text-[#002B49]">{fullEmailPreview}</strong>
                </span>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="create-rut" className="text-xs font-semibold text-slate-700">
                RUT <span className="text-red-600">*</span>
              </label>
              <input
                id="create-rut"
                type="text"
                required
                value={form.rut}
                onChange={(e) => setForm((prev) => ({ ...prev, rut: e.target.value }))}
                placeholder="20.123.456-7"
                {...getVoiceProps('RUT del usuario')}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* 3. Lógica condicional por dominio: Estudiante (@duocuc.cl) vs Staff (@profesor.duoc.cl / @duoc.cl) */}
          {isStudent ? (
            <>
              <PaedisStudentSection
                form={form}
                onPaedisToggle={(isPaedis) => setForm((prev) => ({ ...prev, isPaedis }))}
                onDisabilityChange={handleDisabilityChange}
                onColorBlindChange={(colorBlindMode) =>
                  setForm((prev) => ({ ...prev, colorBlindMode }))
                }
                onVoiceReaderDefaultChange={(enableVoiceReaderByDefault) =>
                  setForm((prev) => ({ ...prev, enableVoiceReaderByDefault }))
                }
                getVoiceProps={getVoiceProps}
              />

              <CareerComboboxField
                careerQuery={careerQuery}
                selectedCareer={form.career}
                filteredCareers={filteredCareers}
                isOpen={isCareerDropdownOpen}
                dropdownRef={careerDropdownRef}
                onQueryChange={(value) => {
                  setCareerQuery(value);
                  setForm((prev) => ({ ...prev, career: value }));
                  setIsCareerDropdownOpen(true);
                }}
                onSelectCareer={(careerName) => {
                  setCareerQuery(careerName);
                  setForm((prev) => ({ ...prev, career: careerName }));
                  setIsCareerDropdownOpen(false);
                }}
                onToggleOpen={() => setIsCareerDropdownOpen((prev) => !prev)}
                onOpen={() => setIsCareerDropdownOpen(true)}
                getVoiceProps={getVoiceProps}
              />
            </>
          ) : (
            <StaffRoleSection
              staffRole={form.staffRole}
              isAdmin={isAdmin}
              onStaffRoleChange={(staffRole) => setForm((prev) => ({ ...prev, staffRole }))}
              getVoiceProps={getVoiceProps}
            />
          )}

          {/* 4. Sede Institucional */}
          <div className="space-y-1">
            <label htmlFor="create-campus-select" className="text-xs font-semibold text-slate-700">
              Sede Duoc UC - {defaultCampus} <span className="text-red-600">*</span>
            </label>
            <select
              id="create-campus-select"
              required
              value={form.campus}
              onChange={(e) => setForm((prev) => ({ ...prev, campus: e.target.value }))}
              {...getVoiceProps(`Seleccionar sede institucional ${defaultCampus}`)}
              className={INPUT_CLASS}
            >
              <option value="" disabled>
                Selecciona una sede...
              </option>
              {sortedSedes.map((s) => (
                <option key={s._id || s.id || s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Información de contraseña inicial automática (sin campo manual) */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#002B49]">
              <KeyRound className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
              <span>Contraseña Inicial Automática y Envío por Correo</span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed">
              La contraseña inicial se genera automáticamente combinando el{' '}
              <strong>RUT sin puntos ni guion</strong> (con &ldquo;k&rdquo; minúscula) más la{' '}
              <strong>primera inicial en minúscula del apellido paterno</strong>, y se envía junto
              al enlace de activación mediante correo de bienvenida.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {passwordPreview ? (
                <>
                  <span className="text-slate-600 font-medium inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
                    Vista previa contraseña inicial:
                  </span>
                  <code className="px-2.5 py-0.5 rounded-lg bg-white border border-amber-300 font-mono font-bold text-[#002B49]">
                    {passwordPreview}
                  </code>
                </>
              ) : (
                <span className="text-[11px] text-slate-500 italic">
                  Ingresa RUT y apellido paterno para previsualizar la contraseña generada.
                </span>
              )}
            </div>
          </div>

          {/* 6. Aviso obligatorio Ley N° 21.719 (sin casilla opcional) */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#002B49]">
              <Shield className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
              <span>Protección de Datos Personales • Ley N° 21.719</span>
            </div>
            <p className="text-[11px] text-slate-600 font-normal leading-relaxed">
              Al registrar este usuario, se aplica automáticamente el tratamiento institucional
              obligatorio, resguardo de credenciales cifradas y limitación de finalidad (gestión
              académica, acompañamiento PAEDIS y retención estudiantil) conforme a la{' '}
              <strong>Ley N° 21.719 sobre Protección de Datos Personales</strong>.
            </p>
          </div>

          {displayedError && (
            <div
              role="alert"
              aria-live="assertive"
              {...getVoiceProps(displayedError)}
              className="p-3.5 bg-red-50 border border-red-300 text-red-900 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fade-in"
            >
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" aria-hidden="true" />
              <span>{displayedError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleModalClose}
              {...getVoiceProps('Cancelar registro de usuario')}
              className="min-h-[42px] px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              {...getVoiceProps('Registrar usuario en Nexo360')}
              className="min-h-[42px] px-6 py-2 bg-[#002B49] hover:bg-[#001D33] text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 animate-spin text-[#FFB81C]" aria-hidden="true" />
              )}
              <span>Registrar Usuario</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterUserModal;
