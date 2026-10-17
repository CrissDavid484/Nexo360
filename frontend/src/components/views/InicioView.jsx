import React from 'react';
import { Clock, ShieldCheck, HeartHandshake, ChevronRight, BookOpen, ExternalLink } from 'lucide-react';
import { VIVO_STUDENT_PROFILE } from '../../data/vivoDuocData';

export const InicioView = ({ onNavigate }) => {
  const currentDate = 'Viernes 16 de Octubre de 2026';

  const vidaEstudiantilCards = [
    {
      id: 'cva',
      title: 'Centro Virtual de Aprendizaje (CVA)',
      description: 'Transforma tu aprendizaje con estrategias y técnicas de estudio.',
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
    <div className="space-y-6">
      {/* Saludo institucional y Fecha Oficial (Screenshot 2) */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 tracking-tight">
          Buenas noches, <span className="font-semibold">{VIVO_STUDENT_PROFILE.nombre.split(' ')[0]} {VIVO_STUDENT_PROFILE.nombre.split(' ')[1]}</span>.
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {currentDate}
        </p>
      </div>

      {/* Banner Superior con Carrusel: "¿Dónde está mi horario? Revísalo aquí" */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center transition-all hover:shadow-md">
        <div className="flex items-center justify-center gap-2 text-slate-700 text-base sm:text-lg font-medium">
          <span>¿Dónde está mi horario?</span>
          <Clock className="w-5 h-5 text-slate-600 inline" aria-hidden="true" />
          <span>Revísalo</span>
          <button
            type="button"
            onClick={() => onNavigate('horarios')}
            className="text-[#002B49] font-black underline hover:text-amber-600 focus:ring-2 focus:ring-amber-400 rounded px-1"
          >
            aquí
          </button>
        </div>
        {/* Indicador de carrusel (punto activo) */}
        <div className="flex justify-center mt-4">
          <span className="w-2.5 h-2.5 bg-[#002B49] rounded-full inline-block" />
        </div>
      </div>

      {/* Banner Especial PAEDIS / Acompañamiento Inclusivo */}
      <div className="bg-gradient-to-r from-[#002B49] to-slate-900 text-white rounded-xl p-5 shadow-sm border border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-black">
            ♿
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Programa PAEDIS Activo
              </span>
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                Sede Alameda
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-100 mt-0.5">
              Acreditación PAEDIS Sede Alameda • Portal adaptado para Accesibilidad Universal y Autonomía Digital.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('perfil')}
          className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold rounded-lg shrink-0 transition-colors focus:ring-2 focus:ring-white"
        >
          Ver Ficha y Ajustes
        </button>
      </div>

      {/* Sección: Vida Estudiantil (Screenshot 2) */}
      <section aria-labelledby="vida-estudiantil-title" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Barra de cabecera azul oscuro */}
        <div className="bg-[#002B49] text-white px-6 py-3">
          <h2 id="vida-estudiantil-title" className="text-lg font-bold tracking-wide">
            Vida Estudiantil
          </h2>
        </div>

        {/* Grilla 2x2 de tarjetas con imagen y botón azul */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {vidaEstudiantilCards.map((card) => (
            <div
              key={card.id}
              className="flex flex-col sm:flex-row bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="sm:w-44 h-36 sm:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                <img
                  src={card.imgSrc}
                  alt={card.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">
                    {card.description}
                  </p>
                </div>
                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={card.action}
                    className="px-4 py-2 bg-[#002B49] hover:bg-slate-800 text-white text-xs font-bold rounded-md transition-colors inline-flex items-center gap-1.5 focus:ring-2 focus:ring-amber-400"
                  >
                    <span>{card.btnText}</span>
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
