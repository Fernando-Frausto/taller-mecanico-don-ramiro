import type { AppData, VehicleState, ManualState, QuoteStatus, LedgerResult, Role } from '../domain/types';

export const SCHEMA_VERSION = 1 as const;

export const STORAGE_KEY_DATA = 'taller-demo:data' as const;
export const STORAGE_KEY_PREFS = 'taller-demo:prefs' as const;

const VALID_VEHICLE_STATES: readonly VehicleState[] = [
  'recibido',
  'diagnostico',
  'espera_aprobacion',
  'reparacion',
  'listo',
  'entregado',
];

const VALID_MANUAL_STATES: readonly ManualState[] = [
  'recibido',
  'diagnostico',
  'reparacion',
  'listo',
  'entregado',
];

const VALID_QUOTE_STATUSES: readonly QuoteStatus[] = [
  'pendiente',
  'aprobada',
  'rechazada',
  'retirada',
];

const VALID_LEDGER_RESULTS: readonly LedgerResult[] = [
  'aprobada',
  'rechazada',
  'retirada',
];

const VALID_ROLES: readonly Role[] = ['mecanico', 'jefe'];

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function isValidActor(actor: unknown): boolean {
  if (!isObject(actor)) return false;
  if (actor.kind === 'taller') {
    return VALID_ROLES.includes(actor.role as Role);
  }
  if (actor.kind === 'cliente' || actor.kind === 'sistema') {
    return true;
  }
  return false;
}

export function isAppData(x: unknown): x is AppData {
  if (!isObject(x)) return false;
  if (x.schemaVersion !== SCHEMA_VERSION) return false;
  if (!Array.isArray(x.vehicles)) return false;
  if (!Array.isArray(x.quotes)) return false;
  if (!Array.isArray(x.ledger)) return false;
  if (!Array.isArray(x.history)) return false;
  if (!Array.isArray(x.catalog)) return false;

  // Validar vehicles
  for (const v of x.vehicles) {
    if (!isObject(v)) return false;
    if (typeof v.id !== 'string' || v.id === '') return false;
    if (typeof v.token !== 'string' || v.token === '') return false;
    if (typeof v.isSeed !== 'boolean') return false;
    if (typeof v.clientName !== 'string') return false;
    if (typeof v.phone !== 'string') return false;
    if (typeof v.vehicleDesc !== 'string') return false;
    if (typeof v.plates !== 'string') return false;
    if (!VALID_VEHICLE_STATES.includes(v.state as VehicleState)) return false;
    if (v.pausedFrom !== null && !VALID_MANUAL_STATES.includes(v.pausedFrom as ManualState)) {
      return false;
    }
    if (v.pauseId !== null && typeof v.pauseId !== 'string') return false;
    if (typeof v.createdAt !== 'string') return false;
    if (typeof v.updatedAt !== 'string') return false;
  }

  // Validar quotes
  for (const q of x.quotes) {
    if (!isObject(q)) return false;
    if (typeof q.id !== 'string') return false;
    if (typeof q.vehicleId !== 'string') return false;
    if (typeof q.pauseId !== 'string') return false;
    if (typeof q.catalogItemId !== 'string') return false;
    if (typeof q.label !== 'string') return false;
    if (typeof q.note !== 'string') return false;
    if (typeof q.amount !== 'number') return false;
    if (typeof q.exactDescription !== 'string') return false;
    if (!VALID_QUOTE_STATUSES.includes(q.status as QuoteStatus)) return false;
    if (typeof q.sentAt !== 'string') return false;
    if (!VALID_ROLES.includes(q.sentBy as Role)) return false;
  }

  // Validar ledger
  for (const l of x.ledger) {
    if (!isObject(l)) return false;
    if (typeof l.id !== 'string') return false;
    if (typeof l.vehicleId !== 'string') return false;
    if (typeof l.quoteId !== 'string') return false;
    if (!VALID_LEDGER_RESULTS.includes(l.result as LedgerResult)) return false;
    if (typeof l.decidedBy !== 'string') return false;
    if (!isValidActor(l.actor)) return false;
    if (typeof l.at !== 'string') return false;
    if (typeof l.amount !== 'number') return false;
    if (typeof l.exactDescription !== 'string') return false;
  }

  // Validar history
  for (const h of x.history) {
    if (!isObject(h)) return false;
    if (typeof h.id !== 'string') return false;
    if (typeof h.vehicleId !== 'string') return false;
    if (h.from !== null && !VALID_VEHICLE_STATES.includes(h.from as VehicleState)) {
      return false;
    }
    if (!VALID_VEHICLE_STATES.includes(h.to as VehicleState)) return false;
    if (typeof h.at !== 'string') return false;
    if (!isValidActor(h.actor)) return false;
  }

  // Validar catalog
  for (const c of x.catalog) {
    if (!isObject(c)) return false;
    if (typeof c.id !== 'string') return false;
    if (typeof c.label !== 'string') return false;
    if (typeof c.suggestedPrice !== 'number') return false;
  }

  return true;
}
