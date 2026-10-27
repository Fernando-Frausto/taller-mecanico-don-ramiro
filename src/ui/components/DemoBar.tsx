import React, { useState } from 'react';
import { useApp } from '../store';
import { navigate, useHashRoute } from '../router';
import { ConfirmDialog } from './ConfirmDialog';
import type { Role } from '../../domain/types';

/**
 * Barra superior fija de demostración.
 * Cumple con RF-27, RF-28, CA-14, CA-15:
 * - Alternar entre vista Taller y Cliente.
 * - Cambiar de rol (Mecánico / Jefe).
 * - Selector rápido de vehículo para saltar a vista cliente o taller.
 * - Botón "Reiniciar demo" con diálogo de confirmación accesible.
 */
export function DemoBar() {
  const { data, prefs, setRole, setView, resetDemo } = useApp();
  const currentRoute = useHashRoute();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const isClientView = currentRoute.kind === 'cliente';

  const handleToggleView = (view: 'taller' | 'cliente') => {
    setView(view);
    if (view === 'taller') {
      navigate('#/taller');
    } else {
      // Si hay vehículos, ir al primero o mantener el actual
      const targetVehicle = data.vehicles[0];
      if (targetVehicle) {
        navigate(`#/c/${targetVehicle.token}`);
      }
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as Role);
  };

  const handleVehicleJump = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;

    const [targetType, idOrToken] = val.split(':');
    if (targetType === 'c') {
      setView('cliente');
      navigate(`#/c/${idOrToken}`);
    } else if (targetType === 'v') {
      setView('taller');
      navigate(`#/taller/v/${idOrToken}`);
    }
  };

  const handleConfirmReset = () => {
    resetDemo();
    setIsResetDialogOpen(false);
    navigate('#/taller');
  };

  return (
    <>
      <nav
        role="region"
        aria-label="Barra de demostración"
        className="demo-bar"
        style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Selector de vista: Taller / Cliente */}
          <div
            role="group"
            aria-label="Selector de vista"
            style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #475569' }}
          >
            <button
              type="button"
              aria-label="Vista Taller"
              onClick={() => handleToggleView('taller')}
              className="touch-target-48"
              style={{
                minHeight: '48px',
                minWidth: '48px',
                padding: '0.5rem 0.85rem',
                border: 'none',
                backgroundColor: !isClientView ? '#2563eb' : '#1e293b',
                color: '#ffffff',
                fontWeight: !isClientView ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              🔧 Taller
            </button>
            <button
              type="button"
              aria-label="Vista Cliente"
              onClick={() => handleToggleView('cliente')}
              className="touch-target-48"
              style={{
                minHeight: '48px',
                minWidth: '48px',
                padding: '0.5rem 0.85rem',
                border: 'none',
                backgroundColor: isClientView ? '#2563eb' : '#1e293b',
                color: '#ffffff',
                fontWeight: isClientView ? 700 : 500,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              📱 Cliente
            </button>
          </div>

          {/* Selector de rol de taller */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <label
              htmlFor="demo-role-select"
              style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}
            >
              Rol del taller:
            </label>
            <select
              id="demo-role-select"
              aria-label="Rol del taller"
              value={prefs.role}
              onChange={handleRoleChange}
              style={{
                minHeight: '48px',
                padding: '0.4rem 0.6rem',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <option value="jefe">Jefe (Don Ramiro)</option>
              <option value="mecanico">Mecánico</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Selector rápido de vehículo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <label
              htmlFor="demo-vehicle-select"
              style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}
            >
              Saltar a vehículo:
            </label>
            <select
              id="demo-vehicle-select"
              aria-label="Saltar a vehículo"
              defaultValue=""
              onChange={handleVehicleJump}
              style={{
                minHeight: '48px',
                maxWidth: '240px',
                padding: '0.4rem 0.6rem',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>
                Seleccionar vehículo...
              </option>
              {data.vehicles.map((v) => (
                <option
                  key={v.id}
                  value={isClientView ? `c:${v.token}` : `v:${v.id}`}
                >
                  {v.vehicleDesc} ({v.plates}) — {v.state}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Reiniciar demo */}
          <button
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            className="touch-target-48 btn-reset-demo"
            aria-label="Reiniciar demo"
            style={{
              minHeight: '48px',
              minWidth: '48px',
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>🔄</span>
            <span>Reiniciar demo</span>
          </button>
        </div>
      </nav>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="¿Desea reiniciar la demo?"
        message="Se restaurarán todos los vehículos, cotizaciones y catálogo al estado inicial de la demo. Se perderán los cambios locales creados en este navegador."
        confirmLabel="Sí, reiniciar"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </>
  );
}
