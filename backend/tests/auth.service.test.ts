import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { authService } from '../src/services/auth.service.js';
import { User } from '../src/models/user.model.js';
import { RefreshToken } from '../src/models/refreshToken.model.js';
import { UserRole, ConflictError, UnauthorizedError } from '../src/types/index.js';

describe('AuthService', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_auth_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  it('should register a new user without returning passwordHash', async () => {
    const user = await authService.register({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      role: UserRole.STUDENT,
    });

    expect(user._id).toBeDefined();
    expect(user.email).toBe('john@example.com');
    expect(user.role).toBe(UserRole.STUDENT);
    expect((user as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
  });

  it('should reject registration if email is already registered', async () => {
    await authService.register({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      role: UserRole.STUDENT,
    });

    await expect(
      authService.register({
        name: 'John Smith',
        email: 'john@example.com',
        password: 'Password456!',
        role: UserRole.FACULTY,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('should successfully authenticate user with valid credentials during login', async () => {
    await authService.register({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password123!',
      role: UserRole.FACULTY,
    });

    const result = await authService.login({
      email: 'jane@example.com',
      password: 'Password123!',
    });

    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(result.user.email).toBe('jane@example.com');
  });

  it('should reject login with wrong password', async () => {
    await authService.register({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password123!',
    });

    await expect(
      authService.login({
        email: 'jane@example.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should successfully refresh token and revoke old refresh token session', async () => {
    await authService.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password123!',
    });

    const loginResult = await authService.login({
      email: 'alice@example.com',
      password: 'Password123!',
    });

    const refreshResult = await authService.refresh(loginResult.tokens.refreshToken);

    expect(refreshResult.tokens.accessToken).toBeDefined();
    expect(refreshResult.tokens.refreshToken).toBeDefined();

    // Old refresh token should now be revoked and rejected
    await expect(authService.refresh(loginResult.tokens.refreshToken)).rejects.toThrow(
      UnauthorizedError,
    );
  });

  it('should revoke refresh token session upon logout', async () => {
    await authService.register({
      name: 'Bob',
      email: 'bob@example.com',
      password: 'Password123!',
    });

    const loginResult = await authService.login({
      email: 'bob@example.com',
      password: 'Password123!',
    });

    await authService.logout(loginResult.tokens.refreshToken);

    await expect(authService.refresh(loginResult.tokens.refreshToken)).rejects.toThrow(
      UnauthorizedError,
    );
  });
});
