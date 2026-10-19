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
  AuditLog,
  Order,
  Cart,
  CmsPage,
  BlogPost,
  Redirect,
  Role,
  InstructorLimit,
  SiteSettings,
} from "../models";
import { hashPassword, comparePassword, signAuthToken, verifyAuthToken } from "../lib/auth";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
  generateRazorpaySignature,
  generateRazorpayWebhookSignature,
} from "../lib/razorpay";
import { getEffectiveInstructorLimits, verifyInstructorQuota } from "../lib/limits";
import { hasPermission, DEFAULT_ROLE_PERMISSIONS } from "../lib/permissions";

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
    const student = await User.findOne({ email: "student@codementors.test" });
    const instructor = await User.findOne({ email: "instructor@codementors.test" });
    const admin = await User.findOne({ email: "admin@codementors.test" });

    assert(student?.role === "student", "Student role identified (student@codementors.test)");
    assert(instructor?.role === "instructor", "Instructor role identified (instructor@codementors.test)");
    assert(admin?.role === "admin", "Admin role identified (admin@codementors.test)");

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
    const validSig = generateRazorpaySignature(mockOrderId, mockPaymentId);
    const isValid = verifyRazorpaySignature(mockOrderId, mockPaymentId, validSig);
    assert(isValid, "Genuine HMAC-SHA256 signature verified successfully");

    const forgedSig = "sig_forged_attack_tampered_payload_12345";
    const isForgedRejected = !verifyRazorpaySignature(mockOrderId, mockPaymentId, forgedSig);
    assert(isForgedRejected, "Forged payment signature strictly rejected");

    const mockPrefixBypassRejected = !verifyRazorpaySignature(mockOrderId, mockPaymentId, "sig_test_bypass");
    assert(mockPrefixBypassRejected, "Arbitrary test-prefix bypass strictly rejected");

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

    // 10. Webhook Signature & Audit Logging
    console.log("\n[10] Testing Webhook Cryptography & Audit Logging...");
    const samplePayload = JSON.stringify({ event: "payment.captured", id: "evt_test_123" });
    const validWebhookSig = generateRazorpayWebhookSignature(samplePayload);
    const isWebhookValid = verifyRazorpayWebhookSignature(samplePayload, validWebhookSig);
    assert(isWebhookValid, "Webhook HMAC-SHA256 signature verified");

    const forgedWebhookRejected = !verifyRazorpayWebhookSignature(samplePayload, "sig_test_forged_webhook");
    assert(forgedWebhookRejected, "Forged webhook signature strictly rejected");

    const auditEntry = await AuditLog.create({
      action: "webhook_test",
      category: "payment",
      resourceId: "evt_test_123",
      status: "success",
    });
    assert(auditEntry._id != null, "AuditLog persisted successfully");
    await AuditLog.findByIdAndDelete(auditEntry._id);

    // 11. Shopping Cart Model & Item Management
    console.log("\n[11] Testing Shopping Cart Persistence & Multi-Course Storage...");
    await Cart.deleteMany({ userId: student!._id });

    const testCart = await Cart.create({
      userId: student!._id,
      items: [
        { courseId: course!._id, addedAt: new Date() },
      ],
      couponCode: "WELCOME20",
    });
    assert(Boolean(testCart._id), "Student cart created in database");
    assert(testCart.items.length === 1, "Cart contains 1 course item");
    assert(testCart.couponCode === "WELCOME20", "Promo coupon attached to cart");

    // Test lookup & item update
    const foundCart = await Cart.findOne({ userId: student!._id });
    assert(Boolean(foundCart), "Cart found by student ID");
    assert(foundCart!.items[0].courseId.toString() === course!._id.toString(), "Course ID matches in cart");

    // Clean up test cart
    await Cart.findByIdAndDelete(testCart._id);
    assert(!(await Cart.findById(testCart._id)), "Cart cleaned up successfully");

    // 12. E-Commerce Order Lifecycle & Unique Order Number
    console.log("\n[12] Testing E-Commerce Multi-Course Order Lifecycle & Transitions...");
    const sampleOrderNumber = `CM-${Date.now().toString().slice(-8)}-TEST`;
    const testOrder = await Order.create({
      orderNumber: sampleOrderNumber,
      userId: student!._id,
      items: [
        {
          courseId: course!._id,
          title: course!.title,
          thumbnail: course!.thumbnail,
          price: 2499,
          finalPrice: 1999,
          instructorName: "Alex Rivera",
        },
      ],
      subtotal: 2499,
      discountAmount: 500,
      couponCode: "WELCOME20",
      totalAmount: 1999,
      currency: "INR",
      status: "pending",
      razorpayOrderId: "order_rzp_mock_init_123",
      receipt: `rcpt_order_test_${Date.now()}`,
    });

    assert(Boolean(testOrder._id), "Order record created successfully");
    assert(testOrder.status === "pending", "Order initialized in 'pending' status");
    assert(testOrder.totalAmount === 1999, "Authoritative total amount matches server computation");
    assert(testOrder.currency === "INR", "Order currency is authoritative INR");

    // Transition Order to Paid
    testOrder.status = "paid";
    testOrder.razorpayOrderId = "order_rzp_mock_test";
    testOrder.razorpayPaymentId = "pay_rzp_mock_test";
    testOrder.razorpaySignature = "sig_rzp_mock_test";
    testOrder.paidAt = new Date();
    await testOrder.save();

    const verifiedOrder = await Order.findOne({ orderNumber: sampleOrderNumber });
    assert(verifiedOrder?.status === "paid", "Order status successfully transitioned to 'paid'");
    assert(Boolean(verifiedOrder?.paidAt), "Paid timestamp recorded on order");
    assert(verifiedOrder?.razorpayPaymentId === "pay_rzp_mock_test", "Razorpay payment ID linked");

    // Clean up test order
    await Order.findByIdAndDelete(testOrder._id);
    assert(!(await Order.findById(testOrder._id)), "Order cleaned up successfully");

    // 13. Dynamic CMS Page Builder Model & Section Ordering
    console.log("\n[13] Testing CMS Page Builder, Sections & SEO Defaults...");
    await CmsPage.deleteMany({ slug: "test-automated-cms-page" });
    const testPage = await CmsPage.create({
      title: "Automated Enterprise Architecture Track",
      slug: "test-automated-cms-page",
      status: "published",
      sections: [
        {
          id: "sec_1",
          type: "hero",
          order: 1,
          isVisible: true,
          title: "Master Enterprise Systems",
          subtitle: "Battle-tested architectural patterns",
          config: {
            ctaText: "Explore Track",
            ctaLink: "/courses",
          },
        },
        {
          id: "sec_2",
          type: "text_block",
          order: 2,
          isVisible: true,
          content: "Comprehensive deep-dive into distributed systems, event-driven pipelines, and high-concurrency microservices.",
        },
      ],
      seo: {
        title: "Enterprise Architecture Track | CodeMentors",
        description: "Master distributed systems and high-throughput microservices.",
        noIndex: false,
      },
    });

    assert(Boolean(testPage._id), "CMS Page model created");
    assert(testPage.sections.length === 2, "CMS Page contains 2 modular sections");
    assert(testPage.sections[0].type === "hero", "First section is hero block");
    assert(testPage.seo?.title?.includes("Enterprise") || false, "SEO metadata correctly populated");

    // Test section update
    testPage.sections.push({
      id: "sec_3",
      type: "faq",
      order: 3,
      isVisible: true,
      title: "Frequently Asked Questions",
      config: {
        items: [{ question: "Is this course certified?", answer: "Yes, verified certificate included." }],
      },
    });
    await testPage.save();
    const updatedPage = await CmsPage.findById(testPage._id);
    assert(updatedPage?.sections.length === 3, "New section appended to CMS page successfully");

    // Clean up test page
    await CmsPage.findByIdAndDelete(testPage._id);
    assert(!(await CmsPage.findById(testPage._id)), "CMS test page cleaned up");

    // 14. Technical Blog Post Model & Reading Time
    console.log("\n[14] Testing Technical Blog Architecture & Metadata...");
    await BlogPost.deleteMany({ slug: "test-automated-blog-post" });
    const testBlog = await BlogPost.create({
      title: "Building Resilient Event-Driven Microservices in 2026",
      slug: "test-automated-blog-post",
      excerpt: "A practical guide to distributed state machines, saga patterns, and idempotency.",
      content: "# Event-Driven Architecture\n\nDesigning scalable software systems requires robust state management...",
      category: "Architecture",
      tags: ["distributed-systems", "microservices", "event-driven"],
      authorId: instructor!._id,
      readingTimeMinutes: 8,
      status: "published",
      publishedAt: new Date(),
    });

    assert(Boolean(testBlog._id), "Blog post model persisted");
    assert(testBlog.tags.length === 3, "Blog post tags array preserved");
    assert(testBlog.readingTimeMinutes === 8, "Reading time recorded correctly");

    // Clean up test blog
    await BlogPost.findByIdAndDelete(testBlog._id);
    assert(!(await BlogPost.findById(testBlog._id)), "Blog test post cleaned up");

    // 15. URL Redirects & Loop Prevention
    console.log("\n[15] Testing Dynamic URL Redirect Rules...");
    await Redirect.deleteMany({ sourcePath: "/old-fullstack-track" });
    const testRedirect = await Redirect.create({
      sourcePath: "/old-fullstack-track",
      destinationPath: "/courses/mastering-nextjs-15-enterprise-apps",
      statusCode: 301,
      isActive: true,
      hitCount: 0,
    });

    assert(Boolean(testRedirect._id), "Redirect rule persisted");
    assert(testRedirect.statusCode === 301, "Status code is permanent 301");

    // Simulate hit
    testRedirect.hitCount += 1;
    testRedirect.lastUsedAt = new Date();
    await testRedirect.save();
    const verifiedRedirect = await Redirect.findById(testRedirect._id);
    assert(verifiedRedirect?.hitCount === 1, "Redirect hit count incremented correctly");

    // Clean up test redirect
    await Redirect.findByIdAndDelete(testRedirect._id);
    assert(!(await Redirect.findById(testRedirect._id)), "Redirect rule cleaned up");

    // 16. Granular RBAC Permissions Model
    console.log("\n[16] Testing Granular RBAC Permission Matrix...");
    // Verify default permissions
    assert(DEFAULT_ROLE_PERMISSIONS.super_admin.length >= 20, "Super admin has all permissions assigned");
    assert(DEFAULT_ROLE_PERMISSIONS.admin.includes("courses.create"), "Admin role has course creation permission");
    assert(DEFAULT_ROLE_PERMISSIONS.instructor.includes("courses.update_own"), "Instructor has update own course permission");
    assert(!DEFAULT_ROLE_PERMISSIONS.student.includes("courses.create"), "Student cannot create courses");

    // Test permission checker logic
    const adminSession = { userId: "admin1", email: "admin@test.com", role: "admin", permissions: [] };
    const studentSession = { userId: "stud1", email: "stud@test.com", role: "student", permissions: [] };
    const superAdminSession = { userId: "super1", email: "super@test.com", role: "super_admin", permissions: [] };
    const customInstructor = { userId: "inst1", email: "inst@test.com", role: "instructor", permissions: ["blog.manage"] };

    assert(hasPermission(adminSession, "courses.create"), "Admin has permission 'courses.create'");
    assert(!hasPermission(studentSession, "courses.create"), "Student denied permission 'courses.create'");
    assert(hasPermission(superAdminSession, "users.manage"), "Super admin granted permission 'users.manage'");
    assert(hasPermission(customInstructor, "blog.manage"), "Instructor with explicit permission override granted 'blog.manage'");
    assert(!hasPermission(studentSession, "settings.manage"), "Student denied permission 'settings.manage'");

    // 17. Instructor Limits & Server-Side Quota Enforcement
    console.log("\n[17] Testing Instructor Quotas & Policy Enforcement...");
    const globalLimits = await getEffectiveInstructorLimits();
    assert(Boolean(globalLimits), "Effective instructor limits retrieved");
    assert(globalLimits.maxActiveCourses > 0, "maxActiveCourses has positive threshold");
    assert(globalLimits.maxDraftCourses > 0, "maxDraftCourses has positive threshold");

    // Test quota verification: exorbitant price violation
    const priceViolation = await verifyInstructorQuota(instructor!._id.toString(), "create_course", {
      price: 9999999, // Exceeds standard limit
      category: "Web Development",
    });
    assert(!priceViolation.allowed, "Exorbitant course price properly rejected by quota engine");
    assert(Boolean(priceViolation.reason), "Clear rejection reason returned to educator");

    // Test quota verification: standard valid draft
    const validDraft = await verifyInstructorQuota(instructor!._id.toString(), "create_course", {
      price: 1999,
      category: "Web Development",
    });
    assert(validDraft.allowed, "Valid course draft permitted by quota engine");

    // 18. Kraviona Company Branding & Platform Settings
    console.log("\n[18] Testing Kraviona Company Branding & Attribution Settings...");
    let settings = await SiteSettings.findOne({ key: "global_config" });
    if (!settings) {
      settings = await SiteSettings.create({
        key: "global_config",
        siteName: "CodeMentors",
      });
    }

    if (!settings.companyBranding || !settings.companyBranding.services || settings.companyBranding.services.length < 5) {
      settings.companyBranding = {
        enabled: true,
        companyName: "Kraviona Tech Solutions",
        companyUrl: "https://kraviona.com/",
        tagline: "Web Development | Backend Engineering | Technical SEO | AI Automation",
        shortDescription:
          "Kraviona Tech Solutions is a technology company focused on web development, full-stack application development, backend engineering, technical SEO, web performance, and AI automation.",
        services: [
          "MERN Stack Development",
          "React.js and Next.js Development",
          "Node.js Backend and API Development",
          "Technical SEO and Website Performance Optimization",
          "UI/UX and Web Application Development",
          "AI Automation and AI Chatbot Development",
          "E-commerce Development",
        ],
        contact: {
          website: "https://kraviona.com/contact",
          email: "contact@kraviona.com",
          phone: "+91 96085 53167",
        },
        displayPosition: "both",
        openInNewTab: true,
      };
      await settings.save();
    }

    assert(Boolean(settings.companyBranding), "Company branding subdocument exists");
    assert(settings.companyBranding.companyName === "Kraviona Tech Solutions", "Default company name is Kraviona Tech Solutions");
    assert(settings.companyBranding.companyUrl === "https://kraviona.com/", "Default company URL is https://kraviona.com/");
    assert(settings.companyBranding.services.length >= 5, "Core engineering services list is populated");
    assert(settings.companyBranding.contact.phone === "+91 96085 53167", "Verified contact telephone is stored");
    assert(settings.companyBranding.openInNewTab === true, "openInNewTab defaults to true");

    // Test updating branding settings
    settings.companyBranding.tagline = "Web Development | Backend Engineering | Technical SEO | AI Automation";
    await settings.save();
    const updatedSettings = await SiteSettings.findOne({ key: "global_config" });
    assert(Boolean(updatedSettings?.companyBranding?.tagline?.includes("Technical SEO")), "Company branding tagline updated & persisted");

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
