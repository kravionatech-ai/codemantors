import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Coupon, Course } from "@/models";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { code, courseId } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      validUntil: { $gte: new Date() },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired coupon code" },
        { status: 404 }
      );
    }

    if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
      return NextResponse.json(
        { success: false, error: "This coupon has reached its maximum usage limit" },
        { status: 400 }
      );
    }

    let originalPrice = 0;
    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) {
        originalPrice = course.discountPrice || course.price;
      }
    }

    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = Math.round((originalPrice * coupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(originalPrice, coupon.discountValue);
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalPrice,
      },
    });
  } catch (error: any) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
