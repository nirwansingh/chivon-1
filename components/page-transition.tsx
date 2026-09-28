'use client';

/**
 * PageTransition — entrance animation wrapper for page content.
 * Uses the shared pageTransition variant from lib/motion.
 * Uses `m` (lazy-loaded motion) instead of `motion` to keep bundle small.
 */

import { m, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { pageTransition } from '@/lib/motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        variants={pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full"
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
