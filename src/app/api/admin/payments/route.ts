import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Payment } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const payments = await Payment.find()
      .populate("userId", "name email")
      .populate("courseId", "title slug price")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    console.error("Admin payments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
