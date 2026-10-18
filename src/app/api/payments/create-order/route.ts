import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, Payment, Coupon } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Please log in to checkout" }, { status: 401 });
    }

    await connectDB();
    const { courseId, couponCode } = await req.json();

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: session.userId,
      courseId: course._id,
      status: { $in: ["active", "completed"] },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: "You are already enrolled in this course." },
        { status: 400 }
      );
    }

    const originalPrice = course.discountPrice || course.price;
    let finalAmount = originalPrice;
    let discountAmount = 0;
    let appliedCoupon: any = null;

    if (couponCode && typeof couponCode === "string") {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        validUntil: { $gte: new Date() },
      });

      if (coupon) {
        if (coupon.maxUses === 0 || coupon.currentUses < coupon.maxUses) {
          if (coupon.discountType === "percentage") {
            discountAmount = Math.round((originalPrice * coupon.discountValue) / 100);
          } else {
            discountAmount = coupon.discountValue;
          }
          finalAmount = Math.max(0, originalPrice - discountAmount);
          appliedCoupon = coupon;
        }
      }
    }

    // If final amount is 0 (100% coupon), handle via zero-cost payment
    if (finalAmount <= 0) {
      const receipt = `rcpt_100disc_${Date.now()}`;
      const zeroPayment = await Payment.create({
        userId: session.userId,
        courseId: course._id,
        orderId: `order_free_${Date.now()}`,
        amount: 0,
        originalPrice,
        discountAmount,
        currency: "INR",
        status: "completed",
        couponCode: appliedCoupon?.code,
        provider: "free",
        receipt,
      });

      // Enroll directly
      await Enrollment.create({
        userId: session.userId,
        courseId: course._id,
        status: "active",
        paymentId: zeroPayment._id,
      });

      if (appliedCoupon) {
        await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { currentUses: 1 } });
      }

      return NextResponse.json({
        success: true,
        isZeroCost: true,
        message: "Coupon applied 100% discount! Course enrolled successfully.",
      });
    }

    // Create Razorpay order
    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const rzpOrder = await createRazorpayOrder({
      amount: finalAmount,
      currency: "INR",
      receipt,
      notes: {
        courseId: course._id.toString(),
        userId: session.userId,
        courseTitle: course.title,
      },
    });

    // Record pending payment
    await Payment.create({
      userId: session.userId,
      courseId: course._id,
      orderId: rzpOrder.id,
      amount: finalAmount,
      originalPrice,
      discountAmount,
      currency: "INR",
      status: "pending",
      couponCode: appliedCoupon?.code,
      provider: "razorpay",
      receipt,
    });

    return NextResponse.json({
      success: true,
      order: rzpOrder,
      course: {
        id: course._id,
        title: course.title,
        price: originalPrice,
        finalAmount,
        discountAmount,
      },
      user: {
        name: session.name,
        email: session.email,
      },
    });
  } catch (error: any) {
    console.error("Create payment order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
