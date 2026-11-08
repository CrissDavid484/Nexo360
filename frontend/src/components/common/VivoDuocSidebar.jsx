import React from 'react';
import {
  Home,
  Clock,
  Laptop,
  GraduationCap,
  CheckSquare,
  Gauge,
  Smartphone,
  BookMarked,
  BookOpen,
  HeartHandshake,
  Mail,
  FileText,
  HelpCircle,
  Calendar,
  Users,
} from 'lucide-react';

export const VivoDuocSidebar = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'horarios', label: 'Horarios de clases', icon: Clock },
    { id: 'ava', label: 'AVA Blackboard', icon: Laptop },
    { id: 'notas', label: 'Notas y Certámenes', icon: GraduationCap },
    { id: 'asistencia', label: 'Control de Asistencia', icon: CheckSquare },
    { id: 'progreso', label: 'Progreso Académico', icon: Gauge },
    { id: 'tutoriales', label: 'Tutoriales Accesibles', icon: Smartphone },
    { id: 'biblioteca', label: 'Biblioteca Duoc', icon: BookMarked, badge: 'Reservas' },
    { id: 'bibliografia', label: 'Bibliografía de Asignaturas', icon: BookOpen },
    { id: 'apoyo', label: 'Apoyo al Estudio', icon: HeartHandshake },
    { id: 'correo', label: 'Correo Institucional', icon: Mail },
    { id: 'solicitudes', label: 'Solicitudes Académicas', icon: FileText, badge: 'Portal' },
    { id: 'ayuda', label: 'Centro de Ayuda', icon: HelpCircle },
    { id: 'eventos', label: 'Actividades y Eventos Online', icon: Calendar },
    { id: 'programas-apoyo', label: 'Programas de apoyo al estudiante', icon: Users, isSpecial: true },
  ];

  return (
    // A11y: Barra lateral semántica <aside> con etiqueta accesible
    <aside
      aria-label="Navegación principal de Vivo Duoc"
      className="w-full lg:w-64 bg-white border-r-2 border-slate-200 flex flex-col py-4 shrink-0 transition-colors"
    >
      <nav aria-label="Menú de servicios estudiantiles" className="flex-1 space-y-1 px-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 ${
                isActive
                  ? 'bg-slate-100 text-[#002B49] font-black border-l-4 border-[#002B49] shadow-xs'
                  : 'text-slate-800 hover:bg-slate-100 hover:text-[#002B49]'
              } ${item.isSpecial ? 'mt-4 pt-3 border-t-2 border-slate-200 text-amber-950 bg-amber-50/70 border border-amber-300' : ''}`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#002B49]' : 'text-slate-600'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-[#002B49] text-[#FFB81C] text-[10px] font-black px-2 py-0.5 rounded-full ml-1 shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Botón flotante oficial: Mesa de Servicios */}
      <div className="p-3 border-t-2 border-slate-200 mt-2">
        <a
          href="https://experienciavivo.duoc.cl/mesa-servicios"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Mesa de servicios estudiantiles Duoc UC (abre en nueva pestaña)"
          className="w-full min-h-[44px] py-2.5 px-4 bg-slate-950 text-white hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-black text-center flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
        >
          <HelpCircle className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
          <span>Mesa de servicios</span>
        </a>
      </div>
    </aside>
  );
};
