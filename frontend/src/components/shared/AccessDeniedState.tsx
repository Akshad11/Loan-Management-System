import React from 'react';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../services/authContext';

interface AccessDeniedStateProps {
  onReturnToDashboard?: () => void;
  message?: string;
}

export const AccessDeniedState: React.FC<AccessDeniedStateProps> = ({
  onReturnToDashboard,
  message = 'You do not have permission to access this module or operational resource with your current role.',
}) => {
  const { user } = useAuth();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg p-8 sm:p-10 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">{message}</p>

        {user && (
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 mb-6 text-left">
            <div>
              <span className="font-semibold text-slate-800">Current User:</span> {user.name}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Role:</span> {user.roleTitle}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Branch:</span> {user.branch}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onReturnToDashboard}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export const SessionExpiredState: React.FC<{ onSignIn: () => void }> = ({ onSignIn }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg p-8 sm:p-10 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-2">Session Expired</h2>
        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          Your active operational session has expired due to inactivity or token timeout. Please sign in again to continue your work securely.
        </p>

        <button
          type="button"
          onClick={onSignIn}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
        >
          <LogIn className="w-4 h-4" />
          Sign In Again
        </button>
      </div>
    </div>
  );
};
