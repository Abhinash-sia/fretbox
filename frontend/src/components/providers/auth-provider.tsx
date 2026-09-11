'use client';

import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginDTO, UserRole } from '@/types/auth';
import { apiClient, ApiClientError } from '@/lib/api/api-client';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDTO) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const accessToken = apiClient.getAccessToken();
    const refreshToken = apiClient.getRefreshToken();

    if (accessToken || refreshToken) {
      apiClient
        .request<User>('/auth/me')
        .then((currentUser) => {
          if (isMounted) {
            setUser(currentUser);
            setAuthError(null);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setUser(null);
            if (err instanceof ApiClientError && err.isAuthError) {
              apiClient.setTokens(null);
            }
            setIsLoading(false);
          }
        });
    } else {
      Promise.resolve().then(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginDTO) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const authResult = await apiClient.request<{ user: User; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: credentials,
          skipAuth: true,
        }
      );

      apiClient.setTokens(authResult.tokens);
      setUser(authResult.user);
    } catch (err) {
      setUser(null);
      apiClient.setTokens(null);
      if (err instanceof ApiClientError) {
        setAuthError(err.message);
      } else {
        setAuthError('An unexpected error occurred during login.');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const refreshToken = apiClient.getRefreshToken();
      if (refreshToken) {
        await apiClient.request('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
          skipAuth: true,
        });
      }
    } catch {
      // Idempotent client logout even if backend fails
    } finally {
      apiClient.setTokens(null);
      setUser(null);
      setAuthError(null);
      setIsLoading(false);
    }
  };

  const clearError = () => setAuthError(null);

  const normalizedRole: UserRole | null = user ? (user.role.toLowerCase() as UserRole) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: normalizedRole,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        authError,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
