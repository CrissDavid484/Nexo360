import React from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';

const variantStyles = {
  default: 'bg-white border-neutral-200 shadow-xs',
  elevated: 'bg-white border-neutral-200 shadow-md',
  outlined: 'bg-white border-neutral-300 shadow-none',
  filled: 'bg-neutral-50 border-neutral-200 shadow-none',
  interactive: 'bg-white border-neutral-200 shadow-xs hover:shadow-md hover:border-brand-navy/40 transition-all duration-300',
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = React.forwardRef(
  ({
    children,
    variant = 'default',
    padding = 'md',
    className = '',
    header,
    footer,
    voiceLabel,
    ...props
  }, ref) => {
    const { getVoiceProps } = useAccessibility();
    const voiceProps = voiceLabel ? getVoiceProps(voiceLabel) : {};

    const combinedClassName = [
      'rounded-2xl',
      variantStyles[variant],
      paddingStyles[padding],
      className,
    ].filter(Boolean).join(' ');

    return (
      <article
        ref={ref}
        className={combinedClassName}
        {...voiceProps}
        {...props}
      >
        {header && (
          <header className="mb-4 pb-4 border-b border-neutral-100">
            {header}
          </header>
        )}
        <div className="space-y-4">
          {children}
        </div>
        {footer && (
          <footer className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
            {footer}
          </footer>
        )}
      </article>
    );
  }
);

Card.displayName = 'Card';

export default Card;