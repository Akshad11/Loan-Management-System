import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Permission, AuthState } from '../types';
import { userHasPermission } from '../lib/permissionUtils';

interface AuthContextType {
  user: User | null;
  authState: AuthState;
  loginError: string | null;
  rememberDevice: boolean;
  login: (credentials: { username: string; password?: string; remember?: boolean }) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  simulateSessionExpiry: () => void;
  simulateAccessDenied: () => void;
  clearAuthError: () => void;
  resetToDefaultLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'lms_auth_user';
const STORAGE_KEY_REMEMBER = 'lms_remember_device';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [authState, setAuthState] = useState<AuthState>(() => {
    if (typeof window === 'undefined') return 'unauthenticated';
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      return savedUser ? 'authenticated' : 'unauthenticated';
    } catch {
      return 'unauthenticated';
    }
  });

  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_KEY_REMEMBER) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user && authState === 'authenticated') {
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      } catch {
        // ignore
      }
    } else if (authState === 'unauthenticated' || authState === 'session_expired') {
      try {
        localStorage.removeItem(STORAGE_KEY_USER);
      } catch {
        // ignore
      }
    }
  }, [user, authState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleAuthInvalid = () => {
      setUser(null);
      setAuthState('unauthenticated');
      try {
        localStorage.removeItem(STORAGE_KEY_USER);
      } catch {
        // ignore
      }
    };
    window.addEventListener('lms_auth_invalid', handleAuthInvalid);
    return () => window.removeEventListener('lms_auth_invalid', handleAuthInvalid);
  }, []);

  const login = async (credentials: { username: string; password?: string; remember?: boolean }): Promise<boolean> => {
    setAuthState('authenticating');
    setLoginError(null);

    const trimmedUsername = credentials.username.trim();
    const password = credentials.password || '';

    if (!trimmedUsername) {
      setAuthState('unauthenticated');
      setLoginError('Username or corporate email is required.');
      return false;
    }

    try {
      // Authenticate directly with the Database API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          password: password,
          remember: credentials.remember,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        const authenticatedUser: User = data.user;

        if (credentials.remember !== undefined) {
          setRememberDevice(credentials.remember);
          try {
            localStorage.setItem(STORAGE_KEY_REMEMBER, credentials.remember ? 'true' : 'false');
          } catch {
            // ignore
          }
        }

        setUser(authenticatedUser);
        setAuthState('authenticated');
        setLoginError(null);
        return true;
      } else {
        setAuthState('unauthenticated');
        setLoginError(data.error || 'Authentication failed. Please check your credentials.');
        return false;
      }
    } catch (networkErr: any) {
      console.error('Backend /api/auth/login connection error:', networkErr);
      setAuthState('unauthenticated');
      setLoginError('Unable to connect to database authentication service.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setAuthState('unauthenticated');
    setLoginError(null);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {
      // ignore
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    // System admin has universal permissions
    if ((user.role as string) === 'system_admin' || (user.role as string) === 'SYSTEM_ADMIN' || user.permissions?.includes('*')) return true;
    // Main dashboard is accessible to all authenticated banking roles
    if (permission === 'view_dashboard') return true;

    return userHasPermission(user.permissions || [], permission, (user.role as string) === 'system_admin' || (user.role as string) === 'SYSTEM_ADMIN');
  };

  const simulateSessionExpiry = () => {
    setAuthState('session_expired');
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch {
      // ignore
    }
  };

  const simulateAccessDenied = () => {
    setAuthState('access_denied');
  };

  const clearAuthError = () => {
    setLoginError(null);
  };

  const resetToDefaultLogin = () => {
    setAuthState('unauthenticated');
    setUser(null);
    setLoginError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authState,
        loginError,
        rememberDevice,
        login,
        logout,
        hasPermission,
        simulateSessionExpiry,
        simulateAccessDenied,
        clearAuthError,
        resetToDefaultLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
