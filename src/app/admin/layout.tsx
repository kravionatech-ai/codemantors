"use client";

import React from "react";
import DashboardShell, { DashboardNavItem } from "@/components/dashboard/DashboardShell";
import {
  LayoutDashboard,
  Users,
  Shield,
  Sliders,
  ShoppingBag,
  BookOpen,
  Sparkles,
  FileText,
  Globe,
  History,
  CreditCard,
  RotateCcw,
  Tag,
  Settings,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const sidebarNavItems: DashboardNavItem[] = [
    { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users & Accounts", href: "/admin/users", icon: Users },
    { name: "Permissions & RBAC", href: "/admin/permissions", icon: Shield },
    { name: "Instructor Quotas", href: "/admin/instructors/limits", icon: Sliders },
    { name: "Order Management", href: "/admin/orders", icon: ShoppingBag },
    { name: "Course Moderation", href: "/admin/courses", icon: BookOpen },
    { name: "Events & Offers Popups", href: "/admin/marketing/popups", icon: Sparkles },
    { name: "Dynamic CMS Pages", href: "/admin/cms/pages", icon: FileText },
    { name: "Technical Blog", href: "/admin/blog", icon: BookOpen },
    { name: "SEO Control Center", href: "/admin/seo", icon: Globe },
    { name: "Audit Trail", href: "/admin/audit", icon: History },
    { name: "Payments & Ledger", href: "/admin/payments", icon: CreditCard },
    { name: "Refund Requests", href: "/admin/refunds", icon: RotateCcw },
    { name: "Categories & Tags", href: "/admin/categories", icon: Tag },
    { name: "Platform Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <DashboardShell
      role="admin"
      roleBadgeText="Admin"
      roleBadgeClass="bg-rose-50 text-[#DC2626] border-rose-200"
      portalName="Admin Governance"
      sidebarSectionTitle="Governance & Ops"
      navItems={sidebarNavItems}
      activeLinkClass="bg-rose-50 text-[#DC2626] font-semibold"
      activeIconClass="text-[#DC2626]"
      headerRightActions={
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span>System Operational</span>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
