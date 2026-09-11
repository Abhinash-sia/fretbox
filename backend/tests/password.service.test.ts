import { describe, it, expect } from 'vitest';
import { passwordService } from '../src/modules/auth/services/password.service.js';

describe('PasswordService', () => {
  it('should generate a valid bcrypt hash from a plaintext password', async () => {
    const password = 'MySecurePassword123!';
    const hash = await passwordService.hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
  });

  it('should return true when comparing correct plaintext password with hash', async () => {
    const password = 'MySecurePassword123!';
    const hash = await passwordService.hashPassword(password);

    const isMatch = await passwordService.comparePassword(password, hash);
    expect(isMatch).toBe(true);
  });

  it('should return false when comparing incorrect plaintext password with hash', async () => {
    const password = 'MySecurePassword123!';
    const wrongPassword = 'WrongPassword123!';
    const hash = await passwordService.hashPassword(password);

    const isMatch = await passwordService.comparePassword(wrongPassword, hash);
    expect(isMatch).toBe(false);
  });
});
