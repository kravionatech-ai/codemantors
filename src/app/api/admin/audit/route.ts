import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AuditLog } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "audit_logs.read") && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: Record<string, any> = {};
    if (category && category !== "all") query.category = category;
    if (status && status !== "all") query.status = status;
    if (search && search.trim()) {
      query.$or = [
        { action: { $regex: search.trim(), $options: "i" } },
        { details: { $regex: search.trim(), $options: "i" } },
        { resourceId: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const logs = await AuditLog.find(query)
      .populate("actorId", "name email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("Admin audit logs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
