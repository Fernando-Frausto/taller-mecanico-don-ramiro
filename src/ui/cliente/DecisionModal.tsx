import { useState, useEffect, useRef } from 'react';
import type { Quote } from '../../domain/types';
import { formatCurrencyMXN } from '../../domain/format';
import { validateDecisionName } from '../../domain/validation';
import { useApp } from '../store';
import { decideQuoteAction } from '../../domain/app';

export interface DecisionModalProps {
  isOpen: boolean;
  quote: Quote | null;
  decision: 'aprobada' | 'rechazada' | null;
  defaultName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Modal accesible para capturar la decisión del cliente con nombre obligatorio
 * y resumen inalterable de la cotización (RF-16, RF-17, CA-09, CA-10, CA-20, CA-21).
 */
export function DecisionModal({
  isOpen,
  quote,
  decision,
  defaultName = '',
  onClose,
  onSuccess,
}: DecisionModalProps) {
  const { dispatch } = useApp();
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadyResolved, setIsAlreadyResolved] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setError(null);
      setIsAlreadyResolved(false);
      // Foco en el campo de texto al abrir
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultName]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !quote || !decision) {
    return null;
  }

  const isApproved = decision === 'aprobada';
  const title = isApproved
    ? 'Confirmar aprobación de reparación'
    : 'Confirmar rechazo de reparación';

  const confirmBtnLabel = isApproved
    ? 'Confirmar aprobación'
    : 'Confirmar rechazo';

  const handleConfirm = () => {
    if (isAlreadyResolved) return;

    const validation = validateDecisionName(name);
    if (!validation.isValid) {
      setError(validation.error ?? 'Nombre no válido.');
      return;
    }

    const result = dispatch(
      decideQuoteAction(quote.id, decision, validation.trimmedName)
    );

    if (result.ok) {
      onSuccess?.();
      onClose();
    } else {
      if (result.error.code === 'already_resolved') {
        setError('La cotización ya ha sido resuelta previamente.');
        setIsAlreadyResolved(true);
      } else {
        setError(result.error.message || 'Error al procesar la decisión.');
      }
    }
  };

  return (
    <div
      className="dialog-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-modal-title"
        className="dialog-content"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          color: '#0f172a',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }} aria-hidden="true">
            {isApproved ? '✅' : '❌'}
          </span>
          <h2
            id="decision-modal-title"
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: isApproved ? '#166534' : '#991b1b',
            }}
          >
            {title}
          </h2>
        </div>

        {/* Resumen inalterable de la cotización (RF-16, CA-09, CA-10) */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
            Resumen de la reparación adicional
          </div>
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#0f172a',
              marginTop: '0.25rem',
              marginBottom: '0.5rem',
            }}
          >
            {quote.exactDescription}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.95rem', color: '#475569' }}>Monto total (MXN):</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#2563eb' }}>
              {formatCurrencyMXN(quote.amount)}
            </span>
          </div>
        </div>

        {/* Campo obligatorio de nombre de quien autoriza (RF-16, CA-20) */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="decision-authorizer-name"
            style={{
              display: 'block',
              fontWeight: 700,
              fontSize: '0.95rem',
              marginBottom: '0.4rem',
              color: '#1e293b',
            }}
          >
            Nombre de quien autoriza <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            id="decision-authorizer-name"
            ref={nameInputRef}
            type="text"
            disabled={isAlreadyResolved}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ingrese nombre y apellido"
            className="touch-target-48"
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: `2px solid ${error ? '#dc2626' : '#cbd5e1'}`,
              fontSize: '1rem',
              color: '#0f172a',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
            Mínimo 2 y máximo 60 caracteres. Quedará registrado de forma inmutable.
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="touch-target-48 btn-secondary"
            style={{
              minHeight: '48px',
              minWidth: '48px',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              color: '#334155',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isAlreadyResolved}
            className="touch-target-48 btn-primary"
            style={{
              minHeight: '48px',
              minWidth: '48px',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isAlreadyResolved
                ? '#94a3b8'
                : isApproved
                ? '#16a34a'
                : '#dc2626',
              color: '#ffffff',
              fontWeight: 700,
              cursor: isAlreadyResolved ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            {confirmBtnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
