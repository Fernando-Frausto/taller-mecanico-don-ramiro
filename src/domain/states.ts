import {
  Vehicle,
  VehicleState,
  ManualState,
  Role,
  Actor,
  StateChange,
  Result,
  ok,
  err,
} from './types';
import { canAdvanceState, canCorrectState } from './permissions';

/**
 * Flujo lineal manual de estados del vehículo (S-01, RF-04, RF-05).
 * 'espera_aprobacion' no forma parte del flujo lineal porque es un estado
 * de pausa exclusivo del Sistema.
 */
export const LINEAR_STATES: readonly ManualState[] = [
  'recibido',
  'diagnostico',
  'reparacion',
  'listo',
  'entregado',
] as const;

/**
 * Determina si un estado es parte del flujo lineal manual.
 */
export function isManualState(state: VehicleState): state is ManualState {
  return state !== 'espera_aprobacion' && (LINEAR_STATES as readonly string[]).includes(state);
}

/**
 * Devuelve el siguiente estado en el flujo lineal manual.
 * Devuelve null si ya está en 'entregado' o si está en 'espera_aprobacion' (S-01, RF-04).
 */
export function getNextState(current: VehicleState): ManualState | null {
  if (current === 'espera_aprobacion' || current === 'entregado') {
    return null;
  }
  const currentIndex = LINEAR_STATES.indexOf(current as ManualState);
  if (currentIndex === -1 || currentIndex >= LINEAR_STATES.length - 1) {
    return null;
  }
  return LINEAR_STATES[currentIndex + 1];
}

/**
 * Devuelve el estado inmediatamente anterior en el flujo lineal manual.
 * Devuelve null si está en 'recibido' o en 'espera_aprobacion' (RF-05).
 */
export function getPreviousState(current: VehicleState): ManualState | null {
  if (current === 'espera_aprobacion' || current === 'recibido') {
    return null;
  }
  const currentIndex = LINEAR_STATES.indexOf(current as ManualState);
  if (currentIndex <= 0) {
    return null;
  }
  return LINEAR_STATES[currentIndex - 1];
}

/**
 * Determina si se puede proponer una reparación en el estado dado (RF-06, CA-04).
 * Permitido en: 'diagnostico', 'reparacion', 'espera_aprobacion'.
 * No permitido en: 'recibido', 'listo', 'entregado'.
 */
export function canProposeInState(state: VehicleState): boolean {
  return (
    state === 'diagnostico' ||
    state === 'reparacion' ||
    state === 'espera_aprobacion'
  );
}

/**
 * Parámetros para registrar un cambio de estado (RF-22).
 */
export interface CreateStateChangeParams {
  id?: string;
  vehicleId: string;
  from: VehicleState | null;
  to: VehicleState;
  at?: string;
  actor: Actor;
}

function generateChangeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `chg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Crea un registro inmutable de cambio de estado (RF-22).
 */
export function createStateChange(params: CreateStateChangeParams): StateChange {
  return {
    id: params.id ?? generateChangeId(),
    vehicleId: params.vehicleId,
    from: params.from,
    to: params.to,
    at: params.at ?? new Date().toISOString(),
    actor: params.actor,
  };
}

export interface AdvanceStateParams {
  vehicle: Vehicle;
  role: Role;
  hasPendingQuotes?: boolean;
  targetState?: VehicleState;
  now?: string;
  changeId?: string;
}

export interface AdvanceStateResult {
  updatedVehicle: Vehicle;
  stateChange: StateChange;
}

/**
 * Avanza el estado del vehículo al siguiente estado del flujo lineal manual.
 * Valida:
 * - Que el rol tenga permiso (RF-04).
 * - Que no haya cotizaciones pendientes (RF-10, CA-05).
 * - Que no esté en espera_aprobacion ni en entregado (S-01, RF-04).
 * - Que no se salten estados ni se seleccione espera_aprobacion (RF-05, CA-03).
 */
export function advanceState(params: AdvanceStateParams): Result<AdvanceStateResult> {
  const {
    vehicle,
    role,
    hasPendingQuotes = false,
    targetState,
    now,
    changeId,
  } = params;

  if (!canAdvanceState(role)) {
    return err({
      code: 'forbidden',
      message: 'El rol especificado no tiene permiso para avanzar el estado.',
    });
  }

  if (hasPendingQuotes) {
    return err({
      code: 'pending_quotes',
      message: 'No se puede avanzar el estado mientras existan cotizaciones pendientes.',
    });
  }

  if (vehicle.state === 'espera_aprobacion') {
    return err({
      code: 'invalid_transition',
      message: 'No se puede avanzar manualmente un vehículo en espera de aprobación.',
    });
  }

  if (vehicle.state === 'entregado') {
    return err({
      code: 'invalid_transition',
      message: 'El vehículo ya se encuentra en el estado final (entregado).',
    });
  }

  const nextExpectedState = getNextState(vehicle.state);
  if (!nextExpectedState) {
    return err({
      code: 'invalid_transition',
      message: `No hay un siguiente estado definido para '${vehicle.state}'.`,
    });
  }

  if (targetState) {
    if (targetState === 'espera_aprobacion') {
      return err({
        code: 'invalid_transition',
        message: 'No se puede avanzar manualmente al estado espera_aprobacion.',
      });
    }
    if (targetState !== nextExpectedState) {
      return err({
        code: 'invalid_transition',
        message: `Transición inválida: de '${vehicle.state}' solo se puede avanzar a '${nextExpectedState}', no a '${targetState}'.`,
      });
    }
  }

  const nextState = targetState ?? nextExpectedState;
  const timestamp = now ?? new Date().toISOString();

  const stateChange = createStateChange({
    id: changeId,
    vehicleId: vehicle.id,
    from: vehicle.state,
    to: nextState,
    at: timestamp,
    actor: { kind: 'taller', role },
  });

  const updatedVehicle: Vehicle = {
    ...vehicle,
    state: nextState,
    updatedAt: timestamp,
  };

  return ok({ updatedVehicle, stateChange });
}

export interface CorrectStateParams {
  vehicle: Vehicle;
  role: Role;
  confirmed: boolean;
  hasPendingQuotes?: boolean;
  targetState?: VehicleState;
  now?: string;
  changeId?: string;
}

export interface CorrectStateResult {
  updatedVehicle: Vehicle;
  stateChange: StateChange;
}

/**
 * Corrige el estado del vehículo retornando al estado inmediatamente anterior en el flujo lineal.
 * Valida:
 * - Confirmación explícita (RF-05).
 * - Que el rol tenga permiso.
 * - Que no existan cotizaciones pendientes (RF-10, CA-05).
 * - Que no esté en espera_aprobacion ni en recibido (RF-05, RF-10).
 * - Que solo se corrija al estado inmediatamente anterior (RF-05).
 */
export function correctState(params: CorrectStateParams): Result<CorrectStateResult> {
  const {
    vehicle,
    role,
    confirmed,
    hasPendingQuotes = false,
    targetState,
    now,
    changeId,
  } = params;

  if (confirmed !== true) {
    return err({
      code: 'invalid_transition',
      message: 'La corrección de estado requiere confirmación explícita del usuario.',
    });
  }

  if (!canCorrectState(role)) {
    return err({
      code: 'forbidden',
      message: 'El rol especificado no tiene permiso para corregir el estado.',
    });
  }

  if (hasPendingQuotes) {
    return err({
      code: 'pending_quotes',
      message: 'No se puede corregir el estado mientras existan cotizaciones pendientes.',
    });
  }

  if (vehicle.state === 'espera_aprobacion') {
    return err({
      code: 'invalid_transition',
      message: 'No se puede corregir el estado mientras el vehículo está en espera de aprobación.',
    });
  }

  if (vehicle.state === 'recibido') {
    return err({
      code: 'invalid_transition',
      message: 'No se puede corregir el estado inicial (recibido).',
    });
  }

  const prevExpectedState = getPreviousState(vehicle.state);
  if (!prevExpectedState) {
    return err({
      code: 'invalid_transition',
      message: `No hay un estado anterior válido para '${vehicle.state}'.`,
    });
  }

  if (targetState && targetState !== prevExpectedState) {
    return err({
      code: 'invalid_transition',
      message: `Solo se permite corregir al estado inmediatamente anterior ('${prevExpectedState}'), no a '${targetState}'.`,
    });
  }

  const prevState = targetState ?? prevExpectedState;
  const timestamp = now ?? new Date().toISOString();

  const stateChange = createStateChange({
    id: changeId,
    vehicleId: vehicle.id,
    from: vehicle.state,
    to: prevState,
    at: timestamp,
    actor: { kind: 'taller', role },
  });

  const updatedVehicle: Vehicle = {
    ...vehicle,
    state: prevState,
    updatedAt: timestamp,
  };

  return ok({ updatedVehicle, stateChange });
}
