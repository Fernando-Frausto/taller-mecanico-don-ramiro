import { describe, it, expect } from 'vitest';
import { generateToken, isValidToken } from './token';

describe('Token generation and validation (token.ts)', () => {
  it('generates a token of default length 12', () => {
    const token = generateToken();
    expect(typeof token).toBe('string');
    expect(token).toHaveLength(12);
  });

  it('generates a token of custom length >= 10', () => {
    const token10 = generateToken(10);
    const token15 = generateToken(15);
    const token20 = generateToken(20);

    expect(token10).toHaveLength(10);
    expect(token15).toHaveLength(15);
    expect(token20).toHaveLength(20);
  });

  it('enforces minimum length of 10 characters', () => {
    expect(() => generateToken(9)).toThrow(/al menos 10 caracteres/i);
    expect(() => generateToken(0)).toThrow(/al menos 10 caracteres/i);
    expect(() => generateToken(-5)).toThrow(/al menos 10 caracteres/i);
  });

  it('contains only alphanumeric characters (a-z, A-Z, 0-9)', () => {
    for (let i = 0; i < 20; i++) {
      const token = generateToken();
      expect(token).toMatch(/^[a-zA-Z0-9]+$/);
    }
  });

  it('generates distinct tokens across consecutive calls', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateToken());
    }
    expect(tokens.size).toBe(100);
  });

  it('supports deterministic generation with custom random function', () => {
    // A mock random that always returns 0 should always pick the first char
    const mockZero = () => 0;
    const tokenZero = generateToken(12, mockZero);
    expect(tokenZero).toHaveLength(12);
    // Consecutive calls with same generator return identical token
    expect(generateToken(12, mockZero)).toBe(tokenZero);
  });

  describe('isValidToken', () => {
    it('returns true for valid alphanumeric tokens >= 10 chars', () => {
      expect(isValidToken('Rm7kQ2xVb9Ld')).toBe(true);
      expect(isValidToken('abcdefghij')).toBe(true);
      expect(isValidToken('1234567890AB')).toBe(true);
    });

    it('returns false for tokens shorter than 10 chars', () => {
      expect(isValidToken('123456789')).toBe(false);
      expect(isValidToken('abc')).toBe(false);
      expect(isValidToken('')).toBe(false);
    });

    it('returns false for non-alphanumeric tokens', () => {
      expect(isValidToken('Rm7kQ2-Vb9Ld')).toBe(false);
      expect(isValidToken('Rm7kQ2 Vb9Ld')).toBe(false);
      expect(isValidToken('Rm7kQ2_Vb9Ld')).toBe(false);
      expect(isValidToken('Rm7kQ2@Vb9Ld')).toBe(false);
    });

    it('returns false for non-string values or empty inputs', () => {
      expect(isValidToken(null as unknown as string)).toBe(false);
      expect(isValidToken(undefined as unknown as string)).toBe(false);
    });
  });
});
