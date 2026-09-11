import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { getEnv } from '../config/env.js';
import { JWTPayload, UserRole, UnauthorizedError } from '../types/index.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenService {
  /**
   * Generates a short-lived access token.
   */
  public generateAccessToken(userId: string, role: UserRole): string {
    const env = getEnv();
    const payload: JWTPayload = {
      sub: userId,
      role,
    };
    const options: SignOptions = {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as unknown as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
  }

  /**
   * Generates a longer-lived refresh token.
   */
  public generateRefreshToken(userId: string, role: UserRole): string {
    const env = getEnv();
    const payload: JWTPayload & { jti: string } = {
      sub: userId,
      role,
      jti: crypto.randomUUID(),
    };
    const options: SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as unknown as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
  }

  /**
   * Verifies an access token and returns payload.
   */
  public verifyAccessToken(token: string): JWTPayload {
    const env = getEnv();
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token has expired', 'AUTH_TOKEN_EXPIRED');
      }
      throw new UnauthorizedError('Invalid access token', 'AUTH_INVALID_TOKEN');
    }
  }

  /**
   * Verifies a refresh token and returns payload.
   */
  public verifyRefreshToken(token: string): JWTPayload {
    const env = getEnv();
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token has expired', 'AUTH_TOKEN_EXPIRED');
      }
      throw new UnauthorizedError('Invalid refresh token', 'AUTH_REFRESH_TOKEN_INVALID');
    }
  }

  /**
   * Produces a SHA-256 hash of a raw token string for secure database persistence.
   */
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const tokenService = new TokenService();
