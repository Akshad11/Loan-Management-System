import React, { useState } from 'react';
import { useAuth } from '../../services/authContext';
import { Eye, EyeOff, Lock, Mail, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, authState, loginError, clearAuthError } = useAuth();

  const [username, setUsername] = useState('admin@fintechlms.in');
  const [password, setPassword] = useState('LmsAdmin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  // Field validation errors
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validate = () => {
    const errs: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errs.username = 'Please enter your username, employee ID, or registered corporate email.';
    }
    if (!password) {
      errs.password = 'Please enter your password.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();

    if (!validate()) return;

    await login({
      username: username.trim(),
      password,
      remember,
    });
  };

  const isSubmitting = authState === 'authenticating';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
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
        <div className="bg-white py-7 px-5 sm:px-8 border border-slate-200 rounded-lg shadow-none">
          {/* Section Heading */}
          <div className="mb-5 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Sign in to your account</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your corporate credentials to authenticate with the database.
            </p>
          </div>

          {/* Server-level Authentication Error Banner */}
          {loginError && (
            <div
              role="alert"
              className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs text-rose-900"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Failed</span>
                <span>{loginError}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Username / Corporate Email / Employee ID */}
            <div>
              <label htmlFor="username-input" className="block text-xs font-bold text-slate-700 mb-1">
                Username / Email / Employee ID <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="username-input"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: undefined });
                  }}
                  disabled={isSubmitting}
                  placeholder="e.g. rajesh.sharma@enterprise-lms.in or EMP-74012"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  disabled={isSubmitting}
                  placeholder="Enter password"
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

            {/* Remember device checkbox */}
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

              <button
                type="button"
                onClick={() => alert('For password resets or new account provisioning, contact your IT Administrator (emp-support@enterprise-lms.in).')}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Need help?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-slate-900 rounded-md text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    <span>Verifying credentials…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Database Accounts Hint */}
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-700 block">System Administrator Account Active</span>
              <span>Login using <strong>admin@fintechlms.in</strong> or <strong>admin</strong> (Password: <code>LmsAdmin@2026</code>) with full administrative privileges.</span>
            </div>
          </div>
        </div>

        {/* Security & Audit notice */}
        <div className="mt-4 text-center text-xs text-slate-500">
          <p>
            Secured via 256-bit TLS encryption. Unauthorized access to this banking system is strictly prohibited and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};
