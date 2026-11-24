import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

const sizeStyles = {
  sm: 'w-8 h-5',
  md: 'w-11 h-6',
  lg: 'w-14 h-7',
};

const thumbSizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export const Toggle = React.forwardRef(
  ({
    checked = false,
    onChange,
    disabled = false,
    label,
    description,
    size = 'md',
    voiceLabel,
    id,
    className = '',
    ...props
  }, ref) => {
    const { getVoiceProps } = useAccessibility();
    const toggleId = id || `toggle-${React.useId()}`;
    const voiceProps = voiceLabel ? getVoiceProps(voiceLabel) : {};

    const handleChange = (e) => {
      if (!disabled && onChange) {
        onChange(e.target.checked);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!disabled && onChange) {
          onChange(!checked);
        }
      }
    };

    return (
      <div className={`flex items-start gap-3 ${className}`} {...voiceProps}>
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={toggleId}
            checked={checked}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-describedby={description ? `${toggleId}-desc` : undefined}
            className="sr-only"
            {...props}
          />
          <label
            htmlFor={toggleId}
            className={`inline-flex items-center cursor-pointer transition-all duration-200 rounded-full border-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${sizeStyles[size]}`}
            style={{
              backgroundColor: checked ? '#002B49' : '#CBD5E1',
              borderColor: checked ? '#002B49' : '#CBD5E1',
            }}
          >
            <span
              className={`transition-transform duration-200 rounded-full bg-white shadow-sm ${thumbSizeStyles[size]} ${
                checked ? 'translate-x-full' : 'translate-x-0'
              }`}
              aria-hidden="true"
            />
          </label>
        </div>
        {(label || description) && (
          <div className="space-y-0.5 min-w-0">
            {label && (
              <span
                className="block text-sm font-semibold text-neutral-900"
                {...voiceProps}
              >
                {label}
              </span>
            )}
            {description && (
              <span
                id={`${toggleId}-desc`}
                className="block text-xs text-neutral-500"
              >
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;