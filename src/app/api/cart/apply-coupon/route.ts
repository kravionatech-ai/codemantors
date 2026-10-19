import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Cart, Coupon } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { code, remove } = await req.json();
    await connectDB();

    let cart = await Cart.findOne({ userId: session.userId });
    if (!cart) {
      cart = new Cart({ userId: session.userId, items: [] });
    }

    if (remove) {
      cart.couponCode = "";
      await cart.save();
      return NextResponse.json({ success: true, message: "Coupon removed" });
    }

    if (!code || !code.trim()) {
      return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      validUntil: { $gte: new Date() },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired promo code" },
        { status: 400 }
      );
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json(
        { success: false, error: "This promo code has reached its maximum redemptions" },
        { status: 400 }
      );
    }

    cart.couponCode = coupon.code;
    await cart.save();

    return NextResponse.json({
      success: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (error: any) {
    console.error("Apply coupon error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to apply coupon" },
      { status: 500 }
    );
  }
}
