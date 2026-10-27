import type { CSSProperties } from 'react';
import type { VehicleState } from '../../domain/types';

export interface StatusBadgeProps {
  state: VehicleState;
  className?: string;
}

interface StateConfig {
  label: string;
  icon: string;
  className: string;
  style: CSSProperties;
}

const STATE_CONFIGS: Record<VehicleState, StateConfig> = {
  recibido: {
    label: 'Recibido',
    icon: '📋',
    className: 'badge-recibido',
    style: {
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
      borderColor: '#94a3b8',
    },
  },
  diagnostico: {
    label: 'En diagnóstico',
    icon: '🔍',
    className: 'badge-diagnostico',
    style: {
      backgroundColor: '#e0f2fe',
      color: '#0369a1',
      borderColor: '#38bdf8',
    },
  },
  espera_aprobacion: {
    label: 'Esperando aprobación',
    icon: '⏳',
    className: 'badge-espera',
    style: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      borderColor: '#f59e0b',
    },
  },
  reparacion: {
    label: 'En reparación',
    icon: '🛠️',
    className: 'badge-reparacion',
    style: {
      backgroundColor: '#ede9fe',
      color: '#5b21b6',
      borderColor: '#a78bfa',
    },
  },
  listo: {
    label: 'Listo para entregar',
    icon: '✅',
    className: 'badge-listo',
    style: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      borderColor: '#4ade80',
    },
  },
  entregado: {
    label: 'Entregado',
    icon: '🏁',
    className: 'badge-entregado',
    style: {
      backgroundColor: '#f3f4f6',
      color: '#1f2937',
      borderColor: '#9ca3af',
    },
  },
};

/**
 * Indicador de estado accesible con alto contraste (WCAG AA),
 * icono visual y texto descriptivo (RNF-02, RNF-03).
 */
export function StatusBadge({ state, className = '' }: StatusBadgeProps) {
  const config = STATE_CONFIGS[state] ?? {
    label: state,
    icon: 'ℹ️',
    className: 'badge-default',
    style: { backgroundColor: '#f3f4f6', color: '#1f2937', borderColor: '#d1d5db' },
  };

  return (
    <span
      role="status"
      className={`status-badge ${config.className} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '9999px',
        fontWeight: 600,
        fontSize: '0.95rem',
        border: '1.5px solid',
        ...config.style,
      }}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
