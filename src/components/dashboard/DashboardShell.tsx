"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Code2,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export interface DashboardNavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeClass?: string;
}

export interface DashboardShellProps {
  role: "admin" | "instructor" | "student";
  roleBadgeText: string;
  roleBadgeClass: string;
  portalName: string;
  sidebarSectionTitle: string;
  navItems: DashboardNavItem[];
  activeLinkClass: string;
  activeIconClass: string;
  headerRightActions?: React.ReactNode;
  children: React.ReactNode;
}

export default function DashboardShell({
  role,
  roleBadgeText,
  roleBadgeClass,
  portalName,
  sidebarSectionTitle,
  navItems,
  activeLinkClass,
  activeIconClass,
  headerRightActions,
  children,
}: DashboardShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname() || "";
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Helper to determine if a navigation item is active
  const isItemActive = (itemHref: string) => {
    if (pathname === itemHref) return true;

    // Handle root dashboard aliases
    if (itemHref === "/admin/dashboard" && pathname === "/admin") return true;
    if (itemHref === "/instructor/dashboard" && pathname === "/instructor") return true;
    if (itemHref === "/student/dashboard" && pathname === "/dashboard") return true;

    // Handle nested sub-routes (e.g. /admin/courses/new matches /admin/courses)
    // Avoid matching root overview for all nested routes
    const isRootOverview =
      itemHref === "/admin/dashboard" ||
      itemHref === "/instructor/dashboard" ||
      itemHref === "/student/dashboard";

    if (!isRootOverview && pathname.startsWith(itemHref + "/")) {
      return true;
    }

    return false;
  };

  // Find the active nav item to display accurate page title in header breadcrumb
  // Sort by href length descending so specific subroutes match first
  const activeItem = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => isItemActive(item.href));

  const pageTitle = activeItem ? activeItem.name : "Overview";

  // Reset main content scroll position to top and close drawer upon route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll and register Escape key listener when mobile drawer is open
  useEffect(() => {
    if (!mobileDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileDrawerOpen]);

  // Role subtitle text in user card
  const getUserSubtext = () => {
    if (!user) return "";
    if (role === "admin") {
      return user.role === "super_admin" ? "Super Administrator" : "Administrator";
    }
    if (role === "instructor") {
      return user.role === "instructor" ? "Course Instructor" : user.email;
    }
    return user.email || "Student";
  };

  const getAvatarBadgeClass = () => {
    if (role === "admin") {
      return "bg-rose-100 text-[#DC2626]";
    }
    return "bg-[#172554] text-[#06B6D4]";
  };

  return (
    <div className="h-screen h-[100dvh] flex overflow-hidden bg-[#F8FAFC] w-full relative">
      {/* 1. DESKTOP STICKY SIDEBAR (Pinned full viewport height, independent nav scroll) */}
      <aside
        aria-label={`${portalName} Sidebar`}
        className="hidden md:flex flex-col w-64 shrink-0 border-r border-[#E2E8F0] bg-white h-full select-none z-20"
      >
        {/* Pinned Brand Header */}
        <div className="h-16 shrink-0 px-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#172554] flex items-center justify-center shadow-xs transition-colors group-hover:bg-[#1E3A8A]">
              <Code2 className="w-4 h-4 text-[#06B6D4]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-[#172554]">CodeMentors</span>
              <span
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${roleBadgeClass}`}
              >
                {roleBadgeText}
              </span>
            </div>
          </Link>
        </div>

        {/* Independently Scrollable Navigation Area */}
        <nav
          aria-label={sidebarSectionTitle}
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-4 px-3 space-y-1"
        >
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
            {sidebarSectionTitle}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  active
                    ? activeLinkClass
                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? activeIconClass : "text-[#94A3B8]"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeClass || "bg-blue-100 text-[#2563EB]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Pinned User Profile & Sign Out Footer */}
        <div className="shrink-0 p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          {user && (
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarBadgeClass()}`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="truncate min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] truncate">{user.name}</p>
                  <p className="text-[11px] text-[#64748B] truncate">{getUserSubtext()}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Sign out of your account"
                className="p-1.5 text-[#94A3B8] hover:text-[#DC2626] rounded-md hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTENT SHELL (Sticky Header + Scrollable Content) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* STICKY DASHBOARD HEADER */}
        <header className="h-16 shrink-0 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-xs px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          {/* Left: Mobile Menu Trigger + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 -ml-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 md:hidden focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer"
              aria-label="Open navigation menu"
              aria-expanded={mobileDrawerOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0 truncate">
              <span className="text-[#64748B] hidden sm:inline truncate">{portalName}</span>
              <span className="text-[#94A3B8] hidden sm:inline shrink-0">/</span>
              <span className="font-semibold text-[#0F172A] truncate">{pageTitle}</span>
            </div>
          </div>

          {/* Right: Role-specific Actions + User Profile + Sign Out */}
          <div className="flex items-center gap-3 shrink-0">
            {headerRightActions}

            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#0F172A] hidden lg:inline max-w-[150px] truncate">
                  {user.name}
                </span>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#DC2626] bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* SINGLE PREDICTABLE VERTICAL SCROLL CONTAINER */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 focus:outline-none p-4 sm:p-6 lg:p-8"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* 3. MOBILE & TABLET COLLAPSIBLE SIDEBAR DRAWER */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label={`${portalName} Navigation Drawer`}>
          {/* Backdrop with blur & Escape click */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-[85vw] bg-white border-r border-[#E2E8F0] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Pinned Header */}
            <div className="h-16 shrink-0 px-6 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#172554] flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4 text-[#06B6D4]" />
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-base text-[#172554] truncate">CodeMentors</span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border shrink-0 ${roleBadgeClass}`}
                  >
                    {roleBadgeText}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Independently Scrollable Navigation */}
            <nav
              aria-label={`${portalName} Mobile Navigation`}
              className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-4 px-3 space-y-1.5"
            >
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                {sidebarSectionTitle}
              </p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? activeLinkClass
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? activeIconClass : "text-[#94A3B8]"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.badgeClass || "bg-blue-100 text-[#2563EB]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Pinned Footer */}
            <div className="shrink-0 p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              {user && (
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarBadgeClass()}`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-[#0F172A] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{getUserSubtext()}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-[#DC2626] font-semibold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
