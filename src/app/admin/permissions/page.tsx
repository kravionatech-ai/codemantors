"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Shield,
  ShieldCheck,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  RotateCcw,
  Users,
} from "lucide-react";

export default function AdminPermissionsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissionsList, setPermissionsList] = useState<string[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [activeRoleSlug, setActiveRoleSlug] = useState<string>("instructor");
  const [rolePermissions, setRolePermissions] = useState<Record<string, Set<string>>>({});

  const fetchPermissionsData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/permissions");
      const data = await res.json();
      if (data.success) {
        setPermissionsList(data.permissions || []);
        setRoles(data.roles || []);

        const map: Record<string, Set<string>> = {};
        (data.roles || []).forEach((r: any) => {
          map[r.slug] = new Set(r.permissions || []);
        });
        setRolePermissions(map);
      } else {
        toast.error(data.error || "Failed to load permissions matrix");
      }
    } catch {
      toast.error("Network error while loading permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissionsData();
  }, []);

  const handleTogglePermission = (roleSlug: string, perm: string) => {
    if (roleSlug === "super_admin") {
      toast.info("Super Administrator permissions cannot be modified.");
      return;
    }

    setRolePermissions((prev) => {
      const currentSet = new Set(prev[roleSlug] || []);
      if (currentSet.has(perm)) {
        currentSet.delete(perm);
      } else {
        currentSet.add(perm);
      }
      return { ...prev, [roleSlug]: currentSet };
    });
  };

  const handleSaveRolePermissions = async (roleSlug: string) => {
    setSaving(true);
    try {
      const permsArray = Array.from(rolePermissions[roleSlug] || []);
      const res = await fetch("/api/admin/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleSlug,
          permissions: permsArray,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Permissions for role "${roleSlug}" saved successfully!`);
        fetchPermissionsData();
      } else {
        toast.error(data.error || "Failed to update role permissions");
      }
    } catch {
      toast.error("Network error while saving permissions");
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by domain
  const permissionGroups: Record<string, string[]> = {
    "Course Governance": permissionsList.filter((p) => p.startsWith("courses.")),
    "Lessons & Curriculum": permissionsList.filter((p) => p.startsWith("lessons.")),
    "Payments & Financials": permissionsList.filter((p) => p.startsWith("payments.") || p.startsWith("refunds.")),
    "User & Identity Management": permissionsList.filter((p) => p.startsWith("users.") || p.startsWith("roles.") || p.startsWith("permissions.")),
    "SEO & Search Optimization": permissionsList.filter((p) => p.startsWith("seo.")),
    "CMS & Platform Settings": permissionsList.filter((p) => p.startsWith("cms.") || p.startsWith("settings.")),
    "Reporting & Security Audits": permissionsList.filter((p) => p.startsWith("reports.") || p.startsWith("audit_logs.")),
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-[#64748B]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
        <p className="text-sm">Loading granular Role-Based Access Control matrix...</p>
      </div>
    );
  }

  const activeRole = roles.find((r) => r.slug === activeRoleSlug) || roles[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-[#2563EB]" />
            Role-Based Access Control (RBAC) Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Configure server-enforced granular permissions for platform roles. All permission changes are logged in the security audit trail.
          </p>
        </div>

        <button
          onClick={() => handleSaveRolePermissions(activeRoleSlug)}
          disabled={saving || activeRoleSlug === "super_admin"}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#172554] hover:bg-[#1E3A8A] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#06B6D4]" />}
          Save {activeRole?.name} Permissions
        </button>
      </div>

      {/* Role Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-white border border-[#E2E8F0]">
        {roles.map((r) => {
          const isActive = r.slug === activeRoleSlug;
          return (
            <button
              key={r.slug}
              onClick={() => setActiveRoleSlug(r.slug)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? "bg-[#172554] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              {r.name}
              {r.isSystem && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-white/90">
                  System
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Role Description & Guard Banner */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-xs sm:text-sm text-[#172554]">
            Editing: {activeRole?.name} ({activeRole?.slug})
          </h4>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {activeRole?.description || "Configure operational boundaries and access rights for this user tier."}
          </p>
        </div>
      </div>

      {/* Permissions Matrix Table by Domain */}
      <div className="space-y-6">
        {Object.entries(permissionGroups).map(([groupTitle, perms]) => {
          if (perms.length === 0) return null;
          const roleSet = rolePermissions[activeRoleSlug] || new Set();

          return (
            <div
              key={groupTitle}
              className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-2xs"
            >
              <div className="px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0F172A]">{groupTitle}</h3>
                <span className="text-xs font-medium text-[#64748B]">
                  {perms.filter((p) => roleSet.has(p) || activeRoleSlug === "super_admin").length} / {perms.length} Enabled
                </span>
              </div>

              <div className="divide-y divide-[#E2E8F0]">
                {perms.map((perm) => {
                  const isChecked = roleSet.has(perm) || activeRoleSlug === "super_admin";
                  const isDisabled = activeRoleSlug === "super_admin";

                  return (
                    <div
                      key={perm}
                      className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold text-[#0F172A] block">
                          {perm}
                        </span>
                        <span className="text-[11px] text-[#64748B]">
                          Authorize users with role &apos;{activeRoleSlug}&apos; to execute {perm} operations.
                        </span>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => handleTogglePermission(activeRoleSlug, perm)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB] disabled:opacity-50"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
