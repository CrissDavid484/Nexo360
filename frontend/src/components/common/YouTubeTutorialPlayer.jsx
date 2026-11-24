import React, { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';

function normalizeYouTubeEmbedUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return '';
  let normalized = url.trim().replace(/^\/\//, 'https://');
  normalized = normalized.replace(
    /^https?:\/\/(?:www\.)?youtube-nocookie\.com\/embed\//i,
    'https://www.youtube.com/embed/'
  );
  if (!/[?&]rel=/.test(normalized)) {
    normalized += `${normalized.includes('?') ? '&' : '?'}rel=0`;
  }
  if (!/[?&]modestbranding=/.test(normalized)) {
    normalized += `${normalized.includes('?') ? '&' : '?'}modestbranding=1`;
  }
  return normalized;
}

export const YouTubeTutorialPlayer = ({
  embedUrl,
  watchUrl,
  title,
  voiceProps = {},
  fallbackAriaLabel = 'Enlace directo al tutorial en YouTube',
  fallbackText = 'Tu navegador, bloqueador o red podría restringir la inserción de YouTube (Error 153). Puedes abrir el video directamente.',
  containerClassName = 'rounded-2xl border border-neutral-200 bg-neutral-950 shadow-xs',
}) => {
  const [hasVideoError, setHasVideoError] = useState(false);

  useEffect(() => {
    setHasVideoError(false);
  }, [embedUrl]);

  const safeEmbedUrl = normalizeYouTubeEmbedUrl(embedUrl);

  return (
    <div className="space-y-2.5 w-full">
      <div
        className={`relative w-full overflow-hidden ${
          hasVideoError
            ? 'min-h-[240px] sm:aspect-video flex items-center justify-center p-5 sm:p-6'
            : 'aspect-video'
        } ${containerClassName}`}
      >
        {hasVideoError ? (
          <div
            role="region"
            aria-label={fallbackAriaLabel}
            className="text-center max-w-md mx-auto space-y-3"
          >
            <div
              className="w-11 h-11 rounded-full bg-amber-400/15 border border-amber-300/50 text-amber-300 flex items-center justify-center mx-auto"
              aria-hidden="true"
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-bold text-white">
                No se pudo cargar el reproductor integrado
              </p>
              <p className="text-xs text-slate-200 leading-relaxed">{fallbackText}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                {...voiceProps}
                className="min-h-[44px] px-4 py-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-xl inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
              >
                <span>Abrir tutorial en YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => setHasVideoError(false)}
                className="min-h-[44px] px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-slate-200 border border-neutral-400 font-semibold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
              >
                <span>Reintentar reproductor</span>
              </button>
            </div>
          </div>
        ) : (
          <iframe
            key={safeEmbedUrl}
            src={safeEmbedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onError={() => setHasVideoError(true)}
            className="absolute inset-0 w-full h-full border-0"
          />
        )}
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setHasVideoError((prev) => !prev)}
          aria-pressed={hasVideoError}
          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-brand-navy border border-neutral-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-navy"
        >
          <span>
            {hasVideoError
              ? 'Volver al reproductor integrado'
              : '¿No carga el video? Abrir en YouTube'}
          </span>
        </button>
      </div>
      <span className="sr-only" aria-live="polite">
        {hasVideoError
          ? 'Mostrando enlace directo al tutorial en YouTube.'
          : 'Mostrando reproductor integrado de YouTube.'}
      </span>
    </div>
  );
};

export default YouTubeTutorialPlayer;
