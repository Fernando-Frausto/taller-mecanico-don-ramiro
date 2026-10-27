import { describe, it, expect } from 'vitest';
import {
  validateNewVehicle,
  validateDecisionName,
  normalizePhone,
  normalizePlates,
} from './validation';
import type { Vehicle, VehicleInput } from './types';

describe('Validation (validation.ts)', () => {
  describe('normalizePhone', () => {
    it('normalizes 10-digit mexican numbers to 52 + 10 digits', () => {
      expect(normalizePhone('5512345678')).toBe('525512345678');
      expect(normalizePhone('55 1234 5678')).toBe('525512345678');
      expect(normalizePhone('55-1234-5678')).toBe('525512345678');
      expect(normalizePhone('(55) 1234-5678')).toBe('525512345678');
    });

    it('handles numbers already prefixed with 52 or +52', () => {
      expect(normalizePhone('+52 55 1234 5678')).toBe('525512345678');
      expect(normalizePhone('525512345678')).toBe('525512345678');
      expect(normalizePhone('+525512345678')).toBe('525512345678');
      // WhatsApp 521 format
      expect(normalizePhone('+52 1 55 1234 5678')).toBe('525512345678');
      expect(normalizePhone('5215512345678')).toBe('525512345678');
    });

    it('returns null for invalid phone numbers (not 10 digits)', () => {
      expect(normalizePhone('123456789')).toBeNull(); // 9 digits
      expect(normalizePhone('12345678901')).toBeNull(); // 11 digits without 52 prefix
      expect(normalizePhone('')).toBeNull();
      expect(normalizePhone('abcdefghij')).toBeNull();
      expect(normalizePhone('551234567a')).toBeNull();
    });
  });

  describe('normalizePlates', () => {
    it('converts to uppercase and removes spaces, dashes and symbols', () => {
      expect(normalizePlates('abc-123')).toBe('ABC123');
      expect(normalizePlates('abc 12 34')).toBe('ABC1234');
      expect(normalizePlates('  xyz - 987 - w  ')).toBe('XYZ987W');
    });

    it('returns empty string if input contains only invalid characters', () => {
      expect(normalizePlates('---   ---')).toBe('');
      expect(normalizePlates('')).toBe('');
    });
  });

  describe('validateNewVehicle (RF-01, RF-02, RF-33, RF-39; CA-01, CA-17)', () => {
    const validBaseInput: VehicleInput = {
      clientName: 'Don Ramiro García',
      phone: '55 1234 5678',
      vehicleDesc: 'Nissan Tsuru 2012 Blanco',
      plates: 'NSS-2012',
      reason: 'Cambio de balatas',
    };

    it('passes with all valid fields and returns normalized data', () => {
      const result = validateNewVehicle(validBaseInput, []);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.data).toBeDefined();
      expect(result.data?.clientName).toBe('Don Ramiro García');
      expect(result.data?.phone).toBe('525512345678');
      expect(result.data?.vehicleDesc).toBe('Nissan Tsuru 2012 Blanco');
      expect(result.data?.plates).toBe('NSS2012');
      expect(result.data?.reason).toBe('Cambio de balatas');
    });

    it('trims clientName, vehicleDesc, and reason', () => {
      const input: VehicleInput = {
        ...validBaseInput,
        clientName: '  María López  ',
        vehicleDesc: '  Honda Civic 2018  ',
        reason: '  Ruido en frenos  ',
      };
      const result = validateNewVehicle(input, []);
      expect(result.isValid).toBe(true);
      expect(result.data?.clientName).toBe('María López');
      expect(result.data?.vehicleDesc).toBe('Honda Civic 2018');
      expect(result.data?.reason).toBe('Ruido en frenos');
    });

    it('requires clientName and fails when empty or whitespace', () => {
      const emptyResult = validateNewVehicle({ ...validBaseInput, clientName: '' }, []);
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors.clientName).toMatch(/nombre.*obligatorio/i);

      const spaceResult = validateNewVehicle({ ...validBaseInput, clientName: '   ' }, []);
      expect(spaceResult.isValid).toBe(false);
      expect(spaceResult.errors.clientName).toMatch(/nombre.*obligatorio/i);
    });

    it('requires vehicleDesc and fails when empty or whitespace', () => {
      const result = validateNewVehicle({ ...validBaseInput, vehicleDesc: '   ' }, []);
      expect(result.isValid).toBe(false);
      expect(result.errors.vehicleDesc).toMatch(/veh[ií]culo.*obligatori[oa]/i);
    });

    it('requires valid 10-digit phone number', () => {
      const shortPhone = validateNewVehicle({ ...validBaseInput, phone: '55123' }, []);
      expect(shortPhone.isValid).toBe(false);
      expect(shortPhone.errors.phone).toMatch(/10 d[ií]gitos/i);

      const invalidChars = validateNewVehicle({ ...validBaseInput, phone: '551234ABCD' }, []);
      expect(invalidChars.isValid).toBe(false);
      expect(invalidChars.errors.phone).toMatch(/10 d[ií]gitos/i);

      const emptyPhone = validateNewVehicle({ ...validBaseInput, phone: '' }, []);
      expect(emptyPhone.isValid).toBe(false);
      expect(emptyPhone.errors.phone).toMatch(/tel[eé]fono.*obligatorio|10 d[ií]gitos/i);
    });

    it('requires plates and fails if empty or non-alphanumeric', () => {
      const emptyPlates = validateNewVehicle({ ...validBaseInput, plates: '' }, []);
      expect(emptyPlates.isValid).toBe(false);
      expect(emptyPlates.errors.plates).toMatch(/placas.*obligatori[ao]s?/i);

      const symbolPlates = validateNewVehicle({ ...validBaseInput, plates: '---' }, []);
      expect(symbolPlates.isValid).toBe(false);
      expect(symbolPlates.errors.plates).toMatch(/alfanum[eé]ric[oa]s?|inv[aá]lid[oa]s?/i);
    });

    it('detects duplicate plates among active (non-delivered) vehicles (RF-33, CA-17)', () => {
      const activeVehicle: Vehicle = {
        id: 'v1',
        token: 'token12345678',
        isSeed: true,
        clientName: 'Pedro Juárez',
        phone: '525598765432',
        vehicleDesc: 'Chevy 2010',
        plates: 'NSS2012', // same normalized plate
        state: 'reparacion',
        pausedFrom: null,
        pauseId: null,
        createdAt: '2026-10-26T10:00:00Z',
        updatedAt: '2026-10-26T10:00:00Z',
      };

      const result = validateNewVehicle(validBaseInput, [activeVehicle]);
      expect(result.isValid).toBe(false);
      expect(result.errors.plates).toMatch(/placas ya registradas|en taller|conflicto/i);
    });

    it('ignores formatting and case when checking duplicate plates', () => {
      const activeVehicle: Vehicle = {
        id: 'v1',
        token: 'token12345678',
        isSeed: true,
        clientName: 'Pedro Juárez',
        phone: '525598765432',
        vehicleDesc: 'Chevy 2010',
        plates: 'NSS-2012',
        state: 'diagnostico',
        pausedFrom: null,
        pauseId: null,
        createdAt: '2026-10-26T10:00:00Z',
        updatedAt: '2026-10-26T10:00:00Z',
      };

      const result = validateNewVehicle({ ...validBaseInput, plates: ' nss 20-12 ' }, [activeVehicle]);
      expect(result.isValid).toBe(false);
      expect(result.errors.plates).toBeDefined();
    });

    it('allows same plates if existing vehicle is delivered (state === "entregado")', () => {
      const deliveredVehicle: Vehicle = {
        id: 'v1',
        token: 'token12345678',
        isSeed: true,
        clientName: 'Pedro Juárez',
        phone: '525598765432',
        vehicleDesc: 'Chevy 2010',
        plates: 'NSS2012',
        state: 'entregado',
        pausedFrom: null,
        pauseId: null,
        createdAt: '2026-10-20T10:00:00Z',
        updatedAt: '2026-10-22T10:00:00Z',
      };

      const result = validateNewVehicle(validBaseInput, [deliveredVehicle]);
      expect(result.isValid).toBe(true);
      expect(result.errors.plates).toBeUndefined();
    });

    it('reports all invalid fields simultaneously for UI mapping (RF-39)', () => {
      const invalidInput: VehicleInput = {
        clientName: '',
        phone: 'invalid',
        vehicleDesc: '   ',
        plates: '   ',
      };

      const result = validateNewVehicle(invalidInput, []);
      expect(result.isValid).toBe(false);
      expect(result.errors.clientName).toBeDefined();
      expect(result.errors.phone).toBeDefined();
      expect(result.errors.vehicleDesc).toBeDefined();
      expect(result.errors.plates).toBeDefined();
    });
  });

  describe('validateDecisionName (RF-16, CA-20)', () => {
    it('accepts valid names between 2 and 60 characters after trim', () => {
      expect(validateDecisionName('Juan Pérez').isValid).toBe(true);
      expect(validateDecisionName('  Juan Pérez  ').trimmedName).toBe('Juan Pérez');
      expect(validateDecisionName('Ed').isValid).toBe(true); // exactly 2 chars
      expect(validateDecisionName('a'.repeat(60)).isValid).toBe(true); // exactly 60 chars
    });

    it('rejects empty or whitespace-only names', () => {
      const empty = validateDecisionName('');
      expect(empty.isValid).toBe(false);
      expect(empty.error).toMatch(/obligatorio/i);

      const spaces = validateDecisionName('    ');
      expect(spaces.isValid).toBe(false);
      expect(spaces.error).toMatch(/obligatorio/i);
    });

    it('rejects names shorter than 2 characters after trim', () => {
      const singleChar = validateDecisionName('A');
      expect(singleChar.isValid).toBe(false);
      expect(singleChar.error).toMatch(/al menos 2 caracteres/i);

      const singleCharWithSpaces = validateDecisionName('   Z   ');
      expect(singleCharWithSpaces.isValid).toBe(false);
      expect(singleCharWithSpaces.error).toMatch(/al menos 2 caracteres/i);
    });

    it('rejects names longer than 60 characters after trim', () => {
      const tooLong = validateDecisionName('a'.repeat(61));
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.error).toMatch(/m[aá]ximo 60 caracteres/i);
    });
  });
});
