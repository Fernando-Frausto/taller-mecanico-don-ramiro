import { describe, it, expect } from 'vitest';
import {
  buildClientUrl,
  buildStatusUpdateMessage,
  buildQuoteMessage,
  buildWhatsAppUrl,
  STATE_LABELS,
} from './whatsapp';
import type { Vehicle, Quote } from './types';

describe('WhatsApp & URLs (whatsapp.ts)', () => {
  const sampleVehicle: Vehicle = {
    id: 'veh-1',
    token: 'Rm7kQ2xVb9Ld',
    isSeed: true,
    clientName: 'Roberto Gómez',
    phone: '525512345678',
    vehicleDesc: 'Nissan Versa 2018 Gris',
    plates: 'ABC1234',
    reason: 'Falla de frenos',
    state: 'diagnostico',
    pausedFrom: null,
    pauseId: null,
    createdAt: '2026-10-26T10:00:00Z',
    updatedAt: '2026-10-26T10:00:00Z',
  };

  const sampleQuote: Quote = {
    id: 'quo-1',
    vehicleId: 'veh-1',
    pauseId: 'pau-1',
    catalogItemId: 'cat-balatas',
    label: 'Cambio de balatas delanteras',
    note: 'Desgaste severo al 90%',
    amount: 1850,
    exactDescription: 'Cambio de balatas delanteras — Nota: Desgaste severo al 90%',
    status: 'pendiente',
    sentAt: '2026-10-26T11:00:00Z',
    sentBy: 'mecanico',
  };

  describe('buildClientUrl (RF-37, CA-12, CA-23)', () => {
    it('builds URL with hash routing from explicit baseUrl without trailing slash', () => {
      const url = buildClientUrl('Rm7kQ2xVb9Ld', 'https://taller-don-ramiro.com');
      expect(url).toBe('https://taller-don-ramiro.com/#/c/Rm7kQ2xVb9Ld');
    });

    it('builds URL with hash routing from explicit baseUrl with trailing slash', () => {
      const url = buildClientUrl('Rm7kQ2xVb9Ld', 'https://taller-don-ramiro.com/');
      expect(url).toBe('https://taller-don-ramiro.com/#/c/Rm7kQ2xVb9Ld');
    });

    it('cleans any existing hash or fragment from baseUrl', () => {
      const url = buildClientUrl('Rm7kQ2xVb9Ld', 'https://taller.com/#/taller/v/123');
      expect(url).toBe('https://taller.com/#/c/Rm7kQ2xVb9Ld');
    });

    it('returns relative hash route when baseUrl is empty or not provided and window is undefined', () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error simulating node environment
      delete globalThis.window;

      const url = buildClientUrl('Rm7kQ2xVb9Ld');
      expect(url).toBe('#/c/Rm7kQ2xVb9Ld');

      globalThis.window = originalWindow;
    });

    it('uses window.location when available and baseUrl is not passed', () => {
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'http://localhost:5173',
          pathname: '/',
        },
        writable: true,
        configurable: true,
      });

      const url = buildClientUrl('Rm7kQ2xVb9Ld');
      expect(url).toBe('http://localhost:5173/#/c/Rm7kQ2xVb9Ld');

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('throws or handles empty token gracefully', () => {
      expect(() => buildClientUrl('')).toThrow(/token.*obligatorio/i);
    });
  });

  describe('buildStatusUpdateMessage (RF-23, CA-12)', () => {
    it('creates a friendly Spanish message for vehicle in diagnostic state', () => {
      const clientUrl = 'https://taller.mx/#/c/Rm7kQ2xVb9Ld';
      const msg = buildStatusUpdateMessage(sampleVehicle, clientUrl);

      expect(msg).toContain('Roberto Gómez');
      expect(msg).toContain('Nissan Versa 2018 Gris');
      expect(msg).toContain('ABC1234');
      expect(msg).toContain(STATE_LABELS.diagnostico);
      expect(msg).toContain(clientUrl);
    });

    it('includes appropriate friendly label for all states', () => {
      const clientUrl = 'https://taller.mx/#/c/test';

      const states: Vehicle['state'][] = [
        'recibido',
        'diagnostico',
        'espera_aprobacion',
        'reparacion',
        'listo',
        'entregado',
      ];

      for (const st of states) {
        const v: Vehicle = { ...sampleVehicle, state: st };
        const msg = buildStatusUpdateMessage(v, clientUrl);
        expect(msg).toContain(STATE_LABELS[st]);
      }
    });

    it('mentions Taller Mecánico Don Ramiro', () => {
      const msg = buildStatusUpdateMessage(sampleVehicle, 'https://taller.mx/#/c/123');
      expect(msg).toMatch(/Don Ramiro/i);
    });
  });

  describe('buildQuoteMessage (RF-24, CA-12)', () => {
    it('creates message with repair exact description, MXN formatted price and client URL', () => {
      const clientUrl = 'https://taller.mx/#/c/Rm7kQ2xVb9Ld';
      const msg = buildQuoteMessage(sampleVehicle, sampleQuote, clientUrl);

      expect(msg).toContain('Roberto Gómez');
      expect(msg).toContain('Nissan Versa 2018 Gris');
      expect(msg).toContain('ABC1234');
      expect(msg).toContain('Cambio de balatas delanteras');
      expect(msg).toContain('Desgaste severo al 90%');
      expect(msg).toMatch(/\$1,850\.00/);
      expect(msg).toMatch(/aprobar.*rechazar|aprobaci[oó]n/i);
      expect(msg).toContain(clientUrl);
    });

    it('handles quote without note correctly', () => {
      const quoteWithoutNote: Quote = {
        ...sampleQuote,
        note: '',
        exactDescription: 'Cambio de balatas delanteras',
      };
      const clientUrl = 'https://taller.mx/#/c/Rm7kQ2xVb9Ld';
      const msg = buildQuoteMessage(sampleVehicle, quoteWithoutNote, clientUrl);

      expect(msg).toContain('Cambio de balatas delanteras');
      expect(msg).not.toContain('Nota:');
      expect(msg).toMatch(/\$1,850\.00/);
    });
  });

  describe('buildWhatsAppUrl (RF-23, RF-24, CA-12)', () => {
    it('constructs correct wa.me URL with phone and URL-encoded message', () => {
      const phone = '525512345678';
      const text = 'Hola Roberto, tu coche está listo en: https://taller.mx/#/c/123';
      const url = buildWhatsAppUrl(phone, text);

      expect(url).toBe(`https://wa.me/525512345678?text=${encodeURIComponent(text)}`);
    });

    it('cleans non-digit characters from phone number', () => {
      const phone = '+52 (55) 1234-5678';
      const text = 'Mensaje de prueba';
      const url = buildWhatsAppUrl(phone, text);

      expect(url.startsWith('https://wa.me/525512345678?text=')).toBe(true);
    });
  });
});
