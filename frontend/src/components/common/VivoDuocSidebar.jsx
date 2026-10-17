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
    { id: 'ava', label: 'AVA', icon: Laptop },
    { id: 'notas', label: 'Notas', icon: GraduationCap },
    { id: 'asistencia', label: 'Asistencia', icon: CheckSquare },
    { id: 'progreso', label: 'Progreso Académico', icon: Gauge },
    { id: 'tutoriales', label: 'Tutoriales', icon: Smartphone },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookMarked, badge: 'Reservas' },
    { id: 'bibliografia', label: 'Bibliografía de Asignaturas', icon: BookOpen },
    { id: 'apoyo', label: 'Apoyo al Estudio', icon: HeartHandshake },
    { id: 'correo', label: 'Correo', icon: Mail },
    { id: 'solicitudes', label: 'Solicitudes', icon: FileText, badge: 'Portal' },
    { id: 'ayuda', label: 'Centro de Ayuda', icon: HelpCircle },
    { id: 'eventos', label: 'Actividades y Eventos Online', icon: Calendar },
    { id: 'paedis-programas', label: 'Programas de apoyo al estudiante', icon: Users, isSpecial: true },
  ];

  return (
    <aside
      aria-label="Navegación principal de Vivo Duoc"
      className="w-full lg:w-64 bg-white border-r border-slate-200 flex flex-col py-4 shrink-0 transition-colors"
    >
      <nav className="flex-1 space-y-0.5 px-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-lg text-left transition-all group focus:outline-none focus:ring-2 focus:ring-[#002B49] ${
                isActive
                  ? 'bg-slate-100 text-[#002B49] font-black border-l-4 border-[#002B49] shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-[#002B49]'
              } ${item.isSpecial ? 'mt-4 pt-3 border-t border-slate-200 text-amber-900 bg-amber-50/50' : ''}`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#002B49]' : 'text-slate-400 group-hover:text-[#002B49]'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-[#002B49] text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Botón flotante oficial: Mesa de Servicios */}
      <div className="p-3 border-t border-slate-100">
        <a
          href="https://experienciavivo.duoc.cl/mesa-servicios"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-3 bg-black text-white hover:bg-slate-800 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm transition-all focus:ring-2 focus:ring-amber-400"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
          <span>Mesa de servicios</span>
        </a>
      </div>
    </aside>
  );
};
