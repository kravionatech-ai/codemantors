"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import {
  Smartphone,
  Monitor,
  Tablet,
  ShieldCheck,
  User,
  Bell,
  LogOut,
  Clock,
  MapPin,
  CheckCircle2,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";

export default function AdminSessionsSettingsPage() {
  const toast = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/admin/account/sessions");
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch {
      toast.error("Failed to load active login sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to revoke this session? The device will be signed out immediately.")) {
      return;
    }
    setRevokingId(sessionId);
    try {
      const res = await fetch(`/api/admin/account/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchSessions();
      } else {
        toast.error(data.error || "Failed to revoke session");
      }
    } catch {
      toast.error("Error revoking session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm("Sign out of all other devices and active browser windows? Your current session will remain active.")) {
      return;
    }
    setRevokingAll(true);
    try {
      const res = await fetch("/api/admin/account/sessions?action=revoke_all_others", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchSessions();
      } else {
        toast.error(data.error || "Failed to revoke sessions");
      }
    } catch {
      toast.error("Error revoking sessions");
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-5">
        <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">
          Admin Management & Security
        </span>
        <h1 className="text-2xl font-black text-[#172554] tracking-tight mt-1 flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-[#2563EB]" />
          Active Login Sessions & Devices
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Review devices and IP addresses currently authenticated to your administrator account. Revoke unauthorized or obsolete sessions.
        </p>

        {/* Account Tabs */}
        <div className="flex flex-wrap gap-6 mt-6 border-b border-[#E2E8F0] text-xs font-semibold">
          <Link
            href="/admin/settings/account"
            className="pb-2.5 border-b-2 border-transparent text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            Profile Information
          </Link>
          <Link
            href="/admin/settings/security"
            className="pb-2.5 border-b-2 border-transparent text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Passwords
          </Link>
          <Link
            href="/admin/settings/notifications"
            className="pb-2.5 border-b-2 border-transparent text-[#64748B] hover:text-[#0F172A] flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications
          </Link>
          <Link
            href="/admin/settings/sessions"
            className="pb-2.5 border-b-2 border-[#2563EB] text-[#2563EB] flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Active Sessions
          </Link>
        </div>
      </div>

      {/* Sessions Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A]">Authenticated Workstations ({sessions.length})</h2>
          <p className="text-xs text-[#64748B]">Sessions automatically expire after 7 days of inactivity.</p>
        </div>

        {sessions.length > 1 && (
          <button
            onClick={handleRevokeAllOthers}
            disabled={revokingAll}
            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            {revokingAll ? "Signing out..." : "Revoke All Other Sessions"}
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-[#64748B]">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#2563EB] mb-2" />
            <p className="text-xs">Loading active login sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-[#E2E8F0] text-xs text-[#64748B]">
            No active sessions found.
          </div>
        ) : (
          sessions.map((sess, idx) => {
            const isCurrent = idx === 0;
            return (
              <div
                key={sess._id || sess.sessionId}
                className="p-5 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
                    {sess.deviceType === "mobile" ? (
                      <Smartphone className="w-5 h-5" />
                    ) : sess.deviceType === "tablet" ? (
                      <Tablet className="w-5 h-5" />
                    ) : (
                      <Monitor className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0F172A] text-sm">
                        {sess.browser || "Browser"} on {sess.os || "Desktop Device"}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                          Current Workstation
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64748B]">
                      <span className="font-mono text-[#0F172A]">IP: {sess.ipAddress}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#94A3B8]" />
                        {sess.location || "Local Network"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#94A3B8]" />
                        Active {new Date(sess.lastActiveAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {!isCurrent && (
                  <button
                    onClick={() => handleRevokeSession(sess.sessionId)}
                    disabled={revokingId === sess.sessionId}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-rose-50 hover:text-rose-600 text-xs font-semibold text-[#64748B] transition-colors cursor-pointer"
                  >
                    {revokingId === sess.sessionId ? "Revoking..." : "Revoke Access"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
