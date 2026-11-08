import React from 'react';
import {
  BookOpen,
  Calendar,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Users,
} from 'lucide-react';

export const BibliotecaView = () => {
  return (
    // A11y: Elemento semántico <section> con encabezado accesible
    <section aria-labelledby="biblioteca-view-title" className="space-y-6">
      {/* 1. Header Oficial de Bibliotecas Duoc UC */}
      <div className="bg-[#002B49] text-white px-6 py-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#FFB81C] shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-serif font-black text-xl text-white">DuocUC</span>
            <span className="text-xs text-amber-300 font-sans tracking-widest uppercase border-l border-white/30 pl-2">
              Bibliotecas
            </span>
          </div>
          <h2 id="biblioteca-view-title" className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Reserva de Salas e Instrucciones de Biblioteca
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl font-medium">
            Conoce cómo reservar salas de estudio, solicitar computadores y acceder a los recursos oficiales de Biblioteca Duoc UC.
          </p>
        </div>

        {/* Botón de Enlace Directo Principal */}
        <div className="shrink-0">
          <a
            href="https://bibliotecas.duoc.cl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ir al portal oficial de Bibliotecas Duoc UC (se abre en una nueva pestaña)"
            className="min-h-[48px] px-6 py-3 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#002B49]"
          >
            <span>Ir al Portal de Bibliotecas</span>
            <ExternalLink className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* 2. Tarjeta de Instrucciones Paso a Paso */}
      <article className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-xs" aria-hidden="true">
            <Calendar className="w-6 h-6 text-amber-800" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              ¿Cómo reservar una sala de estudio en tu sede?
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 font-bold">
              Instrucciones paso a paso para estudiantes regulares de Duoc UC
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Paso 1 */}
          <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-full bg-[#002B49] text-[#FFB81C] font-black text-sm flex items-center justify-center mb-3">
                1
              </span>
              <h4 className="font-black text-slate-900 text-base mb-1">
                Ingresa al Portal
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Accede a <strong>bibliotecas.duoc.cl</strong> e inicia sesión con tu cuenta de correo institucional (@duocuc.cl).
              </p>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-full bg-[#002B49] text-[#FFB81C] font-black text-sm flex items-center justify-center mb-3">
                2
              </span>
              <h4 className="font-black text-slate-900 text-base mb-1">
                Elige tu Sede y Sala
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Selecciona tu sede (ej: Sede Alameda) y el tipo de sala requerida (sala individual de estudio o sala colaborativa grupal).
              </p>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-full bg-[#002B49] text-[#FFB81C] font-black text-sm flex items-center justify-center mb-3">
                3
              </span>
              <h4 className="font-black text-slate-900 text-base mb-1">
                Selecciona Fecha y Hora
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Revisa los bloques horarios libres en la grilla oficial y reserva el bloque que mejor se adapte a tu horario de clases.
              </p>
            </div>
          </div>

          {/* Paso 4 */}
          <div className="p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col justify-between">
            <div>
              <span className="w-8 h-8 rounded-full bg-[#002B49] text-[#FFB81C] font-black text-sm flex items-center justify-center mb-3">
                4
              </span>
              <h4 className="font-black text-slate-900 text-base mb-1">
                Confirma y Check-in
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Recibirás un correo de confirmación. Al llegar a la biblioteca en tu sede, acércate al mesón o tótem para registrar tu ingreso.
              </p>
            </div>
          </div>
        </div>

        {/* Acceso directo a reservas */}
        <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-amber-800 shrink-0" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-black text-slate-900">
              ¿Listo para reservar? Puedes ingresar directamente al sistema institucional de reservas de Duoc UC.
            </span>
          </div>
          <a
            href="https://bibliotecas.duoc.cl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ir al sistema de reserva de salas en el portal de bibliotecas (se abre en una nueva pestaña)"
            className="min-h-[44px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001f35] text-white rounded-xl text-xs sm:text-sm font-black shrink-0 flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
          >
            <span>Reservar Sala Ahora</span>
            <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
          </a>
        </div>
      </article>

      {/* 3. Condiciones y Políticas de Uso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
            <Clock className="w-6 h-6 text-[#002B49]" aria-hidden="true" />
            <h3 className="text-lg font-black text-slate-900">
              Condiciones de Permanencia y Horarios
            </h3>
          </div>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            <li className="flex items-start gap-2.5">
              <span className="text-[#FFAA00] font-black text-base shrink-0" aria-hidden="true">◆</span>
              <span>Cada reserva corresponde a un módulo de <strong>60 minutos</strong> renovable según disponibilidad.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#FFAA00] font-black text-base shrink-0" aria-hidden="true">◆</span>
              <span>Existe una tolerancia de <strong>15 minutos</strong> desde el inicio del bloque para registrar tu ingreso.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#FFAA00] font-black text-base shrink-0" aria-hidden="true">◆</span>
              <span>Si no vas a ocupar la sala, <strong>cancela la reserva</strong> para que otro compañero pueda utilizarla.</span>
            </li>
          </ul>
        </article>

        <article className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
            <Laptop className="w-6 h-6 text-[#002B49]" aria-hidden="true" />
            <h3 className="text-lg font-black text-slate-900">
              Préstamo de Equipos y Libros Digitales
            </h3>
          </div>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            <li className="flex items-start gap-2.5">
              <span className="text-[#FFAA00] font-black text-base shrink-0" aria-hidden="true">◆</span>
              <span>Puedes solicitar <strong>notebooks y calculadoras</strong> en el mesón de atención presentando tu credencial.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#FFAA00] font-black text-base shrink-0" aria-hidden="true">◆</span>
              <span>Accede a miles de <strong>libros electrónicos (e-books)</strong> y revistas académicas en formato digital.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#FFAA00] font-black text-base shrink-0" aria-hidden="true">◆</span>
              <span>Todas las salas cuentan con enchufes de carga y conectividad WiFi institucional de alta velocidad.</span>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
};
