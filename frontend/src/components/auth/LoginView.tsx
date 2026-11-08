import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/authContext';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Cloud,
  Server,
  UserPlus,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, authState, loginError, clearAuthError } = useAuth();

  // Selected auth provider: 'supabase' or 'local'
  const [provider, setProvider] = useState<'supabase' | 'local'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lms_selected_provider');
      if (saved === 'supabase' || saved === 'local') return saved;
    }
    return 'supabase';
  });

  // Action mode for Supabase: 'login' or 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('admin@fintechlms.in');
  const [password, setPassword] = useState('LmsAdmin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Field validation errors
  const [errors, setErrors] = useState<{ username?: string; password?: string; name?: string }>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lms_selected_provider', provider);
    }
    clearAuthError();
    setSuccessNotice(null);

    // Adjust pre-filled defaults when toggling provider
    if (provider === 'local') {
      setUsername('admin@fintechlms.in');
      setPassword('LmsAdmin@2026');
      setAuthMode('login');
    }
  }, [provider]);

  const validate = () => {
    const errs: { username?: string; password?: string; name?: string } = {};
    if (!username.trim()) {
      errs.username =
        provider === 'supabase'
          ? 'Please enter your Supabase email address.'
          : 'Please enter your username, employee ID, or registered corporate email.';
    } else if (provider === 'supabase' && !username.includes('@')) {
      errs.username = 'Please enter a valid email address for Supabase authentication.';
    }

    if (!password) {
      errs.password = 'Please enter your password.';
    } else if (provider === 'supabase' && password.length < 6) {
      errs.password = 'Supabase password must be at least 6 characters.';
    }

    if (provider === 'supabase' && authMode === 'signup' && !name.trim()) {
      errs.name = 'Please enter your full name.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setSuccessNotice(null);

    if (!validate()) return;

    const ok = await login({
      username: username.trim(),
      password,
      remember,
      provider,
      action: authMode,
      name: name.trim() || undefined,
    });

    if (ok && authMode === 'signup') {
      setSuccessNotice('Account created successfully in Supabase! You can now sign in.');
      setAuthMode('login');
    }
  };

  const isSubmitting = authState === 'authenticating';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* LMS Brand Identity */}
        <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 text-white rounded-lg font-black text-xl tracking-tighter mb-3 shadow-none">
          LMS
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Loan Management System
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
          Enterprise Credit & Loan Operations Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-5 sm:px-8 border border-slate-200 rounded-lg shadow-sm">
          {/* Dual Provider Selection Tabs */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Authentication Source
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {provider === 'supabase' ? 'Cloud Connected' : 'Local Offline Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => setProvider('supabase')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                  provider === 'supabase'
                    ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Cloud className={`w-3.5 h-3.5 ${provider === 'supabase' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Supabase Cloud</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('local')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                  provider === 'local'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Server className={`w-3.5 h-3.5 ${provider === 'local' ? 'text-slate-800' : 'text-slate-400'}`} />
                <span>Local DB / Docker</span>
              </button>
            </div>

            {/* Provider Connection Info Pill */}
            <div className="mt-2 text-[11px] flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
              {provider === 'supabase' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate">
                    Target: <strong>xwyarykuzfzitvsjylih.supabase.co</strong> (Auth & Cloud DB)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="truncate">
                    Target: <strong>Local PostgreSQL (localhost:5432 / Docker)</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Supabase Action Switcher (Sign In vs Register) */}
          {provider === 'supabase' && (
            <div className="flex border-b border-slate-200 mb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  clearAuthError();
                }}
                className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                  authMode === 'login'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  clearAuthError();
                }}
                className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                  authMode === 'signup'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                New User Registration
              </button>
            </div>
          )}

          {/* Success Notice */}
          {successNotice && (
            <div
              role="alert"
              className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-2.5 text-xs text-emerald-900"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Success</span>
                <span>{successNotice}</span>
              </div>
            </div>
          )}

          {/* Server-level Authentication Error Banner */}
          {loginError && (
            <div
              role="alert"
              className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs text-rose-900"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Failed</span>
                <span>{loginError}</span>
              </div>
            </div>
          )}

          {/* Login / Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Optional Full Name (Supabase Sign-Up Only) */}
            {provider === 'supabase' && authMode === 'signup' && (
              <div>
                <label htmlFor="fullname-input" className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="fullname-input"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  disabled={isSubmitting}
                  placeholder="e.g. Ramesh Kumar"
                  className={`w-full px-3 py-2 text-xs sm:text-sm bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400 ${
                    errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name}</p>
                )}
              </div>
            )}

            {/* Email / Username */}
            <div>
              <label htmlFor="username-input" className="block text-xs font-bold text-slate-700 mb-1">
                {provider === 'supabase' ? 'Supabase Email' : 'Username / Email / Employee ID'}{' '}
                <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="username-input"
                  name="username"
                  type={provider === 'supabase' ? 'email' : 'text'}
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                  disabled={isSubmitting}
                  placeholder={
                    provider === 'supabase'
                      ? 'e.g. user@yourdomain.com'
                      : 'e.g. admin@fintechlms.in or EMP-74012'
                  }
                  className={`w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400 ${
                    errors.username ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password-input" className="block text-xs font-bold text-slate-700">
                  Password <span className="text-rose-600">*</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  disabled={isSubmitting}
                  placeholder={
                    provider === 'supabase' && authMode === 'signup'
                      ? 'At least 6 characters'
                      : 'Enter password'
                  }
                  className={`w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-white border rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400 ${
                    errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Remember device checkbox & Quick Fill */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="ml-2 text-xs text-slate-600 font-medium">
                  Remember this device
                </span>
              </label>

              {provider === 'local' && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('admin@fintechlms.in');
                      setPassword('LmsAdmin@2026');
                      clearAuthError();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3 text-slate-400" />
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUsername('checker@fintechlms.in');
                      setPassword('LmsAdmin@2026');
                      clearAuthError();
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3 text-slate-400" />
                    Checker
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center py-2.5 px-4 border rounded-md text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  provider === 'supabase'
                    ? 'bg-emerald-700 hover:bg-emerald-800 border-emerald-800 focus:ring-emerald-700'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-900 focus:ring-slate-900'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    <span>
                      {provider === 'supabase'
                        ? authMode === 'signup'
                          ? 'Registering with Supabase…'
                          : 'Verifying with Supabase…'
                        : 'Verifying credentials…'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {provider === 'supabase'
                        ? authMode === 'signup'
                          ? 'Register with Supabase'
                          : 'Sign In via Supabase'
                        : 'Sign In (Local DB)'}
                    </span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Helper Banner */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded">
            {provider === 'supabase' ? (
              <>
                <Cloud className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 block">Supabase Authentication Active</span>
                  <span>
                    Users authenticate against Supabase Auth. Banking roles and permissions are automatically synced with the cloud LMS directory.
                  </span>
                </div>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 block">Local Database Authentication</span>
                  <span>
                    Sign in using <strong>admin@fintechlms.in</strong> (Password: <code>LmsAdmin@2026</code>) with full local system administrator privileges.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center text-xs text-slate-500">
          <p>
            Secured via 256-bit TLS encryption. Connects to Supabase Cloud or Local PostgreSQL.
          </p>
        </div>
      </div>
    </div>
  );
};
