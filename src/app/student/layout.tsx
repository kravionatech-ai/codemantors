"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
  Loader2,
} from "lucide-react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login?redirect=/student/dashboard");
      } else if (user.role === "instructor") {
        router.replace("/instructor/dashboard");
      } else if (user.role === "admin" || user.role === "super_admin") {
        router.replace("/admin/dashboard");
      }
    }
  }, [user, loading, router]);

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

  if (!loading && user && user.role !== "student") {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
        <p className="text-xs font-semibold">Redirecting to authorized dashboard...</p>
      </div>
    );
  }

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
