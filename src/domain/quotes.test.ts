import { describe, it, expect } from 'vitest';
import {
  createQuoteDraft,
  sendQuote,
  withdrawQuote,
  decideQuote,
  resolveVehicleResume,
} from './quotes';
import type { Vehicle, CatalogItem, Quote, QuoteDraft } from './types';

function createMockVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'veh-123',
    token: 'token-abc12345',
    isSeed: false,
    clientName: 'Pedro Infante',
    phone: '525512345678',
    vehicleDesc: 'Nissan Tsuru 2012',
    plates: 'ABC1234',
    state: 'diagnostico',
    pausedFrom: null,
    pauseId: null,
    createdAt: '2026-10-26T10:00:00.000Z',
    updatedAt: '2026-10-26T10:00:00.000Z',
    ...overrides,
  };
}

const mockCatalogBalatas: CatalogItem = {
  id: 'cat-balatas',
  label: 'Cambio de balatas delanteras',
  suggestedPrice: 1200,
};

const mockCatalogAmortiguador: CatalogItem = {
  id: 'cat-amortiguador',
  label: 'Cambio de amortiguadores',
  suggestedPrice: 3500,
};

describe('quotes domain module (RF-06, RF-09, RF-11, RF-17, RF-18, RF-20, RF-31; CA-04, CA-06, CA-09, CA-10, CA-18)', () => {
  describe('createQuoteDraft (RF-06, RF-07)', () => {
    it('crea un borrador con el precio sugerido del catálogo por defecto', () => {
      const res = createQuoteDraft(mockCatalogBalatas);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data).toEqual({
        catalogItemId: 'cat-balatas',
        amount: 1200,
        note: '',
      });
    });

    it('permite al rol Jefe modificar el precio respecto al sugerido (RF-07)', () => {
      const res = createQuoteDraft(mockCatalogBalatas, {
        amount: 1500,
        note: 'Balatas cerámicas de alto rendimiento',
        role: 'jefe',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data).toEqual({
        catalogItemId: 'cat-balatas',
        amount: 1500,
        note: 'Balatas cerámicas de alto rendimiento',
      });
    });

    it('prohíbe al rol Mecánico alterar el precio sugerido del catálogo (RF-07, RF-38)', () => {
      const res = createQuoteDraft(mockCatalogBalatas, {
        amount: 1500,
        role: 'mecanico',
      });

      expect(res.ok).toBe(false);
      if (res.ok) return;

      expect(res.error.code).toBe('forbidden');
      expect(res.error.message).toContain('Solo el jefe puede variar el monto');
    });

    it('permite al Mecánico conservar el precio sugerido original con nota', () => {
      const res = createQuoteDraft(mockCatalogBalatas, {
        amount: 1200,
        note: 'Revisar discos',
        role: 'mecanico',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.amount).toBe(1200);
      expect(res.data.note).toBe('Revisar discos');
    });

    it('rechaza montos negativos con error de validación', () => {
      const res = createQuoteDraft(mockCatalogBalatas, {
        amount: -50,
        role: 'jefe',
      });

      expect(res.ok).toBe(false);
      if (res.ok) return;

      expect(res.error.code).toBe('validation');
    });
  });

  describe('sendQuote (RF-06, RF-09, RF-20; CA-04, CA-06)', () => {
    it('permite enviar cotización desde diagnostico, entra en espera_aprobacion y guarda pausedFrom (RF-06, RF-09, CA-04)', () => {
      const vehicle = createMockVehicle({ state: 'diagnostico' });
      const draft: QuoteDraft = {
        catalogItemId: 'cat-balatas',
        amount: 1200,
        note: 'Urgente',
      };

      const res = sendQuote({
        vehicle,
        draft,
        catalogItem: mockCatalogBalatas,
        role: 'mecanico',
        now: '2026-10-26T11:00:00.000Z',
        quoteId: 'quote-1',
        pauseId: 'pause-1',
        changeId: 'chg-1',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const { updatedVehicle, quote, stateChange } = res.data;

      // Vehículo en pausa
      expect(updatedVehicle.state).toBe('espera_aprobacion');
      expect(updatedVehicle.pausedFrom).toBe('diagnostico');
      expect(updatedVehicle.pauseId).toBe('pause-1');
      expect(updatedVehicle.updatedAt).toBe('2026-10-26T11:00:00.000Z');

      // Cotización inmutable
      expect(quote).toEqual({
        id: 'quote-1',
        vehicleId: 'veh-123',
        pauseId: 'pause-1',
        catalogItemId: 'cat-balatas',
        label: 'Cambio de balatas delanteras',
        note: 'Urgente',
        amount: 1200,
        exactDescription: 'Cambio de balatas delanteras — Nota: Urgente',
        status: 'pendiente',
        sentAt: '2026-10-26T11:00:00.000Z',
        sentBy: 'mecanico',
      });
      expect(Object.isFrozen(quote)).toBe(true);

      // Cambio de estado del sistema
      expect(stateChange).toBeDefined();
      expect(stateChange).toEqual({
        id: 'chg-1',
        vehicleId: 'veh-123',
        from: 'diagnostico',
        to: 'espera_aprobacion',
        at: '2026-10-26T11:00:00.000Z',
        actor: { kind: 'sistema' },
      });
    });

    it('permite enviar cotización desde reparacion guardando pausedFrom = reparacion', () => {
      const vehicle = createMockVehicle({ state: 'reparacion' });
      const draft: QuoteDraft = {
        catalogItemId: 'cat-amortiguador',
        amount: 3500,
        note: '',
      };

      const res = sendQuote({
        vehicle,
        draft,
        catalogItem: mockCatalogAmortiguador,
        role: 'jefe',
        now: '2026-10-26T11:30:00.000Z',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.updatedVehicle.state).toBe('espera_aprobacion');
      expect(res.data.updatedVehicle.pausedFrom).toBe('reparacion');
      expect(res.data.quote.exactDescription).toBe('Cambio de amortiguadores');
    });

    it('al enviar una segunda cotización durante la misma pausa NO sobrescribe pausedFrom ni genera nuevo StateChange (S-10, CA-06)', () => {
      const vehicleInPause = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'diagnostico',
        pauseId: 'pause-existing',
      });

      const draft: QuoteDraft = {
        catalogItemId: 'cat-amortiguador',
        amount: 3500,
        note: '',
      };

      const res = sendQuote({
        vehicle: vehicleInPause,
        draft,
        catalogItem: mockCatalogAmortiguador,
        role: 'mecanico',
        now: '2026-10-26T12:00:00.000Z',
        quoteId: 'quote-2',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const { updatedVehicle, quote, stateChange } = res.data;

      // El pausedFrom se mantiene como 'diagnostico' y no se sobrescribe
      expect(updatedVehicle.state).toBe('espera_aprobacion');
      expect(updatedVehicle.pausedFrom).toBe('diagnostico');
      expect(updatedVehicle.pauseId).toBe('pause-existing');

      expect(quote.pauseId).toBe('pause-existing');
      expect(quote.id).toBe('quote-2');

      // No hay nuevo cambio de estado porque ya estaba en espera_aprobacion
      expect(stateChange).toBeUndefined();
    });

    it('rechaza enviar cotizaciones en estados no permitidos: recibido, listo, entregado (RF-06, CA-04)', () => {
      const draft: QuoteDraft = {
        catalogItemId: 'cat-balatas',
        amount: 1200,
        note: '',
      };

      for (const invalidState of ['recibido', 'listo', 'entregado'] as const) {
        const vehicle = createMockVehicle({ state: invalidState });
        const res = sendQuote({
          vehicle,
          draft,
          catalogItem: mockCatalogBalatas,
          role: 'mecanico',
        });

        expect(res.ok).toBe(false);
        if (res.ok) continue;
        expect(res.error.code).toBe('invalid_transition');
      }
    });

    it('rechaza el envío si el rol Mecánico intenta enviar un monto modificado', () => {
      const vehicle = createMockVehicle({ state: 'diagnostico' });
      const draft: QuoteDraft = {
        catalogItemId: 'cat-balatas',
        amount: 9999, // monto alterado
        note: '',
      };

      const res = sendQuote({
        vehicle,
        draft,
        catalogItem: mockCatalogBalatas,
        role: 'mecanico',
      });

      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe('forbidden');
    });
  });

  describe('withdrawQuote (RF-31, RF-11, CA-18)', () => {
    const basePendingQuote: Quote = Object.freeze({
      id: 'quote-w1',
      vehicleId: 'veh-123',
      pauseId: 'pause-1',
      catalogItemId: 'cat-balatas',
      label: 'Cambio de balatas',
      note: 'Desgaste',
      amount: 1200,
      exactDescription: 'Cambio de balatas — Nota: Desgaste',
      status: 'pendiente',
      sentAt: '2026-10-26T10:00:00.000Z',
      sentBy: 'mecanico',
    });

    it('permite al taller retirar una cotización pendiente y genera entrada en ledger (RF-31, CA-18)', () => {
      const vehicle = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'diagnostico',
        pauseId: 'pause-1',
      });

      const res = withdrawQuote({
        quote: basePendingQuote,
        vehicle,
        role: 'mecanico',
        allVehicleQuotes: [basePendingQuote],
        now: '2026-10-26T11:00:00.000Z',
        ledgerId: 'led-w1',
        changeId: 'chg-resume',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const { updatedQuote, ledgerEntry, updatedVehicle, stateChange } = res.data;

      // Cotización actualizada a 'retirada'
      expect(updatedQuote.status).toBe('retirada');
      expect(Object.isFrozen(updatedQuote)).toBe(true);

      // Ledger con registro de retiro por el taller
      expect(ledgerEntry).toEqual({
        id: 'led-w1',
        vehicleId: 'veh-123',
        quoteId: 'quote-w1',
        result: 'retirada',
        decidedBy: 'Taller (Mecánico)',
        actor: { kind: 'taller', role: 'mecanico' },
        at: '2026-10-26T11:00:00.000Z',
        amount: 1200,
        exactDescription: 'Cambio de balatas — Nota: Desgaste',
      });
      expect(Object.isFrozen(ledgerEntry)).toBe(true);

      // Reanudación: como era la única cotización y fue retirada, vuelve a pausedFrom (diagnostico)
      expect(updatedVehicle.state).toBe('diagnostico');
      expect(updatedVehicle.pausedFrom).toBeNull();
      expect(updatedVehicle.pauseId).toBeNull();

      expect(stateChange).toBeDefined();
      expect(stateChange).toEqual({
        id: 'chg-resume',
        vehicleId: 'veh-123',
        from: 'espera_aprobacion',
        to: 'diagnostico',
        at: '2026-10-26T11:00:00.000Z',
        actor: { kind: 'sistema' },
      });
    });

    it('registra decidedBy como "Taller (Jefe)" si quien retira es el rol jefe', () => {
      const vehicle = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'diagnostico',
        pauseId: 'pause-1',
      });

      const res = withdrawQuote({
        quote: basePendingQuote,
        vehicle,
        role: 'jefe',
        allVehicleQuotes: [basePendingQuote],
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.ledgerEntry.decidedBy).toBe('Taller (Jefe)');
      expect(res.data.ledgerEntry.actor).toEqual({ kind: 'taller', role: 'jefe' });
    });

    it('rechaza retirar una cotización que ya no está pendiente (RF-17, CA-21)', () => {
      const alreadyResolvedQuote: Quote = {
        ...basePendingQuote,
        status: 'aprobada',
      };
      const vehicle = createMockVehicle({ state: 'reparacion' });

      const res = withdrawQuote({
        quote: alreadyResolvedQuote,
        vehicle,
        role: 'mecanico',
        allVehicleQuotes: [alreadyResolvedQuote],
      });

      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.code).toBe('already_resolved');
    });

    it('mantiene el vehículo en pausa si aún queda otra cotización pendiente', () => {
      const quote2: Quote = {
        ...basePendingQuote,
        id: 'quote-w2',
        status: 'pendiente',
      };
      const vehicle = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'diagnostico',
        pauseId: 'pause-1',
      });

      const res = withdrawQuote({
        quote: basePendingQuote,
        vehicle,
        role: 'mecanico',
        allVehicleQuotes: [basePendingQuote, quote2],
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      // Vehículo sigue en espera_aprobacion porque quote2 sigue pendiente
      expect(res.data.updatedVehicle.state).toBe('espera_aprobacion');
      expect(res.data.updatedVehicle.pausedFrom).toBe('diagnostico');
      expect(res.data.stateChange).toBeUndefined();
    });
  });

  describe('decideQuote (RF-15, RF-16, RF-17, RF-18, CA-09, CA-10, CA-20, CA-21)', () => {
    const pendingQuote: Quote = Object.freeze({
      id: 'quote-d1',
      vehicleId: 'veh-123',
      pauseId: 'pause-1',
      catalogItemId: 'cat-balatas',
      label: 'Cambio de balatas',
      note: 'Balatas cerámicas',
      amount: 1500,
      exactDescription: 'Cambio de balatas — Nota: Balatas cerámicas',
      status: 'pendiente',
      sentAt: '2026-10-26T10:00:00.000Z',
      sentBy: 'jefe',
    });

    it('cliente aprueba cotización pendiente con nombre válido y genera entrada en ledger (RF-15, RF-16, RF-18, CA-09)', () => {
      const vehicle = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'diagnostico',
        pauseId: 'pause-1',
      });

      const res = decideQuote({
        quote: pendingQuote,
        vehicle,
        decision: 'aprobada',
        clientName: '  Pedro Infante  ',
        allVehicleQuotes: [pendingQuote],
        now: '2026-10-26T12:00:00.000Z',
        ledgerId: 'led-1',
        changeId: 'chg-resume',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const { updatedQuote, ledgerEntry, updatedVehicle, stateChange } = res.data;

      expect(updatedQuote.status).toBe('aprobada');
      expect(Object.isFrozen(updatedQuote)).toBe(true);

      expect(ledgerEntry).toEqual({
        id: 'led-1',
        vehicleId: 'veh-123',
        quoteId: 'quote-d1',
        result: 'aprobada',
        decidedBy: 'Pedro Infante',
        actor: { kind: 'cliente' },
        at: '2026-10-26T12:00:00.000Z',
        amount: 1500,
        exactDescription: 'Cambio de balatas — Nota: Balatas cerámicas',
      });
      expect(Object.isFrozen(ledgerEntry)).toBe(true);

      // Como se aprobó, pasa a 'reparacion'
      expect(updatedVehicle.state).toBe('reparacion');
      expect(updatedVehicle.pausedFrom).toBeNull();
      expect(updatedVehicle.pauseId).toBeNull();

      expect(stateChange).toBeDefined();
      expect(stateChange).toEqual({
        id: 'chg-resume',
        vehicleId: 'veh-123',
        from: 'espera_aprobacion',
        to: 'reparacion',
        at: '2026-10-26T12:00:00.000Z',
        actor: { kind: 'sistema' },
      });
    });

    it('cliente rechaza cotización pendiente y si no hay más cotizaciones vuelve a pausedFrom (RF-11, CA-06)', () => {
      const vehicle = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'diagnostico',
        pauseId: 'pause-1',
      });

      const res = decideQuote({
        quote: pendingQuote,
        vehicle,
        decision: 'rechazada',
        clientName: 'Pedro Infante',
        allVehicleQuotes: [pendingQuote],
        now: '2026-10-26T12:00:00.000Z',
      });

      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.data.updatedQuote.status).toBe('rechazada');
      expect(res.data.ledgerEntry.result).toBe('rechazada');
      expect(res.data.updatedVehicle.state).toBe('diagnostico');
      expect(res.data.updatedVehicle.pausedFrom).toBeNull();
      expect(res.data.updatedVehicle.pauseId).toBeNull();
      expect(res.data.stateChange?.to).toBe('diagnostico');
    });

    it('valida el nombre con validateDecisionName (RF-16, CA-20)', () => {
      const vehicle = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'diagnostico',
        pauseId: 'pause-1',
      });

      // Nombre vacío
      const resVacio = decideQuote({
        quote: pendingQuote,
        vehicle,
        decision: 'aprobada',
        clientName: '   ',
        allVehicleQuotes: [pendingQuote],
      });

      expect(resVacio.ok).toBe(false);
      if (!resVacio.ok) {
        expect(resVacio.error.code).toBe('validation');
        expect(resVacio.error.fieldErrors?.clientName).toBeDefined();
      }

      // Nombre de 1 solo carácter (<2 chars)
      const resCorto = decideQuote({
        quote: pendingQuote,
        vehicle,
        decision: 'aprobada',
        clientName: 'A',
        allVehicleQuotes: [pendingQuote],
      });

      expect(resCorto.ok).toBe(false);
      if (!resCorto.ok) {
        expect(resCorto.error.code).toBe('validation');
      }
    });

    it('rechaza con error already_resolved si la cotización no está en estado pendiente (RF-17, CA-21)', () => {
      const resolvedQuote: Quote = {
        ...pendingQuote,
        status: 'rechazada',
      };
      const vehicle = createMockVehicle({ state: 'diagnostico' });

      const res = decideQuote({
        quote: resolvedQuote,
        vehicle,
        decision: 'aprobada',
        clientName: 'Pedro Infante',
        allVehicleQuotes: [resolvedQuote],
      });

      expect(res.ok).toBe(false);
      if (res.ok) return;

      expect(res.error.code).toBe('already_resolved');
      expect(res.error.message).toContain('ya ha sido resuelta');
    });
  });

  describe('Lógica combinada de reanudación automática (RF-11, CA-06)', () => {
    it('Caso CA-06: 2 cotizaciones desde diagnostico: 1 aprobada y 1 rechazada -> pasa a reparacion', () => {
      const q1: Quote = {
        id: 'q1',
        vehicleId: 'veh-1',
        pauseId: 'p-1',
        catalogItemId: 'c1',
        label: 'Item 1',
        note: '',
        amount: 500,
        exactDescription: 'Item 1',
        status: 'aprobada',
        sentAt: '2026-10-26T10:00:00.000Z',
        sentBy: 'mecanico',
      };
      const q2: Quote = {
        id: 'q2',
        vehicleId: 'veh-1',
        pauseId: 'p-1',
        catalogItemId: 'c2',
        label: 'Item 2',
        note: '',
        amount: 700,
        exactDescription: 'Item 2',
        status: 'rechazada',
        sentAt: '2026-10-26T10:05:00.000Z',
        sentBy: 'mecanico',
      };

      const vehicle = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'diagnostico',
        pauseId: 'p-1',
      });

      const { updatedVehicle, stateChange } = resolveVehicleResume(vehicle, [q1, q2]);

      expect(updatedVehicle.state).toBe('reparacion');
      expect(updatedVehicle.pausedFrom).toBeNull();
      expect(updatedVehicle.pauseId).toBeNull();
      expect(stateChange?.to).toBe('reparacion');
      expect(stateChange?.actor).toEqual({ kind: 'sistema' });
    });

    it('Caso CA-06: 2 cotizaciones desde diagnostico: ambas rechazadas o retiradas -> vuelve a diagnostico', () => {
      const q1: Quote = {
        id: 'q1',
        vehicleId: 'veh-1',
        pauseId: 'p-1',
        catalogItemId: 'c1',
        label: 'Item 1',
        note: '',
        amount: 500,
        exactDescription: 'Item 1',
        status: 'rechazada',
        sentAt: '2026-10-26T10:00:00.000Z',
        sentBy: 'mecanico',
      };
      const q2: Quote = {
        id: 'q2',
        vehicleId: 'veh-1',
        pauseId: 'p-1',
        catalogItemId: 'c2',
        label: 'Item 2',
        note: '',
        amount: 700,
        exactDescription: 'Item 2',
        status: 'retirada',
        sentAt: '2026-10-26T10:05:00.000Z',
        sentBy: 'mecanico',
      };

      const vehicle = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'diagnostico',
        pauseId: 'p-1',
      });

      const { updatedVehicle, stateChange } = resolveVehicleResume(vehicle, [q1, q2]);

      expect(updatedVehicle.state).toBe('diagnostico');
      expect(updatedVehicle.pausedFrom).toBeNull();
      expect(updatedVehicle.pauseId).toBeNull();
      expect(stateChange?.to).toBe('diagnostico');
    });

    it('Caso: 2 cotizaciones desde reparacion: ambas rechazadas -> vuelve a reparacion', () => {
      const q1: Quote = {
        id: 'q1',
        vehicleId: 'veh-1',
        pauseId: 'p-1',
        catalogItemId: 'c1',
        label: 'Item 1',
        note: '',
        amount: 500,
        exactDescription: 'Item 1',
        status: 'rechazada',
        sentAt: '2026-10-26T10:00:00.000Z',
        sentBy: 'mecanico',
      };
      const q2: Quote = {
        id: 'q2',
        vehicleId: 'veh-1',
        pauseId: 'p-1',
        catalogItemId: 'c2',
        label: 'Item 2',
        note: '',
        amount: 700,
        exactDescription: 'Item 2',
        status: 'rechazada',
        sentAt: '2026-10-26T10:05:00.000Z',
        sentBy: 'mecanico',
      };

      const vehicle = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'reparacion',
        pauseId: 'p-1',
      });

      const { updatedVehicle, stateChange } = resolveVehicleResume(vehicle, [q1, q2]);

      expect(updatedVehicle.state).toBe('reparacion');
      expect(updatedVehicle.pausedFrom).toBeNull();
      expect(updatedVehicle.pauseId).toBeNull();
      expect(stateChange?.to).toBe('reparacion');
    });

    it('no reanuda si todavía existe al menos una cotización pendiente para el vehículo', () => {
      const q1: Quote = {
        id: 'q1',
        vehicleId: 'veh-1',
        pauseId: 'p-1',
        catalogItemId: 'c1',
        label: 'Item 1',
        note: '',
        amount: 500,
        exactDescription: 'Item 1',
        status: 'aprobada',
        sentAt: '2026-10-26T10:00:00.000Z',
        sentBy: 'mecanico',
      };
      const q2Pending: Quote = {
        id: 'q2',
        vehicleId: 'veh-1',
        pauseId: 'p-1',
        catalogItemId: 'c2',
        label: 'Item 2',
        note: '',
        amount: 700,
        exactDescription: 'Item 2',
        status: 'pendiente',
        sentAt: '2026-10-26T10:05:00.000Z',
        sentBy: 'mecanico',
      };

      const vehicle = createMockVehicle({
        state: 'espera_aprobacion',
        pausedFrom: 'diagnostico',
        pauseId: 'p-1',
      });

      const { updatedVehicle, stateChange } = resolveVehicleResume(vehicle, [q1, q2Pending]);

      expect(updatedVehicle.state).toBe('espera_aprobacion');
      expect(updatedVehicle.pausedFrom).toBe('diagnostico');
      expect(updatedVehicle.pauseId).toBe('p-1');
      expect(stateChange).toBeUndefined();
    });
  });
});
