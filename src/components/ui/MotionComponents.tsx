"use client";

import React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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
  threshold = 0.05,
  yOffset = 16,
}: RevealSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold, margin: "150px" }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
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
  threshold = 0.05,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold, margin: "150px" }}
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

interface Card3DTiltProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}

/**
 * Interactive 3D tilt card with perspective and dynamic specular sheen.
 * Automatically disabled on reduced motion or non-hover environments.
 */
export function Card3DTilt({
  children,
  className = "",
  maxTilt = 5,
  glare = true,
  ...props
}: Card3DTiltProps) {
  const shouldReduceMotion = useReducedMotion();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = React.useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false,
  });

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, glareX, glareY, isHovered: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50, isHovered: false });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
        y: tilt.isHovered ? -4 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 24, mass: 0.6 }}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={`relative ${className}`}
      {...(props as any)}
    >
      {children}
      {glare && tilt.isHovered && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-200"
          style={{
            background: `radial-gradient(circle 200px at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.18), transparent 80%)`,
            zIndex: 25,
          }}
        />
      )}
    </motion.div>
  );
}

interface ParallaxScrollProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}

/**
 * Scroll-linked parallax layer using useScroll and useTransform.
 */
export function ParallaxScroll({
  children,
  className = "",
  speed = 16,
}: ParallaxScrollProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-speed, speed]);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

export default RevealSection;
