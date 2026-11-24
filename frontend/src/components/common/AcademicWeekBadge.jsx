import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { api } from '@services/api';
import { useAccessibility } from '@context/AccessibilityContext';

let cachedCalendarPromise = null;
let cachedCalendarData = null;

export function invalidateAcademicWeekCache() {
  cachedCalendarPromise = null;
  cachedCalendarData = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexo360:calendar-updated'));
  }
}

async function fetchAcademicWeekOnce(force = false) {
  if (!force && cachedCalendarData) return cachedCalendarData;
  if (force || !cachedCalendarPromise) {
    cachedCalendarPromise = api
      .getCurrentAcademicCalendar()
      .then((res) => {
        if (res?.success && res.current) {
          cachedCalendarData = res.current;
          return res.current;
        }
        cachedCalendarPromise = null;
        return null;
      })
      .catch(() => {
        cachedCalendarPromise = null;
        return null;
      });
  }
  return cachedCalendarPromise;
}

export const AcademicWeekBadge = ({ compact = false, className = '' }) => {
  const { getVoiceProps } = useAccessibility();
  const [status, setStatus] = useState(() => cachedCalendarData);

  useEffect(() => {
    let mounted = true;
    fetchAcademicWeekOnce().then((data) => {
      if (mounted && data) setStatus(data);
    });

    const handleRefresh = () => {
      fetchAcademicWeekOnce(false).then((data) => {
        if (mounted && data) setStatus(data);
      });
    };

    window.addEventListener('nexo360:calendar-updated', handleRefresh);
    return () => {
      mounted = false;
      window.removeEventListener('nexo360:calendar-updated', handleRefresh);
    };
  }, []);

  if (!status?.label) return null;

  const isWeekZero = Boolean(status.isWeekZero);
  const isExamsOrRecess = status.phase === 'EXAMS' || status.phase === 'RECESS';

  const toneClass = isWeekZero
    ? 'bg-amber-50 text-amber-950 border-amber-200'
    : isExamsOrRecess
      ? 'bg-indigo-50 text-indigo-950 border-indigo-200'
      : 'bg-neutral-50 text-neutral-900 border-neutral-200';

  const secondaryToneClass = isWeekZero
    ? 'text-amber-900'
    : isExamsOrRecess
      ? 'text-indigo-700'
      : 'text-neutral-600';

  const iconClass = isWeekZero ? 'text-amber-700' : isExamsOrRecess ? 'text-indigo-700' : 'text-brand-navy';
  const titleText = [status.label, status.detail, status.upperYearNote, status.calendarResolution]
    .filter(Boolean)
    .join(' • ');

  const sepIdx = status.label.indexOf(' • ');
  const hasLeadingWeek = sepIdx > 0 && status.label.startsWith('Semana ');
  const primaryPart = hasLeadingWeek ? status.label.slice(0, sepIdx) : status.label;
  const secondaryPart = hasLeadingWeek ? status.label.slice(sepIdx) : '';

  return (
    <div
      role="status"
      aria-label={titleText}
      title={titleText}
      {...getVoiceProps(titleText)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium leading-snug select-none transition-colors whitespace-nowrap shrink-0 ${toneClass} ${className}`}
    >
      <CalendarDays className={`w-3.5 h-3.5 shrink-0 ${iconClass}`} aria-hidden="true" />
      {hasLeadingWeek ? (
        <span>
          <span className="font-bold whitespace-nowrap">{primaryPart}</span>
          <span className={`font-medium ${secondaryToneClass}`}>{secondaryPart}</span>
        </span>
      ) : (
        <span className="font-semibold">{status.label}</span>
      )}
      {!compact && status.upperYearNote && (
        <span className="hidden 2xl:inline text-xs text-amber-900 font-normal whitespace-nowrap">
          · Cursos sup. Semana 1
        </span>
      )}
    </div>
  );
};

export default AcademicWeekBadge;
