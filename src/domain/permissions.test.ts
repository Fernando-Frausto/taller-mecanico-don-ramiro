import { describe, it, expect } from 'vitest';
import {
  canCreateVehicle,
  canEditCatalogPrice,
  canEditQuoteDraftPrice,
  canAdvanceState,
  canProposeQuote,
  canWithdrawQuote,
  canCorrectState,
} from './permissions';

describe('Permisos por rol en Taller (RF-04, RF-06, RF-07, RF-31, RF-38, CA-14)', () => {
  describe('canCreateVehicle (RF-01, RF-38, CA-14)', () => {
    it('permite crear vehículos únicamente al rol Jefe', () => {
      expect(canCreateVehicle('jefe')).toBe(true);
      expect(canCreateVehicle('mecanico')).toBe(false);
    });
  });

  describe('canEditCatalogPrice (RF-07, RF-38, CA-14)', () => {
    it('permite editar precios del catálogo únicamente al rol Jefe', () => {
      expect(canEditCatalogPrice('jefe')).toBe(true);
      expect(canEditCatalogPrice('mecanico')).toBe(false);
    });
  });

  describe('canEditQuoteDraftPrice (RF-07, RF-38)', () => {
    it('permite editar el precio en un borrador de cotización únicamente al rol Jefe', () => {
      expect(canEditQuoteDraftPrice('jefe')).toBe(true);
      expect(canEditQuoteDraftPrice('mecanico')).toBe(false);
    });
  });

  describe('canAdvanceState (RF-04)', () => {
    it('permite avanzar estado tanto al Mecánico como al Jefe', () => {
      expect(canAdvanceState('jefe')).toBe(true);
      expect(canAdvanceState('mecanico')).toBe(true);
    });
  });

  describe('canProposeQuote (RF-06)', () => {
    it('permite proponer cotizaciones tanto al Mecánico como al Jefe', () => {
      expect(canProposeQuote('jefe')).toBe(true);
      expect(canProposeQuote('mecanico')).toBe(true);
    });
  });

  describe('canWithdrawQuote (RF-31)', () => {
    it('permite retirar cotizaciones pendientes tanto al Mecánico como al Jefe', () => {
      expect(canWithdrawQuote('jefe')).toBe(true);
      expect(canWithdrawQuote('mecanico')).toBe(true);
    });
  });

  describe('canCorrectState (RF-05)', () => {
    it('permite corregir estado previo con confirmación tanto al Mecánico como al Jefe', () => {
      expect(canCorrectState('jefe')).toBe(true);
      expect(canCorrectState('mecanico')).toBe(true);
    });
  });
});
