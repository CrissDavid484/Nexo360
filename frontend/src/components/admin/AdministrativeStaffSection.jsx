import React, { useState, useMemo } from 'react';
import {
  Shield,
  UserCheck,
  Building2,
  MapPin,
  Search,
  UserPlus,
  Mail,
  Sparkles,
  BookOpen,
  X,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info,
} from 'lucide-react';

/**
 * Obtiene el esquema visual del badge según el rol administrativo
 */
const getRoleBadgeConfig = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'coordinador_paedis') {
    return {
      label: 'Coordinador/a PAEDIS',
      bgClass: 'bg-purple-100 text-purple-950 border-purple-300',
      icon: Sparkles,
      iconClass: 'text-purple-700',
      description: 'Coordinación del Programa de Acompañamiento a la Inclusión',
      scope: 'Gestión PAEDIS • Adaptaciones Curriculares • Acompañamiento Estudiantil',
    };
  }
  if (r === 'admin' || r === 'administrador') {
    return {
      label: 'Administrador/a Nexo360',
      bgClass: 'bg-blue-100 text-[#002B49] border-blue-300',
      icon: Shield,
      iconClass: 'text-[#002B49]',
      description: 'Administración Global de la Plataforma TI Nexo360',
      scope: 'Acceso Total • Gestión de Catálogos • Seguridad Ley N° 21.719',
    };
  }
  if (r === 'director' || r === 'subdirector') {
    return {
      label: r === 'director' ? 'Director/a de Carrera' : 'Subdirector/a Académico',
      bgClass: 'bg-amber-100 text-amber-950 border-amber-300',
      icon: Building2,
      iconClass: 'text-amber-800',
      description: 'Dirección y Supervisión Académica Institucional',
      scope: 'Supervisión de Mallas • Validación Curricular • Gestión de Docencia',
    };
  }
  if (r === 'profesor') {
    return {
      label: 'Profesor / Docente Titular',
      bgClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
      icon: BookOpen,
      iconClass: 'text-emerald-800',
      description: 'Cuerpo Docente Duoc UC',
      scope: 'Cátedras de Asignatura • Registro de Asistencias • Apoyo Académico',
    };
  }
  return {
    label: 'Personal Administrativo',
    bgClass: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: UserCheck,
    iconClass: 'text-slate-700',
    description: 'Gestión y Soporte Institucional Duoc UC',
    scope: 'Atención de Servicios • Gestión de Biblioteca y Financiamiento',
  };
};

/**
 * Componente del Apartado Administrativo de PAEDIS
 * Separa por completo a los coordinadores, administradores y cuerpo directivo del alumnado.
 */
