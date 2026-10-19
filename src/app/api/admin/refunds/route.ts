import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Refund, Payment, Enrollment, Course, User } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { sendEmailAndNotify } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const refunds = await Refund.find()
      .populate("userId", "name email avatar")
      .populate("courseId", "title slug price thumbnail")
      .populate("paymentId", "orderId paymentId amount receipt")
      .sort({ requestedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, refunds });
  } catch (error: any) {
    console.error("Admin refunds list error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { refundId, action, adminNotes } = await req.json(); // action: "approve" | "reject"

    if (!refundId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Valid refundId and action ('approve' | 'reject') are required" },
        { status: 400 }
      );
    }

    const refund = await Refund.findById(refundId);
    if (!refund) {
      return NextResponse.json({ success: false, error: "Refund record not found" }, { status: 404 });
    }

    const course = await Course.findById(refund.courseId);
    const student = await User.findById(refund.userId);

    if (action === "approve") {
      refund.status = "succeeded";
      refund.processedAt = new Date();
      refund.adminNotes = adminNotes || "Refund approved by administrator";
      await refund.save();

      // Update payment
      await Payment.findByIdAndUpdate(refund.paymentId, {
        $set: { status: "refunded" },
      });

      // Update enrollment access
      await Enrollment.findByIdAndUpdate(refund.enrollmentId, {
        $set: { status: "refunded" },
      });

      // Decrement enrolled count
      if (course) {
        await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: -1 } });
      }

      // Notify student
      if (student) {
        sendEmailAndNotify({
          to: student.email,
          subject: `Refund Approved: ${course?.title || "Course"}`,
          text: `Your refund of INR ${refund.amount} for "${course?.title}" has been approved and processed. Your course enrollment has been updated accordingly.`,
          html: `<p>Your refund of <strong>INR ${refund.amount}</strong> for <strong>${course?.title}</strong> has been approved.</p>`,
          userId: student._id.toString(),
          type: "refund",
          link: "/student/dashboard",
        }).catch(console.error);
      }
    } else {
      refund.status = "rejected";
      refund.processedAt = new Date();
      refund.adminNotes = adminNotes || "Refund request rejected";
      await refund.save();

      if (student) {
        sendEmailAndNotify({
          to: student.email,
          subject: `Refund Request Update: ${course?.title || "Course"}`,
          text: `Your refund request for "${course?.title}" was not approved. Note: ${adminNotes || "Does not meet refund criteria."}`,
          html: `<p>Your refund request for <strong>${course?.title}</strong> was not approved.</p><p>Reason: ${adminNotes || "Standard policy terms."}</p>`,
          userId: student._id.toString(),
          type: "refund",
          link: "/student/dashboard",
        }).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, refund });
  } catch (error: any) {
    console.error("Admin refund processing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process refund" },
      { status: 500 }
    );
  }
}
