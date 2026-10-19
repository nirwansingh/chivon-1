import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from './login-form';
import { QuickLogin } from './quick-login';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Chivon CRM',
  description: 'Sign in to Chivon Mechanical CRM & ERP system.',
};

const isDevSwitchEnabled =
  process.env.NODE_ENV !== 'production' && process.env.DEV_USER_SWITCH === 'true';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex">
      {/*
        ── Left panel: branded, animated gradient background ──
        Hidden on mobile (form is shown full-width instead)
      */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12 relative overflow-hidden login-bg-drift"
        aria-hidden="true"
      >
        {/* Subtle blueprint grid overlay */}
        <div
          className="absolute inset-0 blueprint-grid opacity-10"
          aria-hidden="true"
        />

        {/* Brand content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <Link href="/" className="transition-opacity hover:opacity-80 block">
              <img src="/logo.png" alt="Chivon Logo" className="h-12 object-contain" />
            </Link>
          </div>

          <blockquote className="space-y-4">
            <p className="text-white/90 text-2xl font-semibold leading-snug" style={{ fontFamily: 'var(--font-heading)' }}>
              Precision engineering,<br />streamlined operations.
            </p>
            <p className="text-blue-200 text-sm leading-relaxed">
              Manage your customers, quotations, invoices, and payments — all in one place, built for Chivon Mechanical.
            </p>
          </blockquote>
        </div>

        <p className="relative z-10 text-blue-300 text-xs">
          © {new Date().getFullYear()} Chivon Mechanical LLC
        </p>
      </div>

      {/*
        ── Right panel: form ──
      */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16" style={{ background: 'var(--background)' }}>
        <div className="w-full max-w-md space-y-8">
          {/* Mobile-only brand header */}
          <div className="flex items-center gap-3 lg:hidden">
            <Link href="/" className="transition-opacity hover:opacity-80 block">
              <img src="/logo.png" alt="Chivon Logo" className="h-10 object-contain" />
            </Link>
          </div>

          {/* Form header */}
          <div>
            <h1 className="text-h1 text-foreground">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your account to continue.
            </p>
          </div>

          {/* Login form */}
          <LoginForm />

          {/* Dev quick login */}
          {isDevSwitchEnabled && <QuickLogin />}
        </div>
      </div>
    </div>
  );
}
