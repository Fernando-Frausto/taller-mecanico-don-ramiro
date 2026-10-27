/**
 * Módulo de registro inmutable (Ledger) — Taller Mecánico "Don Ramiro"
 * Cumple con RF-18, RF-19, RF-21 y Principio 3 de docs/constitution.md.
 */

import type { LedgerEntry, LedgerResult, Actor } from './types';

/**
 * Genera la descripción exacta aceptada/mostrada:
 * `${label} — Nota: ${note}` si hay nota, o `${label}` si no (RF-18).
 */
export function buildExactDescription(label: string, note?: string): string {
  const trimmedNote = (note ?? '').trim();
  if (trimmedNote.length > 0) {
    return `${label} — Nota: ${trimmedNote}`;
  }
  return label;
}

function generateLedgerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `led-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export interface CreateLedgerEntryParams {
  id?: string;
  vehicleId: string;
  quoteId: string;
  result: LedgerResult;
  decidedBy: string;
  actor: Actor;
  at?: string;
  amount: number;
  exactDescription: string;
}

/**
 * Crea una entrada de registro inmutable (Object.freeze) con todos sus campos (RF-18, Constitución §3).
 */
export function createLedgerEntry(params: CreateLedgerEntryParams): LedgerEntry {
  const entry: LedgerEntry = {
    id: params.id ?? generateLedgerId(),
    vehicleId: params.vehicleId,
    quoteId: params.quoteId,
    result: params.result,
    decidedBy: params.decidedBy,
    actor: params.actor,
    at: params.at ?? new Date().toISOString(),
    amount: params.amount,
    exactDescription: params.exactDescription,
  };

  return Object.freeze(entry);
}

/**
 * Agrega una nueva entrada a la colección de ledger sin mutar la existente.
 * La colección resultante es inmutable (solo-agregar) (RF-19, Constitución §3).
 * No existen funciones para editar o eliminar entradas del ledger.
 */
export function appendLedgerEntry(
  ledger: readonly LedgerEntry[],
  entry: LedgerEntry
): readonly LedgerEntry[] {
  const frozenEntry = Object.isFrozen(entry) ? entry : Object.freeze({ ...entry });
  return Object.freeze([...ledger, frozenEntry]);
}

/**
 * Obtiene las entradas del ledger pertenecientes a un vehículo en orden cronológico.
 */
export function getLedgerForVehicle(
  ledger: readonly LedgerEntry[],
  vehicleId: string
): readonly LedgerEntry[] {
  return Object.freeze(ledger.filter((entry) => entry.vehicleId === vehicleId));
}
