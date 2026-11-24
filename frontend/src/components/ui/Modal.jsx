import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAccessibility } from '../../context/AccessibilityContext';
import { X } from 'lucide-react';

export const Modal = React.forwardRef(
  ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showClose = true,
    closeOnOverlay = true,
    closeOnEscape = true,
    initialFocusRef,
    className = '',
    voiceLabel,
    ...props
  }, ref) => {
    const { getVoiceProps } = useAccessibility();
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);
    const voiceProps = voiceLabel ? getVoiceProps(voiceLabel) : {};

    const setCombinedRef = (node) => {
      modalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref && typeof ref === 'object') ref.current = node;
    };

    const sizeStyles = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-[95vw]',
    };

    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement;
        document.body.style.overflow = 'hidden';
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          modalRef.current?.focus();
        }
      } else {
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      }
      return () => {
        document.body.style.overflow = '';
      };
    }, [isOpen, initialFocusRef]);

    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose?.();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closeOnEscape, onClose]);

    if (!isOpen) return null;

    const modalContent = (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        {...voiceProps}
      >
        <div
          className="absolute inset-0"
          onClick={closeOnOverlay ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          ref={setCombinedRef}
          tabIndex={-1}
          className={`relative z-10 w-full ${sizeStyles[size]} max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-neutral-200 animate-scale-in overflow-hidden ${className}`}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {(title || showClose) && (
            <header className="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
              {title && (
                <h2 id="modal-title" className="text-xl font-bold text-neutral-900">
                  {title}
                </h2>
              )}
              {showClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar modal"
                  className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </header>
          )}
          <div className="p-6 flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    );

    if (typeof document === 'undefined') return modalContent;
    return createPortal(modalContent, document.body);
  }
);

Modal.displayName = 'Modal';

export default Modal;