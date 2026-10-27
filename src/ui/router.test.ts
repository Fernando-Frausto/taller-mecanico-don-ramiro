import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { parseRoute, navigate, useHashRoute, type Route } from './router';

describe('Hash Router', () => {
  describe('parseRoute', () => {
    it('parsea rutas raíz o taller como taller_list', () => {
      expect(parseRoute('')).toEqual<Route>({ kind: 'taller_list' });
      expect(parseRoute('#')).toEqual<Route>({ kind: 'taller_list' });
      expect(parseRoute('#/')).toEqual<Route>({ kind: 'taller_list' });
      expect(parseRoute('#/taller')).toEqual<Route>({ kind: 'taller_list' });
      expect(parseRoute('/taller')).toEqual<Route>({ kind: 'taller_list' });
      expect(parseRoute('#/taller/')).toEqual<Route>({ kind: 'taller_list' });
    });

    it('parsea entregados como taller_delivered', () => {
      expect(parseRoute('#/taller/entregados')).toEqual<Route>({ kind: 'taller_delivered' });
      expect(parseRoute('/taller/entregados')).toEqual<Route>({ kind: 'taller_delivered' });
    });

    it('parsea nuevo vehículo como taller_new', () => {
      expect(parseRoute('#/taller/nuevo')).toEqual<Route>({ kind: 'taller_new' });
    });

    it('parsea catálogo como taller_catalog', () => {
      expect(parseRoute('#/taller/catalogo')).toEqual<Route>({ kind: 'taller_catalog' });
    });

    it('parsea ficha de vehículo como taller_vehicle con su vehicleId', () => {
      expect(parseRoute('#/taller/v/veh-001')).toEqual<Route>({
        kind: 'taller_vehicle',
        vehicleId: 'veh-001',
      });
      expect(parseRoute('#/taller/v/abc-123/')).toEqual<Route>({
        kind: 'taller_vehicle',
        vehicleId: 'abc-123',
      });
    });

    it('retorna not_found si la ruta de ficha no tiene id', () => {
      expect(parseRoute('#/taller/v/')).toEqual<Route>({ kind: 'not_found' });
      expect(parseRoute('#/taller/v')).toEqual<Route>({ kind: 'not_found' });
    });

    it('parsea cliente como cliente con su token', () => {
      expect(parseRoute('#/c/Rm7kQ2xVb9Ld')).toEqual<Route>({
        kind: 'cliente',
        token: 'Rm7kQ2xVb9Ld',
      });
      expect(parseRoute('/c/token12345/')).toEqual<Route>({
        kind: 'cliente',
        token: 'token12345',
      });
    });

    it('retorna not_found si la ruta de cliente no tiene token', () => {
      expect(parseRoute('#/c/')).toEqual<Route>({ kind: 'not_found' });
      expect(parseRoute('#/c')).toEqual<Route>({ kind: 'not_found' });
    });

    it('retorna not_found ante rutas desconocidas', () => {
      expect(parseRoute('#/desconocido')).toEqual<Route>({ kind: 'not_found' });
      expect(parseRoute('#/taller/otro/nivel')).toEqual<Route>({ kind: 'not_found' });
      expect(parseRoute('#/random')).toEqual<Route>({ kind: 'not_found' });
    });
  });

  describe('navigate y useHashRoute', () => {
    const originalHash = window.location.hash;

    beforeEach(() => {
      window.location.hash = '';
    });

    afterEach(() => {
      window.location.hash = originalHash;
    });

    it('navigate actualiza window.location.hash', () => {
      navigate('#/taller/nuevo');
      expect(window.location.hash).toBe('#/taller/nuevo');

      navigate('/c/token-abc');
      expect(window.location.hash).toBe('#/c/token-abc');
    });

    it('useHashRoute detecta el hash inicial y reacciona a cambios', () => {
      window.location.hash = '#/taller/catalogo';
      const { result } = renderHook(() => useHashRoute());

      expect(result.current).toEqual<Route>({ kind: 'taller_catalog' });

      act(() => {
        navigate('#/c/token-xyz');
      });

      expect(result.current).toEqual<Route>({
        kind: 'cliente',
        token: 'token-xyz',
      });

      act(() => {
        window.location.hash = '#/taller/entregados';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });

      expect(result.current).toEqual<Route>({ kind: 'taller_delivered' });
    });
  });
});
