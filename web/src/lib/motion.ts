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

/** Direction-aware page transition variants for mobile navigation */
export const pageSlide = {
  enter: (direction: "forward" | "back") => ({
    x: direction === "forward" ? "100%" : "-30%",
    opacity: direction === "forward" ? 0 : 0.5,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const },
  },
  exit: (direction: "forward" | "back") => ({
    x: direction === "forward" ? "-30%" : "100%",
    opacity: direction === "forward" ? 0.5 : 0,
    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const },
  }),
};

/** Desktop page transition (unchanged existing behavior as a named variant) */
export const pageFade = {
  enter: { opacity: 0, y: 8 },
  center: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  },
};
