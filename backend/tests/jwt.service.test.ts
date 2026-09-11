import { describe, it, expect } from 'vitest';
import { tokenService } from '../src/modules/auth/services/token.service.js';
import { UserRole, UnauthorizedError } from '../src/types/index.js';

describe('TokenService (JWT & Token Hashing)', () => {
  const userId = '654321654321654321654321';
  const role = UserRole.STUDENT;

  it('should generate and verify a valid access token', () => {
    const accessToken = tokenService.generateAccessToken(userId, role);
    expect(accessToken).toBeDefined();

    const payload = tokenService.verifyAccessToken(accessToken);
    expect(payload.sub).toBe(userId);
    expect(payload.role).toBe(role);
  });

  it('should generate and verify a valid refresh token', () => {
    const refreshToken = tokenService.generateRefreshToken(userId, role);
    expect(refreshToken).toBeDefined();

    const payload = tokenService.verifyRefreshToken(refreshToken);
    expect(payload.sub).toBe(userId);
    expect(payload.role).toBe(role);
  });

  it('should throw UnauthorizedError when verifying an invalid token string', () => {
    expect(() => tokenService.verifyAccessToken('invalid.jwt.token')).toThrow(UnauthorizedError);
  });

  it('should produce consistent SHA-256 hashes for token revocation tracking', () => {
    const token = 'sample_raw_token_string';
    const hash1 = tokenService.hashToken(token);
    const hash2 = tokenService.hashToken(token);

    expect(hash1).toHaveLength(64); // SHA-256 hex string length
    expect(hash1).toBe(hash2);
  });
});
