/**
 * CodeMentors LMS — Lightweight Motion Utility & Presets
 * Powered by Framer Motion (v14+)
 *
 * Designed for subtle, high-performance interaction feedback.
 * Respects `prefers-reduced-motion` and avoids expensive layout thrashing.
 */

import { Variants, Transition } from "framer-motion";

// Standard restrained easing curve
export const standardEase = [0.25, 0.1, 0.25, 1.0] as const;

// 1. Fade In Preset (Small panels, tooltips, dialog backdrops)
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

// 2. Subtle Rise Preset (Page sections, card headers, tabs entrance)
export const subtleRise: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

// 3. Staggered Container for Lists / Grids
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

// 4. Card Hover Affordance
export const cardHoverTransition: Transition = {
  duration: 0.18,
  ease: "easeOut",
};

export const cardHoverProps = {
  whileHover: { y: -2, transition: cardHoverTransition },
  whileTap: { y: 0, scale: 0.995, transition: { duration: 0.1 } },
};

// 5. Button Press Interaction
export const buttonPressProps = {
  whileHover: { scale: 1.01, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } },
};

// 6. Modal / Dialog Transition (Backdrop & Content)
export const modalBackdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.18, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

export const modalContentVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 6 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

// 7. Dropdown & Navigation Drawer Transition
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: 0.14, ease: "easeIn" },
  },
};

export const mobileDrawerVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

// 8. Accordion Transition (Curriculum, FAQs)
export const accordionVariants: Variants = {
  hidden: { opacity: 0, height: 0, overflow: "hidden" },
  visible: {
    opacity: 1,
    height: "auto",
    overflow: "hidden",
    transition: { duration: 0.24, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    height: 0,
    overflow: "hidden",
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

// 9. Toast Notification Transition
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: 0.16, ease: "easeIn" },
  },
};

// 10. Tab Content Transition (Dashboard tabs, moderation tabs)
export const tabContentVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.14, ease: "easeIn" },
  },
};
