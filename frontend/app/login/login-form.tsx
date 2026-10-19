'use client';

import { useActionState } from 'react';
import { loginWithCredentials } from './actions';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

export function LoginForm() {
  const [state, action, pending] = useActionState(loginWithCredentials, null);

  return (
    <form action={action} className="space-y-4" noValidate>
      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="block text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Email address
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'var(--muted-foreground)' }}
            aria-hidden="true"
          />
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full h-10 pl-9 pr-4 text-sm rounded-lg border bg-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky focus:border-primary"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            placeholder="you@chivon.com"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="block text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Password
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'var(--muted-foreground)' }}
            aria-hidden="true"
          />
          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full h-10 pl-9 pr-4 text-sm rounded-lg border bg-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-sky focus:border-primary"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {state?.error && (
          <m.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex items-center gap-2 rounded-lg p-3 text-sm"
            style={{ background: '#FEF2F2', color: 'var(--danger)' }}
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{state.error}</span>
          </m.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full h-10 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 disabled:opacity-60 active:scale-[0.98]"
        style={{
          background: pending
            ? 'var(--primary)'
            : 'linear-gradient(135deg, #0B4F9E 0%, #0A3F82 100%)',
        }}
        aria-label={pending ? 'Signing in…' : 'Sign in to Chivon CRM'}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Signing in…</span>
          </>
        ) : (
          'Sign in'
        )}
      </button>
    </form>
  );
}
