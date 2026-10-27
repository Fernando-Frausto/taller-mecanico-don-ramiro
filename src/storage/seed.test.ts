import { describe, it, expect } from 'vitest';
import { createSeed } from './seed';
import { isAppData } from './schema';
import type { VehicleState } from '../domain/types';

describe('Seed data (createSeed)', () => {
  it('genera un objeto AppData válido según el esquema', () => {
    const seed = createSeed();
    expect(isAppData(seed)).toBe(true);
    expect(seed.schemaVersion).toBe(1);
  });

  it('genera exactamente 6 vehículos, todos marcados con isSeed: true', () => {
    const seed = createSeed();
    expect(seed.vehicles).toHaveLength(6);
    for (const v of seed.vehicles) {
      expect(v.isSeed).toBe(true);
      expect(typeof v.id).toBe('string');
      expect(v.id.length).toBeGreaterThan(0);
      expect(v.token).toHaveLength(12);
      expect(v.token).toMatch(/^[A-Za-z0-9]{12}$/);
    }
  });

  it('los tokens e IDs son deterministas entre llamadas sucesivas', () => {
    const seed1 = createSeed('2026-10-26T12:00:00.000Z');
    const seed2 = createSeed('2026-10-26T12:00:00.000Z');

    expect(seed1.vehicles.map((v) => v.id)).toEqual(seed2.vehicles.map((v) => v.id));
    expect(seed1.vehicles.map((v) => v.token)).toEqual(seed2.vehicles.map((v) => v.token));
  });

  it('todos los tokens de los vehículos semilla son únicos entre sí', () => {
    const seed = createSeed();
    const tokens = seed.vehicles.map((v) => v.token);
    const uniqueTokens = new Set(tokens);
    expect(uniqueTokens.size).toBe(6);
  });

  it('contiene exactamente un vehículo en cada uno de los 6 estados', () => {
    const seed = createSeed();
    const expectedStates: VehicleState[] = [
      'recibido',
      'diagnostico',
      'espera_aprobacion',
      'reparacion',
      'listo',
      'entregado',
    ];

    const statesInSeed = seed.vehicles.map((v) => v.state);
    for (const state of expectedStates) {
      expect(statesInSeed).toContain(state);
    }
  });

  it('el vehículo en "espera_aprobacion" tiene pausedFrom="diagnostico" y exactamente 1 cotización pendiente', () => {
    const seed = createSeed();
    const vehicle = seed.vehicles.find((v) => v.state === 'espera_aprobacion');
    expect(vehicle).toBeDefined();
    expect(vehicle?.pausedFrom).toBe('diagnostico');
    expect(vehicle?.pauseId).toBeTruthy();

    const pendingQuotes = seed.quotes.filter(
      (q) => q.vehicleId === vehicle?.id && q.status === 'pendiente'
    );
    expect(pendingQuotes).toHaveLength(1);
    expect(pendingQuotes[0].pauseId).toBe(vehicle?.pauseId);
    expect(pendingQuotes[0].amount).toBeGreaterThan(0);
    expect(pendingQuotes[0].exactDescription.length).toBeGreaterThan(0);
  });

  it('el vehículo en "reparacion" tiene cotizaciones y entradas en el ledger aprobadas y rechazadas', () => {
    const seed = createSeed();
    const vehicle = seed.vehicles.find((v) => v.state === 'reparacion');
    expect(vehicle).toBeDefined();

    const ledgerEntries = seed.ledger.filter((l) => l.vehicleId === vehicle?.id);
    const approved = ledgerEntries.filter((l) => l.result === 'aprobada');
    const rejected = ledgerEntries.filter((l) => l.result === 'rechazada');

    expect(approved.length).toBeGreaterThanOrEqual(1);
    expect(rejected.length).toBeGreaterThanOrEqual(1);

    // Verificar que en quotes existan las cotizaciones correspondientes
    for (const entry of ledgerEntries) {
      const quote = seed.quotes.find((q) => q.id === entry.quoteId);
      expect(quote).toBeDefined();
      expect(quote?.status).toBe(entry.result);
      expect(quote?.exactDescription).toBe(entry.exactDescription);
      expect(quote?.amount).toBe(entry.amount);
    }
  });

  it('el vehículo en "entregado" tiene historial cronológico completo de estados', () => {
    const seed = createSeed();
    const vehicle = seed.vehicles.find((v) => v.state === 'entregado');
    expect(vehicle).toBeDefined();

    const vehicleHistory = seed.history.filter((h) => h.vehicleId === vehicle?.id);
    const statesInOrder = vehicleHistory.map((h) => h.to);

    expect(statesInOrder).toEqual([
      'recibido',
      'diagnostico',
      'reparacion',
      'listo',
      'entregado',
    ]);
  });

  it('el catálogo contiene ~6 ítems requeridos con precios sugeridos positivos', () => {
    const seed = createSeed();
    expect(seed.catalog.length).toBeGreaterThanOrEqual(6);

    const labels = seed.catalog.map((i) => i.label.toLowerCase());
    expect(labels.some((l) => l.includes('balatas'))).toBe(true);
    expect(labels.some((l) => l.includes('amortiguadores'))).toBe(true);
    expect(labels.some((l) => l.includes('distribución') || l.includes('distribucion'))).toBe(true);
    expect(labels.some((l) => l.includes('batería') || l.includes('bateria'))).toBe(true);
    expect(labels.some((l) => l.includes('afinación') || l.includes('afinacion'))).toBe(true);
    expect(labels.some((l) => l.includes('llantas'))).toBe(true);

    for (const item of seed.catalog) {
      expect(item.suggestedPrice).toBeGreaterThan(0);
      expect(Number.isInteger(item.suggestedPrice)).toBe(true);
    }
  });

  it('utiliza fechas válidas relativas o basadas en baseNow cuando se proporciona', () => {
    const baseNow = '2026-10-26T15:30:00.000Z';
    const seed = createSeed(baseNow);

    const baseTimestamp = new Date(baseNow).getTime();

    for (const v of seed.vehicles) {
      const created = new Date(v.createdAt).getTime();
      const updated = new Date(v.updatedAt).getTime();
      expect(Number.isNaN(created)).toBe(false);
      expect(Number.isNaN(updated)).toBe(false);
      expect(created).toBeLessThanOrEqual(baseTimestamp);
      expect(updated).toBeLessThanOrEqual(baseTimestamp);
      expect(created).toBeLessThanOrEqual(updated);
    }

    for (const h of seed.history) {
      const at = new Date(h.at).getTime();
      expect(Number.isNaN(at)).toBe(false);
      expect(at).toBeLessThanOrEqual(baseTimestamp);
    }
  });
});
