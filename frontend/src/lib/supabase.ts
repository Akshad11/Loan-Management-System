/**
 * Supabase Client & REST Auth Utility
 * 
 * Provides unified access to Supabase Authentication & Database operations.
 * Designed to work zero-dependency via native fetch while supporting full
 * Supabase Auth API specs (token exchange, sign-in, sign-up, user session).
 */

export interface SupabaseAuthConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  projectRef: string | null;
}

export interface SupabaseAuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  created_at?: string;
}

export interface SupabaseAuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseAuthUser;
}

/**
 * Extracts and normalizes Supabase configuration from environment variables
 */
export function getSupabaseConfig(): SupabaseAuthConfig {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).trim();

  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  ).trim();

  let projectRef: string | null = null;
  if (url) {
    try {
      const parsed = new URL(url);
      const hostParts = parsed.hostname.split('.');
      if (hostParts.length >= 3 && hostParts[1] === 'supabase') {
        projectRef = hostParts[0];
      }
    } catch {
      // ignore parsing error
    }
  }

  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('[YOUR-PROJECT-REF]') &&
    !anonKey.includes('your-anon-public-key')
  );

  return {
    url: url.replace(/\/+$/, ''), // strip trailing slash
    anonKey,
    isConfigured,
    projectRef,
  };
}

/**
 * Authenticates user credentials directly against Supabase Auth endpoint
 */
export async function supabaseSignIn(credentials: {
  email: string;
  password: string;
}): Promise<{ session?: SupabaseAuthSession; error?: string }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return { error: 'Supabase credentials are not configured in environment variables.' };
  }

  try {
    const res = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg =
        data.error_description ||
        data.msg ||
        data.message ||
        data.error ||
        `Supabase authentication failed (${res.status})`;
      return { error: errMsg };
    }

    return {
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type || 'bearer',
        user: data.user,
      },
    };
  } catch (err: any) {
    return {
      error: `Network error connecting to Supabase: ${err.message || 'Check your internet connection'}`,
    };
  }
}

/**
 * Registers a new user with Supabase Auth
 */
export async function supabaseSignUp(credentials: {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}): Promise<{ user?: SupabaseAuthUser; session?: SupabaseAuthSession; error?: string }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return { error: 'Supabase credentials are not configured in environment variables.' };
  }

  try {
    const res = await fetch(`${config.url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
        data: credentials.metadata || {},
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        error:
          data.error_description ||
          data.msg ||
          data.message ||
          data.error ||
          `Supabase sign-up failed (${res.status})`,
      };
    }

    return {
      user: data.user || data,
      session: data.access_token ? data : undefined,
    };
  } catch (err: any) {
    return { error: `Network error connecting to Supabase: ${err.message}` };
  }
}

/**
 * Validates a Supabase JWT access token and fetches user identity
 */
export async function supabaseGetUser(
  token: string
): Promise<{ user?: SupabaseAuthUser; error?: string }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return { error: 'Supabase credentials are not configured.' };
  }

  try {
    const res = await fetch(`${config.url}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.msg || data.message || 'Invalid Supabase session' };
    }

    return { user: data };
  } catch (err: any) {
    return { error: `Failed to verify Supabase token: ${err.message}` };
  }
}

/**
 * Safely parses the payload of a JWT token without external dependencies
 */
export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = typeof atob === 'function' 
      ? atob(padded) 
      : Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}
