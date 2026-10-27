import { describe, it, expect } from 'vitest';
import {
  buildExactDescription,
  createLedgerEntry,
  appendLedgerEntry,
  getLedgerForVehicle,
} from './ledger';
import type { LedgerEntry, Actor } from './types';

describe('ledger domain module (RF-18, RF-19, RF-21, Constitución §3)', () => {
  describe('buildExactDescription (RF-18)', () => {
    it('genera descripción solo con label si la nota está ausente o vacía', () => {
      expect(buildExactDescription('Cambio de balatas delanteras')).toBe(
        'Cambio de balatas delanteras'
      );
      expect(buildExactDescription('Cambio de balatas delanteras', '')).toBe(
        'Cambio de balatas delanteras'
      );
      expect(buildExactDescription('Cambio de balatas delanteras', '   ')).toBe(
        'Cambio de balatas delanteras'
      );
    });

    it('genera descripción compuesta con label y nota con trim si hay nota', () => {
      expect(
        buildExactDescription('Cambio de balatas delanteras', 'Incluye rectificado de discos')
      ).toBe('Cambio de balatas delanteras — Nota: Incluye rectificado de discos');

      expect(
        buildExactDescription('Cambio de balatas', '  Desgaste severo detectado  ')
      ).toBe('Cambio de balatas — Nota: Desgaste severo detectado');
    });
  });

  describe('createLedgerEntry (RF-18, Constitución §3)', () => {
    it('crea una entrada completa e inmutable (Object.freeze) con todos los campos', () => {
      const actor: Actor = { kind: 'cliente' };
      const entry = createLedgerEntry({
        id: 'led-1',
        vehicleId: 'veh-1',
        quoteId: 'q-1',
        result: 'aprobada',
        decidedBy: 'Carlos Mendoza',
        actor,
        at: '2026-10-26T12:00:00.000Z',
        amount: 1850,
        exactDescription: 'Cambio de balatas — Nota: Balatas de cerámica',
      });

      expect(entry).toEqual({
        id: 'led-1',
        vehicleId: 'veh-1',
        quoteId: 'q-1',
        result: 'aprobada',
        decidedBy: 'Carlos Mendoza',
        actor: { kind: 'cliente' },
        at: '2026-10-26T12:00:00.000Z',
        amount: 1850,
        exactDescription: 'Cambio de balatas — Nota: Balatas de cerámica',
      });

      expect(Object.isFrozen(entry)).toBe(true);
    });

    it('genera id y timestamp ISO automáticamente si no se especifican', () => {
      const entry = createLedgerEntry({
        vehicleId: 'veh-1',
        quoteId: 'q-1',
        result: 'rechazada',
        decidedBy: 'Laura Sánchez',
        actor: { kind: 'cliente' },
        amount: 3200,
        exactDescription: 'Bomba de agua',
      });

      expect(entry.id).toBeDefined();
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.at).toBeDefined();
      expect(new Date(entry.at).toISOString()).toBe(entry.at);
      expect(Object.isFrozen(entry)).toBe(true);
    });

    it('soporta los tres resultados válidos: aprobada, rechazada y retirada', () => {
      const entryRetirada = createLedgerEntry({
        vehicleId: 'veh-1',
        quoteId: 'q-1',
        result: 'retirada',
        decidedBy: 'Taller (Mecánico)',
        actor: { kind: 'taller', role: 'mecanico' },
        amount: 500,
        exactDescription: 'Alineación',
      });

      expect(entryRetirada.result).toBe('retirada');
      expect(entryRetirada.decidedBy).toBe('Taller (Mecánico)');
      expect(entryRetirada.actor).toEqual({ kind: 'taller', role: 'mecanico' });
    });
  });

  describe('appendLedgerEntry y solo-agregar (RF-19, RF-21, Constitución §3)', () => {
    it('agrega una nueva entrada a la lista sin mutar el array original', () => {
      const initialLedger: readonly LedgerEntry[] = Object.freeze([]);

      const entry1 = createLedgerEntry({
        id: 'led-1',
        vehicleId: 'veh-1',
        quoteId: 'q-1',
        result: 'aprobada',
        decidedBy: 'Juan Pérez',
        actor: { kind: 'cliente' },
        amount: 1000,
        exactDescription: 'Servicio 1',
      });

      const nextLedger = appendLedgerEntry(initialLedger, entry1);

      expect(initialLedger).toHaveLength(0);
      expect(nextLedger).toHaveLength(1);
      expect(nextLedger[0]).toEqual(entry1);
      expect(Object.isFrozen(nextLedger)).toBe(true);

      const entry2 = createLedgerEntry({
        id: 'led-2',
        vehicleId: 'veh-1',
        quoteId: 'q-2',
        result: 'rechazada',
        decidedBy: 'Juan Pérez',
        actor: { kind: 'cliente' },
        amount: 2000,
        exactDescription: 'Servicio 2',
      });

      const finalLedger = appendLedgerEntry(nextLedger, entry2);

      expect(nextLedger).toHaveLength(1);
      expect(finalLedger).toHaveLength(2);
      expect(finalLedger[1]).toEqual(entry2);
      expect(Object.isFrozen(finalLedger)).toBe(true);
    });

    it('el array retornado por appendLedgerEntry es inmutable (Object.isFrozen)', () => {
      const ledger = appendLedgerEntry(
        [],
        createLedgerEntry({
          vehicleId: 'veh-1',
          quoteId: 'q-1',
          result: 'aprobada',
          decidedBy: 'Cliente',
          actor: { kind: 'cliente' },
          amount: 500,
          exactDescription: 'Desc',
        })
      );

      expect(Object.isFrozen(ledger)).toBe(true);
      expect(() => {
        // @ts-expect-error Intento deliberado de mutación
        ledger.push({} as LedgerEntry);
      }).toThrow();
    });
  });

  describe('getLedgerForVehicle', () => {
    it('filtra correctamente las entradas del vehículo especificado', () => {
      const e1 = createLedgerEntry({
        id: '1',
        vehicleId: 'veh-A',
        quoteId: 'q-1',
        result: 'aprobada',
        decidedBy: 'Cliente A',
        actor: { kind: 'cliente' },
        amount: 100,
        exactDescription: 'Desc 1',
      });

      const e2 = createLedgerEntry({
        id: '2',
        vehicleId: 'veh-B',
        quoteId: 'q-2',
        result: 'rechazada',
        decidedBy: 'Cliente B',
        actor: { kind: 'cliente' },
        amount: 200,
        exactDescription: 'Desc 2',
      });

      const e3 = createLedgerEntry({
        id: '3',
        vehicleId: 'veh-A',
        quoteId: 'q-3',
        result: 'retirada',
        decidedBy: 'Taller (Jefe)',
        actor: { kind: 'taller', role: 'jefe' },
        amount: 300,
        exactDescription: 'Desc 3',
      });

      const all = appendLedgerEntry(appendLedgerEntry(appendLedgerEntry([], e1), e2), e3);

      const vehAEntries = getLedgerForVehicle(all, 'veh-A');
      expect(vehAEntries).toHaveLength(2);
      expect(vehAEntries.map((e) => e.id)).toEqual(['1', '3']);

      const vehBEntries = getLedgerForVehicle(all, 'veh-B');
      expect(vehBEntries).toHaveLength(1);
      expect(vehBEntries[0].id).toBe('2');

      const vehCEntries = getLedgerForVehicle(all, 'veh-C');
      expect(vehCEntries).toHaveLength(0);
    });
  });
});
