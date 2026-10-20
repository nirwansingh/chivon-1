import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/components/toast-provider';
import { MotionProvider } from '@/components/motion-provider';

// ─── Fonts ────────────────────────────────────────────────────────────────────
// Plus Jakarta Sans — geometric, distinctive headings
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

// Inter — clean, highly legible body/UI font
const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

// JetBrains Mono — document numbers, monospace data
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'Chivon CRM/ERP',
    template: '%s | Chivon CRM',
  },
  description:
    'Internal CRM & ERP system for Chivon Mechanical — customers, quotations, sales orders, invoices, and payments.',
  robots: 'noindex, nofollow', // Internal app — never index
};

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <MotionProvider>
          <TooltipProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </TooltipProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
