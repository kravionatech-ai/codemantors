import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Payment, Enrollment, Course, Refund, AuditLog, Order } from "@/models";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // 1. Verify Cryptographic Signature
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("Unauthorized webhook attempt: invalid signature");
      return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 400 });
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    await connectDB();

    const eventId = event.event_id || event.id || `event_${Date.now()}`;
    const eventType = event.event;

    // 2. Idempotency Check: Prevent duplicate event execution
    const existingLog = await AuditLog.findOne({
      action: `webhook_${eventType}`,
      resourceId: eventId,
    });

    if (existingLog) {
      return NextResponse.json({ success: true, message: "Event already processed idempotently" });
    }

    const payload = event.payload || {};
    const paymentEntity = payload.payment?.entity;
    const orderEntity = payload.order?.entity;
    const refundEntity = payload.refund?.entity;

    // 3. Process Specific Razorpay Events
    switch (eventType) {
      case "payment.captured":
      case "order.paid": {
        const orderId = paymentEntity?.order_id || orderEntity?.id;
        const paymentId = paymentEntity?.id;

        if (orderId) {
          // Reconcile multi-course Order
          const order = await Order.findOne({ razorpayOrderId: orderId });
          if (order && order.status !== "paid") {
            order.status = "paid";
            if (paymentId) order.razorpayPaymentId = paymentId;
            order.paidAt = new Date();
            await order.save();

            for (const item of order.items) {
              const existingEnr = await Enrollment.findOne({
                userId: order.userId,
                courseId: item.courseId,
              });
              if (!existingEnr) {
                await Enrollment.create({
                  userId: order.userId,
                  courseId: item.courseId,
                  status: "active",
                  progressPercentage: 0,
                  completedLessons: [],
                  enrolledAt: new Date(),
                });
                await Course.findByIdAndUpdate(item.courseId, { $inc: { enrolledCount: 1 } });
              } else if (existingEnr.status !== "active" && existingEnr.status !== "completed") {
                existingEnr.status = "active";
                await existingEnr.save();
              }
            }
          }

          // Also check single course payment record
          const payment = await Payment.findOne({ orderId });
          if (payment) {
            payment.status = "completed";
            if (paymentId) payment.paymentId = paymentId;
            if (paymentEntity?.method) payment.paymentMethod = paymentEntity.method;
            await payment.save();

            // Grant active enrollment idempotently
            let enrollment = await Enrollment.findOne({
              userId: payment.userId,
              courseId: payment.courseId,
            });

            if (!enrollment) {
              enrollment = await Enrollment.create({
                userId: payment.userId,
                courseId: payment.courseId,
                paymentId: payment._id,
                status: "active",
                progressPercentage: 0,
                completedLessons: [],
                enrolledAt: new Date(),
              });

              await Course.findByIdAndUpdate(payment.courseId, {
                $inc: { enrolledCount: 1 },
              });
            } else if (enrollment.status !== "active" && enrollment.status !== "completed") {
              enrollment.status = "active";
              enrollment.paymentId = payment._id;
              await enrollment.save();
            }
          }
        }
        break;
      }

      case "payment.failed": {
        const orderId = paymentEntity?.order_id;
        if (orderId) {
          const payment = await Payment.findOne({ orderId });
          if (payment && payment.status === "pending") {
            payment.status = "failed";
            payment.errorDescription = paymentEntity?.error_description || "Payment failed at gateway";
            await payment.save();
          }
        }
        break;
      }

      case "refund.processed":
      case "refund.created": {
        const paymentId = refundEntity?.payment_id;
        const providerRefundId = refundEntity?.id;

        if (paymentId) {
          const payment = await Payment.findOne({ paymentId });
          if (payment) {
            payment.status = "refunded";
            await payment.save();

            // Reconcile Refund record
            const refund = await Refund.findOne({ paymentId: payment._id });
            if (refund) {
              refund.status = "succeeded";
              refund.providerRefundId = providerRefundId;
              refund.processedAt = new Date();
              await refund.save();
            }

            // Revoke course access
            await Enrollment.findOneAndUpdate(
              { userId: payment.userId, courseId: payment.courseId },
              { $set: { status: "refunded" } }
            );

            await Course.findByIdAndUpdate(payment.courseId, {
              $inc: { enrolledCount: -1 },
            });
          }
        }
        break;
      }

      default:
        // Other informational events
        break;
    }

    // 4. Record Audit Log for Idempotency & Audit Trail
    await AuditLog.create({
      action: `webhook_${eventType}`,
      category: "payment",
      resourceId: eventId,
      resourceType: "razorpay_webhook",
      status: "success",
      details: {
        eventType,
        orderId: paymentEntity?.order_id || orderEntity?.id,
        paymentId: paymentEntity?.id,
      },
    });

    return NextResponse.json({ success: true, eventProcessed: eventType });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process webhook" },
      { status: 500 }
    );
  }
}
