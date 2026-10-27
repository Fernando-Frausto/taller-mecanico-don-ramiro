import { useState, type FormEvent } from 'react';
import { useApp } from '../store';
import { navigate } from '../router';
import { createVehicleAction } from '../../domain/app';
import type { VehicleFieldErrors } from '../../domain/types';

export function NewVehicleForm() {
  const { prefs, dispatch } = useApp();
  const isBoss = prefs.role === 'jefe';

  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleDesc, setVehicleDesc] = useState('');
  const [plates, setPlates] = useState('');
  const [reason, setReason] = useState('');

  const [fieldErrors, setFieldErrors] = useState<VehicleFieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  if (!isBoss) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <div
          role="alert"
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '1.25rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontWeight: 600,
          }}
        >
          Solo el rol Jefe puede dar de alta vehículos (RF-38).
        </div>
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
          Volver a la lista de vehículos
        </button>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const action = createVehicleAction(
      {
        clientName: clientName.trim(),
        phone: phone.trim(),
        vehicleDesc: vehicleDesc.trim(),
        plates: plates.trim(),
        reason: reason.trim() || undefined,
      },
      prefs.role
    );

    const result = dispatch(action);

    if (!result.ok) {
      if (result.error.fieldErrors) {
        setFieldErrors(result.error.fieldErrors);
      } else {
        setGeneralError(result.error.message);
      }
      return;
    }

    // El vehículo recién creado está al final del arreglo
    const newVehicle = result.data.vehicles[result.data.vehicles.length - 1];
    if (newVehicle) {
      navigate(`#/taller/v/${newVehicle.id}`);
    } else {
      navigate('#/taller');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
        <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
          Alta de Nuevo Vehículo
        </h2>
      </div>

      {generalError && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontWeight: 600,
          }}
        >
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Nombre del cliente */}
        <div>
          <label
            htmlFor="input-client-name"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}
          >
            Nombre del cliente *
          </label>
          <input
            id="input-client-name"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            aria-invalid={Boolean(fieldErrors.clientName)}
            aria-describedby={fieldErrors.clientName ? 'error-clientName' : undefined}
            placeholder="Ej: Juan Carlos Pérez"
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: `2px solid ${fieldErrors.clientName ? '#dc2626' : '#cbd5e1'}`,
              boxSizing: 'border-box',
            }}
          />
          {fieldErrors.clientName && (
            <p id="error-clientName" style={{ color: '#dc2626', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              {fieldErrors.clientName}
            </p>
          )}
        </div>

        {/* Teléfono */}
        <div>
          <label
            htmlFor="input-phone"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}
          >
            Teléfono del cliente (10 dígitos MX) *
          </label>
          <input
            id="input-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? 'error-phone' : undefined}
            placeholder="Ej: 5512345678"
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: `2px solid ${fieldErrors.phone ? '#dc2626' : '#cbd5e1'}`,
              boxSizing: 'border-box',
            }}
          />
          {fieldErrors.phone && (
            <p id="error-phone" style={{ color: '#dc2626', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              {fieldErrors.phone}
            </p>
          )}
        </div>

        {/* Vehículo */}
        <div>
          <label
            htmlFor="input-vehicle-desc"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}
          >
            Vehículo (marca, modelo, año) *
          </label>
          <input
            id="input-vehicle-desc"
            type="text"
            value={vehicleDesc}
            onChange={(e) => setVehicleDesc(e.target.value)}
            aria-invalid={Boolean(fieldErrors.vehicleDesc)}
            aria-describedby={fieldErrors.vehicleDesc ? 'error-vehicleDesc' : undefined}
            placeholder="Ej: Nissan Versa 2019 Plata"
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: `2px solid ${fieldErrors.vehicleDesc ? '#dc2626' : '#cbd5e1'}`,
              boxSizing: 'border-box',
            }}
          />
          {fieldErrors.vehicleDesc && (
            <p id="error-vehicleDesc" style={{ color: '#dc2626', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              {fieldErrors.vehicleDesc}
            </p>
          )}
        </div>

        {/* Placas */}
        <div>
          <label
            htmlFor="input-plates"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}
          >
            Placas *
          </label>
          <input
            id="input-plates"
            type="text"
            value={plates}
            onChange={(e) => setPlates(e.target.value.toUpperCase())}
            aria-invalid={Boolean(fieldErrors.plates)}
            aria-describedby={fieldErrors.plates ? 'error-plates' : undefined}
            placeholder="Ej: ABC1234"
            style={{
              width: '100%',
              minHeight: '48px',
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: `2px solid ${fieldErrors.plates ? '#dc2626' : '#cbd5e1'}`,
              boxSizing: 'border-box',
              textTransform: 'uppercase',
            }}
          />
          {fieldErrors.plates && (
            <p id="error-plates" style={{ color: '#dc2626', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
              {fieldErrors.plates}
            </p>
          )}
        </div>

        {/* Motivo de ingreso */}
        <div>
          <label
            htmlFor="input-reason"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.35rem' }}
          >
            Motivo de ingreso (opcional)
          </label>
          <textarea
            id="input-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Ruido en la suspensión delantera al pasar baches"
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

        {/* Botones de acción */}
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="submit"
            className="touch-target-48"
            style={{
              minHeight: '48px',
              width: '100%',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Registrar ingreso
          </button>
          <button
            type="button"
            onClick={() => navigate('#/taller')}
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
      </form>
    </div>
  );
}
