"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import {
  Code2,
  BookOpen,
  Bell,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  GraduationCap,
  Menu,
  X,
  Search,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications if user is logged in
  useEffect(() => {
    if (user) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const markAllNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  // Fetch site settings for dynamic navigation & announcement banner
  useEffect(() => {
    fetch("/api/cms/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSiteSettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  const navLinks: { name: string; href: string }[] = siteSettings?.navigation?.headerLinks?.length > 0
    ? siteSettings.navigation.headerLinks
        .filter((l: any) => l.isVisible !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((l: any) => ({ name: l.label, href: l.href }))
    : [
        { name: "Explore Courses", href: "/courses" },
        { name: "Learning Paths", href: "/learning-paths" },
        { name: "Blog", href: "/blog" },
        { name: "Verify Certificate", href: "/certificates/verify" },
        { name: "About", href: "/about" },
        { name: "FAQ", href: "/faq" },
      ];

  return (
    <>
      {/* Top Dynamic Announcement Banner */}
      {siteSettings?.announcementBanner?.enabled && siteSettings?.announcementBanner?.text && showAnnouncement && (
        <div
          className="w-full px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2 relative shadow-xs"
          style={{
            backgroundColor: siteSettings.announcementBanner.backgroundColor || "#2563EB",
            color: siteSettings.announcementBanner.textColor || "#FFFFFF",
          }}
        >
          <span>{siteSettings.announcementBanner.text}</span>
          {siteSettings.announcementBanner.link && (
            <Link href={siteSettings.announcementBanner.link} className="underline hover:opacity-80">
              Learn More →
            </Link>
          )}
          <button
            onClick={() => setShowAnnouncement(false)}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-[#172554] flex items-center justify-center shadow-xs transition-colors group-hover:bg-[#1E3A8A]">
              <Code2 className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-[#172554]">
                CodeMentors
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                LMS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "text-[#2563EB] bg-blue-50 font-semibold"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick Search */}
            <Link
              href="/courses"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] hover:border-slate-300 text-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Search courses...</span>
              <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] bg-white text-[#64748B] rounded border border-[#E2E8F0]">
                /
              </kbd>
            </Link>

            {/* Course Basket Button */}
            <Link
              href="/course-basket"
              className="relative p-2 rounded-lg text-[#64748B] hover:text-[#172554] hover:bg-slate-100 transition-colors"
              title="Course Basket"
              aria-label="Course Basket"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2563EB] text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#DC2626] text-[10px] font-bold text-white flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E2E8F0] bg-white shadow-xl p-4 z-50">
                      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                        <span className="text-sm font-semibold text-[#0F172A]">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="text-xs text-[#2563EB] hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-center py-6 text-xs text-[#64748B]">
                            No notifications yet
                          </p>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <div
                              key={n._id}
                              className={`p-3 rounded-lg text-xs border ${
                                n.isRead
                                  ? "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]"
                                  : "bg-blue-50/60 border-blue-200 text-[#0F172A]"
                              }`}
                            >
                              <p className="font-semibold text-[#0F172A]">{n.title}</p>
                              <p className="mt-0.5 line-clamp-2 text-[#64748B]">{n.message}</p>
                              {n.link && (
                                <Link
                                  href={n.link}
                                  onClick={() => setNotificationsOpen(false)}
                                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#2563EB] font-medium hover:underline"
                                >
                                  View details <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard Direct Shortcut */}
                {user.role === "admin" && (
                  <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-[#DC2626] border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition-colors"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
                {user.role === "instructor" && (
                  <Link
                    href="/instructor/dashboard"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Studio
                  </Link>
                )}
                {user.role === "student" && (
                  <Link
                    href="/student/dashboard"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-[#172554] border border-[#E2E8F0] text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                )}

                {/* User Avatar & Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 transition-colors"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-7 h-7 rounded-md object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-md bg-[#172554] text-[#06B6D4] flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-medium text-[#0F172A] max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </button>

                  {/* Profile Menu Dropdown */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#E2E8F0] bg-white shadow-xl p-2 z-50">
                      <div className="px-3 py-2 border-b border-[#E2E8F0]">
                        <p className="text-xs font-semibold text-[#0F172A] truncate">{user.name}</p>
                        <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#2563EB] border border-blue-200">
                          {user.role}
                        </span>
                      </div>
                      <div className="py-1 space-y-0.5">
                        <Link
                          href="/student/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-[#0F172A] hover:bg-slate-50 rounded-lg"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-[#2563EB]" />
                          Student Dashboard
                        </Link>
                        {user.role === "instructor" && (
                          <Link
                            href="/instructor/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-[#0F172A] hover:bg-slate-50 rounded-lg"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-[#2563EB]" />
                            Instructor Studio
                          </Link>
                        )}
                        {user.role === "admin" && (
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-[#0F172A] hover:bg-slate-50 rounded-lg"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" />
                            Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="pt-1 border-t border-[#E2E8F0]">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#DC2626] hover:bg-red-50 rounded-lg font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] rounded-lg border border-[#E2E8F0] hover:bg-slate-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#172554] hover:bg-[#1E3A8A] rounded-lg shadow-xs transition-colors"
                >
                  Start Learning
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button & Basket */}
          <div className="flex items-center gap-1 md:hidden">
            <Link
              href="/course-basket"
              className="relative p-2 rounded-lg text-[#64748B] hover:text-[#172554]"
              title="Course Basket"
              aria-label="Course Basket"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2563EB] text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2E8F0] bg-white px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-[#0F172A] hover:bg-slate-50"
              >
                {link.name}
              </Link>
            ))}

            <Link
              href="/course-basket"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-[#0F172A] hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#2563EB]" />
                Course Basket
              </span>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#2563EB] text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0]">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="text-xs font-semibold text-[#0F172A]">{user.name}</p>
                  <p className="text-[11px] text-[#64748B]">{user.email}</p>
                </div>
                <Link
                  href="/student/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-[#0F172A] hover:bg-slate-50"
                >
                  Student Dashboard
                </Link>
                {user.role === "instructor" && (
                  <Link
                    href="/instructor/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-[#0F172A] hover:bg-slate-50"
                  >
                    Instructor Studio
                  </Link>
                )}
                {user.role === "admin" && (
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-[#0F172A] hover:bg-slate-50"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-3 py-2 rounded-lg text-xs font-semibold border border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-3 py-2 rounded-lg text-xs font-semibold bg-[#172554] text-white hover:bg-[#1E3A8A]"
                >
                  Start Learning
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
    </>
  );
}
