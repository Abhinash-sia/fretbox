import { User, SafeUser } from '../models/user.model.js';
import { RefreshToken } from '../models/refreshToken.model.js';
import { passwordService } from './password.service.js';
import { tokenService, TokenPair } from './token.service.js';
import {
  UserRole,
  ConflictError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from '../../../types/index.js';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResult {
  user: SafeUser;
  tokens: TokenPair;
}

export class AuthService {
  /**
   * Registers a new user.
   *
   * SECURITY NOTICE (PHASE B1 DEVELOPMENT / DEMO):
   * Allowing client-supplied `role` during registration is provided strictly for B1 development testing
   * so all six roles can be demonstrated. In a production environment, public registration must be
   * restricted to unprivileged roles (e.g. Student), while privileged roles (Faculty, Warden, Admin, etc.)
   * must be provisioned via admin workflows or tokenized invitation links.
   */
  public async register(dto: RegisterDTO): Promise<SafeUser> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictError('User with this email already exists', 'AUTH_EMAIL_EXISTS');
    }

    // Hash password
    const passwordHash = await passwordService.hashPassword(dto.password);

    // Create user
    const role = dto.role || UserRole.STUDENT;
    const newUser = await User.create({
      name: dto.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      isActive: true,
    });

    return newUser.toSafeObject();
  }

  /**
   * Validates user credentials and issues access and refresh tokens.
   */
  public async login(dto: LoginDTO): Promise<AuthResult> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Fetch user including passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      // Generic error message prevents account enumeration
      throw new UnauthorizedError('Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated', 'AUTH_ACCOUNT_INACTIVE');
    }

    // Compare password
    const isPasswordValid = await passwordService.comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
    }

    // Generate Tokens
    const userId = user._id.toString();
    const accessToken = tokenService.generateAccessToken(userId, user.role);
    const refreshToken = tokenService.generateRefreshToken(userId, user.role);

    // Save refresh token session hash in database
    const tokenHash = tokenService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    return {
      user: user.toSafeObject(),
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  /**
   * Refreshes access token using a valid, non-revoked refresh token.
   */
  public async refresh(refreshTokenString: string): Promise<AuthResult> {
    if (!refreshTokenString) {
      throw new BadRequestError('Refresh token is required', 'AUTH_REFRESH_TOKEN_REQUIRED');
    }

    // Verify JWT signature & expiration
    const payload = tokenService.verifyRefreshToken(refreshTokenString);

    // Verify token hash exists in DB and is active
    const tokenHash = tokenService.hashToken(refreshTokenString);
    const storedToken = await RefreshToken.findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      throw new UnauthorizedError(
        'Refresh token is invalid or has been revoked',
        'AUTH_REFRESH_TOKEN_INVALID',
      );
    }

    // Check user status
    const user = await User.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('User account not found', 'AUTH_USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive', 'AUTH_ACCOUNT_INACTIVE');
    }

    // Revoke old refresh token (Refresh Token Rotation strategy)
    storedToken.revokedAt = new Date();
    await storedToken.save();

    // Issue new token pair
    const userId = user._id.toString();
    const newAccessToken = tokenService.generateAccessToken(userId, user.role);
    const newRefreshToken = tokenService.generateRefreshToken(userId, user.role);

    // Persist new refresh token
    const newTokenHash = tokenService.hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
    });

    return {
      user: user.toSafeObject(),
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  /**
   * Revokes a refresh token session (Logout).
   */
  public async logout(refreshTokenString?: string): Promise<void> {
    if (!refreshTokenString) {
      return; // Idempotent logout
    }

    try {
      const tokenHash = tokenService.hashToken(refreshTokenString);
      await RefreshToken.updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      );
    } catch {
      // Idempotent error handling
    }
  }

  /**
   * Retrieves profile details for an authenticated user.
   */
  public async getMe(userId: string): Promise<SafeUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive', 'AUTH_ACCOUNT_INACTIVE');
    }

    return user.toSafeObject();
  }
}

export const authService = new AuthService();
