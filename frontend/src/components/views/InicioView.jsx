import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { VIVO_STUDENT_PROFILE } from '../../data/vivoDuocData';

export const InicioView = ({ onNavigate }) => {
  const currentDate = 'Viernes 16 de Octubre de 2026';

  const vidaEstudiantilCards = [
    {
      id: 'cva',
      title: 'Centro Virtual de Aprendizaje (CVA)',
      description: 'Transforma tu aprendizaje con estrategias y técnicas de estudio inclusivas.',
      btnText: 'Visitar CVA',
      imgSrc: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=60',
      action: () => window.open('https://experienciavivo.duoc.cl/cva', '_blank'),
    },
    {
      id: 'cdp',
      title: 'Centro de Desarrollo Profesional',
      description: 'Recursos y herramientas de apoyo para enfrentar tu proceso de inserción laboral.',
      btnText: 'Ir al sitio',
      imgSrc: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60',
      action: () => window.open('https://experienciavivo.duoc.cl/cdp', '_blank'),
    },
    {
      id: 'eventos',
      title: 'Eventos, actividades y apoyo online',
      description: 'Accede a eventos y apoyos que tenemos disponibles para ti.',
      btnText: 'Ir al sitio',
      imgSrc: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=60',
      action: () => onNavigate('eventos'),
    },
    {
      id: 'bienestar',
      title: 'Promotores del Bienestar',
      description: 'Conviértete en un promotor del bienestar y descubre como ayudarte a ti y a otros.',
      btnText: 'Conoce más',
      imgSrc: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&auto=format&fit=crop&q=60',
      action: () => onNavigate('ayuda'),
    },
  ];

  return (
    // A11y: Elemento semántico <section> con encabezado accesible
    <section aria-labelledby="inicio-view-heading" className="space-y-6">
      {/* Saludo institucional y Fecha Oficial */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-4">
        <h2 id="inicio-view-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Buenas tardes, <span className="text-[#002B49]">{VIVO_STUDENT_PROFILE.nombre.split(' ')[0]} {VIVO_STUDENT_PROFILE.nombre.split(' ')[1]}</span>.
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 font-bold">
          {currentDate}
        </p>
      </div>

      {/* Banner Superior: "¿Dónde está mi horario? Revísalo aquí" */}
      <article className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 text-center transition-all hover:shadow-md">
        <div className="flex flex-wrap items-center justify-center gap-2 text-slate-800 text-base sm:text-lg font-bold">
          <span>¿Dónde está mi horario de clases?</span>
          <Clock className="w-5 h-5 text-slate-700 inline" aria-hidden="true" />
          <span>Revísalo</span>
          <button
            type="button"
            onClick={() => onNavigate('horarios')}
            className="min-h-[44px] inline-flex items-center text-[#002B49] font-black underline hover:text-amber-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] rounded-lg px-2"
          >
            aquí directamente
          </button>
        </div>
      </article>

      {/* Banner de Acompañamiento e Inclusión */}
      <article className="bg-gradient-to-r from-[#002B49] to-slate-900 text-white rounded-2xl p-6 shadow-md border-2 border-[#FFB81C] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFB81C] text-slate-950 flex items-center justify-center shrink-0 font-black text-2xl shadow" aria-hidden="true">
            🎓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#FFB81C]">
                Periodo Académico 2026
              </span>
              <span className="bg-white/20 text-white text-[11px] px-2.5 py-0.5 rounded-full font-black">
                Sede Alameda
              </span>
            </div>
            <p className="text-sm font-bold text-slate-100 mt-1">
              Portal Estudiantil Duoc UC • Experiencia adaptada con Accesibilidad Universal y Autonomía Digital.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('perfil')}
          className="min-h-[44px] px-6 py-2.5 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black rounded-xl shrink-0 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2"
        >
          Ver Mi Perfil
        </button>
      </article>

      {/* Sección: Vida Estudiantil */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        <header className="bg-[#002B49] text-white px-6 py-4 border-b-2 border-[#FFB81C]">
          <h3 className="text-lg font-black tracking-wide">
            Vida Estudiantil & Beneficios
          </h3>
        </header>

        {/* Grilla de tarjetas */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {vidaEstudiantilCards.map((card) => (
            <article
              key={card.id}
              className="flex flex-col sm:flex-row bg-white border-2 border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="sm:w-44 h-40 sm:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                <img
                  src={card.imgSrc}
                  alt={`Fotografía representativa para ${card.title}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <h4 className="font-black text-slate-900 text-base leading-snug">
                    {card.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 mt-1.5 font-medium leading-relaxed">
                    {card.description}
                  </p>
                </div>
                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={card.action}
                    className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white text-xs sm:text-sm font-black rounded-xl transition-all inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                  >
                    <span>{card.btnText}</span>
                    <ChevronRight className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
