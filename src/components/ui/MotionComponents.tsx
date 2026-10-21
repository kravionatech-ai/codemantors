"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  subtleRise,
  fadeIn,
  cardHoverProps,
  scrollRevealVariants,
  staggerContainerVariants,
  staggerItemVariants,
} from "@/lib/motion";

interface RevealSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  yOffset?: number;
}

/**
 * Scroll-triggered section reveal that animates into view when crossing the viewport threshold.
 * Uses `whileInView` with `once: true`. Respects `prefers-reduced-motion`.
 */
export function RevealSection({
  children,
  className = "",
  delay = 0,
  threshold = 0.15,
  yOffset = 20,
}: RevealSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
  threshold?: number;
}

/**
 * Orchestrates staggered appearance of child items (such as course cards or feature items)
 * when entering the viewport.
 */
export function StaggerContainer({
  children,
  className = "",
  delayChildren = 0.04,
  staggerChildren = 0.08,
  threshold = 0.1,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren,
            delayChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  yOffset?: number;
}

/**
 * Individual item participating in a `StaggerContainer`.
 */
export function StaggerItem({
  children,
  className = "",
  yOffset = 16,
}: StaggerItemProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: yOffset },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: "easeOut" },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Smooth opacity fade-in on viewport entrance.
 */
export function FadeIn({ children, className = "", delay = 0 }: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface CardHoverProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Interactive card wrapper providing subtle -3px hover lift and tap feedback.
 */
export function CardHover({ children, className = "", ...props }: CardHoverProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      whileHover={{ y: -3, transition: { duration: 0.18, ease: "easeOut" } }}
      whileTap={{ y: 0, scale: 0.995, transition: { duration: 0.1 } }}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

interface MotionEntranceProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "rise" | "fade";
}

export function MotionEntrance({
  children,
  className = "",
  delay = 0,
  variant = "rise",
}: MotionEntranceProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const selectedVariant = variant === "fade" ? fadeIn : subtleRise;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={selectedVariant}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({ children, className = "", ...props }: CardHoverProps) {
  return <CardHover className={className} {...props}>{children}</CardHover>;
}

export default RevealSection;
