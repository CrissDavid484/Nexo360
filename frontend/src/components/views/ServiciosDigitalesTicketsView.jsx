import React from 'react';
import {
  Laptop,
  ExternalLink,
  LifeBuoy,
  Phone,
  Mail,
  KeyRound,
  Wifi,
  FileCheck,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { DEFAULT_CAMPUS } from '../../utils/studentUtils';

export const ServiciosDigitalesTicketsView = () => {
  const { getVoiceProps } = useAccessibility();

  const serviciosAtendidos = [
    {
      titulo: 'Cuentas y contraseñas',
      icono: KeyRound,
      desc: 'Recuperación de clave institucional @duocuc.cl, desbloqueo de acceso y configuración de Microsoft Authenticator.',
    },
    {
      titulo: 'Aula Virtual AVA',
      icono: Laptop,
      desc: 'Consultas sobre visualización de asignaturas inscritas, carga de evaluaciones o acceso a salas de clases virtuales.',
    },
    {
      titulo: `Red WiFi en ${DEFAULT_CAMPUS}`,
      icono: Wifi,
      desc: `Asistencia para conectar tus dispositivos a la red WiFi estudiantil DUOC_ACADEMIC y Eduroam dentro de ${DEFAULT_CAMPUS}.`,
    },
    {
      titulo: 'Software estudiantil',
      icono: FileCheck,
      desc: 'Activación de licencias gratuitas de Microsoft 365 (Word, Excel, Teams), Azure Dev Tools y software académico.',
    },
  ];

  return (
    <section aria-labelledby="tickets-view-title" className="space-y-6 w-full max-w-full overflow-x-clip">
      {/* 1. Encabezado limpio y amigable */}
      <div className="bg-neutral-0 px-6 sm:px-8 py-6 sm:py-7 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-neutral-200 shadow-sm">
        <div>
          <span className="text-xs font-semibold text-brand-navy block mb-1">
            Mesa de Servicios Digitales • Duoc UC - {DEFAULT_CAMPUS}
          </span>
          <h2
            id="tickets-view-title"
            {...getVoiceProps(`Soporte técnico y tickets digitales, Duoc UC ${DEFAULT_CAMPUS}`)}
            className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900"
          >
            Soporte técnico y tickets digitales
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 max-w-2xl leading-relaxed">
            Solicita ayuda técnica para tu correo institucional, AVA Blackboard, verificación en dos pasos (MFA), licencias y WiFi en {DEFAULT_CAMPUS}.
          </p>
        </div>

        <div className="shrink-0">
          <a
            href="https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir formulario oficial de tickets de Servicios Digitales en el Centro de Ayuda Duoc UC (nueva pestaña)"
            {...getVoiceProps('Crear ticket de soporte en el Centro de Ayuda Duoc UC')}
            className="min-h-[44px] px-5 py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white rounded-xl font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          >
            <span>Crear ticket de soporte</span>
            <ExternalLink className="w-4 h-4 text-brand-gold shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* 2. Áreas de soporte */}
      <article className="bg-neutral-0 rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 text-brand-navy flex items-center justify-center shrink-0" aria-hidden="true">
            <LifeBuoy className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              {...getVoiceProps('¿En qué te puede ayudar Soporte TI?')}
              className="text-lg font-bold text-neutral-900"
            >
              ¿En qué te puede ayudar Soporte TI?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500">
              Consultas frecuentes atendidas por la mesa de ayuda tecnológica en {DEFAULT_CAMPUS}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviciosAtendidos.map((item) => {
            const Icon = item.icono;
            return (
              <div
                key={item.titulo}
                {...getVoiceProps(`${item.titulo}. ${item.desc}`)}
                className="p-5 bg-neutral-50/70 border border-neutral-200/80 rounded-2xl flex flex-col justify-between hover:bg-neutral-0 hover:shadow-sm transition-all duration-200"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-neutral-0 border border-neutral-200/80 text-brand-navy flex items-center justify-center mb-3 shadow-2xs" aria-hidden="true">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h4 className="font-bold text-neutral-900 text-sm sm:text-base mb-1">
                    {item.titulo}
                  </h4>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      {/* 3. Instrucciones y canales de contacto */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <article
          {...getVoiceProps(
            `Cómo ingresar un ticket paso a paso. 1. Selecciona Crear ticket de soporte. 2. Ingresa con tu correo institucional. 3. Elige la categoría. 4. Indica que perteneces a ${DEFAULT_CAMPUS}. 5. Recibirás un número de seguimiento.`
          )}
          className="md:col-span-7 bg-neutral-0 rounded-2xl border border-neutral-200 p-6 sm:p-7 shadow-sm space-y-4"
        >
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 border-b border-slate-100 pb-3">
            Cómo ingresar un ticket paso a paso
          </h3>
          <ol className="space-y-2.5 text-xs sm:text-sm text-neutral-600 leading-relaxed list-decimal pl-4">
            <li>
              Selecciona el botón <strong className="text-neutral-800">Crear ticket de soporte</strong> para abrir el formulario oficial de Servicios Digitales en el Centro de Ayuda.
            </li>
            <li>
              Ingresa con tu correo <strong className="text-neutral-800">@duocuc.cl</strong> y tu contraseña.
            </li>
            <li>
              Elige la categoría que mejor describa tu problema (correo, AVA, clave o software).
            </li>
            <li>
              Explica brevemente lo que ocurre e indica que perteneces a <strong className="text-neutral-800">{DEFAULT_CAMPUS}</strong>. Puedes adjuntar una captura de pantalla si lo deseas.
            </li>
            <li>
              Recibirás un número de seguimiento en tu correo para revisar la respuesta del equipo técnico.
            </li>
          </ol>
        </article>

        <aside className="md:col-span-5 bg-neutral-0 rounded-2xl border border-neutral-200 p-6 sm:p-7 shadow-sm space-y-4">
          <h3
            {...getVoiceProps(`Contacto directo en ${DEFAULT_CAMPUS}`)}
            className="text-base sm:text-lg font-bold text-neutral-900 border-b border-slate-100 pb-3"
          >
            Contacto directo
          </h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3 p-4 bg-neutral-50/80 rounded-xl border border-neutral-200/70">
              <Phone className="w-4 h-4 text-brand-navy shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold text-neutral-800 block">Teléfono Mesa de Servicios</span>
                <div className="flex flex-col gap-1.5 mt-1.5">
                  <a
                    href="tel:+56233844555"
                    {...getVoiceProps('Llamar a Mesa de Servicios +56 2 3384 4555')}
                    className="text-brand-navy font-bold text-sm hover:underline rounded inline-block"
                  >
                    +56 2 3384 4555
                  </a>
                  <a
                    href="https://wa.me/56232394230"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...getVoiceProps('WhatsApp Mesa de Servicios +56 2 3239 4230')}
                    className="text-brand-navy font-bold text-sm hover:underline rounded inline-block"
                  >
                    WhatsApp: +56 2 3239 4230
                  </a>
                  <span className="text-xs text-neutral-500 block">
                    Llamadas salientes desde: +56 600 088 2100
                  </span>
                  <span className="text-xs text-neutral-500 block">
                    Asistencia telefónica para estudiantes de {DEFAULT_CAMPUS}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-neutral-50/80 rounded-xl border border-neutral-200/70">
              <Mail className="w-4 h-4 text-brand-navy shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0 flex-1 space-y-2.5">
                <span className="font-semibold text-neutral-800 block">Correo de soporte</span>
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">
                    Soporte Sede Alameda (Principal)
                  </span>
                  <a
                    href="mailto:sd_al@duoc.cl"
                    {...getVoiceProps('Enviar correo a Soporte Sede Alameda Principal sd_al@duoc.cl')}
                    className="text-brand-navy font-extrabold text-sm sm:text-base hover:underline rounded mt-0.5 inline-block break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy"
                  >
                    sd_al@duoc.cl
                  </a>
                </div>
                <div className="pt-2 border-t border-neutral-200">
                  <span className="text-xs font-medium text-neutral-600 block">
                    Mesa de Servicios Central
                  </span>
                  <a
                    href="mailto:mesadeservicios@duoc.cl"
                    {...getVoiceProps('Enviar correo a Mesa de Servicios Central mesadeservicios@duoc.cl')}
                    className="text-brand-navy font-semibold text-xs sm:text-sm hover:underline rounded mt-0.5 inline-block break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy"
                  >
                    mesadeservicios@duoc.cl
                  </a>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
