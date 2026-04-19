import React, { useState } from 'react';
import { LogIn, ShieldCheck, Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'verify-email';

export function LoginPage() {
  const { 
    loginWithGoogle, 
    loginWithEmail, 
    register, 
    resetPassword, 
    sendVerification,
    user,
    profile 
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(user && !user.emailVerified ? 'verify-email' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'manager' | 'client'>('manager');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        await register(email, password, name, role);
        setMode('verify-email');
      } else if (mode === 'forgot-password') {
        await resetPassword(email);
        setSuccess('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await sendVerification();
      setSuccess('Verification email resent!');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (mode === 'verify-email') {
      return (
        <div className="space-y-6">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4">
            <Mail size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Verify your email</h2>
          <p className="text-slate-400 text-sm">
            We've sent a verification email to <span className="text-white font-medium">{user?.email}</span>. 
            Please check your inbox and click the link to continue.
          </p>
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3 text-emerald-500 text-xs">
              <CheckCircle size={16} />
              {success}
            </div>
          )}
          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Resend Verification Email'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors"
          >
            I've verified my email
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3 text-rose-500 text-xs text-left">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-3 text-emerald-500 text-xs text-left">
            <CheckCircle size={16} className="shrink-0" />
            {success}
          </div>
        )}

        {mode === 'register' && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        {mode !== 'forgot-password' && (
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        )}

        {mode === 'register' && (
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setRole('manager')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${role === 'manager' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${role === 'client' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Client
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Reset Password'}
              <ArrowRight size={18} />
            </>
          )}
        </button>

        <div className="flex items-center justify-between pt-2">
          {mode === 'login' ? (
            <>
              <button
                type="button"
                onClick={() => setMode('forgot-password')}
                className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Create Account
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors mx-auto"
            >
              Back to Sign In
            </button>
          )}
        </div>

        {mode === 'login' && Capacitor.getPlatform() === 'web' && (
          <>
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-slate-900 px-4 text-slate-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full bg-white/5 text-white py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 border border-white/10 transition-all active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Google
            </button>
          </>
        )}
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      </div>

      <div 
        className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl w-full max-w-md text-center"
      >
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg shadow-indigo-500/20">
          S
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">StratOS</h1>
        <p className="text-slate-400 mb-8 text-sm">
          {mode === 'login' ? 'Welcome back to your command center.' : 
           mode === 'register' ? 'Join the next generation of agency OS.' : 
           mode === 'forgot-password' ? 'Recover your access to StratOS.' :
           'Secure your account to continue.'}
        </p>

        {renderForm()}
        
        <div className="flex items-center gap-2 justify-center text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-8">
          <ShieldCheck size={14} />
          Secure Enterprise Authentication
        </div>
      </div>
    </div>
  );
}
