/**
 * Reducer principal y acciones de dominio — Taller Mecánico "Don Ramiro"
 * Cumple con la Constitución §3, §5, §6 y specs/001-estado-y-cotizaciones/plan.md (§1, §3).
 */

import type {
  AppData,
  Vehicle,
  VehicleInput,
  QuoteDraft,
  Role,
  Result,
} from './types';
import { ok, err } from './types';
import { generateToken } from './token';
import { validateNewVehicle } from './validation';
import { canCreateVehicle, canEditCatalogPrice } from './permissions';
import { advanceState, correctState, createStateChange } from './states';
import { sendQuote, withdrawQuote, decideQuote } from './quotes';

export interface AppDeps {
  now(): string;
  id(): string;
  token(): string;
}

function defaultDeps(): AppDeps {
  return {
    now: () => new Date().toISOString(),
    id: () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    },
    token: () => generateToken(12),
  };
}

export interface CreateVehicleAction {
  type: 'create_vehicle';
  input: VehicleInput;
  role: Role;
}

export interface AdvanceStateAction {
  type: 'advance_state';
  vehicleId: string;
  role: Role;
}

export interface CorrectStateAction {
  type: 'correct_state';
  vehicleId: string;
  confirmed: boolean;
  role: Role;
}

export interface SendQuoteAction {
  type: 'send_quote';
  vehicleId: string;
  draft: QuoteDraft;
  role: Role;
}

export interface WithdrawQuoteAction {
  type: 'withdraw_quote';
  quoteId: string;
  role: Role;
}

export interface DecideQuoteAction {
  type: 'decide_quote';
  quoteId: string;
  decision: 'aprobada' | 'rechazada';
  name: string;
}

export interface UpdateCatalogPriceAction {
  type: 'update_catalog_price';
  itemId: string;
  newPrice: number;
  role: Role;
}

export type AppAction =
  | CreateVehicleAction
  | AdvanceStateAction
  | CorrectStateAction
  | SendQuoteAction
  | WithdrawQuoteAction
  | DecideQuoteAction
  | UpdateCatalogPriceAction;

export function createVehicleAction(input: VehicleInput, role: Role): CreateVehicleAction {
  return { type: 'create_vehicle', input, role };
}

export function advanceStateAction(vehicleId: string, role: Role): AdvanceStateAction {
  return { type: 'advance_state', vehicleId, role };
}

export function correctStateAction(
  vehicleId: string,
  confirmed: boolean,
  role: Role
): CorrectStateAction {
  return { type: 'correct_state', vehicleId, confirmed, role };
}

export function sendQuoteAction(
  vehicleId: string,
  draft: QuoteDraft,
  role: Role
): SendQuoteAction {
  return { type: 'send_quote', vehicleId, draft, role };
}

export function withdrawQuoteAction(quoteId: string, role: Role): WithdrawQuoteAction {
  return { type: 'withdraw_quote', quoteId, role };
}

export function decideQuoteAction(
  quoteId: string,
  decision: 'aprobada' | 'rechazada',
  name: string
): DecideQuoteAction {
  return { type: 'decide_quote', quoteId, decision, name };
}

export function updateCatalogPriceAction(
  itemId: string,
  newPrice: number,
  role: Role
): UpdateCatalogPriceAction {
  return { type: 'update_catalog_price', itemId, newPrice, role };
}

function freezeAppData(data: AppData): AppData {
  return Object.freeze({
    schemaVersion: 1,
    vehicles: Object.freeze([...data.vehicles]),
    quotes: Object.freeze([...data.quotes]),
    ledger: Object.freeze([...data.ledger]),
    history: Object.freeze([...data.history]),
    catalog: Object.freeze([...data.catalog]),
  }) as unknown as AppData;
}

/**
 * Reducer puro de la aplicación.
 * Aplica una acción de negocio sobre el estado inmutable `AppData`, retornando
 * un nuevo estado congelado o un error de dominio tipado (Result<AppData>).
 */
