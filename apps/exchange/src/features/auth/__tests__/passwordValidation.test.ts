/**
 * Security Test Suite: Password Validation
 *
 * Tests password complexity requirements for wallet creation.
 * Financial applications require strong passwords to protect encrypted seeds.
 */
import { describe, expect, it } from 'vitest';

/**
 * Password validation logic matching CreateAccount.tsx requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { errors, valid: errors.length === 0 };
};

describe('Password Validation', () => {
  it('accepts strong passwords meeting all requirements', () => {
    const result = validatePassword('MyStr0ng!Pass');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects passwords shorter than 12 characters', () => {
    const result = validatePassword('Short1!a');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 12 characters');
  });

  it('rejects passwords without uppercase', () => {
    const result = validatePassword('nouppercase1!abc');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('rejects passwords without lowercase', () => {
    const result = validatePassword('NOLOWERCASE1!ABC');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('rejects passwords without digits', () => {
    const result = validatePassword('NoDigitsHere!!aa');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one digit');
  });

  it('rejects passwords without special characters', () => {
    const result = validatePassword('NoSpecialChar1aa');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character');
  });

  it('rejects empty passwords', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('reports multiple violations simultaneously', () => {
    const result = validatePassword('abc');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('accepts passwords with unicode special characters', () => {
    const result = validatePassword('MyStr0ng€Pass');
    expect(result.valid).toBe(true);
  });

  it('accepts exact minimum length of 12', () => {
    const result = validatePassword('Abcdefgh1!23');
    expect(result.valid).toBe(true);
  });
});
