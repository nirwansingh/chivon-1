'use client';

/**
 * MotionProvider — wraps the app with:
 * - LazyMotion (domAnimation features only — smaller bundle)
 * - MotionConfig with reducedMotion="user" to respect prefers-reduced-motion
 *
 * Place this high in the tree (root layout), but keep it client-only.
 * Server Components remain unaffected.
 */

import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
