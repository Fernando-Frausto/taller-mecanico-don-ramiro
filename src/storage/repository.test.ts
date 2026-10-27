import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadData,
  saveData,
  resetDemo,
  loadPrefs,
  savePrefs,
  subscribeToStorage,
} from './repository';
import { STORAGE_KEY_DATA, STORAGE_KEY_PREFS } from './schema';
import { createSeed } from './seed';
import type { AppData, DemoPrefs } from '../domain/types';

describe('Repository (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('loadData', () => {
    it('inicializa con createSeed() cuando no hay datos en localStorage y los guarda', () => {
      expect(localStorage.getItem(STORAGE_KEY_DATA)).toBeNull();

      const result = loadData();

      expect(result.notice).toBeUndefined();
      expect(result.data.schemaVersion).toBe(1);
      expect(result.data.vehicles).toHaveLength(6);

      const savedRaw = localStorage.getItem(STORAGE_KEY_DATA);
      expect(savedRaw).not.toBeNull();
      const parsed = JSON.parse(savedRaw!);
      expect(parsed.schemaVersion).toBe(1);
    });

    it('carga datos válidos existentes sin generar aviso ni sobreescribirlos con semilla nueva', () => {
      const customData: AppData = createSeed();
      customData.vehicles[0].clientName = 'Cliente Modificado Test';
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(customData));

      const result = loadData();

      expect(result.notice).toBeUndefined();
      expect(result.data.vehicles[0].clientName).toBe('Cliente Modificado Test');
    });

    it('recupera datos corruptos (JSON sintaxis inválida) regenerando semilla con aviso', () => {
      localStorage.setItem(STORAGE_KEY_DATA, '{ json invalido! ');

      const result = loadData();

      expect(result.notice).toBe('reset-corrupt');
      expect(result.data.schemaVersion).toBe(1);
      expect(result.data.vehicles).toHaveLength(6);

      // Debe quedar guardada la nueva semilla limpia en localStorage
      const savedRaw = localStorage.getItem(STORAGE_KEY_DATA);
      expect(savedRaw).not.toBeNull();
      expect(() => JSON.parse(savedRaw!)).not.toThrow();
    });

    it('recupera datos con schemaVersion incompatible regenerando semilla con aviso', () => {
      const outdatedData = {
        ...createSeed(),
        schemaVersion: 2,
      };
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(outdatedData));

      const result = loadData();

      expect(result.notice).toBe('reset-corrupt');
      expect(result.data.schemaVersion).toBe(1);
    });

    it('recupera datos que no cumplen la estructura isAppData regenerando semilla con aviso', () => {
      // Objeto al que le falta el arreglo de vehicles
      const badData = {
        schemaVersion: 1,
        vehicles: 'no-es-arreglo',
        quotes: [],
        ledger: [],
        history: [],
        catalog: [],
      };
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(badData));

      const result = loadData();

      expect(result.notice).toBe('reset-corrupt');
      expect(result.data.schemaVersion).toBe(1);
      expect(result.data.vehicles).toHaveLength(6);
    });
  });

  describe('saveData', () => {
    it('guarda los datos serializados en localStorage', () => {
      const data = createSeed();
      data.vehicles[1].plates = 'NUEVAS99';

      saveData(data);

      const savedRaw = localStorage.getItem(STORAGE_KEY_DATA);
      expect(savedRaw).not.toBeNull();
      const parsed = JSON.parse(savedRaw!);
      expect(parsed.vehicles[1].plates).toBe('NUEVAS99');
    });
  });

  describe('resetDemo', () => {
    it('borra los datos existentes y restaura una semilla fresca', () => {
      const customData = createSeed();
      customData.vehicles = []; // vaciar
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(customData));

      const resetData = resetDemo();

      expect(resetData.schemaVersion).toBe(1);
      expect(resetData.vehicles).toHaveLength(6);

      const savedRaw = localStorage.getItem(STORAGE_KEY_DATA);
      const parsed = JSON.parse(savedRaw!);
      expect(parsed.vehicles).toHaveLength(6);
    });
  });

  describe('loadPrefs y savePrefs', () => {
    it('devuelve las preferencias por defecto cuando no hay nada guardado', () => {
      const prefs = loadPrefs();
      expect(prefs).toEqual({ view: 'taller', role: 'jefe' });
    });

    it('guarda y carga las preferencias personalizadas', () => {
      const customPrefs: DemoPrefs = { view: 'cliente', role: 'mecanico' };
      savePrefs(customPrefs);

      const loaded = loadPrefs();
      expect(loaded).toEqual(customPrefs);

      const raw = localStorage.getItem(STORAGE_KEY_PREFS);
      expect(JSON.parse(raw!)).toEqual(customPrefs);
    });

    it('retorna preferencias por defecto si el valor guardado está corrupto o es inválido', () => {
      localStorage.setItem(STORAGE_KEY_PREFS, 'invalido-json');
      expect(loadPrefs()).toEqual({ view: 'taller', role: 'jefe' });

      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ view: 'admin', role: 'otro' }));
      expect(loadPrefs()).toEqual({ view: 'taller', role: 'jefe' });
    });
  });

  describe('subscribeToStorage', () => {
    it('ejecuta el callback cuando se dispara el evento storage para STORAGE_KEY_DATA', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToStorage(callback);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY_DATA,
          newValue: '{"test": 1}',
        })
      );

      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
    });

    it('ejecuta el callback cuando se dispara el evento storage con key null (clear)', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToStorage(callback);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: null,
        })
      );

      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
    });

    it('ignora eventos storage para otras claves', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToStorage(callback);

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'otra-clave-diferente',
        })
      );

      expect(callback).not.toHaveBeenCalled();

      unsubscribe();
    });

    it('deja de escuchar tras llamar a unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToStorage(callback);

      unsubscribe();

      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY_DATA,
        })
      );

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
