/**
 * Tipos base del dominio — Taller Mecánico "Don Ramiro"
 * Basado en specs/001-estado-y-cotizaciones/plan.md y docs/constitution.md
 */

export type VehicleState =
  | 'recibido'
  | 'diagnostico'
  | 'espera_aprobacion'
  | 'reparacion'
  | 'listo'
  | 'entregado';

export type ManualState = Exclude<VehicleState, 'espera_aprobacion'>;

export type Role = 'mecanico' | 'jefe';

export type Actor =
  | { kind: 'taller'; role: Role }
  | { kind: 'cliente' }
  | { kind: 'sistema' };

export interface Vehicle {
  id: string;
  token: string;
  isSeed: boolean;
  clientName: string;
  phone: string; // '52' + 10 dígitos (normalizado)
  vehicleDesc: string;
  plates: string; // placas normalizadas (mayúsculas, sin espacios/guiones)
  reason?: string;
  state: VehicleState;
  pausedFrom: ManualState | null; // solo se fija al entrar en pausa (S-10)
  pauseId: string | null; // agrupa cotizaciones de la pausa actual (RF-11)
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItem {
  id: string;
  label: string;
  suggestedPrice: number;
}

export interface QuoteDraft {
  catalogItemId: string;
  amount: number;
  note: string;
}

export type QuoteStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'retirada';

export interface Quote {
  id: string;
  vehicleId: string;
  pauseId: string;
  catalogItemId: string;
  label: string;
  note: string;
  amount: number;
  exactDescription: string; // label + (nota ? ' — Nota: ' + nota : '')
  status: QuoteStatus;
  sentAt: string;
  sentBy: Role;
}

export type LedgerResult = 'aprobada' | 'rechazada' | 'retirada';

export interface LedgerEntry {
  id: string;
  vehicleId: string;
  quoteId: string;
  result: LedgerResult;
  decidedBy: string; // nombre del cliente o 'Taller (Jefe|Mecánico)'
  actor: Actor;
  at: string;
  amount: number;
  exactDescription: string;
}

export interface StateChange {
  id: string;
  vehicleId: string;
  from: VehicleState | null;
  to: VehicleState;
  at: string;
  actor: Actor;
}

export interface AppData {
  schemaVersion: 1;
  vehicles: Vehicle[];
  quotes: Quote[];
  ledger: LedgerEntry[];
  history: StateChange[];
  catalog: CatalogItem[];
}

export interface DemoPrefs {
  view: 'taller' | 'cliente';
  role: Role;
}

export type DomainErrorCode =
  | 'forbidden'
  | 'invalid_transition'
  | 'pending_quotes'
  | 'already_resolved'
  | 'not_found'
  | 'validation'
  | 'conflict';

export interface DomainError {
  code: DomainErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
  details?: unknown;
}

export type Result<T, E = DomainError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function err<E = DomainError>(error: E): Result<never, E> {
  return { ok: false, error };
}

export interface VehicleInput {
  clientName: string;
  phone: string;
  vehicleDesc: string;
  plates: string;
  reason?: string;
}

export interface NormalizedVehicleInput {
  clientName: string;
  phone: string;
  vehicleDesc: string;
  plates: string;
  reason?: string;
}

export type VehicleFieldErrors = Partial<
  Record<'clientName' | 'phone' | 'vehicleDesc' | 'plates' | 'reason', string>
>;

export interface VehicleValidationResult {
  isValid: boolean;
  errors: VehicleFieldErrors;
  data?: NormalizedVehicleInput;
}

export interface DecisionNameValidationResult {
  isValid: boolean;
  error?: string;
  trimmedName: string;
}
