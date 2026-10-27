import React, { useEffect, useRef } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal accesible de confirmación para acciones importantes o destructivas.
 * Cumple con WCAG AA, role="dialog", aria-modal="true", navegación con teclado (Esc)
 * y objetivos táctiles ≥ 48px para uso en celular (RF-08, RNF-01, RNF-03).
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Foco accesible al abrir
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="dialog-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 9999,
      }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
        className="dialog-content"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          color: '#111827',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="dialog-title"
          style={{
            margin: '0 0 0.75rem 0',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: isDestructive ? '#dc2626' : '#111827',
          }}
        >
          {title}
        </h2>

        <div
          id="dialog-desc"
          style={{
            marginBottom: '1.5rem',
            fontSize: '1rem',
            lineHeight: 1.5,
            color: '#374151',
          }}
        >
          {message}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="touch-target-48 btn-secondary"
            style={{
              minHeight: '48px',
              minWidth: '48px',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: '1.5px solid #d1d5db',
              backgroundColor: '#f9fafb',
              color: '#374151',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="touch-target-48 btn-primary"
            style={{
              minHeight: '48px',
              minWidth: '48px',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isDestructive ? '#dc2626' : '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
