import { useState } from 'react';
import { useApp } from '../store';
import { navigate } from '../router';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { QuoteDraftModal } from './QuoteDraftModal';
import {
  getNextState,
  getPreviousState,
  canProposeInState,
} from '../../domain/states';
import {
  advanceStateAction,
  correctStateAction,
  withdrawQuoteAction,
} from '../../domain/app';
import { formatCurrencyMXN, formatDateTime } from '../../domain/format';
import {
  STATE_LABELS,
  buildClientUrl,
  buildStatusUpdateMessage,
  buildQuoteMessage,
  buildWhatsAppUrl,
} from '../../domain/whatsapp';
import type { CatalogItem, Quote } from '../../domain/types';

export interface VehicleDetailProps {
  vehicleId: string;
}

export function VehicleDetail({ vehicleId }: VehicleDetailProps) {
  const { data, prefs, dispatch } = useApp();
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isCorrectDialogOpen, setIsCorrectDialogOpen] = useState(false);
  const [quoteToWithdraw, setQuoteToWithdraw] = useState<Quote | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const vehicle = data.vehicles.find((v) => v.id === vehicleId);

  if (!vehicle) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: '#dc2626', fontWeight: 700 }}>
          Vehículo no encontrado.
        </p>
        <button
          type="button"
          onClick={() => navigate('#/taller')}
          className="touch-target-48"
          style={{
            minHeight: '48px',
            padding: '0.5rem 1.5rem',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Volver a la lista
        </button>
      </div>
    );
  }

  const vehicleQuotes = data.quotes.filter((q) => q.vehicleId === vehicle.id);
  const pendingQuotes = vehicleQuotes.filter((q) => q.status === 'pendiente');
  const hasPending = pendingQuotes.length > 0 || vehicle.state === 'espera_aprobacion';

  const nextState = getNextState(vehicle.state);
  const prevState = getPreviousState(vehicle.state);

  const canAdvance = nextState !== null && !hasPending;
  const canCorrect = prevState !== null && !hasPending;
  const canPropose = canProposeInState(vehicle.state);

  const vehicleHistory = data.history.filter((h) => h.vehicleId === vehicle.id);
  const vehicleLedger = data.ledger.filter((l) => l.vehicleId === vehicle.id);

  // Generación de URL y mensaje de WhatsApp
  const clientUrl = buildClientUrl(vehicle.token);
  const activePendingQuote = pendingQuotes[0];
  const waMessage = activePendingQuote
    ? buildQuoteMessage(vehicle, activePendingQuote, clientUrl)
    : buildStatusUpdateMessage(vehicle, clientUrl);
  const waUrl = buildWhatsAppUrl(vehicle.phone, waMessage);

  const handleAdvance = () => {
    dispatch(advanceStateAction(vehicle.id, prefs.role));
  };

  const handleConfirmCorrect = () => {
    dispatch(correctStateAction(vehicle.id, true, prefs.role));
    setIsCorrectDialogOpen(false);
  };

  const handleConfirmWithdraw = () => {
    if (quoteToWithdraw) {
      dispatch(withdrawQuoteAction(quoteToWithdraw.id, prefs.role));
      setQuoteToWithdraw(null);
    }
  };

  const handleOpenProposeModal = (item: CatalogItem) => {
    setSelectedCatalogItem(item);
    setIsQuoteModalOpen(true);
  };

  const handleCopyClientLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(clientUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = clientUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    } catch {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    }
  };

  const formatActor = (actor: { kind: string; role?: string }) => {
    if (actor.kind === 'sistema') return '⚙️ Sistema';
    if (actor.kind === 'cliente') return '👤 Cliente';
    if (actor.kind === 'taller') {
      return actor.role === 'jefe' ? '👨‍🔧 Taller (Jefe)' : '🔧 Taller (Mecánico)';
    }
    return 'Desconocido';
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1rem' }}>
      {/* Barra superior con botón volver */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => navigate('#/taller')}
          aria-label="Volver a la lista de vehículos"
          className="touch-target-48"
          style={{
            minHeight: '48px',
            minWidth: '48px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '1.25rem',
            cursor: 'pointer',
          }}
        >
          ⬅️
        </button>
        <div>
          <span
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: '1rem',
              marginRight: '0.5rem',
            }}
          >
            {vehicle.plates}
          </span>
          <h2 style={{ display: 'inline', margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
            {vehicle.vehicleDesc}
          </h2>
        </div>
      </div>

      {/* Tarjeta de información principal del vehículo */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Estado actual:
          </span>
          <StatusBadge state={vehicle.state} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.95rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>Cliente: </span>
            <strong style={{ color: '#0f172a' }}>{vehicle.clientName}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Teléfono: </span>
            <strong style={{ color: '#0f172a' }}>+{vehicle.phone}</strong>
          </div>
          {vehicle.reason && (
            <div style={{ marginTop: '0.25rem' }}>
              <span style={{ color: '#64748b' }}>Motivo de ingreso: </span>
              <span style={{ color: '#1e293b', fontStyle: 'italic' }}>{vehicle.reason}</span>
            </div>
          )}
          <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
            Registrado: {formatDateTime(vehicle.createdAt)}
          </div>
        </div>
      </div>

      {/* Cartel de trabajo en pausa si hay cotizaciones pendientes */}
      {hasPending && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.25rem',
            color: '#92400e',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.4rem' }}>⏳</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
              Trabajo en pausa
            </h3>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem' }}>
            El avance manual está bloqueado mientras existan cotizaciones pendientes de aprobación por parte del cliente.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingQuotes.map((q) => (
              <div
                key={q.id}
                style={{
                  backgroundColor: '#ffffff',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <strong style={{ display: 'block', color: '#0f172a', fontSize: '1rem' }}>
                    {q.label}
                  </strong>
                  {q.note && (
                    <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block' }}>
                      Nota: {q.note}
                    </span>
                  )}
                  <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>
                    {formatCurrencyMXN(q.amount)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setQuoteToWithdraw(q)}
                  className="touch-target-48"
                  style={{
                    minHeight: '48px',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fca5a5',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Retirar cotización
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción de estados: Avanzar (1 toque) y Corregir (con confirmación) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          marginBottom: '1.25rem',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
          Acciones de Estado
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {canAdvance && nextState && (
            <button
              type="button"
              onClick={handleAdvance}
              className="touch-target-48"
              style={{
                minHeight: '48px',
                width: '100%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Pasar a {STATE_LABELS[nextState]} ➔
            </button>
          )}

          {canCorrect && prevState && (
            <button
              type="button"
              onClick={() => setIsCorrectDialogOpen(true)}
              className="touch-target-48"
              style={{
                minHeight: '48px',
                width: '100%',
                backgroundColor: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⬅️ Corregir a {STATE_LABELS[prevState]}
            </button>
          )}

          {!canAdvance && !canCorrect && !hasPending && vehicle.state === 'entregado' && (
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
              Este vehículo ya ha sido entregado al cliente. No hay más transiciones de estado disponibles.
            </p>
          )}
        </div>
      </div>

      {/* Sección: Proponer reparación adicional (catálogo) */}
      {canPropose && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            marginBottom: '1.25rem',
          }}
        >
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
            Proponer reparación adicional
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#64748b' }}>
            Toca una opción del catálogo para preparar la cotización (1 toque abre borrador, 2º toque envía):
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {data.catalog.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleOpenProposeModal(item)}
                className="touch-target-48"
                style={{
                  minHeight: '48px',
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '2px solid #cbd5e1',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                  {item.label}
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
                  {formatCurrencyMXN(item.suggestedPrice)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sección para compartir: WhatsApp y Copiar enlace */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          marginBottom: '1.25rem',
        }}
      >
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
          Compartir seguimiento con el cliente
        </h3>

        {!vehicle.isSeed && (
          <div
            role="note"
            style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              fontSize: '0.85rem',
              color: '#1e40af',
            }}
          >
            ℹ️ Aviso: Este vehículo fue creado en esta sesión y solo es visible en este navegador (RF-34).
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target-48"
            style={{
              minHeight: '48px',
              backgroundColor: '#22c55e',
              color: '#ffffff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              gap: '0.5rem',
            }}
          >
            <span>💬</span> Compartir por WhatsApp
          </a>

          <button
            type="button"
            onClick={handleCopyClientLink}
            className="touch-target-48"
            style={{
              minHeight: '48px',
              backgroundColor: '#f1f5f9',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📋</span> {copyFeedback ? '¡Enlace copiado!' : 'Copiar enlace del cliente'}
          </button>
        </div>
      </div>

      {/* Sección de historiales: Estados y Ledger */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          marginBottom: '1.25rem',
        }}
      >
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
          Historial de estados
        </h3>
        {vehicleHistory.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Sin cambios de estado registrados.
          </p>
        ) : (
          <ul style={{ margin: 0, padding: '0 0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {vehicleHistory.map((h) => (
              <li key={h.id} style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                <strong>{STATE_LABELS[h.to]}</strong> — {formatActor(h.actor)} ({formatDateTime(h.at)})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          marginBottom: '1.25rem',
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>
          Registro inmutable de cotizaciones
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>
          Trazabilidad inmutable de decisiones aprobadas, rechazadas o retiradas (RF-21, Constitución §3).
        </p>

        {vehicleLedger.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            No hay decisiones de cotizaciones registradas para este vehículo.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {vehicleLedger.map((l) => (
              <div
                key={l.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor:
                    l.result === 'aprobada'
                      ? '#dcfce7'
                      : l.result === 'rechazada'
                      ? '#fee2e2'
                      : '#f1f5f9',
                  border: `1px solid ${
                    l.result === 'aprobada'
                      ? '#86efac'
                      : l.result === 'rechazada'
                      ? '#fca5a5'
                      : '#cbd5e1'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <strong
                    style={{
                      color:
                        l.result === 'aprobada'
                          ? '#166534'
                          : l.result === 'rechazada'
                          ? '#991b1b'
                          : '#475569',
                      fontSize: '0.95rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    {l.result === 'retirada' ? 'Retirada por taller' : l.result}
                  </strong>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrencyMXN(l.amount)}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.25rem' }}>
                  {l.exactDescription}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Decidido por: <strong>{l.decidedBy}</strong> • {formatDateTime(l.at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modales y Diálogos de confirmación */}
      <QuoteDraftModal
        isOpen={isQuoteModalOpen}
        item={selectedCatalogItem}
        vehicleId={vehicle.id}
        role={prefs.role}
        onClose={() => setIsQuoteModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={isCorrectDialogOpen}
        title="Confirmar corrección de estado"
        message={`¿Estás seguro de corregir el estado a "${
          prevState ? STATE_LABELS[prevState] : ''
        }"?`}
        confirmLabel="Confirmar corrección"
        onConfirm={handleConfirmCorrect}
        onCancel={() => setIsCorrectDialogOpen(false)}
      />

      <ConfirmDialog
        isOpen={Boolean(quoteToWithdraw)}
        title="Retirar cotización"
        message={`¿Estás seguro de retirar la cotización de "${
          quoteToWithdraw?.label
        }" por ${formatCurrencyMXN(quoteToWithdraw?.amount ?? 0)}?`}
        confirmLabel="Retirar cotización"
        isDestructive={true}
        onConfirm={handleConfirmWithdraw}
        onCancel={() => setQuoteToWithdraw(null)}
      />
    </div>
  );
}
