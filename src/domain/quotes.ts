/**
 * Módulo de cotizaciones adicionales y lógica de pausa/reanudación — Taller Mecánico "Don Ramiro"
 * Cumple con RF-06, RF-09, RF-11, RF-15, RF-16, RF-17, RF-18, RF-20, RF-31
 * y Criterios de Aceptación CA-04, CA-06, CA-09, CA-10, CA-18, CA-20, CA-21.
 */

import type {
  Vehicle,
  CatalogItem,
  QuoteDraft,
  Quote,
  Role,
  StateChange,
  LedgerEntry,
  Result,
  ManualState,
  VehicleState,
} from './types';
import { ok, err } from './types';
import {
  canProposeQuote,
  canEditQuoteDraftPrice,
  canWithdrawQuote,
} from './permissions';
import { canProposeInState, createStateChange } from './states';
import { buildExactDescription, createLedgerEntry } from './ledger';
import { validateDecisionName } from './validation';

function generateQuoteId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `quo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generatePauseId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pau-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export interface CreateQuoteDraftOptions {
  amount?: number;
  note?: string;
  role?: Role;
}

/**
 * Crea un borrador de cotización a partir de un ítem del catálogo (RF-06).
 * El precio sugerido se precarga por defecto. Solo el rol Jefe puede variar
 * el monto con respecto al precio sugerido (RF-07, RF-38).
 */
export function createQuoteDraft(
  catalogItem: CatalogItem,
  options?: CreateQuoteDraftOptions
): Result<QuoteDraft> {
  const note = (options?.note ?? '').trim();
  const role = options?.role;
  const specifiedAmount = options?.amount;

  if (specifiedAmount !== undefined && specifiedAmount < 0) {
    return err({
      code: 'validation',
      message: 'El monto de la cotización no puede ser negativo.',
    });
  }

  const finalAmount = specifiedAmount ?? catalogItem.suggestedPrice;

  if (specifiedAmount !== undefined && specifiedAmount !== catalogItem.suggestedPrice) {
    if (!role || !canEditQuoteDraftPrice(role)) {
      return err({
        code: 'forbidden',
        message: 'Solo el jefe puede variar el monto con respecto al precio sugerido.',
      });
    }
  }

  return ok({
    catalogItemId: catalogItem.id,
    amount: finalAmount,
    note,
  });
}

export interface SendQuoteParams {
  vehicle: Vehicle;
  draft: QuoteDraft;
  catalogItem: CatalogItem;
  role: Role;
  now?: string;
  quoteId?: string;
  pauseId?: string;
  changeId?: string;
}

export interface SendQuoteResult {
  updatedVehicle: Vehicle;
  quote: Quote;
  stateChange?: StateChange;
}

/**
 * Envía una cotización adicional para el vehículo (RF-06, RF-09, RF-20; CA-04, CA-06).
 * - Solo se permite proponer en: 'diagnostico', 'reparacion' o 'espera_aprobacion' (RF-06, CA-04).
 * - La cotización se vuelve inmutable tras su envío (RF-20).
 * - Al enviar la primera cotización de una pausa, el vehículo entra automáticamente
 *   en 'espera_aprobacion', registra `pausedFrom` (su estado manual previo),
 *   asigna un nuevo `pauseId` y genera un `StateChange` con actor Sistema (RF-09, S-10, CA-06).
 * - Cotizaciones posteriores en la misma pausa NO sobrescriben `pausedFrom` (S-10, CA-06).
 */
export function sendQuote(params: SendQuoteParams): Result<SendQuoteResult> {
  const {
    vehicle,
    draft,
    catalogItem,
    role,
    now,
    quoteId,
    pauseId,
    changeId,
  } = params;

  if (!canProposeQuote(role)) {
    return err({
      code: 'forbidden',
      message: 'El rol especificado no tiene permiso para proponer cotizaciones.',
    });
  }

  if (!canProposeInState(vehicle.state)) {
    return err({
      code: 'invalid_transition',
      message: `No se pueden proponer cotizaciones en el estado '${vehicle.state}'.`,
    });
  }

  if (draft.amount !== catalogItem.suggestedPrice && !canEditQuoteDraftPrice(role)) {
    return err({
      code: 'forbidden',
      message: 'Solo el jefe puede variar el monto con respecto al precio sugerido.',
    });
  }

  if (draft.amount < 0) {
    return err({
      code: 'validation',
      message: 'El monto de la cotización no puede ser negativo.',
    });
  }

  const timestamp = now ?? new Date().toISOString();
  const newQuoteId = quoteId ?? generateQuoteId();
  const exactDescription = buildExactDescription(catalogItem.label, draft.note);

  let currentPauseId: string;
  let updatedVehicle: Vehicle;
  let stateChange: StateChange | undefined;

  if (vehicle.state === 'espera_aprobacion') {
    // Ya se encuentra en pausa; preservar pauseId y pausedFrom existente (S-10)
    currentPauseId = vehicle.pauseId ?? (pauseId ?? generatePauseId());
    updatedVehicle = {
      ...vehicle,
      updatedAt: timestamp,
    };
    stateChange = undefined;
  } else {
    // Primera cotización que inicia la pausa
    currentPauseId = pauseId ?? generatePauseId();
    const pausedFrom = vehicle.state as ManualState;

    stateChange = createStateChange({
      id: changeId,
      vehicleId: vehicle.id,
      from: vehicle.state,
      to: 'espera_aprobacion',
      at: timestamp,
      actor: { kind: 'sistema' },
    });

    updatedVehicle = {
      ...vehicle,
      state: 'espera_aprobacion',
      pausedFrom,
      pauseId: currentPauseId,
      updatedAt: timestamp,
    };
  }

  const newQuote: Quote = Object.freeze({
    id: newQuoteId,
    vehicleId: vehicle.id,
    pauseId: currentPauseId,
    catalogItemId: catalogItem.id,
    label: catalogItem.label,
    note: draft.note ?? '',
    amount: draft.amount,
    exactDescription,
    status: 'pendiente',
    sentAt: timestamp,
    sentBy: role,
  });

  return ok({
    updatedVehicle,
    quote: newQuote,
    stateChange,
  });
}

export interface ResolveVehicleResumeResult {
  updatedVehicle: Vehicle;
  stateChange?: StateChange;
}

/**
 * Evalúa la reanudación automática del vehículo (RF-11, CA-06).
 * Si el vehículo está en 'espera_aprobacion' y ya no quedan cotizaciones pendientes en la pausa:
 * - Si al menos una cotización de la pausa actual fue 'aprobada':
 *   el vehículo pasa a 'reparacion', resetea `pausedFrom` y `pauseId`,
 *   y registra un StateChange con actor Sistema.
 * - Si todas las cotizaciones de la pausa actual fueron rechazadas o retiradas:
 *   el vehículo regresa a `pausedFrom` (o 'diagnostico' como fallback seguro),
 *   resetea `pausedFrom` y `pauseId`, y registra un StateChange con actor Sistema.
 */
export function resolveVehicleResume(
  vehicle: Vehicle,
  quotesForPause: readonly Quote[],
  now?: string,
  changeId?: string
): ResolveVehicleResumeResult {
  if (vehicle.state !== 'espera_aprobacion') {
    return { updatedVehicle: vehicle };
  }

  const hasPending = quotesForPause.some((q) => q.status === 'pendiente');
  if (hasPending) {
    return { updatedVehicle: vehicle };
  }

  const timestamp = now ?? new Date().toISOString();
  const hasAnyApproved = quotesForPause.some((q) => q.status === 'aprobada');
  const targetState: VehicleState = hasAnyApproved
    ? 'reparacion'
    : vehicle.pausedFrom ?? 'diagnostico';

  const stateChange = createStateChange({
    id: changeId,
    vehicleId: vehicle.id,
    from: 'espera_aprobacion',
    to: targetState,
    at: timestamp,
    actor: { kind: 'sistema' },
  });

  const updatedVehicle: Vehicle = {
    ...vehicle,
    state: targetState,
    pausedFrom: null,
    pauseId: null,
    updatedAt: timestamp,
  };

  return {
    updatedVehicle,
    stateChange,
  };
}

export interface WithdrawQuoteParams {
  quote: Quote;
  vehicle: Vehicle;
  role: Role;
  allVehicleQuotes: readonly Quote[];
  now?: string;
  ledgerId?: string;
  changeId?: string;
}

export interface WithdrawQuoteResult {
  updatedVehicle: Vehicle;
  updatedQuote: Quote;
  ledgerEntry: LedgerEntry;
  stateChange?: StateChange;
}

/**
 * Retira una cotización pendiente por parte del taller (RF-31, CA-18).
 * - Marca la cotización como 'retirada' (inmutable).
 * - Genera entrada en el ledger con result 'retirada' y decidedBy 'Taller (Mecánico|Jefe)'.
 * - Evalúa reanudación del vehículo según la lógica de RF-11.
 */
export function withdrawQuote(params: WithdrawQuoteParams): Result<WithdrawQuoteResult> {
  const {
    quote,
    vehicle,
    role,
    allVehicleQuotes,
    now,
    ledgerId,
    changeId,
  } = params;

  if (!canWithdrawQuote(role)) {
    return err({
      code: 'forbidden',
      message: 'El rol especificado no tiene permiso para retirar cotizaciones.',
    });
  }

  if (quote.status !== 'pendiente') {
    return err({
      code: 'already_resolved',
      message: 'Solo se pueden retirar cotizaciones en estado pendiente.',
    });
  }

  const timestamp = now ?? new Date().toISOString();
  const updatedQuote: Quote = Object.freeze({
    ...quote,
    status: 'retirada',
  });

  const decidedBy = role === 'jefe' ? 'Taller (Jefe)' : 'Taller (Mecánico)';

  const ledgerEntry = createLedgerEntry({
    id: ledgerId,
    vehicleId: vehicle.id,
    quoteId: quote.id,
    result: 'retirada',
    decidedBy,
    actor: { kind: 'taller', role },
    at: timestamp,
    amount: quote.amount,
    exactDescription: quote.exactDescription,
  });

  // Reemplazar la cotización modificada en la lista para evaluar la reanudación
  const updatedQuotesList = allVehicleQuotes.map((q) =>
    q.id === quote.id ? updatedQuote : q
  );
  if (!updatedQuotesList.some((q) => q.id === quote.id)) {
    updatedQuotesList.push(updatedQuote);
  }

  const pauseQuotes = vehicle.pauseId
    ? updatedQuotesList.filter(
        (q) => q.vehicleId === vehicle.id && q.pauseId === vehicle.pauseId
      )
    : updatedQuotesList.filter((q) => q.vehicleId === vehicle.id);

  const { updatedVehicle, stateChange } = resolveVehicleResume(
    vehicle,
    pauseQuotes,
    timestamp,
    changeId
  );

  return ok({
    updatedVehicle,
    updatedQuote,
    ledgerEntry,
    stateChange,
  });
}

export interface DecideQuoteParams {
  quote: Quote;
  vehicle: Vehicle;
  decision: 'aprobada' | 'rechazada';
  clientName: string;
  allVehicleQuotes: readonly Quote[];
  now?: string;
  ledgerId?: string;
  changeId?: string;
}

export interface DecideQuoteResult {
  updatedVehicle: Vehicle;
  updatedQuote: Quote;
  ledgerEntry: LedgerEntry;
  stateChange?: StateChange;
}

/**
 * Resuelve una cotización pendiente por parte del cliente (RF-15, RF-16, RF-18; CA-09, CA-20, CA-21).
 * - Valida nombre de quien decide con `validateDecisionName` (RF-16, CA-20).
 * - Si la cotización ya no está pendiente, rechaza con error 'already_resolved' (RF-17, CA-21).
 * - Marca la cotización como 'aprobada' o 'rechazada' (inmutable).
 * - Genera entrada en el ledger (RF-18, CA-09).
 * - Evalúa reanudación del vehículo según RF-11 y CA-06.
 */
export function decideQuote(params: DecideQuoteParams): Result<DecideQuoteResult> {
  const {
    quote,
    vehicle,
    decision,
    clientName,
    allVehicleQuotes,
    now,
    ledgerId,
    changeId,
  } = params;

  if (quote.status !== 'pendiente') {
    return err({
      code: 'already_resolved',
      message: 'La cotización ya ha sido resuelta previamente.',
    });
  }

  const nameValidation = validateDecisionName(clientName);
  if (!nameValidation.isValid) {
    return err({
      code: 'validation',
      message: nameValidation.error ?? 'El nombre de quien decide es inválido.',
      fieldErrors: {
        clientName: nameValidation.error ?? 'Nombre inválido.',
      },
    });
  }

  const timestamp = now ?? new Date().toISOString();
  const updatedQuote: Quote = Object.freeze({
    ...quote,
    status: decision,
  });

  const ledgerEntry = createLedgerEntry({
    id: ledgerId,
    vehicleId: vehicle.id,
    quoteId: quote.id,
    result: decision,
    decidedBy: nameValidation.trimmedName,
    actor: { kind: 'cliente' },
    at: timestamp,
    amount: quote.amount,
    exactDescription: quote.exactDescription,
  });

  // Reemplazar la cotización modificada en la lista para evaluar la reanudación
  const updatedQuotesList = allVehicleQuotes.map((q) =>
    q.id === quote.id ? updatedQuote : q
  );
  if (!updatedQuotesList.some((q) => q.id === quote.id)) {
    updatedQuotesList.push(updatedQuote);
  }

  const pauseQuotes = vehicle.pauseId
    ? updatedQuotesList.filter(
        (q) => q.vehicleId === vehicle.id && q.pauseId === vehicle.pauseId
      )
    : updatedQuotesList.filter((q) => q.vehicleId === vehicle.id);

  const { updatedVehicle, stateChange } = resolveVehicleResume(
    vehicle,
    pauseQuotes,
    timestamp,
    changeId
  );

  return ok({
    updatedVehicle,
    updatedQuote,
    ledgerEntry,
    stateChange,
  });
}
