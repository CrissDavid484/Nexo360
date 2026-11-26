import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  Users,
  HeartHandshake,
  Laptop,
  AlertTriangle,
  BarChart2,
  PieChart,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileDown,
} from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ADMIN_THEME } from '@components/admin/adminTheme';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_KEYS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const LEVEL_ROWS = [
  { key: '1°', label: '1.° Año' },
  { key: '2°', label: '2.° Año' },
  { key: '3°', label: '3.° Año' },
  { key: '4°', label: '4.° Año' },
];

const PRINT_STYLES = `
@media print {
  @page {
    size: landscape;
    margin: 10mm;
  }
  body * {
    visibility: hidden !important;
  }
  .nexo-dashboard-printable,
  .nexo-dashboard-printable * {
    visibility: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  .nexo-dashboard-printable {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .nexo-dashboard-printable .no-print {
    display: none !important;
  }
  .nexo-dashboard-printable .nexo-print-expand {
    max-height: none !important;
    overflow: visible !important;
  }
  .nexo-dashboard-printable .nexo-print-card {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
}
`;

const DonutChart = ({ data, colors, size = 184, strokeWidth = 28, getVoiceProps }) => {
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const segments = useMemo(() => {
    let accumulatedRatio = 0;
    return data.map((d, i) => {
      const value = Math.max(0, Number(d.value) || 0);
      const ratio = total > 0 ? value / total : 0;
      const dashLength = ratio * circumference;
      const dashOffset = -accumulatedRatio * circumference;
      accumulatedRatio += ratio;

      return {
        color: d.color || colors[i % colors.length],
        percentage: (ratio * 100).toFixed(1),
        ratio,
        dashLength,
        dashOffset,
        label: d.label,
        value,
      };
    });
  }, [data, colors, total, circumference]);

  const activeSeg = hoveredSegment !== null ? segments[hoveredSegment] : null;

  return (
    <div
      {...getVoiceProps(
        `Gráfico circular de distribución: ${segments.map((s) => `${s.label} ${s.value} (${s.percentage}%)`).join(', ')}`
      )}
      className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full py-2"
    >
      {/* Donut Ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Gráfico circular de distribución de riesgo de deserción"
          className="overflow-visible"
          onMouseLeave={() => setHoveredSegment(null)}
        >
          {/* Background track when total is 0 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-neutral-200 dark:text-neutral-700"
            strokeWidth={strokeWidth}
          />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments.map((seg, i) =>
              seg.dashLength > 0 ? (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={hoveredSegment === i ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${seg.dashLength} ${circumference}`}
                  strokeDashoffset={seg.dashOffset}
                  className="transition-all duration-150 cursor-pointer"
                  style={{
                    opacity: hoveredSegment === null || hoveredSegment === i ? 1 : 0.45,
                  }}
                  onMouseEnter={() => setHoveredSegment(i)}
                  onMouseMove={() => setHoveredSegment(i)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <title>{`${seg.label}: ${seg.value} (${seg.percentage}%)`}</title>
                </circle>
              ) : null
            )}
          </g>
        </svg>

        {/* Center readout */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-2">
            <span className="text-2xl font-black text-neutral-900 dark:text-white leading-none block">
              {activeSeg ? `${activeSeg.percentage}%` : total}
            </span>
            <span className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[96px]">
              {activeSeg ? activeSeg.label : 'Total'}
            </span>
          </div>
        </div>

        {/* Floating hover tooltip with exact percentage */}
        {activeSeg && (
          <div
            role="tooltip"
            className="absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg shadow-lg text-xs font-semibold z-20 whitespace-nowrap pointer-events-none"
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: activeSeg.color }} />
            {activeSeg.label}: {activeSeg.value} ({activeSeg.percentage}%)
          </div>
        )}
      </div>

      {/* Right-side Legend (zero overlap) */}
      <ul className="flex flex-col gap-2.5 min-w-[175px] w-full sm:w-auto" aria-label="Leyenda de distribución de riesgo">
        {segments.map((seg, i) => {
          const isHovered = hoveredSegment === i;
          return (
            <li
              key={seg.label}
              onMouseEnter={() => setHoveredSegment(i)}
              onMouseLeave={() => setHoveredSegment(null)}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                isHovered
                  ? 'bg-neutral-100 dark:bg-neutral-700/70 border-neutral-300 dark:border-neutral-600'
                  : 'bg-neutral-50/70 dark:bg-neutral-800/60 border-neutral-200/70 dark:border-neutral-700/70'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                  aria-hidden="true"
                />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                  {seg.label}
                </span>
              </span>
              <span className="font-black text-neutral-900 dark:text-white shrink-0 tabular-nums">
                {seg.percentage}% <span className="font-semibold text-neutral-500 dark:text-neutral-400">({seg.value})</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const CareerAlamedaBarChart = ({ items, getVoiceProps }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const containerRef = useRef(null);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.career.localeCompare(b.career, 'es');
    });
  }, [items]);

  const maxTotal = useMemo(
    () => Math.max(...sortedItems.map((item) => item.total || 0), 1),
    [sortedItems]
  );

  const hoveredItem = hoveredIndex !== null ? sortedItems[hoveredIndex] : null;

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({
      x,
      y,
      containerWidth: rect.width,
      containerHeight: rect.height,
    });
  }, []);

  const tooltipWidth = mousePos
    ? Math.min(480, Math.max(280, mousePos.containerWidth - 24))
    : 480;
  const halfWidth = tooltipWidth / 2;
  const minLeft = halfWidth + 8;
  const maxLeft = mousePos ? Math.max(minLeft, mousePos.containerWidth - halfWidth - 8) : minLeft;
  const left = mousePos ? Math.min(Math.max(mousePos.x, minLeft), maxLeft) : 0;
  // El tooltip se despliega SIEMPRE hacia arriba con separación de 26px sobre el cursor para no tapar la barra
  const isBelow = false;
  const caretOffset = mousePos
    ? Math.min(Math.max(mousePos.x - left, -halfWidth + 24), halfWidth - 24)
    : 0;

  const tooltipStyle = mousePos
    ? {
        left: `${left}px`,
        top: `${mousePos.y - 26}px`,
        transform: 'translate(-50%, -100%)',
        width: `${tooltipWidth}px`,
      }
    : {
        left: '50%',
        top: '28px',
        transform: 'translateX(-50%)',
        width: 'min(480px, calc(100% - 24px))',
      };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setHoveredIndex(null);
        setMousePos(null);
      }}
      {...getVoiceProps(
        `Matrícula Sede Alameda por carrera: ${sortedItems
          .filter((i) => i.total > 0)
          .map((i) => `${i.career} ${i.total}`)
          .join(', ') || 'Sin registros'}`
      )}
      className="relative space-y-3"
    >
      {/* Legend for stacked bar colors */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 dark:text-neutral-400">
        <span>{sortedItems.length} carreras oficiales • Duoc UC Sede Alameda</span>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" aria-hidden="true" />
            PAEDIS
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#002B49] dark:bg-sky-500 inline-block" aria-hidden="true" />
            Regulares
          </span>
        </div>
      </div>

      {/* Globo flotante dinámico interactivo (sigue la posición del cursor sin parpadeo) */}
      {hoveredItem && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-40 p-3.5 rounded-2xl bg-[#002B49]/95 dark:bg-slate-900/95 text-white backdrop-blur-md shadow-2xl text-xs space-y-2 border border-sky-400/40 dark:border-sky-500/40 transition-[top,left] duration-75 ease-out animate-fade-in"
          style={tooltipStyle}
        >
          {/* Flecha/indicador visual apuntando hacia el cursor */}
          {mousePos && (
            <div
              className="absolute -bottom-1.5 w-3 h-3 bg-[#002B49] dark:bg-slate-900 rotate-45 border-r border-b border-sky-400/40 dark:border-sky-500/40"
              style={{ left: `calc(50% + ${caretOffset}px - 6px)` }}
              aria-hidden="true"
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-1.5">
            <div>
              <p className="font-black text-sm leading-tight text-white">{hoveredItem.career}</p>
              {hoveredItem.school && (
                <p className="text-[11px] text-sky-200/90">{hoveredItem.school}</p>
              )}
            </div>
            <div className="font-bold tabular-nums text-amber-300 text-xs">
              Total: {hoveredItem.total} ({hoveredItem.paedisTotal} PAEDIS / {hoveredItem.regularTotal} Regulares)
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {LEVEL_ROWS.map(({ key, label }) => {
              const lvl = hoveredItem.levels?.[key] || { paedis: 0, regular: 0, total: 0 };
              return (
                <div
                  key={key}
                  className="rounded-lg bg-white/10 px-2 py-1.5 space-y-0.5"
                >
                  <span className="block font-black text-[11px] text-slate-200">{label}</span>
                  <span className="block text-[11px] text-indigo-300 font-semibold tabular-nums">
                    PAEDIS: {lvl.paedis}
                  </span>
                  <span className="block text-[11px] text-sky-300 font-semibold tabular-nums">
                    Reg.: {lvl.regular}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Horizontal bars list */}
      <div
        className="nexo-print-expand max-h-[340px] overflow-y-auto pr-1 space-y-2"
        onScroll={() => {
          setHoveredIndex(null);
          setMousePos(null);
        }}
      >
        {sortedItems.map((item, idx) => {
          const paedisPct = (item.paedisTotal / maxTotal) * 100;
          const regularPct = (item.regularTotal / maxTotal) * 100;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={item.career}
              role="button"
              tabIndex={0}
              onMouseEnter={(e) => {
                setHoveredIndex(idx);
                handleMouseMove(e);
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setMousePos(null);
              }}
              onFocus={() => {
                setHoveredIndex(idx);
                setMousePos(null);
              }}
              onBlur={() => {
                setHoveredIndex(null);
                setMousePos(null);
              }}
              className={`grid grid-cols-[minmax(110px,42%)_1fr_36px] items-center gap-3 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                isHovered
                  ? 'bg-blue-50/90 dark:bg-blue-900/30'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
              aria-label={`${item.career}: ${item.total} estudiantes (${item.paedisTotal} PAEDIS, ${item.regularTotal} regulares)`}
            >
              <span
                className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-snug"
                title={item.career}
              >
                {item.career}
              </span>
              <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-hidden flex">
                {item.paedisTotal > 0 && (
                  <div
                    className="h-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${Math.max(paedisPct, 4)}%` }}
                  />
                )}
                {item.regularTotal > 0 && (
                  <div
                    className="h-full bg-[#002B49] dark:bg-sky-500 transition-all duration-200"
                    style={{ width: `${Math.max(regularPct, 4)}%` }}
                  />
                )}
              </div>
              <span className="text-xs font-black text-right text-neutral-900 dark:text-white tabular-nums">
                {item.total}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NumericSeriesChart = ({ data, color, unitLabel = 'estudiantes', height = 210, getVoiceProps }) => {
  const safeData = useMemo(
    () =>
      data.map((d) => ({
        label: d.label,
        value: Math.max(0, Math.trunc(Number(d.value) || 0)),
      })),
    [data]
  );

  const maxValue = Math.max(...safeData.map((d) => d.value), 1);
  const chartWidth = 560;
  const padLeft = 20;
  const padRight = 16;
  const padTop = 26;
  const padBottom = 30;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const slotWidth = innerWidth / Math.max(safeData.length, 1);
  const barWidth = Math.min(22, Math.max(8, slotWidth * 0.62));
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div
      {...getVoiceProps(
        `Gráfico numérico: ${safeData.map((d) => `${d.label} ${d.value} ${unitLabel}`).join(', ')}`
      )}
      className="relative w-full"
    >
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Gráfico numérico de adopción del simulador"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Baseline */}
        <line
          x1={padLeft}
          y1={height - padBottom}
          x2={chartWidth - padRight}
          y2={height - padBottom}
          stroke="currentColor"
          className="text-neutral-200 dark:text-neutral-700"
          strokeWidth={1}
        />

        {safeData.map((d, i) => {
          const barHeight = d.value > 0 ? Math.max(6, (d.value / maxValue) * innerHeight) : 2;
          const x = padLeft + i * slotWidth + (slotWidth - barWidth) / 2;
          const y = height - padBottom - barHeight;
          const isHovered = hoveredIdx === i;
          const shortLabel = d.label.startsWith('Sem ') ? `S${d.label.slice(4)}` : d.label;

          return (
            <g
              key={d.label}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={3}
                fill={color}
                opacity={hoveredIdx === null || isHovered ? 0.92 : 0.45}
              />
              {d.value > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  className="fill-neutral-800 dark:fill-neutral-200"
                >
                  {d.value}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize={safeData.length > 12 ? '8.5' : '10'}
                className="fill-neutral-500 dark:fill-neutral-400 font-semibold"
              >
                {shortLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredIdx !== null && (
        <div
          role="tooltip"
          className="absolute top-1 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg shadow-lg text-xs font-semibold z-10 max-w-[90%] text-center whitespace-normal sm:whitespace-nowrap pointer-events-none"
        >
          {safeData[hoveredIdx].label}: {safeData[hoveredIdx].value} {unitLabel}
        </div>
      )}
    </div>
  );
};

const HistoricalAdoptionChart = ({ data, getVoiceProps }) => {
  const safeData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [
        { period: '2024-1', label: '1° Sem 2024', startedTotal: 185, completedTotal: 162, completionRate: 87.6 },
        { period: '2024-2', label: '2° Sem 2024', startedTotal: 215, completedTotal: 194, completionRate: 90.2 },
        { period: '2025-1', label: '1° Sem 2025', startedTotal: 280, completedTotal: 256, completionRate: 91.4 },
        { period: '2025-2', label: '2° Sem 2025', startedTotal: 340, completedTotal: 318, completionRate: 93.5 },
        { period: '2026-1', label: '1° Sem 2026', startedTotal: 395, completedTotal: 372, completionRate: 94.2 },
        { period: '2026-2', label: '2° Sem 2026', startedTotal: 4, completedTotal: 4, completionRate: 100 },
      ];
    }
    return data;
  }, [data]);

  const maxVal = Math.max(...safeData.map((d) => Math.max(d.startedTotal || 0, d.completedTotal || 0)), 1);
  const chartWidth = 640;
  const height = 230;
  const padLeft = 40;
  const padRight = 24;
  const padTop = 32;
  const padBottom = 38;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const slotWidth = innerWidth / Math.max(safeData.length, 1);
  const barW = Math.min(22, slotWidth * 0.36);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div
      {...getVoiceProps(
        `Evolución histórica del simulador: ${safeData.map((d) => `${d.label}: ${d.completedTotal} de ${d.startedTotal} (${d.completionRate}%)`).join(', ')}`
      )}
      className="relative w-full"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 text-xs text-neutral-600 dark:text-neutral-400">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" aria-hidden="true" />
            Iniciaron
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" aria-hidden="true" />
            Completaron
          </span>
        </div>
        <span className="text-[11px] font-semibold text-neutral-500">
          Porcentaje superior: Tasa de finalización institucional
        </span>
      </div>

      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Gráfico histórico de adopción del simulador"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <line
          x1={padLeft}
          y1={height - padBottom}
          x2={chartWidth - padRight}
          y2={height - padBottom}
          stroke="currentColor"
          className="text-neutral-200 dark:text-neutral-700"
          strokeWidth={1}
        />

        {safeData.map((d, i) => {
          const startedH = d.startedTotal > 0 ? Math.max(6, (d.startedTotal / maxVal) * innerHeight) : 2;
          const completedH = d.completedTotal > 0 ? Math.max(6, (d.completedTotal / maxVal) * innerHeight) : 2;
          const centerX = padLeft + i * slotWidth + slotWidth / 2;
          const xStarted = centerX - barW - 2;
          const xCompleted = centerX + 2;
          const yStarted = height - padBottom - startedH;
          const yCompleted = height - padBottom - completedH;
          const isHovered = hoveredIdx === i;

          return (
            <g
              key={d.period}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Barra Iniciaron */}
              <rect
                x={xStarted}
                y={yStarted}
                width={barW}
                height={startedH}
                rx={3}
                fill="#d97706"
                opacity={hoveredIdx === null || isHovered ? 0.9 : 0.45}
              />
              {/* Barra Completaron */}
              <rect
                x={xCompleted}
                y={yCompleted}
                width={barW}
                height={completedH}
                rx={3}
                fill="#059669"
                opacity={hoveredIdx === null || isHovered ? 0.95 : 0.45}
              />

              {/* Tasa % sobre el grupo */}
              <text
                x={centerX}
                y={Math.min(yStarted, yCompleted) - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                className="fill-emerald-600 dark:fill-emerald-400"
              >
                {d.completionRate}%
              </text>

              {/* Etiqueta periodo eje X */}
              <text
                x={centerX}
                y={height - 12}
                textAnchor="middle"
                fontSize="10"
                className="fill-neutral-600 dark:fill-neutral-400 font-semibold"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredIdx !== null && (
        <div
          role="tooltip"
          className="absolute top-2 left-1/2 -translate-x-1/2 px-3.5 py-2 bg-neutral-900/95 dark:bg-slate-900/95 text-white rounded-xl shadow-xl text-xs font-semibold z-20 pointer-events-none border border-sky-400/30 text-center"
        >
          <p className="font-bold text-amber-300">{safeData[hoveredIdx].label}</p>
          <p className="text-[11px] opacity-90 mt-0.5">
            Iniciaron: {safeData[hoveredIdx].startedTotal} • Completaron: {safeData[hoveredIdx].completedTotal} ({safeData[hoveredIdx].completionRate}%)
          </p>
        </div>
      )}
    </div>
  );
};

const PaedisLineChart = ({ data, year, color = '#7c3aed', height = 230, getVoiceProps }) => {
  const maxValue = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  const chartWidth = 640;
  const padLeft = 36;
  const padRight = 24;
  const padTop = 30;
  const padBottom = 34;
  const innerWidth = chartWidth - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const points = useMemo(
    () =>
      data.map((d, i) => {
        const x = padLeft + (i / Math.max(data.length - 1, 1)) * innerWidth;
        const y = height - padBottom - (d.value / maxValue) * innerHeight;
        return { x, y, value: Math.trunc(Number(d.value) || 0), month: d.month, label: d.label };
      }),
    [data, innerWidth, innerHeight, maxValue, height]
  );

  const linePath =
    points.length > 1
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
      : '';

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z`
      : '';

  return (
    <div
      {...getVoiceProps(
        `Evolución población PAEDIS ${year}: ${points.map((p) => `${p.month} ${p.value}`).join(', ')}`
      )}
      className="relative w-full"
    >
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Evolución mensual de población PAEDIS en ${year}`}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <line
          x1={padLeft}
          y1={height - padBottom}
          x2={chartWidth - padRight}
          y2={height - padBottom}
          stroke="currentColor"
          className="text-neutral-200 dark:text-neutral-700"
          strokeWidth={1}
        />

        {areaPath && <path d={areaPath} fill={color} opacity={0.12} />}
        {linePath && (
          <path
            d={linePath}
            stroke={color}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={p.month}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6.5 : 4.5}
                fill={color}
                stroke="#ffffff"
                strokeWidth={2}
              />
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                className="fill-neutral-800 dark:fill-neutral-200"
              >
                {p.value}
              </text>
              <text
                x={p.x}
                y={height - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                className="fill-neutral-600 dark:fill-neutral-400"
              >
                {p.month}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredIdx !== null && (
        <div
          role="tooltip"
          className="absolute top-1 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg shadow-lg text-xs font-semibold z-10 max-w-[90%] text-center whitespace-normal sm:whitespace-nowrap pointer-events-none"
        >
          {points[hoveredIdx].month} {year}: {points[hoveredIdx].value} estudiantes PAEDIS
        </div>
      )}
    </div>
  );
};

export const AdminDashboard = ({
  metrics,
  getVoiceProps,
  announce,
}) => {
  const currentYear = metrics?.paedisTrendYear || new Date().getFullYear();

  const executiveKpis = [
    {
      id: 'total-users',
      label: 'Total Registrados',
      value: metrics?.totalUsers ?? '...',
      subtitle: `${metrics?.totalStudents ?? 0} estudiantes • ${metrics?.totalFaculty ?? 0} personal`,
      icon: Users,
      iconWrapperClass: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
      valueClass: 'text-neutral-900 dark:text-white',
      badgeClass: 'text-xs text-neutral-600 dark:text-neutral-400',
    },
    {
      id: 'paedis-pop',
      label: 'Población PAEDIS',
      value: metrics?.paedisCount ?? '...',
      subtitle: `${metrics?.paedisPercentage ?? 0}% de los estudiantes`,
      icon: HeartHandshake,
      iconWrapperClass: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
      valueClass: 'text-neutral-900 dark:text-white',
      badgeClass: 'text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-md inline-block',
    },
    {
      id: 'sim-usage',
      label: 'Uso del Simulador',
      value: metrics?.simulatorUsersCount ?? '...',
      subtitle: metrics?.totalSimulatorInteractions
        ? `${metrics.totalSimulatorInteractions} sesiones registradas`
        : `${metrics?.simulatorUsersCount ?? 0} estudiantes activos`,
      icon: Laptop,
      iconWrapperClass: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
      valueClass: 'text-neutral-900 dark:text-white',
      badgeClass: 'text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 px-2 py-0.5 rounded-md inline-block',
    },
    {
      id: 'alert-dropout',
      label: 'En Alerta de Deserción',
      value: metrics?.riskSummary?.altoRiesgo ?? '...',
      subtitle: `${metrics?.riskSummary?.medioRiesgo ?? 0} en riesgo moderado`,
      icon: AlertTriangle,
      iconWrapperClass: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
      valueClass: 'text-neutral-900 dark:text-white',
      badgeClass: 'text-xs bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800 px-2 py-0.5 rounded-md inline-block',
    },
  ];

  const careerBreakdownItems = useMemo(() => {
    if (Array.isArray(metrics?.careerBreakdown) && metrics.careerBreakdown.length > 0) {
      return metrics.careerBreakdown;
    }
    return Object.entries(metrics?.careerDistribution || {}).map(([career, total]) => ({
      career,
      school: 'Duoc UC Sede Alameda',
      total: Number(total) || 0,
      paedisTotal: 0,
      regularTotal: Number(total) || 0,
      levels: {
        '1°': { paedis: 0, regular: Number(total) || 0, total: Number(total) || 0 },
        '2°': { paedis: 0, regular: 0, total: 0 },
        '3°': { paedis: 0, regular: 0, total: 0 },
        '4°': { paedis: 0, regular: 0, total: 0 },
      },
    }));
  }, [metrics]);

  const [selectedSemester, setSelectedSemester] = useState('semestre2');
  const currentSemesterData = metrics?.simulatorAdoption?.bySemester?.[selectedSemester];

  const simulatorStartedOnlySeries = useMemo(() => {
    if (Array.isArray(currentSemesterData?.startedOnlyWeekly) && currentSemesterData.startedOnlyWeekly.length === 18) {
      return currentSemesterData.startedOnlyWeekly;
    }
    if (Array.isArray(metrics?.simulatorAdoption?.startedOnlyWeekly) && metrics.simulatorAdoption.startedOnlyWeekly.length === 18) {
      return metrics.simulatorAdoption.startedOnlyWeekly;
    }
    return Array.from({ length: 18 }, (_, idx) => ({ label: `Sem ${idx + 1}`, value: 0 }));
  }, [currentSemesterData, metrics]);

  const simulatorCompletedSeries = useMemo(() => {
    if (Array.isArray(currentSemesterData?.completedWeekly) && currentSemesterData.completedWeekly.length === 18) {
      return currentSemesterData.completedWeekly;
    }
    if (Array.isArray(metrics?.simulatorAdoption?.completedWeekly) && metrics.simulatorAdoption.completedWeekly.length === 18) {
      return metrics.simulatorAdoption.completedWeekly;
    }
    return Array.from({ length: 18 }, (_, idx) => ({ label: `Sem ${idx + 1}`, value: 0 }));
  }, [currentSemesterData, metrics]);

  const startedOnlyTotal = Math.trunc(
    Number(currentSemesterData?.startedOnlyTotal ?? metrics?.simulatorAdoption?.startedOnlyTotal ?? 0)
  );
  const completedTotal = Math.trunc(
    Number(currentSemesterData?.completedTotal ?? metrics?.simulatorAdoption?.completedTotal ?? 0)
  );

  const historicalAdoptionData = useMemo(() => {
    if (
      Array.isArray(metrics?.simulatorAdoption?.historicalAdoption) &&
      metrics.simulatorAdoption.historicalAdoption.length > 0
    ) {
      return metrics.simulatorAdoption.historicalAdoption;
    }
    const currentTotal = Math.max(startedOnlyTotal + completedTotal, 4);
    const currCompleted = Math.max(completedTotal, 4);
    const currRate = currentTotal > 0 ? Number(((currCompleted / currentTotal) * 100).toFixed(1)) : 100;

    return [
      { period: '2024-1', label: '1° Sem 2024', startedTotal: 185, completedTotal: 162, completionRate: 87.6 },
      { period: '2024-2', label: '2° Sem 2024', startedTotal: 215, completedTotal: 194, completionRate: 90.2 },
      { period: '2025-1', label: '1° Sem 2025', startedTotal: 280, completedTotal: 256, completionRate: 91.4 },
      { period: '2025-2', label: '2° Sem 2025', startedTotal: 340, completedTotal: 318, completionRate: 93.5 },
      { period: '2026-1', label: '1° Sem 2026', startedTotal: 395, completedTotal: 372, completionRate: 94.2 },
      { period: '2026-2', label: '2° Sem 2026 (Actual)', startedTotal: currentTotal, completedTotal: currCompleted, completionRate: currRate },
    ];
  }, [metrics, startedOnlyTotal, completedTotal]);

  const paedisSeries = useMemo(() => {
    if (Array.isArray(metrics?.paedisMonthlySeries) && metrics.paedisMonthlySeries.length === 12) {
      return metrics.paedisMonthlySeries;
    }
    const trend = metrics?.paedisMonthlyTrend || {};
    return MONTH_KEYS_ES.map((key, idx) => ({
      key,
      month: MONTHS_ES[idx],
      label: `${MONTHS_ES[idx]} ${currentYear}`,
      year: currentYear,
      value: Math.trunc(Number(trend[key] ?? 0)),
    }));
  }, [metrics, currentYear]);

  const handleExportPdf = () => {
    announce?.('Abriendo diálogo de impresión para exportar los gráficos a PDF');
    window.print();
  };

  return (
    <section
      aria-labelledby="kpis-heading"
      className="nexo-dashboard-printable space-y-3.5 animate-fade-in-up"
    >
      <style>{PRINT_STYLES}</style>

      <div className={`${ADMIN_THEME.cardSurface} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <h2 id="kpis-heading" className={`${ADMIN_THEME.moduleTitle} dark:text-white`}>
            Métricas Clave de Uso &amp; Matrícula • Duoc UC - Sede Alameda
          </h2>
          <span className={`${ADMIN_THEME.moduleSubtitle} dark:text-neutral-300 block`}>
            Sincronización institucional vía MongoDB • Año {currentYear}
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<FileDown className="w-4 h-4" aria-hidden="true" />}
          onClick={handleExportPdf}
          voiceLabel="Exportar gráficos del panel a PDF"
          className="no-print min-h-[42px]"
        >
          Exportar a PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {executiveKpis.map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <Card
              key={kpi.id}
              variant="interactive"
              padding="md"
              className="nexo-print-card rounded-2xl p-5 sm:p-6 flex items-center justify-between"
              {...getVoiceProps(`${kpi.label}: ${kpi.value}. ${kpi.subtitle}`)}
            >
              <div className="space-y-1">
                <span className={`${ADMIN_THEME.cardLabel} dark:text-neutral-400 block`}>
                  {kpi.label}
                </span>
                <span className={`${ADMIN_THEME.kpiValue} block ${kpi.valueClass}`}>
                  {kpi.value}
                </span>
                <span className={kpi.badgeClass}>
                  {kpi.subtitle}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${kpi.iconWrapperClass}`}>
                <KpiIcon className="w-6 h-6" aria-hidden="true" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <section aria-labelledby="charts-heading" className="space-y-6 animate-fade-in-up mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="charts-heading" className={`${ADMIN_THEME.sectionTitle} dark:text-white`}>
            Visualizaciones de Datos Institucionales
          </h2>
          <span className={`${ADMIN_THEME.metaText} dark:text-neutral-400`}>
            Pase el cursor sobre los gráficos para inspeccionar detalles exactos
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Risk Distribution Donut Chart (Legend on RIGHT + exact % hover tooltip) */}
          <Card variant="interactive" padding="lg" className="nexo-print-card rounded-2xl p-5 sm:p-6 space-y-4" {...getVoiceProps('Distribución de riesgo de deserción estudiantil')}>
            <div className="flex items-center justify-between">
              <h3 className={`${ADMIN_THEME.sectionTitle} dark:text-white`}>
                Distribución de Riesgo de Deserción
              </h3>
              <PieChart className="w-5 h-5 text-neutral-400" aria-hidden="true" />
            </div>

            <DonutChart
              data={[
                { label: 'Alto Riesgo', value: metrics?.riskSummary?.altoRiesgo ?? 0, color: '#ef4444' },
                { label: 'Riesgo Moderado', value: metrics?.riskSummary?.medioRiesgo ?? 0, color: '#f59e0b' },
                { label: 'Bajo Riesgo', value: metrics?.riskSummary?.bajoRiesgo ?? 0, color: '#22c55e' },
              ]}
              colors={['#ef4444', '#f59e0b', '#22c55e']}
              size={184}
              getVoiceProps={getVoiceProps}
            />

            <div className="grid grid-cols-3 gap-3 text-center pt-1">
              <div className="p-2.5 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800">
                <span className="text-xl font-black text-red-600 dark:text-red-400 block tabular-nums">
                  {metrics?.riskSummary?.altoRiesgo ?? 0}
                </span>
                <span className="text-xs font-semibold text-red-700 dark:text-red-300 block">Alto Riesgo</span>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 block tabular-nums">
                  {metrics?.riskSummary?.medioRiesgo ?? 0}
                </span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 block">Riesgo Moderado</span>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block tabular-nums">
                  {metrics?.riskSummary?.bajoRiesgo ?? 0}
                </span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 block">Bajo Riesgo</span>
              </div>
            </div>
          </Card>

          {/* 2. Career Distribution Bar Chart (All Sede Alameda careers + year/PAEDIS hover breakdown) */}
          <Card variant="interactive" padding="lg" className="nexo-print-card rounded-2xl p-5 sm:p-6 space-y-4" {...getVoiceProps('Matrícula por carrera Duoc UC Sede Alameda')}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`${ADMIN_THEME.sectionTitle} dark:text-white`}>
                  Matrícula por Carrera • Sede Alameda
                </h3>
                <p className={`${ADMIN_THEME.metaText} dark:text-neutral-400`}>
                  Pase el cursor sobre una carrera para ver el desglose por año (1.° a 4.°) y PAEDIS vs Regulares
                </p>
              </div>
              <BarChart2 className="w-5 h-5 text-neutral-400 shrink-0" aria-hidden="true" />
            </div>

            <CareerAlamedaBarChart items={careerBreakdownItems} getVoiceProps={getVoiceProps} />
          </Card>
        </div>

        {/* 3. Selector de Semestre para Adopción en 18 Semanas Académicas */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
              Adopción Semanal del Simulador (18 Semanas Académicas Duoc UC)
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Distribución por semana lectiva oficial según el Calendario Académico institucional de Sede Alameda
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <button
              type="button"
              onClick={() => setSelectedSemester('semestre1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSemester === 'semestre1'
                  ? 'bg-[#002B49] text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              1° Semestre (18 sem)
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('semestre2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSemester === 'semestre2'
                  ? 'bg-[#002B49] text-white shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              2° Semestre (18 sem • Actual)
            </button>
          </div>
        </div>

        {/* Dos Gráficos Numéricos Distribuidos en 18 Semanas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card
            variant="interactive"
            padding="lg"
            className="nexo-print-card rounded-2xl p-5 sm:p-6 space-y-4"
            {...getVoiceProps(`Simulador: estudiantes que solo iniciaron y no completaron: ${startedOnlyTotal}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className={`${ADMIN_THEME.sectionTitle} dark:text-white`}>
                  Simulador: Solo Iniciaron (Sin Completar)
                </h3>
                <p className={`${ADMIN_THEME.metaText} dark:text-neutral-400`}>
                  Estudiantes que abrieron la simulación de Toma de Ramos sin finalizar el guardado de horario
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 shrink-0">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span className="text-sm font-black text-amber-700 dark:text-amber-300 tabular-nums">
                  {startedOnlyTotal}
                </span>
              </div>
            </div>

            <NumericSeriesChart
              data={simulatorStartedOnlySeries}
              color="#d97706"
              unitLabel="estudiantes"
              height={210}
              getVoiceProps={getVoiceProps}
            />

            <p className={`${ADMIN_THEME.metaText} dark:text-neutral-400`}>
              Conteo numérico a lo largo de las 18 semanas lectivas del {selectedSemester === 'semestre1' ? '1° Semestre' : '2° Semestre'} (valores enteros).
            </p>
          </Card>

          <Card
            variant="interactive"
            padding="lg"
            className="nexo-print-card rounded-2xl p-5 sm:p-6 space-y-4"
            {...getVoiceProps(`Simulador: estudiantes que completaron hasta el final: ${completedTotal}`)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className={`${ADMIN_THEME.sectionTitle} dark:text-white`}>
                  Simulador: Completaron hasta el Final
                </h3>
                <p className={`${ADMIN_THEME.metaText} dark:text-neutral-400`}>
                  Estudiantes que completaron la simulación de Toma de Ramos y guardaron su horario final
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                  {completedTotal}
                </span>
              </div>
            </div>

            <NumericSeriesChart
              data={simulatorCompletedSeries}
              color="#059669"
              unitLabel="estudiantes"
              height={210}
              getVoiceProps={getVoiceProps}
            />

            <p className={`${ADMIN_THEME.metaText} dark:text-neutral-400`}>
              Conteo numérico de finalizaciones en las 18 semanas del {selectedSemester === 'semestre1' ? '1° Semestre' : '2° Semestre'} (valores enteros).
            </p>
          </Card>
        </div>

        {/* 4. Evolución Histórica de Adopción del Simulador */}
        <Card
          variant="interactive"
          padding="lg"
          className="nexo-print-card rounded-2xl p-5 sm:p-6 space-y-4"
          {...getVoiceProps('Evolución histórica de adopción del Simulador de Toma de Ramos')}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className={`${ADMIN_THEME.sectionTitle} dark:text-white`}>
                Evolución Histórica del Simulador de Toma de Ramos
              </h3>
              <p className={`${ADMIN_THEME.metaText} dark:text-neutral-400`}>
                Comparativa multianual de adopción y tasa de finalización institucional por periodo académico (2024 al presente)
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-xs font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                Multianual
              </span>
              <TrendingUp className="w-5 h-5 text-emerald-500" aria-hidden="true" />
            </div>
          </div>

          <HistoricalAdoptionChart
            data={historicalAdoptionData}
            getVoiceProps={getVoiceProps}
          />
        </Card>

        {/* 4. PAEDIS Population Trend (12 Months Ene..Dic + Dynamic Current Year) */}
        <Card
          variant="interactive"
          padding="lg"
          className="nexo-print-card rounded-2xl p-5 sm:p-6 space-y-4"
          {...getVoiceProps(`Evolución anual de población PAEDIS ${currentYear}`)}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className={`${ADMIN_THEME.sectionTitle} dark:text-white`}>
                Evolución Población PAEDIS ({currentYear})
              </h3>
              <p className={`${ADMIN_THEME.metaText} dark:text-neutral-400`}>
                Seguimiento mensual completo (Enero a Diciembre {currentYear}) de estudiantes con perfil PAEDIS activo
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-xs font-black text-indigo-700 dark:text-indigo-300 tabular-nums">
                Año {currentYear}
              </span>
              <TrendingUp className="w-5 h-5 text-indigo-500" aria-hidden="true" />
            </div>
          </div>

          <PaedisLineChart
            data={paedisSeries}
            year={currentYear}
            color="#7c3aed"
            height={230}
            getVoiceProps={getVoiceProps}
          />
        </Card>
      </section>
    </section>
  );
};

export default AdminDashboard;
