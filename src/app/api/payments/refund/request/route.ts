import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Payment, Enrollment, Refund, Course } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { sendEmailAndNotify } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { courseId, reason } = await req.json();

    if (!courseId || !reason || reason.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid reason for the refund request" },
        { status: 400 }
      );
    }

    // Find enrollment
    const enrollment = await Enrollment.findOne({
      userId: session.userId,
      courseId,
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "No active enrollment found for this course" },
        { status: 404 }
      );
    }

    if (enrollment.status === "refunded") {
      return NextResponse.json(
        { success: false, error: "This enrollment has already been refunded" },
        { status: 400 }
      );
    }

    // Find latest completed payment
    const payment = await Payment.findOne({
      userId: session.userId,
      courseId,
      status: "completed",
    }).sort({ createdAt: -1 });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: "No completed payment record found to refund" },
        { status: 400 }
      );
    }

    // Check if refund request already exists and is pending
    const existingRefund = await Refund.findOne({
      paymentId: payment._id,
      status: { $in: ["requested", "approved", "processing"] },
    });

    if (existingRefund) {
      return NextResponse.json({
        success: true,
        message: "A refund request is already pending review for this purchase.",
        refund: existingRefund,
      });
    }

    const course = await Course.findById(courseId);

    // Create refund record with status "requested"
    const refund = await Refund.create({
      paymentId: payment._id,
      enrollmentId: enrollment._id,
      userId: session.userId,
      courseId,
      amount: payment.amount,
      reason: reason.trim(),
      status: "requested",
      requestedAt: new Date(),
    });

    // Notify student and admin
    sendEmailAndNotify({
      to: session.email,
      subject: `Refund Request Submitted: ${course?.title || "Course"}`,
      text: `Your refund request for amount INR ${payment.amount} has been received and is currently under review by our admin team.`,
      html: `<p>Your refund request for <strong>${course?.title}</strong> (INR ${payment.amount}) has been received.</p>`,
      userId: session.userId,
      type: "refund",
      link: "/dashboard",
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Refund request submitted successfully. Our team will review within 24-48 hours.",
      refund,
    });
  } catch (error: any) {
    console.error("Refund request error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit refund request" },
      { status: 500 }
    );
  }
}
