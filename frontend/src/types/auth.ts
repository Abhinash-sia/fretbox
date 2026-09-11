export type UserRole =
  | 'student'
  | 'faculty'
  | 'security'
  | 'warden'
  | 'staff'
  | 'administrator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: TokenPair;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  statusCode: number;
  message: string;
  data: T;
  errorCode?: string;
  errorDetails?: unknown;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errorCode?: string;
  errorDetails?: unknown;
  isAuthError: boolean;
  isForbiddenError: boolean;
  isNetworkError: boolean;
}

export interface LoginDTO {
  email: string;
  password: string;
}
