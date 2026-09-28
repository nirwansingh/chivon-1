/**
 * Motion system for Chivon CRM/ERP
 * ─────────────────────────────────
 * Shared Framer Motion variants, spring tokens, and ease curves.
 * Import from here — never define animation values inline in components.
 *
 * Rules (see DESIGN.md §7):
 * - Animate transform and opacity only.
 * - Durations 150–350ms. Springs for interactive, ease-out for entrances.
 * - Per-row animation: first 12 rows only. No full-table stagger on large lists.
 * - reducedMotion is handled by <MotionConfig reducedMotion="user"> in MotionProvider.
 */

import type { Variants, Transition } from 'framer-motion';

// ─── Spring tokens ────────────────────────────────────────────────────────────

export const spring = {
  /** Buttons, toggles, quick interactive feedback */
  snappy: { type: 'spring', stiffness: 400, damping: 30 } satisfies Transition,
  /** Sidebar pill, modals, drawers */
  smooth: { type: 'spring', stiffness: 260, damping: 24 } satisfies Transition,
  /** Page transitions, gentle entrance */
  gentle: { type: 'spring', stiffness: 180, damping: 20 } satisfies Transition,
} as const;

// ─── Ease curves ──────────────────────────────────────────────────────────────

export const ease = {
  out: [0.0, 0.0, 0.2, 1] as [number, number, number, number],
  inOut: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
  standard: [0.2, 0.0, 0.0, 1] as [number, number, number, number],
} as const;

// ─── Shared variants ──────────────────────────────────────────────────────────

/** Fade up from slight vertical offset — primary entrance for cards, sections */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: ease.out },
  },
};

/** Simple opacity fade — for overlays, backdrops */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: ease.out },
  },
};

/** Scale + fade — modals, popovers, dropdowns */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.18, ease: ease.out },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.14, ease: ease.inOut },
  },
};

/** Slide in from left — toasts, side panels */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: ease.out },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.16, ease: ease.inOut },
  },
};

/** Slide in from right — drawers */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: spring.smooth,
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: { duration: 0.16, ease: ease.inOut },
  },
};

/**
 * Stagger container — wrap list parents with this.
 * Children should use staggerItem (or any variant).
 */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

/** Individual staggered list/table item — pair with staggerContainer */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: ease.out },
  },
};

// ─── Hover / tap shortcuts (use as whileHover / whileTap props) ───────────────

export const hoverLift = {
  y: -2,
  transition: { duration: 0.15, ease: ease.out },
} as const;

export const tapScale = { scale: 0.97 } as const;

export const hoverScale = {
  scale: 1.02,
  transition: { duration: 0.15, ease: ease.out },
} as const;

// ─── Page transition (used in template.tsx or PageTransition wrapper) ─────────

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: ease.inOut },
  },
};

// ─── MAX_STAGGER_ROWS ─────────────────────────────────────────────────────────
// Only stagger-animate the first N rows in a table/list.
// Beyond this, render without entrance animation.
export const MAX_STAGGER_ROWS = 12;
