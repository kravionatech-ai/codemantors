import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, Payment, Coupon, User } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { sendEmailAndNotify, generateEnrollmentEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required payment parameters" },
        { status: 400 }
      );
    }

    // 1. Verify cryptographic signature
    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, error: "Invalid payment signature verification failed" },
        { status: 400 }
      );
    }

    // 2. Find pending payment record
    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment record not found for this order" },
        { status: 404 }
      );
    }

    // Duplicate callback protection
    if (payment.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Payment already verified and active",
      });
    }

    // 3. Mark payment as completed
    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.status = "completed";
    await payment.save();

    // 4. Update coupon usage if applicable
    if (payment.couponCode) {
      await Coupon.findOneAndUpdate(
        { code: payment.couponCode },
        { $inc: { currentUses: 1 } }
      );
    }

    // 5. Grant course enrollment idempotently
    const course = await Course.findById(payment.courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Associated course no longer exists" },
        { status: 404 }
      );
    }

    let enrollment = await Enrollment.findOne({
      userId: payment.userId,
      courseId: payment.courseId,
    });

    if (enrollment) {
      enrollment.status = "active";
      enrollment.paymentId = payment._id;
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        userId: payment.userId,
        courseId: payment.courseId,
        status: "active",
        progressPercentage: 0,
        completedLessons: [],
        paymentId: payment._id,
      });
    }

    // Increment enrolled count
    await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });

    // 6. Send transactional confirmation email and in-app notification
    const student = await User.findById(payment.userId);
    const emailData = generateEnrollmentEmail(student?.name || session.name, course.title);
    sendEmailAndNotify({
      to: student?.email || session.email,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      userId: payment.userId.toString(),
      type: "payment",
      link: `/learn/${course.slug}/${course.modules?.[0]?.lessons?.[0]?._id?.toString() || ""}`,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully and enrollment granted!",
      enrollmentId: enrollment._id,
      courseSlug: course.slug,
    });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
