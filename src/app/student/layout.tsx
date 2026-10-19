"use client";

import React from "react";
import Link from "next/link";
import DashboardShell, { DashboardNavItem } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Compass,
  Bookmark,
  Award,
  Settings,
  HelpCircle,
  Search,
} from "lucide-react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const sidebarNavItems: DashboardNavItem[] = [
    { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "My Courses", href: "/student/courses", icon: BookOpen },
    { name: "Payment History", href: "/student/payments", icon: CreditCard },
    { name: "Learning Paths", href: "/learning-paths", icon: Compass },
    { name: "Bookmarks", href: "/student/bookmarks", icon: Bookmark },
    { name: "Certificates", href: "/student/certificates", icon: Award },
    { name: "Profile & Settings", href: "/student/settings", icon: Settings },
    { name: "Help & Support", href: "/help", icon: HelpCircle },
  ];

  return (
    <DashboardShell
      role="student"
      roleBadgeText="Student"
      roleBadgeClass="bg-blue-50 text-[#2563EB] border-blue-200"
      portalName="Student Portal"
      sidebarSectionTitle="Learning Menu"
      navItems={sidebarNavItems}
      activeLinkClass="bg-blue-50 text-[#2563EB] font-semibold"
      activeIconClass="text-[#2563EB]"
      headerRightActions={
        <Link
          href="/courses"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Browse Catalog</span>
        </Link>
      }
    >
      {children}
    </DashboardShell>
  );
}
