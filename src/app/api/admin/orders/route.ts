import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, User } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (search.trim()) {
      query.$or = [
        { orderNumber: { $regex: search.trim(), $options: "i" } },
        { razorpayOrderId: { $regex: search.trim(), $options: "i" } },
        { razorpayPaymentId: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const orders = await Order.find(query)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error("Admin orders list error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin orders" },
      { status: 500 }
    );
  }
}
