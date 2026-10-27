import { describe, it, expect } from 'vitest';
import {
  LINEAR_STATES,
  isManualState,
  getNextState,
  getPreviousState,
  canProposeInState,
  createStateChange,
  advanceState,
  correctState,
} from './states';
import { Vehicle } from './types';

const baseVehicle: Vehicle = {
  id: 'veh-123',
  token: 'tok-1234567890',
  isSeed: false,
  clientName: 'Juan Pérez',
  phone: '525512345678',
  vehicleDesc: 'Nissan Versa 2018',
  plates: 'ABC1234',
  reason: 'Frenos rechinan',
  state: 'recibido',
  pausedFrom: null,
  pauseId: null,
  createdAt: '2026-10-26T10:00:00.000Z',
  updatedAt: '2026-10-26T10:00:00.000Z',
};

describe('Máquina de estados — Flujo lineal y transiciones (RF-04, RF-05, RF-10, RF-22)', () => {
  describe('LINEAR_STATES e isManualState', () => {
    it('define el orden estricto del flujo lineal de 5 estados', () => {
      expect(LINEAR_STATES).toEqual([
        'recibido',
        'diagnostico',
        'reparacion',
        'listo',
        'entregado',
      ]);
    });

    it('identifica correctamente qué estados son manuales y excluye espera_aprobacion', () => {
      expect(isManualState('recibido')).toBe(true);
      expect(isManualState('diagnostico')).toBe(true);
      expect(isManualState('reparacion')).toBe(true);
      expect(isManualState('listo')).toBe(true);
      expect(isManualState('entregado')).toBe(true);
      expect(isManualState('espera_aprobacion')).toBe(false);
    });
  });

  describe('getNextState (S-01, RF-04)', () => {
    it('devuelve el siguiente estado en el flujo lineal manual', () => {
      expect(getNextState('recibido')).toBe('diagnostico');
      expect(getNextState('diagnostico')).toBe('reparacion');
      expect(getNextState('reparacion')).toBe('listo');
      expect(getNextState('listo')).toBe('entregado');
    });

    it('devuelve null si el estado actual es entregado (estado terminal)', () => {
      expect(getNextState('entregado')).toBeNull();
    });

    it('devuelve null si el estado actual es espera_aprobacion (pausa del sistema, sin avance manual)', () => {
      expect(getNextState('espera_aprobacion')).toBeNull();
    });
  });

  describe('getPreviousState (RF-05)', () => {
    it('devuelve el estado inmediatamente anterior en el flujo lineal manual', () => {
      expect(getPreviousState('diagnostico')).toBe('recibido');
      expect(getPreviousState('reparacion')).toBe('diagnostico');
      expect(getPreviousState('listo')).toBe('reparacion');
      expect(getPreviousState('entregado')).toBe('listo');
    });

    it('devuelve null si el estado actual es recibido (estado inicial)', () => {
      expect(getPreviousState('recibido')).toBeNull();
    });

    it('devuelve null si el estado actual es espera_aprobacion', () => {
      expect(getPreviousState('espera_aprobacion')).toBeNull();
    });
  });

  describe('canProposeInState (RF-06, CA-04)', () => {
    it('permite proponer cotizaciones en diagnostico, reparacion y espera_aprobacion', () => {
      expect(canProposeInState('diagnostico')).toBe(true);
      expect(canProposeInState('reparacion')).toBe(true);
      expect(canProposeInState('espera_aprobacion')).toBe(true);
    });

    it('prohíbe proponer cotizaciones en recibido, listo y entregado', () => {
      expect(canProposeInState('recibido')).toBe(false);
      expect(canProposeInState('listo')).toBe(false);
      expect(canProposeInState('entregado')).toBe(false);
    });
  });

  describe('createStateChange (RF-22)', () => {
    it('crea un registro de cambio de estado con actor taller (rol mecánico o jefe)', () => {
      const change = createStateChange({
        id: 'chg-1',
        vehicleId: 'veh-123',
        from: 'recibido',
        to: 'diagnostico',
        at: '2026-10-26T12:00:00.000Z',
        actor: { kind: 'taller', role: 'mecanico' },
      });

      expect(change).toEqual({
        id: 'chg-1',
        vehicleId: 'veh-123',
        from: 'recibido',
        to: 'diagnostico',
        at: '2026-10-26T12:00:00.000Z',
        actor: { kind: 'taller', role: 'mecanico' },
      });
    });

    it('soporta actor sistema y actor cliente', () => {
      const changeSistema = createStateChange({
        id: 'chg-sys',
        vehicleId: 'veh-123',
        from: 'diagnostico',
        to: 'espera_aprobacion',
        at: '2026-10-26T12:05:00.000Z',
        actor: { kind: 'sistema' },
      });
      expect(changeSistema.actor).toEqual({ kind: 'sistema' });

      const changeCliente = createStateChange({
        id: 'chg-cli',
        vehicleId: 'veh-123',
        from: 'espera_aprobacion',
        to: 'reparacion',
        at: '2026-10-26T12:10:00.000Z',
        actor: { kind: 'cliente' },
      });
      expect(changeCliente.actor).toEqual({ kind: 'cliente' });
    });

    it('genera id y fecha ISO automáticamente si no se suministran', () => {
      const change = createStateChange({
        vehicleId: 'veh-123',
        from: 'recibido',
        to: 'diagnostico',
        actor: { kind: 'taller', role: 'jefe' },
      });

      expect(typeof change.id).toBe('string');
      expect(change.id.length).toBeGreaterThan(0);
      expect(Date.parse(change.at)).not.toBeNaN();
    });
  });

  describe('advanceState (RF-04, RF-05, RF-10, CA-02, CA-03, CA-05)', () => {
    it('avanza con éxito de recibido a diagnostico', () => {
      const result = advanceState({
        vehicle: { ...baseVehicle, state: 'recibido' },
        role: 'mecanico',
        now: '2026-10-26T11:00:00.000Z',
        changeId: 'chg-adv-1',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.updatedVehicle.state).toBe('diagnostico');
        expect(result.data.updatedVehicle.updatedAt).toBe('2026-10-26T11:00:00.000Z');
        expect(result.data.stateChange).toEqual({
          id: 'chg-adv-1',
          vehicleId: 'veh-123',
          from: 'recibido',
          to: 'diagnostico',
          at: '2026-10-26T11:00:00.000Z',
          actor: { kind: 'taller', role: 'mecanico' },
        });
      }
    });

    it('avanza secuencialmente a través de todo el flujo lineal', () => {
      let currentVehicle = { ...baseVehicle };
      const expectedSteps: Array<[Vehicle['state'], Vehicle['state']]> = [
        ['recibido', 'diagnostico'],
        ['diagnostico', 'reparacion'],
        ['reparacion', 'listo'],
        ['listo', 'entregado'],
      ];

      for (const [from, to] of expectedSteps) {
        expect(currentVehicle.state).toBe(from);
        const res = advanceState({
          vehicle: currentVehicle,
          role: 'jefe',
        });
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.data.updatedVehicle.state).toBe(to);
          expect(res.data.stateChange.from).toBe(from);
          expect(res.data.stateChange.to).toBe(to);
          currentVehicle = res.data.updatedVehicle;
        }
      }
    });

    it('falla si el vehículo ya está en entregado (no hay siguiente estado)', () => {
      const result = advanceState({
        vehicle: { ...baseVehicle, state: 'entregado' },
        role: 'mecanico',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_transition');
        expect(result.error.message).toMatch(/entregado/i);
      }
    });

    it('falla si el vehículo está en espera_aprobacion (no se puede avanzar manualmente en pausa)', () => {
      const result = advanceState({
        vehicle: { ...baseVehicle, state: 'espera_aprobacion' },
        role: 'mecanico',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_transition');
        expect(result.error.message).toMatch(/espera de aprobación/i);
      }
    });

    it('falla si tiene cotizaciones pendientes (RF-10, CA-05)', () => {
      const result = advanceState({
        vehicle: { ...baseVehicle, state: 'diagnostico' },
        role: 'mecanico',
        hasPendingQuotes: true,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('pending_quotes');
        expect(result.error.message).toMatch(/cotizaciones pendientes/i);
      }
    });

    it('falla si se intenta saltar estados especificando targetState no lineal (RF-05, CA-03)', () => {
      const result = advanceState({
        vehicle: { ...baseVehicle, state: 'recibido' },
        role: 'jefe',
        targetState: 'listo',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_transition');
      }
    });

    it('falla si se intenta avanzar manualmente a espera_aprobacion (CA-03, S-01)', () => {
      const result = advanceState({
        vehicle: { ...baseVehicle, state: 'diagnostico' },
        role: 'jefe',
        targetState: 'espera_aprobacion',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_transition');
        expect(result.error.message).toMatch(/espera_aprobacion/i);
      }
    });
  });

  describe('correctState (RF-05, RF-10, CA-05)', () => {
    it('permite corregir al estado inmediatamente anterior con confirmación explícita (confirmed: true)', () => {
      const result = correctState({
        vehicle: { ...baseVehicle, state: 'diagnostico' },
        role: 'mecanico',
        confirmed: true,
        now: '2026-10-26T11:30:00.000Z',
        changeId: 'chg-cor-1',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.updatedVehicle.state).toBe('recibido');
        expect(result.data.updatedVehicle.updatedAt).toBe('2026-10-26T11:30:00.000Z');
        expect(result.data.stateChange).toEqual({
          id: 'chg-cor-1',
          vehicleId: 'veh-123',
          from: 'diagnostico',
          to: 'recibido',
          at: '2026-10-26T11:30:00.000Z',
          actor: { kind: 'taller', role: 'mecanico' },
        });
      }
    });

    it('permite corregir desde reparacion a diagnostico, de listo a reparacion y de entregado a listo', () => {
      const steps: Array<[Vehicle['state'], Vehicle['state']]> = [
        ['entregado', 'listo'],
        ['listo', 'reparacion'],
        ['reparacion', 'diagnostico'],
      ];

      for (const [from, to] of steps) {
        const res = correctState({
          vehicle: { ...baseVehicle, state: from },
          role: 'jefe',
          confirmed: true,
        });
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.data.updatedVehicle.state).toBe(to);
          expect(res.data.stateChange.from).toBe(from);
          expect(res.data.stateChange.to).toBe(to);
        }
      }
    });

    it('falla si no hay confirmación explícita (confirmed: false) (RF-05)', () => {
      const result = correctState({
        vehicle: { ...baseVehicle, state: 'diagnostico' },
        role: 'mecanico',
        confirmed: false,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_transition');
        expect(result.error.message).toMatch(/confirmación/i);
      }
    });

    it('falla si el vehículo está en recibido (no hay estado anterior) (RF-05)', () => {
      const result = correctState({
        vehicle: { ...baseVehicle, state: 'recibido' },
        role: 'mecanico',
        confirmed: true,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_transition');
      }
    });

    it('falla si el vehículo está en espera_aprobacion (RF-10)', () => {
      const result = correctState({
        vehicle: { ...baseVehicle, state: 'espera_aprobacion' },
        role: 'mecanico',
        confirmed: true,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_transition');
      }
    });

    it('falla si existen cotizaciones pendientes (RF-10, CA-05)', () => {
      const result = correctState({
        vehicle: { ...baseVehicle, state: 'reparacion' },
        role: 'mecanico',
        confirmed: true,
        hasPendingQuotes: true,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('pending_quotes');
        expect(result.error.message).toMatch(/cotizaciones pendientes/i);
      }
    });

    it('falla si se intenta corregir a un targetState que no es el inmediatamente anterior', () => {
      const result = correctState({
        vehicle: { ...baseVehicle, state: 'listo' },
        role: 'jefe',
        confirmed: true,
        targetState: 'recibido',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('invalid_transition');
      }
    });
  });
});
