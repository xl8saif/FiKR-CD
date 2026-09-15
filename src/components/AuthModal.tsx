import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Lock, 
  LogIn, 
  UserPlus, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  KeyRound
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  formatAuthError,
  AuthStatus
} from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: FirebaseUser | null;
  authStatus: AuthStatus;
  authError: string | null;
  setAuthStatus: (status: AuthStatus) => void;
  setAuthError: (err: string | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  authStatus,
  authError,
  setAuthStatus,
  setAuthError
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setAuthError('Please provide both email and password.');
      setAuthStatus('AUTH_ERROR');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      setAuthStatus('AUTH_ERROR');
      return;
    }

    setIsSubmitting(true);
    setAuthStatus('AUTHENTICATING');

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(trimmedEmail, password);
        setSuccessMessage('Successfully signed in via Firebase Authentication.');
      } else {
        await createUserWithEmailAndPassword(trimmedEmail, password);
        setSuccessMessage('Account created successfully via Firebase Authentication.');
      }
      // Clear password from local state immediately after submit
      setPassword('');
      setAuthStatus('AUTHENTICATED');
    } catch (err: any) {
      const formatted = formatAuthError(err);
      setAuthError(formatted);
      setAuthStatus('AUTH_ERROR');
    } finally {
      setIsSubmitting(false);
      setPassword('');
    }
  };

  const handleSignOut = async () => {
    setIsSubmitting(true);
    setAuthStatus('AUTHENTICATING');
    setAuthError(null);
    setSuccessMessage(null);
    try {
      await signOut();
      setAuthStatus('UNAUTHENTICATED');
      setSuccessMessage('You have been signed out.');
    } catch (err: any) {
      const formatted = formatAuthError(err);
      setAuthError(formatted);
      setAuthStatus('AUTH_ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setAuthError(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <div 
      id="firebase-auth-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        id="firebase-auth-modal" 
        className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden text-[#E5E5E5] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] bg-[#191919]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#C9A66B]/15 text-[#C9A66B] border border-[#C9A66B]/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F5F5F5] tracking-wide flex items-center gap-2">
                Firebase Authentication
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#222] text-[#D4B582] border border-[#333]">
                  Production Identity
                </span>
              </h2>
              <p className="text-[11px] text-[#888]">
                Real cloud authentication foundation (BALL 15.2)
              </p>
            </div>
          </div>
          <button
            id="auth-modal-close-btn"
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#888] hover:text-[#FFF] hover:bg-[#262626] transition"
            aria-label="Close Authentication Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Real Auth State Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F0F0F] border border-[#222]">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${
                authStatus === 'AUTHENTICATED' 
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                  : authStatus === 'AUTHENTICATING'
                  ? 'bg-amber-500 animate-ping'
                  : authStatus === 'AUTH_ERROR'
                  ? 'bg-rose-500'
                  : 'bg-zinc-600'
              }`} />
              <span className="text-xs font-mono text-[#888]">State:</span>
              <span className="text-xs font-mono font-bold text-[#E5E5E5]">
                {authStatus}
              </span>
            </div>
            {firebaseUser && (
              <span className="text-[10px] font-mono text-[#777] truncate max-w-[160px]" title={firebaseUser.uid}>
                UID: {firebaseUser.uid.slice(0, 10)}...
              </span>
            )}
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Notification */}
          {authError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Authentication Notice</span>
                <span>{authError}</span>
              </div>
            </div>
          )}

          {/* Authenticated View */}
          {firebaseUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#181818] border border-[#262626] space-y-2">
                <div className="text-xs text-[#888] flex items-center justify-between">
                  <span>Authenticated Account</span>
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified Live
                  </span>
                </div>
                <div className="font-medium text-sm text-[#F5F5F5] break-all">
                  {firebaseUser.email || 'No email associated'}
                </div>
                <div className="text-[11px] font-mono text-[#777] break-all">
                  Firebase UID: {firebaseUser.uid}
                </div>
              </div>

              <div className="text-[11px] text-[#777] bg-[#161616] p-3 rounded-xl border border-[#222]">
                <strong className="text-[#C9A66B]">Note:</strong> Profile details & role assignment are decoupled and will be provisioned in future milestones.
              </div>

              <button
                id="auth-signout-btn"
                type="button"
                onClick={handleSignOut}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 text-xs font-semibold transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>Sign Out from Firebase</span>
              </button>
            </div>
          ) : (
            /* Unauthenticated Form */
            <div>
              {/* Mode Toggle */}
              <div className="flex rounded-xl bg-[#181818] p-1 border border-[#262626] mb-4">
                <button
                  id="auth-tab-signin"
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    mode === 'signin'
                      ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-sm'
                      : 'text-[#888] hover:text-[#FFF]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  id="auth-tab-signup"
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    mode === 'signup'
                      ? 'bg-[#C9A66B] text-[#0C0C0C] shadow-sm'
                      : 'text-[#888] hover:text-[#FFF]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label htmlFor="auth-email-input" className="block text-xs font-medium text-[#AAA] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                    <input
                      id="auth-email-input"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contributor@fikrcd.org"
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#E5E5E5] placeholder-[#555] focus:outline-none focus:border-[#C9A66B] focus:ring-1 focus:ring-[#C9A66B] transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="auth-password-input" className="block text-xs font-medium text-[#AAA]">
                      Password
                    </label>
                    {mode === 'signup' && (
                      <span className="text-[10px] text-[#777]">Min. 6 characters</span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
                    <input
                      id="auth-password-input"
                      type="password"
                      required
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#E5E5E5] placeholder-[#555] focus:outline-none focus:border-[#C9A66B] focus:ring-1 focus:ring-[#C9A66B] transition"
                    />
                  </div>
                </div>

                {/* Password Notice */}
                <div className="text-[11px] text-[#666] flex items-center gap-1.5 px-1">
                  <KeyRound className="h-3.5 w-3.5 text-[#888] shrink-0" />
                  <span>Passwords are handled strictly and securely by Firebase Auth.</span>
                </div>

                {/* Submit Button */}
                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#C9A66B] hover:bg-[#D4B582] text-[#0C0C0C] text-xs font-bold transition shadow-sm disabled:opacity-50 mt-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#0C0C0C]" />
                  ) : mode === 'signin' ? (
                    <LogIn className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  <span>{mode === 'signin' ? 'Sign In to Firebase' : 'Create New Account'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#222] bg-[#111] text-center">
          <p className="text-[10px] text-[#666]">
            Indus-Kohistani Language Digital Preservation & Technology Initiative • Security Standard BALL 15.2
          </p>
        </div>
      </div>
    </div>
  );
};
