import { describe, it, expect } from 'vitest';
import {
  applyAppAction,
  type AppDeps,
  createVehicleAction,
  advanceStateAction,
  correctStateAction,
  sendQuoteAction,
  withdrawQuoteAction,
  decideQuoteAction,
  updateCatalogPriceAction,
} from './app';
import type { AppData, Vehicle, CatalogItem, Quote } from './types';

describe('App Reducer (src/domain/app.ts)', () => {
  const initialCatalog: CatalogItem[] = [
    { id: 'cat-balatas', label: 'Cambio de balatas delanteras', suggestedPrice: 1500 },
    { id: 'cat-afinacion', label: 'Afinación mayor', suggestedPrice: 2800 },
    { id: 'cat-bateria', label: 'Reemplazo de batería', suggestedPrice: 2200 },
  ];

  const baseVehicle: Vehicle = {
    id: 'veh-1',
    token: 'tok-veh-1-abc',
    isSeed: false,
    clientName: 'Juan Pérez',
    phone: '525511223344',
    vehicleDesc: 'Ford Fiesta 2015 Rojo',
    plates: 'FST2015',
    reason: 'Ruido en motor',
    state: 'recibido',
    pausedFrom: null,
    pauseId: null,
    createdAt: '2026-10-26T09:00:00Z',
    updatedAt: '2026-10-26T09:00:00Z',
  };

  const initialAppData: AppData = {
    schemaVersion: 1,
    vehicles: [baseVehicle],
    quotes: [],
    ledger: [],
    history: [
      {
        id: 'chg-init',
        vehicleId: 'veh-1',
        from: null,
        to: 'recibido',
        at: '2026-10-26T09:00:00Z',
        actor: { kind: 'taller', role: 'jefe' },
      },
    ],
    catalog: initialCatalog,
  };

  const mockDeps: AppDeps = {
    now: () => '2026-10-26T12:00:00Z',
    id: (() => {
      let counter = 0;
      return () => `test-id-${++counter}`;
    })(),
    token: () => 'DetToken123456',
  };

  describe('create_vehicle action (RF-01, RF-02, RF-33, RF-38, RF-39; CA-01, CA-14, CA-17)', () => {
    it('allows Jefe to create a new vehicle in "recibido" with initial history entry', () => {
      const action = createVehicleAction(
        {
          clientName: 'María Ramos',
          phone: '55 9988 7766',
          vehicleDesc: 'Nissan Sentra 2020',
          plates: 'NSS-2020',
          reason: 'Mantenimiento preventivo',
        },
        'jefe'
      );

      const result = applyAppAction(initialAppData, action, mockDeps);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const { data } = result;
      expect(data.vehicles).toHaveLength(2);
      const newVeh = data.vehicles.find((v) => v.plates === 'NSS2020');
      expect(newVeh).toBeDefined();
      expect(newVeh?.id).toMatch(/^test-id-/);
      expect(newVeh?.token).toBe('DetToken123456');
      expect(newVeh?.state).toBe('recibido');
      expect(newVeh?.phone).toBe('525599887766');
      expect(newVeh?.clientName).toBe('María Ramos');
      expect(newVeh?.isSeed).toBe(false);
      expect(newVeh?.createdAt).toBe('2026-10-26T12:00:00Z');

      // History must contain initial state change with actor jefe
      const newHist = data.history.find((h) => h.vehicleId === newVeh?.id);
      expect(newHist).toBeDefined();
      expect(newHist?.from).toBeNull();
      expect(newHist?.to).toBe('recibido');
      expect(newHist?.actor).toEqual({ kind: 'taller', role: 'jefe' });
    });

    it('rejects vehicle creation if role is Mecánico (RF-38, CA-14)', () => {
      const action = createVehicleAction(
        {
          clientName: 'María Ramos',
          phone: '55 9988 7766',
          vehicleDesc: 'Nissan Sentra 2020',
          plates: 'NSS-2020',
        },
        'mecanico'
      );

      const result = applyAppAction(initialAppData, action, mockDeps);
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.error.code).toBe('forbidden');
      expect(result.error.message).toMatch(/jefe.*dar de alta/i);
    });

    it('rejects vehicle creation when validation fails (RF-39, CA-17)', () => {
      const action = createVehicleAction(
        {
          clientName: '',
          phone: '123',
          vehicleDesc: '',
          plates: '',
        },
        'jefe'
      );

      const result = applyAppAction(initialAppData, action, mockDeps);
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.error.code).toBe('validation');
      expect(result.error.fieldErrors).toBeDefined();
      expect(result.error.fieldErrors?.clientName).toBeDefined();
      expect(result.error.fieldErrors?.phone).toBeDefined();
    });

    it('rejects vehicle creation when plates conflict with active vehicle (RF-33, CA-17)', () => {
      const action = createVehicleAction(
        {
          clientName: 'Otro Cliente',
          phone: '55 1234 5678',
          vehicleDesc: 'Otro Coche',
          plates: 'fst-2015', // Same normalized plates as baseVehicle (FST2015)
        },
        'jefe'
      );

      const result = applyAppAction(initialAppData, action, mockDeps);
      expect(result.ok).toBe(false);
      if (result.ok) return;

      expect(result.error.code).toBe('conflict');
      expect(result.error.fieldErrors?.plates).toMatch(/conflicto|ya existe/i);
    });
  });

  describe('advance_state action (RF-04, RF-05, RF-10, RF-22; CA-02, CA-03, CA-05)', () => {
    it('advances vehicle through linear states and appends history', () => {
      const action = advanceStateAction('veh-1', 'mecanico');
      const result = applyAppAction(initialAppData, action, mockDeps);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const { data } = result;
      const updated = data.vehicles.find((v) => v.id === 'veh-1');
      expect(updated?.state).toBe('diagnostico');
      expect(updated?.updatedAt).toBe('2026-10-26T12:00:00Z');

      const lastHist = data.history[data.history.length - 1];
      expect(lastHist.vehicleId).toBe('veh-1');
      expect(lastHist.from).toBe('recibido');
      expect(lastHist.to).toBe('diagnostico');
      expect(lastHist.actor).toEqual({ kind: 'taller', role: 'mecanico' });
    });

    it('returns not_found when vehicleId does not exist', () => {
      const action = advanceStateAction('veh-inexistente', 'jefe');
      const result = applyAppAction(initialAppData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('not_found');
    });

    it('blocks advancement when vehicle has pending quotes (RF-10, CA-05)', () => {
      const dataWithPendingQuote: AppData = {
        ...initialAppData,
        quotes: [
          {
            id: 'quo-1',
            vehicleId: 'veh-1',
            pauseId: 'pau-1',
            catalogItemId: 'cat-balatas',
            label: 'Cambio de balatas',
            note: '',
            amount: 1500,
            exactDescription: 'Cambio de balatas',
            status: 'pendiente',
            sentAt: '2026-10-26T10:00:00Z',
            sentBy: 'mecanico',
          },
        ],
      };

      const action = advanceStateAction('veh-1', 'jefe');
      const result = applyAppAction(dataWithPendingQuote, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('pending_quotes');
    });

    it('rejects advancement when vehicle is in entregado (terminal state)', () => {
      const deliveredData: AppData = {
        ...initialAppData,
        vehicles: [{ ...baseVehicle, state: 'entregado' }],
      };

      const action = advanceStateAction('veh-1', 'mecanico');
      const result = applyAppAction(deliveredData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('invalid_transition');
    });
  });

  describe('correct_state action (RF-05, RF-10; CA-03, CA-05)', () => {
    const diagVehicle: Vehicle = {
      ...baseVehicle,
      state: 'diagnostico',
    };
    const diagAppData: AppData = {
      ...initialAppData,
      vehicles: [diagVehicle],
    };

    it('allows correcting to previous state with confirmed: true', () => {
      const action = correctStateAction('veh-1', true, 'mecanico');
      const result = applyAppAction(diagAppData, action, mockDeps);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const updated = result.data.vehicles.find((v) => v.id === 'veh-1');
      expect(updated?.state).toBe('recibido');

      const lastHist = result.data.history[result.data.history.length - 1];
      expect(lastHist.from).toBe('diagnostico');
      expect(lastHist.to).toBe('recibido');
    });

    it('rejects correction if confirmed is false', () => {
      const action = correctStateAction('veh-1', false, 'mecanico');
      const result = applyAppAction(diagAppData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('invalid_transition');
    });

    it('rejects correction from "recibido" (initial state)', () => {
      const action = correctStateAction('veh-1', true, 'mecanico');
      const result = applyAppAction(initialAppData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('invalid_transition');
    });
  });

  describe('send_quote action (RF-06, RF-09, RF-20; CA-04, CA-06)', () => {
    const diagVehicle: Vehicle = {
      ...baseVehicle,
      state: 'diagnostico',
    };
    const diagAppData: AppData = {
      ...initialAppData,
      vehicles: [diagVehicle],
    };

    it('sends quote, pauses vehicle in "espera_aprobacion" and records system transition', () => {
      const action = sendQuoteAction(
        'veh-1',
        {
          catalogItemId: 'cat-balatas',
          amount: 1500,
          note: 'Desgaste 80%',
        },
        'mecanico'
      );

      const result = applyAppAction(diagAppData, action, mockDeps);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const { data } = result;
      const updatedVeh = data.vehicles.find((v) => v.id === 'veh-1');
      expect(updatedVeh?.state).toBe('espera_aprobacion');
      expect(updatedVeh?.pausedFrom).toBe('diagnostico');
      expect(updatedVeh?.pauseId).toBeDefined();

      expect(data.quotes).toHaveLength(1);
      const quote = data.quotes[0];
      expect(quote.vehicleId).toBe('veh-1');
      expect(quote.amount).toBe(1500);
      expect(quote.exactDescription).toBe('Cambio de balatas delanteras — Nota: Desgaste 80%');
      expect(quote.status).toBe('pendiente');

      // System state change recorded
      const sysChange = data.history.find(
        (h) => h.vehicleId === 'veh-1' && h.to === 'espera_aprobacion'
      );
      expect(sysChange).toBeDefined();
      expect(sysChange?.actor).toEqual({ kind: 'sistema' });
    });

    it('rejects sending quote from "recibido" or "listo"', () => {
      const action = sendQuoteAction(
        'veh-1',
        { catalogItemId: 'cat-balatas', amount: 1500, note: '' },
        'mecanico'
      );
      const result = applyAppAction(initialAppData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('invalid_transition');
    });

    it('rejects custom amount if role is Mecánico (RF-07, RF-38)', () => {
      const action = sendQuoteAction(
        'veh-1',
        { catalogItemId: 'cat-balatas', amount: 9999, note: '' }, // suggested is 1500
        'mecanico'
      );
      const result = applyAppAction(diagAppData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('forbidden');
    });

    it('allows custom amount if role is Jefe (RF-07)', () => {
      const action = sendQuoteAction(
        'veh-1',
        { catalogItemId: 'cat-balatas', amount: 1800, note: '' },
        'jefe'
      );
      const result = applyAppAction(diagAppData, action, mockDeps);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.data.quotes[0].amount).toBe(1800);
    });

    it('returns not_found if catalogItemId is invalid', () => {
      const action = sendQuoteAction(
        'veh-1',
        { catalogItemId: 'cat-inexistente', amount: 1000, note: '' },
        'jefe'
      );
      const result = applyAppAction(diagAppData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('not_found');
    });
  });

  describe('withdraw_quote action (RF-31, RF-11; CA-18)', () => {
    const pausedVehicle: Vehicle = {
      ...baseVehicle,
      state: 'espera_aprobacion',
      pausedFrom: 'diagnostico',
      pauseId: 'pau-1',
    };

    const pendingQuote: Quote = {
      id: 'quo-1',
      vehicleId: 'veh-1',
      pauseId: 'pau-1',
      catalogItemId: 'cat-balatas',
      label: 'Cambio de balatas',
      note: '',
      amount: 1500,
      exactDescription: 'Cambio de balatas',
      status: 'pendiente',
      sentAt: '2026-10-26T10:00:00Z',
      sentBy: 'mecanico',
    };

    const pausedAppData: AppData = {
      ...initialAppData,
      vehicles: [pausedVehicle],
      quotes: [pendingQuote],
    };

    it('withdraws quote, appends to ledger, and resumes vehicle to pausedFrom', () => {
      const action = withdrawQuoteAction('quo-1', 'mecanico');
      const result = applyAppAction(pausedAppData, action, mockDeps);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const { data } = result;
      const quote = data.quotes.find((q) => q.id === 'quo-1');
      expect(quote?.status).toBe('retirada');

      expect(data.ledger).toHaveLength(1);
      const entry = data.ledger[0];
      expect(entry.result).toBe('retirada');
      expect(entry.decidedBy).toBe('Taller (Mecánico)');
      expect(entry.actor).toEqual({ kind: 'taller', role: 'mecanico' });

      // Vehicle returned to pausedFrom ('diagnostico')
      const updatedVeh = data.vehicles.find((v) => v.id === 'veh-1');
      expect(updatedVeh?.state).toBe('diagnostico');
      expect(updatedVeh?.pausedFrom).toBeNull();
      expect(updatedVeh?.pauseId).toBeNull();
    });

    it('rejects withdrawal if quote is already resolved (RF-17)', () => {
      const dataWithResolvedQuote: AppData = {
        ...pausedAppData,
        quotes: [{ ...pendingQuote, status: 'aprobada' }],
      };

      const action = withdrawQuoteAction('quo-1', 'mecanico');
      const result = applyAppAction(dataWithResolvedQuote, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('already_resolved');
    });
  });

  describe('decide_quote action (RF-15, RF-16, RF-17, RF-18; CA-06, CA-09, CA-20, CA-21)', () => {
    const pausedVehicle: Vehicle = {
      ...baseVehicle,
      state: 'espera_aprobacion',
      pausedFrom: 'diagnostico',
      pauseId: 'pau-1',
    };

    const pendingQuote: Quote = {
      id: 'quo-1',
      vehicleId: 'veh-1',
      pauseId: 'pau-1',
      catalogItemId: 'cat-balatas',
      label: 'Cambio de balatas',
      note: 'Desgaste 90%',
      amount: 1500,
      exactDescription: 'Cambio de balatas — Nota: Desgaste 90%',
      status: 'pendiente',
      sentAt: '2026-10-26T10:00:00Z',
      sentBy: 'mecanico',
    };

    const pausedAppData: AppData = {
      ...initialAppData,
      vehicles: [pausedVehicle],
      quotes: [pendingQuote],
    };

    it('approves quote, creates ledger entry and resumes vehicle to "reparacion"', () => {
      const action = decideQuoteAction('quo-1', 'aprobada', 'Juan Pérez');
      const result = applyAppAction(pausedAppData, action, mockDeps);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const { data } = result;
      const quote = data.quotes.find((q) => q.id === 'quo-1');
      expect(quote?.status).toBe('aprobada');

      expect(data.ledger).toHaveLength(1);
      const entry = data.ledger[0];
      expect(entry.result).toBe('aprobada');
      expect(entry.decidedBy).toBe('Juan Pérez');
      expect(entry.exactDescription).toBe('Cambio de balatas — Nota: Desgaste 90%');
      expect(entry.amount).toBe(1500);
      expect(entry.actor).toEqual({ kind: 'cliente' });

      // Resumed to 'reparacion'
      const updatedVeh = data.vehicles.find((v) => v.id === 'veh-1');
      expect(updatedVeh?.state).toBe('reparacion');
      expect(updatedVeh?.pausedFrom).toBeNull();
      expect(updatedVeh?.pauseId).toBeNull();
    });

    it('rejects decision if quote is already resolved (RF-17, CA-21)', () => {
      const resolvedData: AppData = {
        ...pausedAppData,
        quotes: [{ ...pendingQuote, status: 'rechazada' }],
      };

      const action = decideQuoteAction('quo-1', 'aprobada', 'Juan Pérez');
      const result = applyAppAction(resolvedData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('already_resolved');
    });

    it('validates client name length and non-emptiness (RF-16, CA-20)', () => {
      const action = decideQuoteAction('quo-1', 'aprobada', '   ');
      const result = applyAppAction(pausedAppData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('validation');
    });
  });

  describe('update_catalog_price action (RF-07, RF-38; CA-14)', () => {
    it('allows Jefe to update catalog suggestedPrice', () => {
      const action = updateCatalogPriceAction('cat-balatas', 1650, 'jefe');
      const result = applyAppAction(initialAppData, action, mockDeps);

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const item = result.data.catalog.find((c) => c.id === 'cat-balatas');
      expect(item?.suggestedPrice).toBe(1650);
    });

    it('rejects Mecánico from updating catalog price (RF-38, CA-14)', () => {
      const action = updateCatalogPriceAction('cat-balatas', 1650, 'mecanico');
      const result = applyAppAction(initialAppData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('forbidden');
    });

    it('rejects invalid or negative prices', () => {
      const action = updateCatalogPriceAction('cat-balatas', -50, 'jefe');
      const result = applyAppAction(initialAppData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('validation');
    });

    it('returns not_found for non-existent catalog item', () => {
      const action = updateCatalogPriceAction('cat-fantasma', 1000, 'jefe');
      const result = applyAppAction(initialAppData, action, mockDeps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('not_found');
    });
  });

  describe('Reducer Purity & Immutability (Constitución §5, Plan §1)', () => {
    it('does not mutate input AppData when an action is applied', () => {
      const frozenInput: AppData = Object.freeze({
        schemaVersion: 1,
        vehicles: Object.freeze([Object.freeze({ ...baseVehicle })]) as unknown as Vehicle[],
        quotes: Object.freeze([]) as unknown as Quote[],
        ledger: Object.freeze([]) as unknown as AppData['ledger'],
        history: Object.freeze([]) as unknown as AppData['history'],
        catalog: Object.freeze(initialCatalog.map((c) => Object.freeze({ ...c }))) as unknown as CatalogItem[],
      });

      const action = advanceStateAction('veh-1', 'mecanico');
      const result = applyAppAction(frozenInput, action, mockDeps);

      expect(result.ok).toBe(true);
      // Original frozen input must remain untouched
      expect(frozenInput.vehicles[0].state).toBe('recibido');
      expect(frozenInput.history).toHaveLength(0);
    });

    it('returns frozen or immutable AppData result', () => {
      const action = advanceStateAction('veh-1', 'mecanico');
      const result = applyAppAction(initialAppData, action, mockDeps);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(Object.isFrozen(result.data)).toBe(true);
    });
  });
});
