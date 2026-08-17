import React, { useState } from 'react';
import {
  Activity,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { User } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const user = await firebaseService.register(email, password, name);
        onLoginSuccess(user);
      } else {
        const user = await firebaseService.login(email, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await firebaseService.loginQuickDemo();
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || 'Instant demo access failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white text-black shadow-lg mb-2">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#fafafa]">
            FikFap Account Tracker
          </h1>
          <p className="text-xs text-[#a1a1aa] max-w-xs mx-auto">
            Real-time Firebase multi-account monitoring, video telemetry, and bio attribution
          </p>
        </div>

        {/* Auth Card */}
        <div className="p-6 sm:p-8 rounded-xl bg-[#09090b] border border-[#27272a] shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Instant Demo Login Banner */}
          {!isRegister && (
            <button
              id="demo-login-btn"
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] text-[#fafafa] transition group text-left"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <div>
                  <div className="text-xs font-semibold text-[#fafafa]">Instant Quick Access (Firebase)</div>
                  <div className="text-[11px] text-[#a1a1aa]">Launch clean workspace with 0 mock data</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#a1a1aa] group-hover:translate-x-0.5 transition" />
            </button>
          )}

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#27272a] w-full" />
            <span className="bg-[#09090b] px-3 text-[11px] text-[#71717a] uppercase tracking-wider font-semibold">
              {isRegister ? 'Create Account' : 'Or Sign In'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Your Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    placeholder="Creator Studio"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#52525b]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="creator@yourdomain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#52525b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#71717a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#09090b] border border-[#27272a] rounded-lg text-[#fafafa] placeholder-[#71717a] focus:outline-none focus:border-[#52525b]"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-black bg-white hover:bg-zinc-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating with Firebase...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account & Launch' : 'Sign In to Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between login & register */}
          <div className="text-center pt-2">
            <button
              id="toggle-auth-mode-btn"
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-[#a1a1aa] hover:text-[#fafafa] transition"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-[#71717a]">
          <div className="flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Firebase Security</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <TrendingUp className="w-4 h-4 text-[#a1a1aa]" />
            <span>Live Firestore Sync</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Activity className="w-4 h-4 text-[#a1a1aa]" />
            <span>Clean 0-Data Start</span>
          </div>
        </div>
      </div>
    </div>
  );
};
