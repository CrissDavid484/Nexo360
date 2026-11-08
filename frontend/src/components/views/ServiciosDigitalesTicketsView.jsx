import React from 'react';
import {
  Laptop,
  ExternalLink,
  LifeBuoy,
  Phone,
  Mail,
  CheckCircle2,
  KeyRound,
  Wifi,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';

export const ServiciosDigitalesTicketsView = () => {
  const serviciosAtendidos = [
    {
      titulo: 'Cuentas y Contraseñas',
      icono: KeyRound,
      desc: 'Bloqueo de acceso, recuperación de contraseña institucional @duocuc.cl y configuración de Microsoft Authenticator.',
    },
    {
      titulo: 'Aula Virtual AVA Blackboard',
      icono: Laptop,
      desc: 'Dificultades para visualizar ramos inscritos, problemas con subida de evaluaciones o errores en foros de cátedra.',
    },
    {
      titulo: 'Conectividad WiFi en Sedes',
      icono: Wifi,
      desc: 'Configuración de perfiles de conexión segura a la red WiFi institucional y Eduroam dentro de cualquier sede Duoc UC.',
    },
    {
      titulo: 'Convenios de Software Educativo',
      icono: FileCheck,
      desc: 'Activación de licencias de Microsoft 365 (Word, Excel, Teams), Azure Dev Tools para Informática y Adobe Creative Cloud.',
    },
  ];

  return (
    // A11y: Elemento semántico <section> con encabezado accesible
    <section aria-labelledby="tickets-view-title" className="space-y-6">
      {/* 1. Encabezado Oficial */}
      <div className="bg-[#002B49] text-white px-6 py-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#FFB81C] shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif font-black text-xl text-white">DuocUC</span>
            <span className="text-xs text-amber-300 font-sans tracking-widest uppercase border-l border-white/30 pl-2">
              Mesa de Servicios Digitales
            </span>
          </div>
          <h2 id="tickets-view-title" className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Tickets y Soporte a Servicios Digitales
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl font-medium">
            Información oficial y enlace directo para ingresar tickets de soporte técnico sobre cuentas, correo, AVA Blackboard, software y conectividad.
          </p>
        </div>

        {/* Botón de Enlace Directo Principal */}
        <div className="shrink-0">
          <a
            href="https://experienciavivo.duoc.cl/mesa-servicios"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir portal oficial para ingresar tickets en una nueva pestaña"
            className="min-h-[48px] px-6 py-3 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#002B49]"
          >
            <span>Crear Ticket en Mesa de Servicios</span>
            <ExternalLink className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* 2. ¿Cuándo ingresar un ticket técnico? */}
      <article className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#002B49] flex items-center justify-center shrink-0 shadow-xs" aria-hidden="true">
            <LifeBuoy className="w-6 h-6 text-[#002B49]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              ¿Qué requerimientos se resuelven mediante un Ticket?
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 font-bold">
              Tipos de solicitudes atendidas por el equipo de soporte de Duoc UC
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {serviciosAtendidos.map((item, idx) => {
            const Icon = item.icono;
            return (
              <div
                key={idx}
                className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#002B49] text-[#FFB81C] flex items-center justify-center mb-3 shadow-xs" aria-hidden="true">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h4 className="font-black text-slate-900 text-base mb-1">
                    {item.titulo}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      {/* 3. Instrucciones de cómo ingresar y canales directos */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Pasos */}
        <article className="md:col-span-7 bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 border-b-2 border-slate-100 pb-3">
            Pasos para Generar tu Ticket de Soporte
          </h3>
          <ol className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium list-decimal pl-4">
            <li>
              Haz clic en el botón <strong>"Crear Ticket en Mesa de Servicios"</strong> para ir al portal oficial.
            </li>
            <li>
              Inicia sesión con tu correo <strong>@duocuc.cl</strong> y contraseña institucional.
            </li>
            <li>
              Selecciona la categoría correspondiente a tu requerimiento o incidencia técnica.
            </li>
            <li>
              Describe la situación indicando tu carrera y sede, y adjunta capturas de pantalla si aplica.
            </li>
            <li>
              Recibirás un <strong>código de ticket (ID de incidente)</strong> en tu correo para hacer seguimiento hasta su resolución.
            </li>
          </ol>
        </article>

        {/* Canales de Contacto Directo */}
        <aside className="md:col-span-5 bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 border-b-2 border-slate-100 pb-3">
            Canales de Atención Directa
          </h3>
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <Phone className="w-5 h-5 text-[#002B49] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-black text-slate-900 block">Mesa de Servicios Telefónica:</span>
                <a
                  href="tel:229993862"
                  className="text-[#002B49] font-black text-sm hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] rounded"
                >
                  2 2999 3862
                </a>
                <span className="text-[11px] text-slate-600 block mt-0.5">Atención continua para estudiantes</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <Mail className="w-5 h-5 text-[#002B49] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-black text-slate-900 block">Correo Oficial de Soporte:</span>
                <a
                  href="mailto:mesadeservicios@duoc.cl"
                  className="text-[#002B49] font-black hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] rounded"
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

