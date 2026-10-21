"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { subtleRise, fadeIn, cardHoverProps } from "@/lib/motion";

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

interface MotionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function MotionCard({ children, className = "", ...props }: MotionCardProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div className={className} {...cardHoverProps} {...(props as any)}>
      {children}
    </motion.div>
  );
}

export default MotionEntrance;
