import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, AuditLog } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, reason } = await req.json();
    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID required" }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findOne({
      _id: orderId,
      userId: session.userId,
      status: "pending",
    });

    if (order) {
      order.status = "cancelled";
      order.errorDetails = reason || "Checkout closed by user";
      await order.save();

      await AuditLog.create({
        action: "order_cancelled",
        category: "payment",
        userId: session.userId,
        resourceId: order._id.toString(),
        resourceType: "Order",
        details: { reason: order.errorDetails },
      });
    }

    return NextResponse.json({ success: true, message: "Order cancelled" });
  } catch (error: any) {
    console.error("Order cancellation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel order" },
      { status: 500 }
    );
  }
}
