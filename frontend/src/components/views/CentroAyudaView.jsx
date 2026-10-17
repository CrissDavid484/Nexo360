import React, { useState, useMemo } from 'react';
import { Search, HelpCircle, ChevronDown, ChevronUp, FilePlus, BookOpen, Laptop, ShieldCheck, HeartHandshake } from 'lucide-react';

export const CentroAyudaView = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const helpTopics = [
    {
      category: 'Vida Académica',
      icon: BookOpen,
      faqs: [
        {
          q: '¿Cómo funciona la toma de ramos y qué prioridad tengo en PAEDIS?',
          a: 'La inscripción de asignaturas se realiza en tramos horarios a través de Experiencia Vivo. Los estudiantes acreditados en PAEDIS cuentan con tramo de inscripción prioritaria garantizado para seleccionar horarios compatibles con traslados y terapias.',
        },
        {
          q: '¿Cómo justifico una inasistencia a clases o evaluaciones?',
          a: 'Tienes 5 días hábiles desde ocurrida la inasistencia para ingresar a la sección "Solicitudes" de esta plataforma, seleccionar "Asistencias y Justificativos" y adjuntar tu certificado médico o respaldo de terapia.',
        },
        {
          q: '¿Cómo hago valer mis ajustes de accesibilidad en las evaluaciones?',
          a: 'Todos los estudiantes con Ficha PAEDIS Alameda aprobada cuentan con adecuaciones registradas automáticamente en el sistema del docente (formatos digitales accesibles, lectores de pantalla, pruebas ampliadas o condiciones preferenciales de aula).',
        },
      ],
    },
    {
      category: 'Beneficios, Becas y TNE',
      icon: HeartHandshake,
      faqs: [
        {
          q: '¿Dónde revalido mi pase escolar TNE en Duoc UC?',
          a: 'Puedes revalidar tu sello TNE en los tótems Bip habilitados en el hall de tu sede o en los operativos presenciales coordinados al inicio de cada semestre.',
        },
        {
          q: '¿Cómo mantengo la Gratuidad o el Crédito con Aval del Estado (CAE)?',
          a: 'Debes mantener matrícula vigente y cumplir con el avance académico mínimo exigido. Recuerda firmar el pagaré de matrícula costo cero cada semestre en el portal de pagos.',
        },
      ],
    },
    {
      category: 'Servicios Digitales y Cuentas',
      icon: Laptop,
      faqs: [
        {
          q: '¿Cómo accedo a mi correo institucional y a Microsoft 365?',
          a: 'Tu cuenta oficial es con dominio @duocuc.cl. Tienes acceso gratuito a la suite Office 365, Teams, OneDrive y licencias educativas con solo iniciar sesión institucional.',
        },
        {
          q: '¿Cómo recupero mi clave si se bloqueó o no recuerdo el acceso?',
          a: 'Puedes autogestionar el cambio de clave en el portal de autoservicio Duoc o solicitar asistencia a la Mesa de Servicios (2 2999 3862).',
        },
      ],
    },
  ];

  const filteredTopics = useMemo(() => {
    if (!searchTerm.trim()) return helpTopics;
    const term = searchTerm.toLowerCase();

    return helpTopics
      .map((topic) => {
        const matchingFaqs = topic.faqs.filter(
          (faq) =>
            faq.q.toLowerCase().includes(term) || faq.a.toLowerCase().includes(term)
        );
        return { ...topic, faqs: matchingFaqs };
      })
      .filter((topic) => topic.faqs.length > 0);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Encabezado del Centro de Ayuda */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 tracking-tight">
          Centro de Ayuda Duoc UC
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Encuentra respuestas inmediatas a tus trámites, reglamentos, becas y beneficios institucionales, con acompañamiento especializado PAEDIS.
        </p>
      </div>

      {/* Buscador reactivo */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Escribe tu consulta (ej: justificar inasistencia, gratuidad, toma de ramos, accesibilidad)..."
          className="w-full text-xs sm:text-sm p-4 pl-12 rounded-xl border-2 border-slate-300 focus:border-[#002B49] focus:ring-4 focus:ring-amber-300 focus:outline-none bg-white font-medium shadow-xs"
        />
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" aria-hidden="true" />
      </div>

      {/* Temas y Preguntas Frecuentes */}
      <div className="space-y-6">
        {filteredTopics.map((topic, topicIdx) => {
          const Icon = topic.icon;

          return (
            <div
              key={topicIdx}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="bg-[#002B49] text-white px-6 py-3 flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <h2 className="text-sm sm:text-base font-bold tracking-wide">
                  {topic.category}
                </h2>
              </div>

              <div className="divide-y divide-slate-100">
                {topic.faqs.map((faq, faqIdx) => {
                  const faqKey = `${topicIdx}-${faqIdx}`;
                  const isOpen = expandedFaq === faqKey;

                  return (
                    <div key={faqIdx} className="p-4 sm:p-5">
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isOpen ? null : faqKey)}
                        className="w-full flex items-center justify-between text-left gap-4 focus:outline-none focus:ring-2 focus:ring-[#002B49] rounded p-1"
                        aria-expanded={isOpen}
                      >
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed pl-2 border-l-2 border-amber-400">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ¿No encontraste lo que buscabas? Crear solicitud */}
      <div className="p-6 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border border-amber-400">
        <div>
          <h3 className="font-bold text-base text-amber-300">
            ¿No encontraste respuesta para tu caso?
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Puedes abrir una solicitud formal directa a la coordinación académica o al equipo PAEDIS de tu sede.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('solicitudes')}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg shrink-0 flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
        >
          <FilePlus className="w-4 h-4" aria-hidden="true" />
          <span>Ingresar Nueva Solicitud</span>
        </button>
      </div>
    </div>
  );
};
