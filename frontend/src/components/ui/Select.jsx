import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

const baseStyles = 'w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 transition-all duration-200 appearance-none bg-no-repeat bg-right-[12px] bg-[length:20px]';
const focusStyles = 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold focus-visible:border-brand-navy';
const disabledStyles = 'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:border-neutral-200 disabled:cursor-not-allowed';
const errorStyles = 'border-semantic-error-500 focus-visible:ring-semantic-error-200';

export const Select = React.forwardRef(
  ({
    label,
    error,
    helperText,
    voiceLabel,
    options = [],
    placeholder = 'Seleccionar...',
    className = '',
    id,
    ...props
  }, ref) => {
    const { getVoiceProps } = useAccessibility();
    const selectId = id || `select-${React.useId()}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText ? `${selectId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
    const voiceProps = voiceLabel ? getVoiceProps(voiceLabel) : {};

    const combinedClassName = [
      baseStyles,
      focusStyles,
      disabledStyles,
      error ? errorStyles : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-neutral-700"
            {...voiceProps}
          >
            {label}
            {props.required && <span className="text-semantic-error-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={combinedClassName}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={props.required}
            {...voiceProps}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>{placeholder}</option>
            )}
            {options.map((opt, idx) => (
              <option key={opt.value ?? idx} value={opt.value ?? opt.label}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none" aria-hidden="true">
            <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-semantic-error-600 flex items-center gap-1"
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;