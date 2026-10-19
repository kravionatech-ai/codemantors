import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order, Cart, Course, Enrollment, Coupon, AuditLog } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Please sign in to proceed with checkout" },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const directCourseId = body.courseId; // If direct "Buy Now"

    let courseIds: string[] = [];
    let couponCodeToApply = body.couponCode || "";

    if (directCourseId) {
      courseIds = [directCourseId];
    } else {
      const cart = await Cart.findOne({ userId: session.userId });
      if (!cart || !cart.items || cart.items.length === 0) {
        return NextResponse.json(
          { success: false, error: "Your shopping cart is empty" },
          { status: 400 }
        );
      }
      courseIds = cart.items.map((i) => i.courseId.toString());
      if (!couponCodeToApply && cart.couponCode) {
        couponCodeToApply = cart.couponCode;
      }
    }

    // Check if user already owns any of these courses
    const existingEnrollments = await Enrollment.find({
      userId: session.userId,
      courseId: { $in: courseIds },
      status: { $in: ["active", "completed"] },
    }).populate("courseId", "title").lean();

    if (existingEnrollments.length > 0) {
      const titles = existingEnrollments.map((e: any) => e.courseId?.title).filter(Boolean);
      return NextResponse.json(
        {
          success: false,
          error: `You are already enrolled in: ${titles.join(", ")}. Please remove them before checkout.`,
          enrolledCourses: titles,
        },
        { status: 400 }
      );
    }

    // Fetch authoritative course pricing from DB
    const courses = await Course.find({
      _id: { $in: courseIds },
      status: "published",
    })
      .populate("instructor", "name")
      .lean();

    if (courses.length === 0) {
      return NextResponse.json(
        { success: false, error: "No published courses found for checkout" },
        { status: 404 }
      );
    }

    let subtotal = 0;
    const orderItems = courses.map((c: any) => {
      const effectivePrice = c.isFree ? 0 : (c.discountPrice ?? c.price);
      subtotal += effectivePrice;
      return {
        courseId: c._id,
        title: c.title,
        thumbnail: c.thumbnail || "",
        instructorName: c.instructor?.name || "CodeMentors Instructor",
        price: c.price,
        discountPrice: c.discountPrice,
        finalPrice: effectivePrice,
      };
    });

    // Authoritative Coupon Validation
    let discountAmount = 0;
    if (couponCodeToApply && subtotal > 0) {
      const coupon = await Coupon.findOne({
        code: couponCodeToApply.trim().toUpperCase(),
        isActive: true,
        validUntil: { $gte: new Date() },
      });

      if (coupon && (!coupon.maxUses || coupon.currentUses < coupon.maxUses)) {
        if (coupon.discountType === "percentage") {
          discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
        } else {
          discountAmount = Math.min(subtotal, coupon.discountValue);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);

    // Generate unique internal order number
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `CM-${timestamp}-${randomSuffix}`;
    const receipt = `rcpt_${orderNumber.toLowerCase()}`;

    // Free order case (e.g. 100% discount or free course)
    if (totalAmount === 0) {
      const freeOrder = await Order.create({
        orderNumber,
        userId: session.userId,
        items: orderItems,
        subtotal,
        discountAmount,
        couponCode: couponCodeToApply,
        totalAmount: 0,
        currency: "INR",
        status: "paid",
        razorpayOrderId: `free_${Date.now()}`,
        receipt,
        paidAt: new Date(),
        paymentMethod: "free_grant",
      });

      // Grant enrollments immediately
      for (const item of orderItems) {
        await Enrollment.findOneAndUpdate(
          { userId: session.userId, courseId: item.courseId },
          {
            $set: {
              status: "active",
              progressPercentage: 0,
              completedLessons: [],
              enrolledAt: new Date(),
            },
          },
          { upsert: true, new: true }
        );
        await Course.findByIdAndUpdate(item.courseId, { $inc: { enrolledCount: 1 } });
      }

      // Increment coupon usage if applied
      if (couponCodeToApply) {
        await Coupon.findOneAndUpdate(
          { code: couponCodeToApply.trim().toUpperCase() },
          { $inc: { currentUses: 1 } }
        );
      }

      // Clear cart
      await Cart.findOneAndUpdate({ userId: session.userId }, { $set: { items: [], couponCode: "" } });

      return NextResponse.json({
        success: true,
        isFree: true,
        orderId: freeOrder._id,
        orderNumber: freeOrder.orderNumber,
      });
    }

    // Paid Order: Create Razorpay Order with authoritative server amount
    const rzpOrder = await createRazorpayOrder({
      amount: totalAmount,
      currency: "INR",
      receipt,
      notes: {
        orderNumber,
        userId: session.userId,
        customerEmail: session.email,
      },
    });

    const order = await Order.create({
      orderNumber,
      userId: session.userId,
      items: orderItems,
      subtotal,
      discountAmount,
      couponCode: couponCodeToApply,
      totalAmount,
      currency: "INR",
      status: "pending",
      razorpayOrderId: rzpOrder.id,
      receipt,
    });

    await AuditLog.create({
      action: "order_created",
      category: "payment",
      userId: session.userId,
      userEmail: session.email,
      resourceId: order._id.toString(),
      resourceType: "Order",
      details: {
        orderNumber,
        razorpayOrderId: rzpOrder.id,
        totalAmount,
        itemCount: orderItems.length,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: totalAmount,
      amountInPaise: Math.round(totalAmount * 100),
      currency: "INR",
      keyId: rzpOrder.keyId,
      customer: {
        name: session.name,
        email: session.email,
      },
      items: orderItems,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initialize order checkout" },
      { status: 500 }
    );
  }
}
