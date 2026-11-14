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

export const ServiciosDigitalesTicketsView = () => {
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
      titulo: 'Red WiFi en sede',
      icono: Wifi,
      desc: 'Asistencia para conectar tus dispositivos a la red WiFi estudiantil y Eduroam dentro de tu sede.',
    },
    {
      titulo: 'Software estudiantil',
      icono: FileCheck,
      desc: 'Activación de licencias gratuitas de Microsoft 365 (Word, Excel, Teams), Azure Dev Tools y software académico.',
    },
  ];

  return (
    <section aria-labelledby="tickets-view-title" className="space-y-6">
      {/* 1. Encabezado limpio y amigable */}
      <div className="bg-white px-6 sm:px-8 py-6 sm:py-7 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-semibold text-[#002B49] block mb-1">
            Mesa de Servicios Digitales • Duoc UC
          </span>
          <h2 id="tickets-view-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Soporte técnico y tickets digitales
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Solicita ayuda técnica para tu correo institucional, AVA Blackboard, verificación en dos pasos (MFA), licencias y WiFi.
          </p>
        </div>

        <div className="shrink-0">
          <a
            href="https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id=31306954742157"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir formulario oficial de tickets de Servicios Digitales en el Centro de Ayuda Duoc UC (nueva pestaña)"
            className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          >
            <span>Crear ticket de soporte</span>
            <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* 2. Áreas de soporte */}
      <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#002B49] flex items-center justify-center shrink-0" aria-hidden="true">
            <LifeBuoy className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              ¿En qué te puede ayudar Soporte TI?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Consultas frecuentes atendidas por la mesa de ayuda tecnológica.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviciosAtendidos.map((item, idx) => {
            const Icon = item.icono;
            return (
              <div
                key={idx}
                className="p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <div>
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 text-[#002B49] flex items-center justify-center mb-3 shadow-2xs" aria-hidden="true">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                    {item.titulo}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
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
        <article className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Cómo ingresar un ticket paso a paso
          </h3>
          <ol className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed list-decimal pl-4">
            <li>
              Selecciona el botón <strong className="text-slate-800">Crear ticket de soporte</strong> para abrir el formulario oficial de Servicios Digitales en el Centro de Ayuda.
            </li>
            <li>
              Ingresa con tu correo <strong className="text-slate-800">@duocuc.cl</strong> y tu contraseña.
            </li>
            <li>
              Elige la categoría que mejor describa tu problema (correo, AVA, clave o software).
            </li>
            <li>
              Explica brevemente lo que ocurre e indica tu sede. Puedes adjuntar una captura de pantalla si lo deseas.
            </li>
            <li>
              Recibirás un número de seguimiento en tu correo para revisar la respuesta del equipo técnico.
            </li>
          </ol>
        </article>

        <aside className="md:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Contacto directo
          </h3>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-start gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <Phone className="w-4 h-4 text-[#002B49] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold text-slate-800 block">Teléfono Mesa de Servicios</span>
                <a
                  href="tel:229993862"
                  className="text-[#002B49] font-bold text-sm hover:underline rounded mt-0.5 inline-block"
                >
                  2 2999 3862
                </a>
                <span className="text-xs text-slate-500 block mt-0.5">Asistencia telefónica para estudiantes</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <Mail className="w-4 h-4 text-[#002B49] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold text-slate-800 block">Correo de soporte</span>
                <a
                  href="mailto:mesadeservicios@duoc.cl"
                  className="text-[#002B49] font-bold hover:underline rounded mt-0.5 inline-block"
                >
                  mesadeservicios@duoc.cl
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
