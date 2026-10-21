"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, ArrowRight, Sparkles, Tag, ExternalLink } from "lucide-react";

interface PopupData {
  _id: string;
  name: string;
  headline: string;
  description: string;
  badgeText?: string;
  badgeColor?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  imageAlt: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  displayFrequency: "always" | "once_per_session" | "once_per_day" | "once_per_campaign";
  displayDelaySeconds: number;
  dismissalBehavior: "close_button" | "outside_click" | "both";
}

const SENSITIVE_PATHS = [
  "/checkout",
  "/order-confirmation",
  "/login",
  "/register",
  "/learn",
  "/admin",
  "/cart",
  "/course-basket",
];

export default function EventPopupModal() {
  const pathname = usePathname();
  const router = useRouter();

  const [popup, setPopup] = useState<PopupData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Check if frequency criteria allows displaying this popup
  const shouldDisplayByFrequency = useCallback((pop: PopupData): boolean => {
    try {
      if (pop.displayFrequency === "always") return true;

      const sessionKey = `cm_popup_session_${pop._id}`;
      const dayKey = `cm_popup_day_${pop._id}`;
      const dismissedKey = `cm_popup_dismissed_${pop._id}`;

      if (pop.displayFrequency === "once_per_session") {
        if (sessionStorage.getItem(sessionKey)) return false;
      } else if (pop.displayFrequency === "once_per_day") {
        const today = new Date().toISOString().slice(0, 10);
        if (localStorage.getItem(dayKey) === today) return false;
      } else if (pop.displayFrequency === "once_per_campaign") {
        if (localStorage.getItem(dismissedKey)) return false;
      }

      return true;
    } catch {
      return true;
    }
  }, []);

  // Mark frequency key once displayed
  const markAsDisplayed = useCallback((pop: PopupData) => {
    try {
      const sessionKey = `cm_popup_session_${pop._id}`;
      const dayKey = `cm_popup_day_${pop._id}`;
      const today = new Date().toISOString().slice(0, 10);

      sessionStorage.setItem(sessionKey, "true");
      localStorage.setItem(dayKey, today);
    } catch {}
  }, []);

  // Mark campaign permanently dismissed if needed
  const markAsDismissed = useCallback((pop: PopupData) => {
    try {
      const dismissedKey = `cm_popup_dismissed_${pop._id}`;
      localStorage.setItem(dismissedKey, "true");
    } catch {}
  }, []);

  // Fetch active popup for the current route
  useEffect(() => {
    if (!pathname) return;

    // NEVER run promotional overlays on sensitive or learning flows
    const isSensitive = SENSITIVE_PATHS.some((prefix) => {
      if (prefix === "/learn") {
        return pathname === "/learn" || pathname.startsWith("/learn/");
      }
      return pathname.startsWith(prefix);
    });
    if (isSensitive) {
      setIsOpen(false);
      setPopup(null);
      return;
    }

    let isCancelled = false;
    let timer: NodeJS.Timeout | null = null;

    async function loadActivePopup() {
      try {
        const res = await fetch(`/api/popups/active?pathname=${encodeURIComponent(pathname)}`);
        const data = await res.json();

        if (isCancelled) return;

        if (data.success && data.popup) {
          const pop: PopupData = data.popup;
          if (shouldDisplayByFrequency(pop)) {
            setPopup(pop);
            const delayMs = Math.max(0, (pop.displayDelaySeconds || 2) * 1000);

            timer = setTimeout(() => {
              if (isCancelled) return;
              setIsOpen(true);
              markAsDisplayed(pop);
              // Record impression asynchronously
              fetch(`/api/popups/${pop._id}/impression`, { method: "POST" }).catch(() => {});
            }, delayMs);
          }
        } else {
          setPopup(null);
          setIsOpen(false);
        }
      } catch {
        // Silently fail on network disruption without blocking UI
        setPopup(null);
        setIsOpen(false);
      }
    }

    loadActivePopup();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pathname, shouldDisplayByFrequency, markAsDisplayed]);

  // Handle dismissal
  const handleDismiss = useCallback(
    (reason: "close_btn" | "outside" | "key") => {
      if (!popup) return;

      if (reason === "outside" && popup.dismissalBehavior === "close_button") {
        return; // Click outside disallowed by campaign settings
      }

      setIsOpen(false);
      markAsDismissed(popup);
      fetch(`/api/popups/${popup._id}/dismiss`, { method: "POST" }).catch(() => {});
    },
    [popup, markAsDismissed]
  );

  // Handle CTA Click
  const handleCtaClick = () => {
    if (!popup) return;

    fetch(`/api/popups/${popup._id}/click`, { method: "POST" }).catch(() => {});
    setIsOpen(false);
    markAsDismissed(popup);

    const dest = popup.ctaUrl?.trim() || "/courses";
    if (dest.startsWith("/")) {
      router.push(dest);
    } else {
      window.location.href = dest;
    }
  };

  // Keyboard accessibility: ESC key dismisses popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleDismiss("key");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleDismiss]);

  if (!isOpen || !popup) return null;

  const badgeColorClass =
    popup.badgeColor === "amber"
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : popup.badgeColor === "rose"
      ? "bg-rose-100 text-rose-800 border-rose-300"
      : popup.badgeColor === "purple"
      ? "bg-purple-100 text-purple-800 border-purple-300"
      : popup.badgeColor === "blue"
      ? "bg-blue-100 text-[#2563EB] border-blue-300"
      : "bg-emerald-100 text-emerald-800 border-emerald-300";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => handleDismiss("outside")}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => handleDismiss("close_btn")}
          aria-label="Close promotional announcement"
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#64748B] hover:text-[#0F172A] border border-[#CBD5E1] flex items-center justify-center shadow-md transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Campaign Banner Image */}
        {popup.imageUrl && (
          <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden">
            <img
              src={popup.imageUrl}
              alt={popup.imageAlt || popup.headline}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Optional Floating Badge on image */}
            {popup.badgeText && (
              <div className="absolute top-3 left-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs backdrop-blur-md ${badgeColorClass}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{popup.badgeText}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Text Content & CTAs */}
        <div className="p-6 sm:p-7 space-y-4 text-center sm:text-left">
          {/* Badge if no image */}
          {!popup.imageUrl && popup.badgeText && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeColorClass}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{popup.badgeText}</span>
            </span>
          )}

          <div>
            <h3
              id="promo-popup-title"
              className="text-xl sm:text-2xl font-black text-[#172554] tracking-tight leading-snug"
            >
              {popup.headline}
            </h3>
            {popup.description && (
              <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
                {popup.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleCtaClick}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{popup.ctaText || "Explore Now"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {popup.secondaryCtaText && popup.secondaryCtaUrl && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  const sUrl = popup.secondaryCtaUrl?.trim() || "/courses";
                  if (sUrl.startsWith("/")) router.push(sUrl);
                  else window.location.href = sUrl;
                }}
                className="w-full sm:w-auto py-3 px-4 rounded-xl border border-[#CBD5E1] text-[#0F172A] hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                {popup.secondaryCtaText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
