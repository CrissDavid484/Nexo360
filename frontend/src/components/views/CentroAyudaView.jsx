import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, FilePlus, BookOpen, Laptop, HeartHandshake } from 'lucide-react';

export const CentroAyudaView = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const helpTopics = [
    {
      category: 'Vida Académica',
      icon: BookOpen,
      faqs: [
        {
          q: '¿Cómo funciona la toma de ramos y la inscripción preferencial?',
          a: 'La inscripción de asignaturas se realiza en tramos horarios a través de Experiencia Vivo. Los estudiantes con adecuaciones y asignación prioritaria disponen de un tramo inicial para seleccionar horarios compatibles con sus traslados y necesidades.',
        },
        {
          q: '¿Cómo justifico una inasistencia a clases o evaluaciones?',
          a: 'Tienes 5 días hábiles desde ocurrida la inasistencia para ingresar a la sección de trámites o contactar a tu sede y adjuntar tu certificado médico o documento de respaldo.',
        },
        {
          q: '¿Cómo hago valer mis ajustes de accesibilidad en las evaluaciones?',
          a: 'Todos los estudiantes con adecuaciones aprobadas cuentan con las especificaciones registradas automáticamente en el sistema del docente (formatos digitales accesibles, lectores de pantalla, pruebas ampliadas o condiciones preferenciales de aula).',
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
    // A11y: Elemento semántico <section> con encabezado accesible
    <section aria-labelledby="centro-ayuda-heading" className="space-y-6">
      {/* Encabezado del Centro de Ayuda */}
      <div className="border-b border-slate-200 pb-4">
        <h2 id="centro-ayuda-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Centro de Ayuda Duoc UC
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-3xl leading-relaxed font-medium">
          Encuentra respuestas inmediatas a tus trámites, reglamentos, becas y beneficios institucionales, con acompañamiento especializado.
        </p>
      </div>

      {/* A11y: Buscador semántico con <label> explícito asociado */}
      <div className="relative">
        <label htmlFor="ayuda-search-input" className="sr-only">
          Buscar preguntas frecuentes y trámites en el Centro de Ayuda
        </label>
        <input
          id="ayuda-search-input"
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Escribe tu consulta (ej: justificar inasistencia, gratuidad, toma de ramos, accesibilidad)..."
          className="w-full min-h-[50px] text-xs sm:text-sm p-4 pl-12 rounded-2xl border-2 border-slate-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 focus:border-[#002B49] bg-white font-bold text-slate-900 shadow-xs"
        />
        <Search className="w-5 h-5 text-slate-500 absolute left-4 top-3.5" aria-hidden="true" />
      </div>

      {/* Temas y Preguntas Frecuentes */}
      <div className="space-y-6">
        {filteredTopics.map((topic, topicIdx) => {
          const Icon = topic.icon;

          return (
            <article
              key={topicIdx}
              className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm"
            >
              <header className="bg-[#002B49] text-white px-6 py-4 flex items-center gap-3 border-b-2 border-[#FFB81C]">
                <Icon className="w-5 h-5 text-[#FFB81C] shrink-0" aria-hidden="true" />
                <h3 className="text-sm sm:text-base font-black tracking-wide">
                  {topic.category}
                </h3>
              </header>

              <div className="divide-y divide-slate-200">
                {topic.faqs.map((faq, faqIdx) => {
                  const faqKey = `${topicIdx}-${faqIdx}`;
                  const isOpen = expandedFaq === faqKey;
                  const buttonId = `faq-btn-${faqKey}`;
                  const panelId = `faq-panel-${faqKey}`;

                  return (
                    <div key={faqIdx} className="p-4 sm:p-5">
                      {/* A11y: Botón acordeón con aria-expanded, aria-controls y tamaño mínimo 44px */}
                      <button
                        id={buttonId}
                        type="button"
                        onClick={() => setExpandedFaq(isOpen ? null : faqKey)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="w-full min-h-[44px] flex items-center justify-between text-left gap-4 rounded-xl p-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                      >
                        <span className="font-black text-slate-900 text-xs sm:text-sm">
                          {faq.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-slate-700 shrink-0" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-600 shrink-0" aria-hidden="true" />
                        )}
                      </button>

                      {isOpen && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className="mt-3 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed pl-4 border-l-4 border-[#FFB81C]"
                        >
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>

      {/* ¿No encontraste lo que buscabas? Crear solicitud */}
      <article className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border-2 border-[#FFB81C]">
        <div>
          <h3 className="font-black text-base sm:text-lg text-[#FFB81C]">
            ¿No encontraste respuesta para tu caso?
          </h3>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium leading-relaxed">
            Puedes abrir una solicitud o ticket formal directo a la coordinación académica o a Servicios Digitales.
          </p>
        </div>

        {/* A11y: Botón con tamaño mínimo táctil 44x44px y foco ultra-visible */}
        <button
          type="button"
          onClick={() => onNavigate('solicitudes')}
          className="min-h-[44px] px-6 py-2.5 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black rounded-xl shrink-0 flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 shadow-sm"
        >
          <FilePlus className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
          <span>Ingresar Nueva Solicitud</span>
        </button>
      </article>
    </section>
  );
};
