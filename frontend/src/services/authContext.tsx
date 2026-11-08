import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Permission, AuthState } from '../types';
import { userHasPermission } from '../lib/permissionUtils';

interface LoginCredentials {
  username: string;
  password?: string;
  remember?: boolean;
  provider?: 'supabase' | 'local' | 'auto';
  action?: 'login' | 'signup';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  authState: AuthState;
  loginError: string | null;
  rememberDevice: boolean;
  authProvider: 'supabase' | 'local' | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
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
const STORAGE_KEY_TOKEN = 'lms_auth_token';
const STORAGE_KEY_PROVIDER = 'lms_auth_provider';

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

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(STORAGE_KEY_TOKEN);
    } catch {
      return null;
    }
  });

  const [authProvider, setAuthProvider] = useState<'supabase' | 'local' | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return (localStorage.getItem(STORAGE_KEY_PROVIDER) as 'supabase' | 'local') || null;
    } catch {
      return null;
    }
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
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      } catch {
        // ignore
      }
    }
  }, [user, authState]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleAuthInvalid = () => {
      setUser(null);
      setToken(null);
      setAuthState('unauthenticated');
      try {
        localStorage.removeItem(STORAGE_KEY_USER);
        localStorage.removeItem(STORAGE_KEY_TOKEN);
      } catch {
        // ignore
      }
    };
    window.addEventListener('lms_auth_invalid', handleAuthInvalid);
    return () => window.removeEventListener('lms_auth_invalid', handleAuthInvalid);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
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
      // Authenticate directly with the Database API endpoint (supporting both Supabase and Local)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          password: password,
          remember: credentials.remember,
          provider: credentials.provider || 'auto',
          action: credentials.action || 'login',
          name: credentials.name,
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

        if (data.token) {
          setToken(data.token);
          try {
            localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
          } catch {
            // ignore
          }
        }

        const activeProvider = data.authProvider || credentials.provider || 'local';
        setAuthProvider(activeProvider);
        try {
          localStorage.setItem(STORAGE_KEY_PROVIDER, activeProvider);
        } catch {
          // ignore
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
      setLoginError('Unable to connect to authentication service.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthProvider(null);
    setAuthState('unauthenticated');
    setLoginError(null);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_PROVIDER);
    } catch {
      // ignore
    }
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    // System admin has universal permissions
    if ((user.role as string) === 'system_admin' || (user.role as string) === 'SYSTEM_ADMIN' || user.permissions?.includes('*')) return true;
    // Core banking operational modules are accessible to authenticated banking roles
    if (
      permission === 'view_dashboard' ||
      permission === 'view_approvals' ||
      permission === 'view_sanctions' ||
      permission === 'view_disbursements' ||
      permission === 'view_loans' ||
      permission === 'view_credit_assessment' ||
      permission === 'view_applications'
    ) return true;

    return userHasPermission(user.permissions || [], permission, (user.role as string) === 'system_admin' || (user.role as string) === 'SYSTEM_ADMIN');
  };

  const simulateSessionExpiry = () => {
    setAuthState('session_expired');
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
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
    setToken(null);
    setLoginError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authState,
        loginError,
        rememberDevice,
        authProvider,
        token,
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
