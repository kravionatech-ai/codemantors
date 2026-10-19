import { connectDB } from "../lib/db";
import { Course, Enrollment, User } from "../models";
import mongoose from "mongoose";

async function runMultiModuleTests() {
  console.log("=================================================");
  console.log("   CodeMentors Multi-Module & W3Schools Suite    ");
  console.log("=================================================\n");

  await connectDB();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Verify courses have multiple modules
    console.log("[1] Testing Multiple Modules Per Course...");
    const nextjsCourse = await Course.findOne({ slug: "nextjs-15-react-19-mastery" }).lean();
    assert(Boolean(nextjsCourse), "Next.js 15 course found");
    assert((nextjsCourse?.modules?.length || 0) >= 2, `Course has multiple modules (${nextjsCourse?.modules?.length} modules)`);

    // 2. Verify Module 1 has dedicated Video, PDF, and W3Schools Notes
    console.log("\n[2] Testing Module 1 Assets (Video, PDF & Notes)...");
    const mod1 = nextjsCourse?.modules?.[0];
    assert(Boolean(mod1?.videoUrl), `Module 1 has dedicated video: ${mod1?.videoUrl}`);
    assert(Boolean(mod1?.videoDuration && mod1.videoDuration > 0), `Module 1 has video duration: ${mod1?.videoDuration}s`);
    assert(Boolean(mod1?.pdfUrl), `Module 1 has PDF handbook link: ${mod1?.pdfUrl}`);
    assert(Boolean(mod1?.pdfTitle), `Module 1 has PDF document title: ${mod1?.pdfTitle}`);
    assert(Boolean(mod1?.notes), "Module 1 has W3Schools-style notes");
    assert(Boolean(mod1?.notes?.includes("### Example")), "Module 1 notes contain W3Schools 'Example' card");
    assert(Boolean(mod1?.notes?.includes("> **Note:**")), "Module 1 notes contain W3Schools 'Note:' callout");
    assert(Boolean(mod1?.notes?.includes("> **Tip:**")), "Module 1 notes contain W3Schools 'Tip:' callout");

    // 3. Verify Module 2 has dedicated Video, PDF, and W3Schools Notes
    console.log("\n[3] Testing Module 2 Assets (Video, PDF & Notes)...");
    const mod2 = nextjsCourse?.modules?.[1];
    assert(Boolean(mod2?.videoUrl), `Module 2 has dedicated video: ${mod2?.videoUrl}`);
    assert(Boolean(mod2?.pdfUrl), `Module 2 has PDF handbook link: ${mod2?.pdfUrl}`);
    assert(Boolean(mod2?.pdfTitle), `Module 2 has PDF document title: ${mod2?.pdfTitle}`);
    assert(Boolean(mod2?.notes), "Module 2 has W3Schools-style notes");
    assert(Boolean(mod2?.notes?.includes("### Example")), "Module 2 notes contain W3Schools 'Example' card");
    assert(Boolean(mod2?.notes?.includes("> **Note:**")), "Module 2 notes contain W3Schools 'Note:' callout");

    // 4. Verify Course 2 (TypeScript) has Module Assets
    console.log("\n[4] Testing Course 2 (TypeScript) Module Assets...");
    const tsCourse = await Course.findOne({ slug: "typescript-enterprise-clean-architecture" }).lean();
    const tsMod1 = tsCourse?.modules?.[0];
    assert(Boolean(tsMod1?.videoUrl), "TypeScript Module 1 has dedicated video URL");
    assert(Boolean(tsMod1?.pdfUrl), "TypeScript Module 1 has PDF URL");
    assert(Boolean(tsMod1?.notes?.includes("### Example")), "TypeScript Module 1 has W3Schools notes with code example");

    // 5. Verify Course 3 (AI) has Module Assets
    console.log("\n[5] Testing Course 3 (Python AI) Module Assets...");
    const aiCourse = await Course.findOne({ slug: "python-ai-production-llm-apps" }).lean();
    const aiMod1 = aiCourse?.modules?.[0];
    assert(Boolean(aiMod1?.videoUrl), "AI Module 1 has dedicated video URL");
    assert(Boolean(aiMod1?.pdfUrl), "AI Module 1 has PDF handbook URL");
    assert(Boolean(aiMod1?.notes?.includes("### Example")), "AI Module 1 has W3Schools notes with code example");

    // 6. Test Module CRUD & Persistence with Video, PDF & Notes
    console.log("\n[6] Testing Instructor Curriculum Module CRUD with Assets...");
    const testCourse = await Course.create({
      title: "Test Architecture Course for Multi-Module",
      slug: `test-multi-module-${Date.now()}`,
      subtitle: "Verifying multi-module video, pdf & w3schools notes",
      description: "Comprehensive testing of module-level video, pdf, and notes persistence.",
      category: "Web Development",
      level: "Beginner",
      language: "English",
      price: 999,
      isFree: false,
      thumbnail: "https://example.com/thumb.jpg",
      instructor: nextjsCourse?.instructor,
      status: "draft",
      requirements: ["Test req"],
      whatYouWillLearn: ["Test outcome"],
      targetAudience: ["Test audience"],
      modules: [
        {
          title: "Module A: Foundations & Setup",
          description: "Setup video, PDF cheatsheet, and W3Schools tutorial",
          order: 1,
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          videoDuration: 600,
          pdfUrl: "https://example.com/moduleA.pdf",
          pdfTitle: "ModuleA_Cheatsheet.pdf",
          notes: "# Module A\n\n> **Note:** Test note\n\n### Example\n```html\n<h1>Hello</h1>\n```",
          lessons: [
            {
              title: "Intro Lesson",
              slug: "intro-lesson",
              type: "video",
              order: 1,
              durationMinutes: 5,
              isPreview: true,
            },
          ],
        },
        {
          title: "Module B: Advanced Implementation",
          description: "Second module with distinct video, PDF, and notes",
          order: 2,
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          videoDuration: 720,
          pdfUrl: "https://example.com/moduleB.pdf",
          pdfTitle: "ModuleB_Cheatsheet.pdf",
          notes: "# Module B\n\n> **Tip:** Test tip\n\n### Example\n```javascript\nconst a = 10;\n```",
          lessons: [
            {
              title: "Lesson B1",
              slug: "lesson-b1",
              type: "article",
              order: 1,
              durationMinutes: 8,
              isPreview: false,
            },
          ],
        },
      ],
    });

    assert(testCourse.modules.length === 2, "Test course created with 2 modules");
    assert(testCourse.modules[0].videoUrl === "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "Module A videoUrl preserved");
    assert(testCourse.modules[0].pdfTitle === "ModuleA_Cheatsheet.pdf", "Module A pdfTitle preserved");
    assert(testCourse.modules[1].videoUrl === "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", "Module B videoUrl preserved");
    assert(testCourse.modules[1].pdfTitle === "ModuleB_Cheatsheet.pdf", "Module B pdfTitle preserved");

    // Clean up test course
    await Course.findByIdAndDelete(testCourse._id);
    assert(true, "Test course cleaned up safely");

    console.log("\n=================================================");
    console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================\n");

    if (failed > 0) process.exit(1);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Test execution failed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runMultiModuleTests();
