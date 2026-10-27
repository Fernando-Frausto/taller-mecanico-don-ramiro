import { useState, useEffect } from 'react';
import type { CatalogItem, Role } from '../../domain/types';
import { useApp } from '../store';
import { sendQuoteAction } from '../../domain/app';

export interface QuoteDraftModalProps {
  isOpen: boolean;
  item: CatalogItem | null;
  vehicleId: string;
  role: Role;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function QuoteDraftModal({
  isOpen,
  item,
  vehicleId,
  role,
  onClose,
  onSubmitted,
}: QuoteDraftModalProps) {
  const { dispatch } = useApp();
  const [amount, setAmount] = useState<number>(item?.suggestedPrice ?? 0);
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setAmount(item.suggestedPrice);
      setNote('');
      setErrorMsg(null);
    }
  }, [item, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) {
    return null;
  }

  const isBoss = role === 'jefe';

  const handleSend = () => {
    if (amount <= 0 || isNaN(amount)) {
      setErrorMsg('El monto debe ser mayor a 0.');
      return;
    }

    const action = sendQuoteAction(
      vehicleId,
      {
        catalogItemId: item.id,
        amount,
        note: note.trim(),
      },
      role
    );

    const result = dispatch(action);
    if (!result.ok) {
      setErrorMsg(result.error.message);
      return;
    }

    onSubmitted?.();
    onClose();
  };

  return (
    <div
      className="dialog-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
        aria-labelledby="modal-quote-title"
        className="dialog-content"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          color: '#111827',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="modal-quote-title"
          style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700 }}
        >
          Cotizar reparación adicional
        </h2>

        <div style={{ marginBottom: '1rem' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '1.1rem' }}>
            {item.label}
          </p>
          <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
            {isBoss
              ? 'Como Jefe de taller, puedes editar el monto de la cotización.'
              : 'Como Mecánico, el precio sugerido es de solo lectura.'}
          </span>
        </div>

        {errorMsg && (
          <div
            role="alert"
            style={{
              padding: '0.75rem',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="quote-amount"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.95rem' }}
          >
            Monto de cotización (MXN)
          </label>
          <input
            id="quote-amount"
            type="number"
            readOnly={!isBoss}
            aria-readonly={!isBoss}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={1}
            step={50}
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '0.5rem 0.75rem',
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: '2px solid #cbd5e1',
              backgroundColor: isBoss ? '#ffffff' : '#f1f5f9',
              color: '#0f172a',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="quote-note"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem', fontSize: '0.95rem' }}
          >
            Nota opcional (se incluirá en la descripción para el cliente)
          </label>
          <textarea
            id="quote-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: Balatas delanteras desgastadas al 90%, requiere rectificado"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              fontSize: '0.95rem',
              borderRadius: '8px',
              border: '2px solid #cbd5e1',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexDirection: 'column',
          }}
        >
          <button
            type="button"
            onClick={handleSend}
            className="touch-target-48"
            style={{
              minHeight: '48px',
              width: '100%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Enviar cotización
          </button>
          <button
            type="button"
            onClick={onClose}
            className="touch-target-48"
            style={{
              minHeight: '48px',
              width: '100%',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
