import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, Enrollment, Payment } from "@/models";
import { getSessionUser } from "@/lib/auth";
import { sendEmailAndNotify, generateEnrollmentEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Please log in to enroll" }, { status: 401 });
    }

    await connectDB();
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }

    if (!course.isFree || (course.price !== undefined && course.price > 0)) {
      return NextResponse.json(
        { success: false, error: "This course requires payment. Please complete checkout to enroll." },
        { status: 400 }
      );
    }

    // Check existing enrollment
    let enrollment = await Enrollment.findOne({
      userId: session.userId,
      courseId: course._id,
    });

    if (enrollment && enrollment.status === "active") {
      return NextResponse.json({
        success: true,
        message: "You are already enrolled in this course",
        enrollment,
      });
    }

    // Create free payment record for audit
    const receipt = `rcpt_free_${Date.now()}`;
    const payment = await Payment.create({
      userId: session.userId,
      courseId: course._id,
      orderId: `order_free_${Date.now()}`,
      paymentId: `pay_free_${Date.now()}`,
      amount: 0,
      originalPrice: 0,
      discountAmount: 0,
      status: "completed",
      provider: "free",
      receipt,
    });

    if (enrollment) {
      enrollment.status = "active";
      enrollment.paymentId = payment._id;
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        userId: session.userId,
        courseId: course._id,
        status: "active",
        progressPercentage: 0,
        completedLessons: [],
        paymentId: payment._id,
      });
    }

    // Increment course enrolledCount
    await Course.findByIdAndUpdate(course._id, { $inc: { enrolledCount: 1 } });

    // Send confirmation
    const emailData = generateEnrollmentEmail(session.name, course.title);
    sendEmailAndNotify({
      to: session.email,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html,
      userId: session.userId,
      type: "enrollment",
      link: `/learn/${course.slug}/${course.modules?.[0]?.lessons?.[0]?._id?.toString() || ""}`,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Successfully enrolled in free course!",
      enrollment,
    });
  } catch (error: any) {
    console.error("Free enrollment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to complete enrollment" },
      { status: 500 }
    );
  }
}
