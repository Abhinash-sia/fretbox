import { ApiError, ApiResponse } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class ApiClientError extends Error implements ApiError {
  statusCode: number;
  errorCode?: string;
  errorDetails?: unknown;
  isAuthError: boolean;
  isForbiddenError: boolean;
  isNetworkError: boolean;

  constructor(
    message: string,
    statusCode = 500,
    errorCode?: string,
    errorDetails?: unknown,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errorDetails = errorDetails;
    this.isAuthError = statusCode === 401;
    this.isForbiddenError = statusCode === 403;
    this.isNetworkError = isNetworkError;
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('fretbox_access_token');
      this.refreshToken = localStorage.getItem('fretbox_refresh_token');
    }
  }

  public setTokens(tokens: { accessToken: string; refreshToken: string } | null) {
    if (tokens) {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      if (typeof window !== 'undefined') {
        localStorage.setItem('fretbox_access_token', tokens.accessToken);
        localStorage.setItem('fretbox_refresh_token', tokens.refreshToken);
      }
    } else {
      this.accessToken = null;
      this.refreshToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fretbox_access_token');
        localStorage.removeItem('fretbox_refresh_token');
      }
    }
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getRefreshToken(): string | null {
    return this.refreshToken;
  }

  private onRefreshed(token: string | null) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(callback: (token: string | null) => void) {
    this.refreshSubscribers.push(callback);
  }

  public async refreshSession(): Promise<string | null> {
    if (!this.refreshToken) {
      return null;
    }

    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.addRefreshSubscriber((token) => resolve(token));
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data: ApiResponse<{ tokens: { accessToken: string; refreshToken: string } }> = await response.json();

      if (!response.ok || data.status !== 'success') {
        this.setTokens(null);
        this.onRefreshed(null);
        return null;
      }

      this.setTokens(data.data.tokens);
      this.onRefreshed(data.data.tokens.accessToken);
      return data.data.tokens.accessToken;
    } catch {
      this.setTokens(null);
      this.onRefreshed(null);
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, skipAuth = false, headers: customHeaders, ...customOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      let response = await fetch(url, {
        ...customOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      let responseData: ApiResponse<T>;
      try {
        responseData = await response.json();
      } catch {
        throw new ApiClientError('Invalid JSON response from server', response.status, 'INVALID_RESPONSE');
      }

      if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
        const newAccessToken = await this.refreshSession();
        if (newAccessToken) {
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          response = await fetch(url, {
            ...customOptions,
            headers,
            body: body ? JSON.stringify(body) : undefined,
          });
          responseData = await response.json();
        } else {
          throw new ApiClientError(
            responseData.message || 'Session expired',
            401,
            responseData.errorCode || 'AUTH_EXPIRED'
          );
        }
      }

      if (!response.ok || responseData.status === 'error') {
        throw new ApiClientError(
          responseData.message || 'API request failed',
          response.status,
          responseData.errorCode,
          responseData.errorDetails
        );
      }

      return responseData.data;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError('Network or server connection failed', 0, 'NETWORK_ERROR', null, true);
    }
  }

  public async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public async patch<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
