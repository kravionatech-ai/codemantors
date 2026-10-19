"use client";

import React from "react";
import Link from "next/link";
import DashboardShell, { DashboardNavItem } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Users,
  Star,
  BarChart3,
  MessageSquare,
  Settings,
  ExternalLink,
} from "lucide-react";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const sidebarNavItems: DashboardNavItem[] = [
    { name: "Overview", href: "/instructor/dashboard", icon: LayoutDashboard },
    { name: "My Courses", href: "/instructor/courses", icon: BookOpen },
    { name: "Create Course", href: "/instructor/courses/new", icon: PlusCircle },
    { name: "Student Enrollments", href: "/instructor/enrollments", icon: Users },
    { name: "Reviews & Feedback", href: "/instructor/reviews", icon: Star },
    { name: "Course Analytics", href: "/instructor/analytics", icon: BarChart3 },
    { name: "Q&A & Announcements", href: "/instructor/qa", icon: MessageSquare },
    { name: "Studio Settings", href: "/instructor/settings", icon: Settings },
  ];

  return (
    <DashboardShell
      role="instructor"
      roleBadgeText="Instructor"
      roleBadgeClass="bg-blue-50 text-[#172554] border-blue-200"
      portalName="Instructor Studio"
      sidebarSectionTitle="Studio Management"
      navItems={sidebarNavItems}
      activeLinkClass="bg-blue-50 text-[#172554] font-semibold"
      activeIconClass="text-[#2563EB]"
      headerRightActions={
        <Link
          href="/courses"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A] px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 transition-colors"
        >
          <span>View Public Catalog</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      }
    >
      {children}
    </DashboardShell>
  );
}
