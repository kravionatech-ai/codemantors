"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/ui/Modal";
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  Calendar,
  ShieldAlert,
} from "lucide-react";

export default function AdminAuditLogsPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Inspect Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "all") params.append("category", category);
      if (status !== "all") params.append("status", status);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      } else {
        toast.error(data.error || "Failed to load audit logs");
      }
    } catch {
      toast.error("Network error while loading audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [category, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] flex items-center gap-2.5">
          <History className="w-7 h-7 text-[#2563EB]" />
          Security & Operational Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Immutable event log tracking administrative operations, permissions mutations, course publications, and financial transactions.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by action, details, or resource ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-lg bg-[#172554] text-white font-semibold cursor-pointer"
          >
            Filter
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#64748B]">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            >
              <option value="all">All Categories</option>
              <option value="course">Course Actions</option>
              <option value="permission">Permissions & Roles</option>
              <option value="user">User Governance</option>
              <option value="payment">Payments</option>
              <option value="refund">Refunds</option>
              <option value="cms">CMS & Pages</option>
              <option value="seo">SEO & Redirects</option>
              <option value="settings">Platform Settings</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#64748B]">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A]"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wider">
            Audit Records ({logs.length})
          </span>
          <span className="text-xs text-[#64748B]">Showing most recent 100 entries</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#64748B]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563EB] mb-3" />
            <p className="text-sm">Querying audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-[#64748B] text-xs">
            No audit records match your selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-semibold border-b border-[#E2E8F0]">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Actor / Role</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {logs.map((log) => {
                  const actor = log.actorId || {};
                  const isSuccess = log.status === "success";

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3 text-[#64748B] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase bg-slate-100 text-[#0F172A]">
                          {log.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono font-bold text-[#0F172A]">
                        {log.action}
                      </td>
                      <td className="px-6 py-3 text-[#0F172A]">
                        <span className="font-semibold block">{actor.name || log.actorRole || "System"}</span>
                        <span className="text-[11px] text-[#64748B]">{actor.email || ""}</span>
                      </td>
                      <td
                        className="px-6 py-3 text-[#64748B] max-w-xs truncate"
                        title={typeof log.details === "string" ? log.details : (log.details ? JSON.stringify(log.details) : "")}
                      >
                        {typeof log.details === "string"
                          ? log.details
                          : (log.details ? JSON.stringify(log.details) : (log.resourceId || "—"))}
                      </td>
                      <td className="px-6 py-3">
                        {isSuccess ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-[#16A34A] flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Success
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-[#DC2626] flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setInspectModalOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-slate-100 text-[#2563EB] cursor-pointer"
                          title="Inspect Metadata"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspector Modal */}
      {inspectModalOpen && selectedLog && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`Audit Log Inspector: ${selectedLog.action}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-[#E2E8F0]">
              <div>
                <span className="text-[#64748B] block text-[11px]">Action</span>
                <span className="font-mono font-bold text-[#0F172A]">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Category</span>
                <span className="font-semibold text-[#0F172A] uppercase">{selectedLog.category}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Resource ID</span>
                <span className="font-mono text-[#0F172A]">{selectedLog.resourceId || "—"}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Timestamp</span>
                <span className="text-[#0F172A]">{new Date(selectedLog.createdAt).toISOString()}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">IP Address</span>
                <span className="font-mono text-[#0F172A]">{selectedLog.ipAddress || "Internal / Local"}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[11px]">Actor Role</span>
                <span className="font-semibold text-[#2563EB]">{selectedLog.actorRole || "system"}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-[#0F172A] block mb-1">Details Summary</span>
              <p className="p-3 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] leading-relaxed break-words whitespace-pre-wrap">
                {typeof selectedLog.details === "string"
                  ? selectedLog.details
                  : (selectedLog.details ? JSON.stringify(selectedLog.details, null, 2) : "No narrative details recorded.")}
              </p>
            </div>

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <span className="font-bold text-[#0F172A] block mb-1">Structured Metadata Snapshot</span>
                <pre className="p-3 rounded-lg border border-[#E2E8F0] bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-60">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#172554] text-white font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
