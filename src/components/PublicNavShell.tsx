"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventPopupModal from "@/components/marketing/EventPopupModal";

interface PublicNavShellProps {
  children: React.ReactNode;
}

export default function PublicNavShell({ children }: PublicNavShellProps) {
  const routerPathname = usePathname();
  const windowPathname = typeof window !== "undefined" ? window.location.pathname : "";
  const pathname = routerPathname || windowPathname || "";

  // Dedicated Auth routes: must NEVER render public header or footer
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  // Role-based Dashboards: render their own dedicated layouts & sidebars
  const isDashboardRoute =
    pathname.startsWith("/student") ||
    pathname.startsWith("/instructor") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard");

  // Dedicated Learning Room: focused distraction-free player
  const isLearningRoute = pathname === "/learn" || pathname.startsWith("/learn/");

  const shouldHidePublicNav = isAuthRoute || isDashboardRoute || isLearningRoute;

  if (shouldHidePublicNav) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <EventPopupModal />
    </div>
  );
}
