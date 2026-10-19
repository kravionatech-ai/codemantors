"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} rounded-xl border border-[#E2E8F0] bg-white shadow-xl p-6 z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
          {title && <h3 className="text-base font-bold text-[#0F172A]">{title}</h3>}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors ml-auto cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