export function applyAppAction(
  data: AppData,
  action: AppAction,
  deps?: Partial<AppDeps>
): Result<AppData> {
  const fallback = defaultDeps();
  const resolvedDeps: AppDeps = {
    now: deps?.now ?? fallback.now,
    id: deps?.id ?? fallback.id,
    token: deps?.token ?? fallback.token,
  };

  switch (action.type) {
    case 'create_vehicle': {
      if (!canCreateVehicle(action.role)) {
        return err({
          code: 'forbidden',
          message: 'Solo el jefe puede dar de alta vehículos.',
        });
      }

      const validation = validateNewVehicle(action.input, data.vehicles);
      if (!validation.isValid) {
        const isConflict = Boolean(
          validation.errors.plates && /conflicto|ya existe/i.test(validation.errors.plates)
        );
        return err({
          code: isConflict ? 'conflict' : 'validation',
          message: isConflict
            ? validation.errors.plates!
            : 'Faltan campos obligatorios o son inválidos para el alta del vehículo.',
          fieldErrors: validation.errors,
        });
      }

      const timestamp = resolvedDeps.now();
      const newVehicleId = resolvedDeps.id();
      const newToken = resolvedDeps.token();

      const newVehicle: Vehicle = {
        id: newVehicleId,
        token: newToken,
        isSeed: false,
        clientName: validation.data!.clientName,
        phone: validation.data!.phone,
        vehicleDesc: validation.data!.vehicleDesc,
        plates: validation.data!.plates,
        reason: validation.data!.reason,
        state: 'recibido',
        pausedFrom: null,
        pauseId: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const initialStateChange = createStateChange({
        id: resolvedDeps.id(),
        vehicleId: newVehicleId,
        from: null,
        to: 'recibido',
        at: timestamp,
        actor: { kind: 'taller', role: action.role },
      });

      return ok(
        freezeAppData({
          ...data,
          vehicles: [...data.vehicles, newVehicle],
          history: [...data.history, initialStateChange],
        })
      );
    }

    case 'advance_state': {
      const vehicle = data.vehicles.find((v) => v.id === action.vehicleId);
      if (!vehicle) {
        return err({
          code: 'not_found',
          message: `Vehículo con ID '${action.vehicleId}' no encontrado.`,
        });
      }

      const hasPendingQuotes = data.quotes.some(
        (q) => q.vehicleId === vehicle.id && q.status === 'pendiente'
      );

      const advanceRes = advanceState({
        vehicle,
        role: action.role,
        hasPendingQuotes,
        now: resolvedDeps.now(),
        changeId: resolvedDeps.id(),
      });

      if (!advanceRes.ok) {
        return advanceRes;
      }

      const updatedVehicles = data.vehicles.map((v) =>
        v.id === vehicle.id ? advanceRes.data.updatedVehicle : v
      );

      return ok(
        freezeAppData({
          ...data,
          vehicles: updatedVehicles,
          history: [...data.history, advanceRes.data.stateChange],
        })
      );
    }

    case 'correct_state': {
      const vehicle = data.vehicles.find((v) => v.id === action.vehicleId);
      if (!vehicle) {
        return err({
          code: 'not_found',
          message: `Vehículo con ID '${action.vehicleId}' no encontrado.`,
        });
      }

      const hasPendingQuotes = data.quotes.some(
        (q) => q.vehicleId === vehicle.id && q.status === 'pendiente'
      );

      const correctRes = correctState({
        vehicle,
        role: action.role,
        confirmed: action.confirmed,
        hasPendingQuotes,
        now: resolvedDeps.now(),
        changeId: resolvedDeps.id(),
      });

      if (!correctRes.ok) {
        return correctRes;
      }

      const updatedVehicles = data.vehicles.map((v) =>
        v.id === vehicle.id ? correctRes.data.updatedVehicle : v
      );

      return ok(
        freezeAppData({
          ...data,
          vehicles: updatedVehicles,
          history: [...data.history, correctRes.data.stateChange],
        })
      );
    }

    case 'send_quote': {
      const vehicle = data.vehicles.find((v) => v.id === action.vehicleId);
      if (!vehicle) {
        return err({
          code: 'not_found',
          message: `Vehículo con ID '${action.vehicleId}' no encontrado.`,
        });
      }

      const catalogItem = data.catalog.find((c) => c.id === action.draft.catalogItemId);
      if (!catalogItem) {
        return err({
          code: 'not_found',
          message: `Ítem de catálogo con ID '${action.draft.catalogItemId}' no encontrado.`,
        });
      }

      const sendRes = sendQuote({
        vehicle,
        draft: action.draft,
        catalogItem,
        role: action.role,
        now: resolvedDeps.now(),
        quoteId: resolvedDeps.id(),
        pauseId: resolvedDeps.id(),
        changeId: resolvedDeps.id(),
      });

      if (!sendRes.ok) {
        return sendRes;
      }

      const updatedVehicles = data.vehicles.map((v) =>
        v.id === vehicle.id ? sendRes.data.updatedVehicle : v
      );
      const updatedHistory = sendRes.data.stateChange
        ? [...data.history, sendRes.data.stateChange]
        : data.history;

      return ok(
        freezeAppData({
          ...data,
          vehicles: updatedVehicles,
          quotes: [...data.quotes, sendRes.data.quote],
          history: updatedHistory,
        })
      );
    }

    case 'withdraw_quote': {
      const quote = data.quotes.find((q) => q.id === action.quoteId);
      if (!quote) {
        return err({
          code: 'not_found',
          message: `Cotización con ID '${action.quoteId}' no encontrada.`,
        });
      }

      const vehicle = data.vehicles.find((v) => v.id === quote.vehicleId);
      if (!vehicle) {
        return err({
          code: 'not_found',
          message: `Vehículo con ID '${quote.vehicleId}' no encontrado.`,
        });
      }

      const withdrawRes = withdrawQuote({
        quote,
        vehicle,
        role: action.role,
        allVehicleQuotes: data.quotes,
        now: resolvedDeps.now(),
        ledgerId: resolvedDeps.id(),
        changeId: resolvedDeps.id(),
      });

      if (!withdrawRes.ok) {
        return withdrawRes;
      }

      const updatedQuotes = data.quotes.map((q) =>
        q.id === quote.id ? withdrawRes.data.updatedQuote : q
      );
      const updatedVehicles = data.vehicles.map((v) =>
        v.id === vehicle.id ? withdrawRes.data.updatedVehicle : v
      );
      const updatedHistory = withdrawRes.data.stateChange
        ? [...data.history, withdrawRes.data.stateChange]
        : data.history;

      return ok(
        freezeAppData({
          ...data,
          vehicles: updatedVehicles,
          quotes: updatedQuotes,
          ledger: [...data.ledger, withdrawRes.data.ledgerEntry],
          history: updatedHistory,
        })
      );
    }

    case 'decide_quote': {
      const quote = data.quotes.find((q) => q.id === action.quoteId);
      if (!quote) {
        return err({
          code: 'not_found',
          message: `Cotización con ID '${action.quoteId}' no encontrada.`,
        });
      }

      const vehicle = data.vehicles.find((v) => v.id === quote.vehicleId);
      if (!vehicle) {
        return err({
          code: 'not_found',
          message: `Vehículo con ID '${quote.vehicleId}' no encontrado.`,
        });
      }

      const decideRes = decideQuote({
        quote,
        vehicle,
        decision: action.decision,
        clientName: action.name,
        allVehicleQuotes: data.quotes,
        now: resolvedDeps.now(),
        ledgerId: resolvedDeps.id(),
        changeId: resolvedDeps.id(),
      });

      if (!decideRes.ok) {
        return decideRes;
      }

      const updatedQuotes = data.quotes.map((q) =>
        q.id === quote.id ? decideRes.data.updatedQuote : q
      );
      const updatedVehicles = data.vehicles.map((v) =>
        v.id === vehicle.id ? decideRes.data.updatedVehicle : v
      );
      const updatedHistory = decideRes.data.stateChange
        ? [...data.history, decideRes.data.stateChange]
        : data.history;

      return ok(
        freezeAppData({
          ...data,
          vehicles: updatedVehicles,
          quotes: updatedQuotes,
          ledger: [...data.ledger, decideRes.data.ledgerEntry],
          history: updatedHistory,
        })
      );
    }

    case 'update_catalog_price': {
      if (!canEditCatalogPrice(action.role)) {
        return err({
          code: 'forbidden',
          message: 'Solo el jefe puede editar precios del catálogo.',
        });
      }

      if (
        typeof action.newPrice !== 'number' ||
        isNaN(action.newPrice) ||
        action.newPrice < 0
      ) {
        return err({
          code: 'validation',
          message: 'El precio sugerido debe ser un número mayor o igual a cero.',
        });
      }

      const itemExists = data.catalog.some((c) => c.id === action.itemId);
      if (!itemExists) {
        return err({
          code: 'not_found',
          message: `Ítem de catálogo con ID '${action.itemId}' no encontrado.`,
        });
      }

      const updatedCatalog = data.catalog.map((c) =>
        c.id === action.itemId ? { ...c, suggestedPrice: action.newPrice } : c
      );

      return ok(
        freezeAppData({
          ...data,
          catalog: updatedCatalog,
        })
      );
    }

    default: {
      return err({
        code: 'validation',
        message: 'Acción desconocida en el reducer.',
      });
    }
  }
}
