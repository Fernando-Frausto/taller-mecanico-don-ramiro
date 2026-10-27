import type { MouseEvent } from 'react';
import { useApp } from '../store';
import { navigate } from '../router';
import { StatusBadge } from '../components/StatusBadge';
import { getNextState } from '../../domain/states';
import { STATE_LABELS } from '../../domain/whatsapp';
import { advanceStateAction } from '../../domain/app';

export interface VehicleListProps {
  filterDelivered?: boolean;
}

export function VehicleList({ filterDelivered = false }: VehicleListProps) {
  const { data, prefs, dispatch } = useApp();
  const isBoss = prefs.role === 'jefe';

  const vehicles = data.vehicles.filter((v) =>
    filterDelivered ? v.state === 'entregado' : v.state !== 'entregado'
  );

  const hasPendingQuotes = (vehicleId: string) => {
    return data.quotes.some(
      (q) => q.vehicleId === vehicleId && q.status === 'pendiente'
    );
  };

  const handleQuickAdvance = (vehicleId: string, e: MouseEvent) => {
    e.stopPropagation();
    dispatch(advanceStateAction(vehicleId, prefs.role));
  };

  const handleOpenDetail = (vehicleId: string) => {
    navigate(`#/taller/v/${vehicleId}`);
  };

  return (
    <div className="taller-view" style={{ maxWidth: '720px', margin: '0 auto', padding: '1rem' }}>
      {/* Encabezado y acciones de rol */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.4rem', fontWeight: 800 }}>
            {filterDelivered ? 'Vehículos Entregados' : 'Vehículos Activos'}
          </h2>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Rol actual: <strong>{isBoss ? 'Jefe de taller' : 'Mecánico'}</strong>
          </span>
        </div>

        {isBoss && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('#/taller/nuevo')}
              className="touch-target-48"
              style={{
                minHeight: '48px',
                minWidth: '48px',
                padding: '0.5rem 1rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>➕</span> Nuevo ingreso
            </button>
            <button
              type="button"
              onClick={() => navigate('#/taller/catalogo')}
              className="touch-target-48"
              style={{
                minHeight: '48px',
                minWidth: '48px',
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>⚙️</span> Catálogo
            </button>
          </div>
        )}
      </div>

      {/* Pestañas para alternar entre Activos y Entregados */}
      <nav
        aria-label="Filtro de vehículos"
        style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '1.25rem',
          gap: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('#/taller')}
          className="touch-target-48"
          style={{
            minHeight: '48px',
            padding: '0.5rem 1.25rem',
            border: 'none',
            borderBottom: !filterDelivered ? '3px solid #2563eb' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: !filterDelivered ? '#2563eb' : '#64748b',
            fontWeight: !filterDelivered ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Vehículos Activos ({data.vehicles.filter((v) => v.state !== 'entregado').length})
        </button>
        <button
          type="button"
          onClick={() => navigate('#/taller/entregados')}
          className="touch-target-48"
          style={{
            minHeight: '48px',
            padding: '0.5rem 1.25rem',
            border: 'none',
            borderBottom: filterDelivered ? '3px solid #2563eb' : '3px solid transparent',
            backgroundColor: 'transparent',
            color: filterDelivered ? '#2563eb' : '#64748b',
            fontWeight: filterDelivered ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Entregados ({data.vehicles.filter((v) => v.state === 'entregado').length})
        </button>
      </nav>

      {/* Lista de tarjetas de vehículos */}
      {vehicles.length === 0 ? (
        <div
          style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            color: '#64748b',
          }}
        >
          <p style={{ margin: 0, fontSize: '1.1rem' }}>
            {filterDelivered
              ? 'No hay vehículos entregados registrados.'
              : 'No hay vehículos activos en este momento.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {vehicles.map((v) => {
            const pending = hasPendingQuotes(v.id) || v.state === 'espera_aprobacion';
            const nextState = getNextState(v.state);
            const canQuickAdvance = nextState !== null && !pending;

            return (
              <div
                key={v.id}
                data-testid={`vehicle-card-${v.id}`}
                onClick={() => handleOpenDetail(v.id)}
                style={{
                  backgroundColor: '#ffffff',
                  border: pending ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Indicador de trabajo en pausa por cotización pendiente */}
                {pending && (
                  <div
                    style={{
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      padding: '0.4rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginBottom: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <span>⏳</span> Cotización pendiente — Trabajo pausado
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '1rem',
                        letterSpacing: '0.05em',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {v.plates}
                    </span>
                    <h3 style={{ margin: '0.25rem 0', fontSize: '1.15rem', color: '#0f172a' }}>
                      {v.vehicleDesc}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>
                      Cliente: <strong>{v.clientName}</strong>
                    </p>
                  </div>
                  <div>
                    <StatusBadge state={v.state} />
                  </div>
                </div>

                {v.reason && (
                  <p
                    style={{
                      margin: '0.5rem 0 1rem 0',
                      fontSize: '0.85rem',
                      color: '#64748b',
                      fontStyle: 'italic',
                    }}
                  >
                    Motivo: {v.reason}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    marginTop: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  {canQuickAdvance && nextState && (
                    <button
                      type="button"
                      aria-label={`Avanzar a ${STATE_LABELS[nextState]}`}
                      onClick={(e) => handleQuickAdvance(v.id, e)}
                      className="touch-target-48"
                      style={{
                        minHeight: '48px',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                      }}
                    >
                      Avanzar a {STATE_LABELS[nextState]} ➔
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(v.id);
                    }}
                    className="touch-target-48"
                    style={{
                      minHeight: '48px',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f1f5f9',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Ver ficha 🔍
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
