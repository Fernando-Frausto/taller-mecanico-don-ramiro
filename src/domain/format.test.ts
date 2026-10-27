import { describe, it, expect } from 'vitest';
import { formatCurrencyMXN, formatDateTime, formatDate } from './format';

describe('Formatters (format.ts)', () => {
  describe('formatCurrencyMXN', () => {
    it('formats numbers as MXN currency', () => {
      const formatted1500 = formatCurrencyMXN(1500);
      expect(formatted1500).toMatch(/\$1,500(\.00)?/);

      const formatted0 = formatCurrencyMXN(0);
      expect(formatted0).toMatch(/\$0(\.00)?/);

      const formatted25000 = formatCurrencyMXN(25000);
      expect(formatted25000).toMatch(/\$25,000(\.00)?/);
    });
  });

  describe('formatDateTime and formatDate', () => {
    it('formats ISO date strings to es-MX format', () => {
      const iso = '2026-10-26T15:30:00.000Z';
      const formatted = formatDateTime(iso);
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
      // es-MX format contains day, month or time
      expect(formatted).toMatch(/2026|oct/i);
    });

    it('formats date only', () => {
      const iso = '2026-10-26T15:30:00.000Z';
      const formatted = formatDate(iso);
      expect(typeof formatted).toBe('string');
      expect(formatted).toMatch(/2026/);
    });
  });
});
