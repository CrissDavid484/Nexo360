import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

const variantStyles = {
  primary: 'bg-brand-navy hover:bg-brand-navyDark text-white border-brand-navy',
  secondary: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border-neutral-300',
  outline: 'bg-transparent hover:bg-neutral-100 text-brand-navy border-brand-navy',
  ghost: 'bg-transparent hover:bg-neutral-100 text-neutral-700 border-transparent',
  danger: 'bg-semantic-error-600 hover:bg-semantic-error-700 text-white border-semantic-error-600',
  success: 'bg-semantic-success-600 hover:bg-semantic-success-700 text-white border-semantic-success-600',
  warning: 'bg-semantic-warning-600 hover:bg-semantic-warning-700 text-white border-semantic-warning-600',
  amber: 'bg-brand-gold hover:bg-brand-goldDark text-neutral-950 border-brand-gold',
};

const sizeStyles = {
  sm: 'min-h-[40px] px-3 py-1.5 text-xs',
  md: 'min-h-[44px] px-4 py-2 text-sm',
  lg: 'min-h-[48px] px-5 py-2.5 text-base',
  icon: 'min-h-[44px] min-w-[44px] p-0',
};

const baseStyles = 'inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

export const Button = React.forwardRef(
  ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    leftIcon,
    rightIcon,
    loading = false,
    voiceLabel,
    className = '',
    ...props
  }, ref) => {
    const { getVoiceProps } = useAccessibility();
    const voiceProps = voiceLabel ? getVoiceProps(voiceLabel) : {};

    return (
      <button
        ref={ref}
        type="button"
        className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
        style={{ display: 'inline-flex', flexDirection: 'row', whiteSpace: 'nowrap' }}
        disabled={loading || props.disabled}
        aria-busy={loading}
        aria-disabled={loading || props.disabled}
        {...voiceProps}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {leftIcon && <span className="shrink-0 inline-flex items-center" aria-hidden="true">{leftIcon}</span>}
            <span className="inline-flex items-center justify-center gap-1.5 min-w-0 truncate">{children}</span>
            {rightIcon && <span className="shrink-0 inline-flex items-center" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;