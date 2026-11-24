import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

const baseStyles = 'w-full min-h-[44px] px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 placeholder-neutral-400 transition-all duration-200';
const focusStyles = 'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold focus-visible:border-brand-navy';
const disabledStyles = 'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:border-neutral-200 disabled:cursor-not-allowed';
const errorStyles = 'border-semantic-error-500 focus-visible:ring-semantic-error-200';
const successStyles = 'border-semantic-success-500 focus-visible:ring-semantic-success-200';

export const Input = React.forwardRef(
  ({
    label,
    error,
    success,
    helperText,
    voiceLabel,
    id,
    type = 'text',
    className = '',
    ...props
  }, ref) => {
    const { getVoiceProps } = useAccessibility();
    const inputId = id || `input-${React.useId()}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
    const voiceProps = voiceLabel ? getVoiceProps(voiceLabel) : {};

    const combinedClassName = [
      baseStyles,
      focusStyles,
      disabledStyles,
      error ? errorStyles : success ? successStyles : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-neutral-700"
            {...voiceProps}
          >
            {label}
            {props.required && <span className="text-semantic-error-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={combinedClassName}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={props.required}
          {...voiceProps}
          {...props}
        />
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
        {success && !error && (
          <p id={helperId} className="text-xs font-medium text-semantic-success-600 flex items-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3 3a.75.75 0 001.06 1.06l1.72-1.72a.75.75 0 10-1.06-1.06l-2 2a.75.75 0 101.06 1.06l2.5-2.5z" clipRule="evenodd" />
            </svg>
            {success}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;