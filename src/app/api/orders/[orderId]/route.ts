import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Order, User } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await props.params;
    const session = await getSessionUser(req);

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const isObjectId = mongoose.Types.ObjectId.isValid(orderId);
    const query: any = isObjectId
      ? { $or: [{ _id: orderId }, { orderNumber: orderId }] }
      : { orderNumber: orderId };

    const order = await Order.findOne(query)
      .populate("userId", "name email")
      .lean();

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // Permission check: owner or admin
    const isOwner = (order.userId as any)?._id?.toString() === session.userId;
    const isAdmin = session.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your order" }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Get order details error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load order details" },
      { status: 500 }
    );
  }
}
