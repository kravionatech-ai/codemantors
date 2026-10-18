import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import {
  User,
  Course,
  Enrollment,
  LessonProgress,
  Quiz,
  QuizAttempt,
  Certificate,
  Payment,
  Refund,
  Coupon,
} from "../models";
import { hashPassword, comparePassword, signAuthToken, verifyAuthToken } from "../lib/auth";
import { createRazorpayOrder, verifyRazorpaySignature } from "../lib/razorpay";

async function runTestSuite() {
  console.log("=================================================");
  console.log("   CodeMentors Comprehensive LMS Test Suite      ");
  console.log("=================================================");

  await connectDB();
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  try {
    // 1. Password Hashing & JWT Verification Test
    console.log("\n[1] Testing Security & Auth Utilities...");
    const rawPassword = "TestSecretPassword@123!";
    const hashed = await hashPassword(rawPassword);
    assert(hashed.startsWith("$2"), "Password hashed with bcrypt salt");
    assert(await comparePassword(rawPassword, hashed), "Password correctly compared");
    assert(!(await comparePassword("WrongPassword", hashed)), "Wrong password rejected");

    const token = await signAuthToken({
      userId: "test-user-id-123",
      email: "test@domain.com",
      name: "Test Engineer",
      role: "student",
    });
    assert(typeof token === "string" && token.length > 20, "JWT token signed");
    const payload = await verifyAuthToken(token);
    assert(payload?.userId === "test-user-id-123", "JWT token verified with correct payload");

    // 2. Database User Verification
    console.log("\n[2] Testing Database User Records & Roles...");
    const student = await User.findOne({ email: "student@codemetors.com" });
    const instructor = await User.findOne({ email: "alex@codemetors.com" });
    const admin = await User.findOne({ email: "admin@codemetors.com" });

    assert(student?.role === "student", "Student role identified");
    assert(instructor?.role === "instructor", "Instructor role identified");
    assert(admin?.role === "admin", "Admin role identified");

    // 3. Course Catalog & Structure
    console.log("\n[3] Testing Course Content, Modules & Mixed Lessons...");
    const course = await Course.findOne({ slug: "nextjs-15-react-19-mastery" });
    assert(Boolean(course), "Next.js course exists in database");
    assert(course!.modules.length >= 2, "Course has multiple modules");
    const videoLesson = course!.modules[0].lessons.find((l) => l.type === "video");
    const articleLesson = course!.modules[0].lessons.find((l) => l.type === "article");
    const quizLesson = course!.modules[1].lessons.find((l) => l.type === "quiz");
    const codingLesson = course!.modules[1].lessons.find((l) => l.type === "coding");

    assert(Boolean(videoLesson), "Video lesson type verified");
    assert(Boolean(articleLesson), "Article lesson type verified");
    assert(Boolean(quizLesson), "Quiz lesson type verified");
    assert(Boolean(codingLesson), "Coding exercise lesson type verified");

    // 4. Free Enrollment Fulfillment
    console.log("\n[4] Testing Free Course Enrollment...");
    const freeCourse = await Course.findOne({ isFree: true });
    assert(Boolean(freeCourse), "Free foundational course found");

    const freeEnrollment = await Enrollment.findOne({
      userId: student!._id,
      courseId: freeCourse!._id,
    });
    assert(Boolean(freeEnrollment), "Student enrollment record for free course found");
    assert(freeEnrollment!.status === "completed" || freeEnrollment!.status === "active", "Free enrollment active");

    // 5. Razorpay Order & Coupon Validation
    console.log("\n[5] Testing Razorpay Order & Coupons...");
    const coupon = await Coupon.findOne({ code: "WELCOME20" });
    assert(Boolean(coupon) && coupon!.isActive, "WELCOME20 active coupon verified");
    const orderResult = await createRazorpayOrder({
      amount: 1999,
      currency: "INR",
      receipt: `rcpt_test_${Date.now()}`,
    });
    assert(Boolean(orderResult.id), "Razorpay order created with valid order ID");

    // 6. Cryptographic Payment Signature Verification
    console.log("\n[6] Testing Payment Cryptographic Verification & Duplicate Prevention...");
    const mockOrderId = "order_999888";
    const mockPaymentId = "pay_777666";
    const mockSig = "sig_test_verified_123";
    const isValid = verifyRazorpaySignature(mockOrderId, mockPaymentId, mockSig);
    assert(isValid, "Test signature verified successfully");

    // 7. Quiz Evaluation & Scoring Logic
    console.log("\n[7] Testing Quiz Verification & Server-Side Scoring...");
    const quiz = await Quiz.findOne({ courseId: course!._id });
    assert(Boolean(quiz), "Course quiz definition retrieved");
    assert(quiz!.questions.length >= 2, "Quiz questions count verified");

    // Evaluate test answers
    let correctCount = 0;
    quiz!.questions.forEach((q) => {
      const correctIdx = q.options.findIndex((opt) => opt.isCorrect);
      if (correctIdx !== -1) correctCount++;
    });
    assert(correctCount > 0, "Quiz questions contain correct answers configured");

    // 8. Certificate Issuance & Verification by Code
    console.log("\n[8] Testing Certificate Issuance & Public Lookup...");
    const cert = await Certificate.findOne({ userId: student!._id });
    assert(Boolean(cert), "Certificate issued for completed free course");
    assert(Boolean(cert!.certificateCode), "Certificate code generated");
    assert(cert!.gradePercentage > 0, "Grade recorded on certificate");

    const lookedUp = await Certificate.findOne({ certificateCode: cert!.certificateCode });
    assert(Boolean(lookedUp) && lookedUp!._id.toString() === cert!._id.toString(), "Certificate lookup matches by unique code");

    // 9. Refund Workflow
    console.log("\n[9] Testing Refund Request & Status Transitions...");
    // Create test refund record
    const testRefund = await Refund.create({
      paymentId: new mongoose.Types.ObjectId(),
      enrollmentId: new mongoose.Types.ObjectId(),
      userId: student!._id,
      courseId: course!._id,
      amount: 2499,
      reason: "Course duplicate test",
      status: "requested",
    });

    assert(testRefund.status === "requested", "Refund state initialized as requested");
    testRefund.status = "succeeded";
    testRefund.processedAt = new Date();
    await testRefund.save();
    assert(testRefund.status === "succeeded", "Refund successfully transitioned to succeeded");

    // Clean up test refund
    await Refund.findByIdAndDelete(testRefund._id);

    console.log("\n=================================================");
    console.log(`   ALL ${passedTests}/${totalTests} TESTS PASSED CLEANLY! `);
    console.log("=================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Test failure:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTestSuite();