export const AdministrativeStaffSection = ({
  staffUsers = [],
  onOpenCreateModal,
  isAdmin = false,
  isCoordinator = false,
  announce = () => {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'coordinador_paedis' | 'admin' | 'docente'
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Métricas agregadas del personal administrativo
  const metrics = useMemo(() => {
    const total = staffUsers.length;
    const coordinadores = staffUsers.filter((u) => u.role === 'coordinador_paedis').length;
    const admins = staffUsers.filter((u) => u.role === 'admin' || u.role === 'administrador').length;
    const faculty = staffUsers.filter((u) =>
      ['profesor', 'director', 'subdirector', 'administrativo'].includes(u.role)
    ).length;
    const sedesSet = new Set(
      staffUsers.map((u) => u.campus || u.sede || 'Sede Alameda').filter(Boolean)
    );

    return {
      total,
      coordinadores,
      admins,
      faculty,
      sedesCount: sedesSet.size,
    };
  }, [staffUsers]);

  // Filtrado y ordenamiento alfabético de los miembros administrativos
  const filteredStaff = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    const cleanQ = q.replace(/[^0-9kK]/g, '');

    const filtered = staffUsers.filter((u) => {
      const name = u.fullName || u.nombre || '';
      const sede = u.campus || u.sede || '';
      const email = u.email || '';
      const rut = u.rut || '';
      const cleanRut = rut.replace(/[^0-9kK]/g, '').toLowerCase();

      const matchesRut =
        (rut && rut.toLowerCase().includes(q)) ||
        (cleanQ.length > 0 && cleanRut.includes(cleanQ));

      const matchesSearch =
        !q ||
        name.toLowerCase().includes(q) ||
        sede.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        matchesRut;

      if (!matchesSearch) return false;

      if (roleFilter === 'coordinador_paedis') {
        return u.role === 'coordinador_paedis';
      }
      if (roleFilter === 'admin') {
        return u.role === 'admin' || u.role === 'administrador';
      }
      if (roleFilter === 'docente') {
        return ['profesor', 'director', 'subdirector', 'administrativo'].includes(u.role);
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const nameA = (a.fullName || a.nombre || a.email || '').trim();
      const nameB = (b.fullName || b.nombre || b.email || '').trim();
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });
  }, [staffUsers, searchTerm, roleFilter]);

  const handleCardClick = (member) => {
    setSelectedStaff(member);
    announce(`Ficha administrativa de ${member.fullName || member.email} seleccionada.`, 'polite');
  };

  return (
    <article aria-labelledby="administrative-section-title" className="space-y-6">
      {/* 1. Header Banner del Apartado Administrativo */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-950 border border-purple-200 mb-2">
            <Shield className="w-3.5 h-3.5 text-purple-700" aria-hidden="true" />
            <span>Apartado Administrativo Institucional • PAEDIS Duoc UC</span>
          </div>
          <h1
            id="administrative-section-title"
            className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
          >
            Equipo Administrativo & Coordinación PAEDIS
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 max-w-2xl leading-relaxed">
            Directorio institucional reservado exclusivamente para coordinadores del programa PAEDIS,
            administradores de la plataforma Nexo360, docentes titulares y directivos de escuela.
            Mantiene la gobernanza y soporte separada del registro curricular del alumnado.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-[#002B49] hover:bg-blue-950 text-white shadow-md inline-flex items-center gap-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 self-start lg:self-auto"
        >
          <UserPlus className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Registrar Personal Administrativo</span>
        </button>
      </header>

      {/* 2. Tarjetas KPI de Gobernanza Administrativa */}
      <section
        aria-labelledby="administrative-kpi-heading"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <h2 id="administrative-kpi-heading" className="sr-only">
          Indicadores del equipo administrativo y coordinación
        </h2>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <header className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Coordinación PAEDIS
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-900 flex items-center justify-center">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </div>
          </header>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.coordinadores}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
            Acompañamiento e Inclusión
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <header className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Administradores Nexo360
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#002B49] flex items-center justify-center">
              <Shield className="w-4 h-4" aria-hidden="true" />
            </div>
          </header>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.admins}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
            Gestión global de plataforma TI
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <header className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Docentes & Directivos
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Building2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </header>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.faculty}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
            Supervisión académica de escuelas
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <header className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Sedes Gestionadas
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <MapPin className="w-4 h-4" aria-hidden="true" />
            </div>
          </header>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.sedesCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
            Presencia institucional Duoc UC
          </p>
        </div>
      </section>

      {/* 3. Directorio del Personal Administrativo y Coordinación */}
      <section
        aria-labelledby="administrative-directory-title"
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2
              id="administrative-directory-title"
              className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight"
            >
              Directorio Administrativo ({filteredStaff.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Haz clic en cualquier miembro del equipo para inspeccionar sus responsabilidades y permisos RBAC.
            </p>
          </div>

          {/* Filtros por Rol Administrativo */}
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filtrar por rol institucional"
          >
            {[
              { id: 'all', label: `Todos (${metrics.total})` },
              { id: 'coordinador_paedis', label: `Coordinadores (${metrics.coordinadores})` },
              { id: 'admin', label: `Administradores (${metrics.admins})` },
              { id: 'docente', label: `Docentes & Directivos (${metrics.faculty})` },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRoleFilter(f.id)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${
                  roleFilter === f.id
                    ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Barra de Búsqueda */}
        <div className="relative">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar coordinador, administrador o directivo por nombre, RUT o sede..."
            aria-label="Buscar coordinador, administrador o directivo por nombre, RUT o sede"
            className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          />
        </div>

        {/* Tarjetas del Personal Administrativo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5" role="list">
          {filteredStaff.length === 0 ? (
            <div className="col-span-full p-8 text-center text-slate-500 font-bold bg-slate-50 rounded-2xl border border-slate-200">
              No se encontraron miembros del equipo administrativo con los criterios seleccionados.
            </div>
          ) : (
            filteredStaff.map((member) => {
              const badge = getRoleBadgeConfig(member.role);
              const SedeIcon = badge.icon;
              const sedeName = member.campus || member.sede || 'Sede Alameda';
              const isSelected =
                selectedStaff &&
                (selectedStaff._id === member._id || selectedStaff.id === member.id);

              return (
                <div key={member._id || member.id} role="listitem">
                  <button
                    type="button"
                    onClick={() => handleCardClick(member)}
                    className={`w-full p-4 text-left flex flex-col justify-between gap-3 group cursor-pointer transition-all border rounded-2xl shadow-xs hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'bg-blue-50/80 border-[#002B49] ring-2 ring-[#002B49]'
                        : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-[#002B49]/40'
                    }`}
                    aria-label={`Ver ficha de ${member.fullName || member.email}, ${badge.label}, ${sedeName}`}
                  >
                    <div className="space-y-2 w-full">
                      {/* Badge de Rol Institucional */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${badge.bgClass}`}
                        >
                          <SedeIcon className={`w-3 h-3 ${badge.iconClass}`} aria-hidden="true" />
                          <span>{badge.label}</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#002B49] transition-transform group-hover:translate-x-0.5" />
                      </div>

                      {/* Nombre Completo */}
                      <div>
                        <span className="font-black block truncate text-sm sm:text-base text-slate-900 group-hover:text-[#002B49]">
                          {member.fullName || member.nombre || 'Personal Institucional'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 block truncate mt-0.5">
                          {sedeName}
                        </span>
                      </div>

                      {/* Correo Electrónico Institucional */}
                      {member.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium truncate pt-1 border-t border-slate-100">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Alcance de Funciones */}
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 line-clamp-1">
                      {badge.scope}
                    </div>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 4. Modal Accesible de Ficha Administrativa Detallada */}
      {selectedStaff && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-staff-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-scale-up">
            <header className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border mb-1.5 ${
                    getRoleBadgeConfig(selectedStaff.role).bgClass
                  }`}
                >
                  <Shield className="w-3 h-3" aria-hidden="true" />
                  <span>{getRoleBadgeConfig(selectedStaff.role).label}</span>
                </span>
                <h3 id="modal-staff-title" className="text-lg sm:text-xl font-black text-slate-900">
                  {selectedStaff.fullName || selectedStaff.email}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Ficha de Personal Institucional • Programa PAEDIS Duoc UC
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
                aria-label="Cerrar ficha administrativa"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Sede Asignada</span>
                  <span className="font-black text-slate-900">
                    {selectedStaff.campus || selectedStaff.sede || 'Sede Alameda'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">RUT Institucional</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedStaff.rut || 'No informado'}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Correo Institucional</span>
                  <span className="font-bold text-[#002B49]">{selectedStaff.email}</span>
                </div>
              </div>

              {/* Responsabilidades Institucionales */}
              <div className="space-y-1.5 p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200">
                <span className="font-black text-purple-950 text-xs block">
                  Alcance y Funciones en Nexo360:
                </span>
                <p className="text-xs text-purple-900 leading-relaxed font-medium">
                  {getRoleBadgeConfig(selectedStaff.role).scope}
                </p>
              </div>

              {/* Cumplimiento Normativo Ley N° 21.719 */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                <span>
                  Registro validado conforme a la Ley N° 21.719 de Protección de Datos Personales.
                </span>
              </div>
            </div>

            <footer className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStaff(null)}
                className="min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#002B49] text-white hover:bg-blue-950 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
              >
                Cerrar Ficha
              </button>
            </footer>
          </div>
        </div>
      )}
    </article>
  );
};
