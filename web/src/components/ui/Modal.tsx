import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  children,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Size styles
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, closeOnEscape]);

  // Focus trap and body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the modal
      modalRef.current?.focus();

      return () => {
        // Unlock body scroll
        document.body.style.overflow = '';
        
        // Restore focus
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Content */}
        <div
          ref={modalRef}
          className={`relative w-full ${sizeStyles[size]} bg-white rounded-2xl shadow-2xl transform transition-all animate-scale-in`}
          tabIndex={-1}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-6 border-b border-slate-200">
              <div className="flex-1">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-2xl font-bold text-slate-900"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="mt-2 text-sm text-slate-600"
                  >
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg p-1"
                  aria-label="Close modal"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;

// Optional: ModalFooter component for consistent footer styling
export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 ${className}`}>
      {children}
    </div>
  );
};
