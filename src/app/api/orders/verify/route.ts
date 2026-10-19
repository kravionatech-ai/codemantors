import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Order, Payment, Enrollment, Course, Cart, AuditLog, Notification, Coupon } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { sendEmailAndNotify } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment verification parameters" },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Fetch Order
    const queryConditions: any[] = [{ razorpayOrderId }];
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      queryConditions.push({ _id: orderId });
    }

    const order = await Order.findOne({
      $or: queryConditions,
      userId: session.userId,
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order record not found" },
        { status: 404 }
      );
    }

    // Idempotency: if already paid, return success immediately
    if (order.status === "paid") {
      return NextResponse.json({
        success: true,
        message: "Order already verified and completed",
        orderId: order._id,
        orderNumber: order.orderNumber,
      });
    }

    // 2. Cryptographic Signature Verification
    const isValidSignature = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValidSignature) {
      order.status = "failed";
      order.errorDetails = "Cryptographic signature verification failed";
      await order.save();

      await AuditLog.create({
        action: "order_payment_tampering_detected",
        category: "security",
        userId: session.userId,
        resourceId: order._id.toString(),
        resourceType: "Order",
        status: "failure",
        details: { razorpayOrderId, razorpayPaymentId },
      });

      return NextResponse.json(
        { success: false, error: "Invalid payment verification signature. Transaction not approved." },
        { status: 400 }
      );
    }

    // 3. Mark Order as Paid
    order.status = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paidAt = new Date();
    await order.save();

    // 4. Create Payment Audit Record
    for (const item of order.items) {
      await Payment.create({
        userId: session.userId,
        courseId: item.courseId,
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
        amount: item.finalPrice,
        originalPrice: item.price,
        discountAmount: (item.price - item.finalPrice),
        currency: "INR",
        status: "completed",
        provider: "razorpay",
        receipt: `${order.orderNumber}-${item.courseId.toString().slice(-4)}`,
        metadata: {
          parentOrderNumber: order.orderNumber,
          parentOrderId: order._id.toString(),
        },
      });

      // 5. Grant Active Course Enrollment (Idempotently)
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

      // Increment course student count
      await Course.findByIdAndUpdate(item.courseId, {
        $inc: { enrolledCount: 1 },
      });
    }

    // 6. Clear Student Cart
    await Cart.findOneAndUpdate(
      { userId: session.userId },
      { $set: { items: [], couponCode: "" } }
    );

    // 6b. Increment Coupon Usage
    if (order.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: order.couponCode.trim().toUpperCase() },
        { $inc: { currentUses: 1 } }
      );
    }

    // 7. Audit Logging
    await AuditLog.create({
      action: "order_paid_and_enrolled",
      category: "payment",
      userId: session.userId,
      userEmail: session.email,
      resourceId: order._id.toString(),
      resourceType: "Order",
      status: "success",
      details: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        enrolledCoursesCount: order.items.length,
      },
    });

    // 8. Notifications
    const courseTitles = order.items.map((i) => i.title).join(", ");
    sendEmailAndNotify({
      to: session.email,
      subject: `Order Confirmed: ${order.orderNumber} - Welcome to CodeMentors!`,
      text: `Your payment of INR ${order.totalAmount} for ${courseTitles} was successful! You now have lifetime access to your enrolled courses.`,
      html: `<p>Thank you for your order <strong>${order.orderNumber}</strong>!</p><p>You now have full access to: <strong>${courseTitles}</strong>.</p><p><a href="${process.env.APP_BASE_URL || 'http://localhost:3005'}/student/courses">Open My Courses</a></p>`,
      userId: session.userId,
      type: "enrollment",
      link: "/student/courses",
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified! Your courses have been unlocked.",
      orderId: order._id,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
