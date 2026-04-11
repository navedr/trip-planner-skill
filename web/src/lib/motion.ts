/** Shared Framer Motion variants for staggered entrance animations */

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
} as const;

export const staggerSlow = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;
