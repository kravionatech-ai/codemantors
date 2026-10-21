"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { accordionVariants } from "@/lib/motion";

interface FaqItem {
  q: string;
  a: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  allowMultiple?: boolean;
  className?: string;
}

export default function FaqAccordion({
  items,
  allowMultiple = false,
  className = "",
}: FaqAccordionProps) {
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  const toggleIndex = (index: number) => {
    if (allowMultiple) {
      setOpenIndices((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndices((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIndices.includes(index);
        return (
          <div
            key={index}
            className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-xs transition-colors"
          >
            <button
              type="button"
              onClick={() => toggleIndex(index)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-[#0F172A] hover:text-[#2563EB] transition-colors cursor-pointer select-none"
            >
              <span className="pr-4">{item.q}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="shrink-0 text-[#64748B]"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={accordionVariants}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-[#E2E8F0] pt-3">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
