import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const Table = React.forwardRef(
  ({
    columns = [],
    data = [],
    keyField = 'id',
    striped = true,
    hoverable = true,
    compact = false,
    emptyMessage = 'No hay datos disponibles.',
    onRowClick,
    rowClassName,
    className = '',
    voiceLabel,
    ...props
  }, ref) => {
    const { getVoiceProps } = useAccessibility();
    const voiceProps = voiceLabel ? getVoiceProps(voiceLabel) : {};

    const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';
    const cellSize = compact ? 'text-xs' : 'text-sm';

    return (
      <div
        ref={ref}
        className={`overflow-x-auto rounded-2xl border border-neutral-200 ${className}`}
        {...voiceProps}
        {...props}
      >
        {data.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 font-medium bg-white">
            {emptyMessage}
          </div>
        ) : (
          <table className="w-full border-collapse bg-white" role="grid">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={col.field ?? idx}
                    scope="col"
                    className={`text-left font-semibold text-neutral-700 ${cellPadding} ${cellSize} ${col.align ? `text-${col.align}` : ''} ${col.width ? `w-[${col.width}]` : ''}`}
                    style={col.style}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((row, rowIdx) => {
                const rowKey = row[keyField] ?? rowIdx;
                const isClickable = typeof onRowClick === 'function';
                const baseRowClass = [
                  'transition-colors',
                  striped && rowIdx % 2 === 1 ? 'bg-neutral-50/50' : '',
                  hoverable && isClickable ? 'hover:bg-brand-navy/5 cursor-pointer' : '',
                  rowClassName?.(row) || '',
                ].filter(Boolean).join(' ');

                return (
                  <tr
                    key={rowKey}
                    className={baseRowClass}
                    onClick={() => isClickable && onRowClick(row, rowIdx)}
                    role={isClickable ? 'button' : 'row'}
                    tabIndex={isClickable ? 0 : undefined}
                    onKeyDown={(e) => isClickable && (e.key === 'Enter' || e.key === ' ') && onRowClick(row, rowIdx)}
                    {...voiceProps}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={`${rowKey}-${col.field ?? colIdx}`}
                        className={`${cellPadding} ${cellSize} text-neutral-900 ${col.align ? `text-${col.align}` : ''}`}
                        style={col.style}
                      >
                        {col.render
                          ? col.render(row[col.field], row, rowIdx)
                          : row[col.field] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  }
);

Table.displayName = 'Table';

export default Table;