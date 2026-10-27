import { useState } from 'react';
import { useApp } from '../store';
import { InvalidLink } from './InvalidLink';
import { DecisionModal } from './DecisionModal';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrencyMXN, formatDateTime } from '../../domain/format';
import type { Quote, ManualState, VehicleState } from '../../domain/types';

export interface ClientViewProps {
  token: string;
}

const PROGRESS_STEPS: { state: ManualState; label: string }[] = [
  { state: 'recibido', label: 'Recibido' },
  { state: 'diagnostico', label: 'En diagnóstico' },
  { state: 'reparacion', label: 'En reparación' },
  { state: 'listo', label: 'Listo para entregar' },
  { state: 'entregado', label: 'Entregado' },
];

function getActiveStepIndex(state: VehicleState, pausedFrom: ManualState | null): number {
  if (state === 'espera_aprobacion') {
    const base = pausedFrom ?? 'diagnostico';
    return PROGRESS_STEPS.findIndex((s) => s.state === base);
  }
  return PROGRESS_STEPS.findIndex((s) => s.state === state);
}

/**
 * Portal web del cliente accesible mediante token único (#/c/:token).
 * Sin login ni cuenta (Constitución §2, RF-12..18, RF-21, RF-40; CA-07..10, CA-19).
 */
export function ClientView({ token }: ClientViewProps) {
  const { data } = useApp();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [modalDecision, setModalDecision] = useState<'aprobada' | 'rechazada' | null>(null);

  // Buscar el vehículo correspondiente al token
  const vehicle = data.vehicles.find((v) => v.token === token);

  // Si no existe, mostrar pantalla amigable de enlace no válido (RF-13, CA-08)
  if (!vehicle) {
    return <InvalidLink />;
  }

  // Cotizaciones y ledger exclusivos de este vehículo (RF-14)
  const vehicleQuotes = data.quotes.filter((q) => q.vehicleId === vehicle.id);
  const pendingQuotes = vehicleQuotes.filter((q) => q.status === 'pendiente');
  const vehicleLedger = data.ledger.filter((l) => l.vehicleId === vehicle.id);

  const isDelivered = vehicle.state === 'entregado';
  const hasPendingQuotes = pendingQuotes.length > 0;
  const activeStepIdx = getActiveStepIndex(vehicle.state, vehicle.pausedFrom);

  const handleOpenDecision = (quote: Quote, decision: 'aprobada' | 'rechazada') => {
    setSelectedQuote(quote);
    setModalDecision(decision);
  };

  const handleCloseModal = () => {
    setSelectedQuote(null);
    setModalDecision(null);
  };

  return (
    <div
      className="client-view-container"
      style={{
        maxWidth: '680px',
        margin: '1.5rem auto',
        padding: '0 1rem',
      }}
    >
      {/* 1. Alerta prioritaria de cotización pendiente en pausa (RF-14, RF-15, RF-18) */}
      {hasPendingQuotes && (
        <div
          role="alert"
          style={{
            backgroundColor: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }} aria-hidden="true">
              ⚠️
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#92400e',
                lineHeight: 1.3,
              }}
            >
              Reparación adicional requerida: el trabajo se encuentra en pausa esperando su autorización
            </h3>
          </div>

          <p style={{ margin: '0 0 1rem 0', color: '#78350f', fontSize: '0.95rem' }}>
            El mecánico ha identificado una reparación complementaria necesaria para su vehículo.
            Revise los detalles y elija una opción:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pendingQuotes.map((quote) => (
              <div
                key={quote.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  border: '1.5px solid #fbbf24',
                }}
              >
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                    marginBottom: '0.5rem',
                  }}
                >
                  {quote.exactDescription}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    padding: '0.5rem 0',
                    borderTop: '1px solid #fef3c7',
                  }}
                >
                  <span style={{ fontSize: '0.95rem', color: '#475569' }}>Monto adicional:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>
                    {formatCurrencyMXN(quote.amount)}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenDecision(quote, 'aprobada')}
                    className="touch-target-48 btn-approve"
                    style={{
                      flex: 1,
                      minHeight: '48px',
                      minWidth: '140px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span>✓</span> Aprobar reparación
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDecision(quote, 'rechazada')}
                    className="touch-target-48 btn-reject"
                    style={{
                      flex: 1,
                      minHeight: '48px',
                      minWidth: '140px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span>✕</span> Rechazar reparación
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Banner de agradecimiento para vehículos entregados (RF-40, CA-19) */}
      {isDelivered && (
        <div
          role="status"
          style={{
            backgroundColor: '#f0fdf4',
            border: '2px solid #86efac',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} aria-hidden="true">
            🏁
          </div>
          <h3
            style={{
              margin: '0 0 0.5rem 0',
              color: '#166534',
              fontSize: '1.3rem',
              fontWeight: 800,
            }}
          >
            Vehículo entregado. Gracias por su preferencia
          </h3>
          <p style={{ margin: 0, color: '#15803d', fontSize: '0.95rem' }}>
            Su vehículo fue entregado satisfactoriamente. Esta página permanece disponible en modo
            de solo consulta para su historial y comprobantes de servicio.
          </p>
        </div>
      )}

      {/* 3. Ficha principal del vehículo */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h2
              style={{
                margin: '0 0 0.35rem 0',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0f172a',
              }}
            >
              {vehicle.vehicleDesc}
            </h2>
            <div style={{ fontSize: '0.95rem', color: '#475569' }}>
              Propietario: <strong>{vehicle.clientName}</strong>
            </div>
          </div>

          <div
            style={{
              display: 'inline-block',
              backgroundColor: '#f1f5f9',
              border: '2px solid #0f172a',
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontWeight: 800,
              fontSize: '1.15rem',
              color: '#0f172a',
              letterSpacing: '0.1em',
              fontFamily: 'monospace',
            }}
          >
            {vehicle.plates}
          </div>
        </div>

        {/* Estado actual destacado en texto + icono + color (RNF-02, RF-12, CA-07) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            paddingTop: '1rem',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.35rem' }}>
              Estado del vehículo
            </div>
            <StatusBadge state={vehicle.state} />
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Última actualización:</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
              {formatDateTime(vehicle.updatedAt)}
            </div>
          </div>
        </div>

        {vehicle.reason && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              borderLeft: '4px solid #3b82f6',
              fontSize: '0.9rem',
              color: '#334155',
            }}
          >
            <strong>Motivo de ingreso:</strong> {vehicle.reason}
          </div>
        )}
      </div>

      {/* 4. Línea de progreso visual de los 5 estados principales (RF-12) */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          marginBottom: '1.5rem',
        }}
      >
        <h3
          style={{
            margin: '0 0 1.25rem 0',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          Progreso de la reparación
        </h3>

        <ol
          role="list"
          aria-label="Progreso de la reparación"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {PROGRESS_STEPS.map((step, idx) => {
            const isCompleted = idx < activeStepIdx;
            const isCurrent = idx === activeStepIdx;
            const isPausedAtThisStep = isCurrent && vehicle.state === 'espera_aprobacion';

            let indicatorBg = '#e2e8f0';
            let indicatorColor = '#64748b';
            let indicatorText = `${idx + 1}`;

            if (isCompleted) {
              indicatorBg = '#16a34a';
              indicatorColor = '#ffffff';
              indicatorText = '✓';
            } else if (isPausedAtThisStep) {
              indicatorBg = '#f59e0b';
              indicatorColor = '#ffffff';
              indicatorText = '⏸';
            } else if (isCurrent) {
              indicatorBg = '#2563eb';
              indicatorColor = '#ffffff';
              indicatorText = `${idx + 1}`;
            }

            return (
              <li
                key={step.state}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  opacity: idx > activeStepIdx ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: indicatorBg,
                    color: indicatorColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {indicatorText}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: isCurrent ? 800 : 600,
                      fontSize: '1rem',
                      color: isCurrent ? '#0f172a' : '#475569',
                    }}
                  >
                    {step.label}
                  </div>
                  {isPausedAtThisStep && (
                    <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>
                      En pausa: esperando autorización de cotización
                    </div>
                  )}
                  {isCurrent && !isPausedAtThisStep && (
                    <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                      Fase actual
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* 5. Registro inmutable de cotizaciones (RF-21, Constitución §3) */}
      <section
        role="region"
        aria-label="Registro inmutable de cotizaciones"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          marginBottom: '1.5rem',
        }}
      >
        <h3
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.15rem',
            fontWeight: 800,
            color: '#0f172a',
          }}
        >
          Registro inmutable de cotizaciones
        </h3>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>
          Trazabilidad inmutable de todas las decisiones de cotizaciones adicionales autorizadas,
          rechazadas o retiradas (RF-21, Constitución §3).
        </p>

        {vehicleLedger.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            No hay cotizaciones registradas para este vehículo.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {vehicleLedger.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  backgroundColor:
                    item.result === 'aprobada'
                      ? '#f0fdf4'
                      : item.result === 'rechazada'
                      ? '#fef2f2'
                      : '#f8fafc',
                  border: `1.5px solid ${
                    item.result === 'aprobada'
                      ? '#86efac'
                      : item.result === 'rechazada'
                      ? '#fca5a5'
                      : '#cbd5e1'
                  }`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.25rem',
                  }}
                >
                  <strong
                    style={{
                      color:
                        item.result === 'aprobada'
                          ? '#166534'
                          : item.result === 'rechazada'
                          ? '#991b1b'
                          : '#475569',
                      fontSize: '0.95rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.result === 'retirada' ? 'Retirada por taller' : item.result}
                  </strong>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                    {formatCurrencyMXN(item.amount)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.95rem',
                    color: '#1e293b',
                    marginBottom: '0.35rem',
                    fontWeight: 500,
                  }}
                >
                  {item.exactDescription}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Decidido por: <strong>{item.decidedBy}</strong> • {formatDateTime(item.at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Datos de contacto y ubicación del Taller "Don Ramiro" */}
      <footer
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          color: '#334155',
        }}
      >
        <h4
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#0f172a',
          }}
        >
          Taller Mecánico Don Ramiro
        </h4>
        <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem' }}>
          📞 Teléfono: <strong>(55) 5555-1234</strong>
        </p>
        <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem' }}>
          🕒 Horario: Lunes a Viernes de 8:00 a 18:00 hrs, Sábados de 8:00 a 14:00 hrs
        </p>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          📍 Ubicación: Av. Principal #123, Col. Centro
        </p>
      </footer>

      {/* Modal de decisión del cliente */}
      <DecisionModal
        isOpen={Boolean(selectedQuote && modalDecision)}
        quote={selectedQuote}
        decision={modalDecision}
        defaultName={vehicle.clientName}
        onClose={handleCloseModal}
      />
    </div>
  );
}
