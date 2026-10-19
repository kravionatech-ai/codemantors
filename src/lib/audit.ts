import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";

export interface LogAuditOptions {
  action: string;
  category?: "course" | "user" | "permission" | "payment" | "refund" | "cms" | "seo" | "settings" | "auth" | "admin" | "security";
  resourceId?: string;
  resource?: string;
  userId?: string | any;
  userEmail?: string;
  userRole?: string;
  actorId?: string;
  actorRole?: string;
  details?: string | Record<string, any> | any;
  status?: "success" | "failure" | "warning";
  metadata?: Record<string, any>;
  req?: Request;
}

export const recordAuditLog = logAuditEvent;

export async function logAuditEvent(options: LogAuditOptions): Promise<void> {
  try {
    await connectDB();

    let ipAddress = "";
    let userAgent = "";

    if (options.req) {
      ipAddress =
        options.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        options.req.headers.get("x-real-ip") ||
        "";
      userAgent = options.req.headers.get("user-agent") || "";
    }

    const serializedDetails =
      typeof options.details === "string"
        ? options.details
        : options.details
        ? JSON.stringify(options.details)
        : "";

    await AuditLog.create({
      action: options.action,
      category: options.category || "admin",
      resourceId: options.resourceId || options.resource || "",
      userId: options.userId,
      userEmail: options.userEmail,
      actorId: options.actorId || (options.userId ? String(options.userId) : ""),
      actorRole: options.actorRole || options.userRole || "",
      details: serializedDetails,
      status: options.status || "success",
      ipAddress,
      userAgent,
      metadata: options.metadata || {},
    });
  } catch (err) {
    console.error("Failed to persist audit log entry:", err);
  }
}
