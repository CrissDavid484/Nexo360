import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

const variantStyles = {
  default: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  primary: 'bg-brand-navy text-white border-brand-navy',
  success: 'bg-semantic-success-50 text-semantic-success-900 border-semantic-success-200',
  warning: 'bg-semantic-warning-50 text-semantic-warning-900 border-semantic-warning-200',
  error: 'bg-semantic-error-50 text-semantic-error-900 border-semantic-error-200',
  info: 'bg-semantic-info-50 text-semantic-info-900 border-semantic-info-200',
  amber: 'bg-brand-goldLight text-neutral-950 border-brand-gold',
  highContrast: 'bg-hc-bg text-hc-primary border-hc-border',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Badge = React.forwardRef(
  ({
    children,
    variant = 'default',
    size = 'md',
    icon,
    dot = false,
    dotColor,
    voiceLabel,
    className = '',
    ...props
  }, ref) => {
    const { getVoiceProps } = useAccessibility();
    const voiceProps = voiceLabel ? getVoiceProps(voiceLabel) : {};

    const combinedClassName = [
      'inline-flex items-center gap-1.5 font-semibold rounded-full border transition-all duration-200',
      variantStyles[variant],
      sizeStyles[size],
      className,
    ].filter(Boolean).join(' ');

    return (
      <span
        ref={ref}
        className={combinedClassName}
        {...voiceProps}
        {...props}
      >
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotColor || 'currentColor'}`}
            aria-hidden="true"
          />
        )}
        {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
        <span>{children}</span>
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;