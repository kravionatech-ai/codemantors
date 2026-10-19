import { connectDB } from "@/lib/db";
import { InstructorLimit, IInstructorLimit } from "@/models/InstructorLimit";
import { Course } from "@/models/Course";

export interface InstructorQuotaUsage {
  activeCourses: number;
  draftCourses: number;
  totalCourses: number;
  maxActiveCourses: number;
  maxDraftCourses: number;
  allowedCategories: string[];
  canCreatePaidCourses: boolean;
  minCoursePrice: number;
  maxCoursePrice: number;
  requireCourseApproval: boolean;
  canEditSeo: boolean;
  canPublishBlog: boolean;
}

export async function getEffectiveInstructorLimits(instructorId?: string): Promise<IInstructorLimit> {
  await connectDB();

  // 1. Check for custom override for this specific instructor
  if (instructorId) {
    const customLimit = await InstructorLimit.findOne({ instructorId }).lean();
    if (customLimit) return customLimit as unknown as IInstructorLimit;
  }

  // 2. Check for global default limits in database
  const globalDefault = await InstructorLimit.findOne({ isGlobalDefault: true }).lean();
  if (globalDefault) return globalDefault as unknown as IInstructorLimit;

  // 3. Fallback built-in platform defaults
  return {
    maxActiveCourses: 5,
    maxDraftCourses: 10,
    maxModulesPerCourse: 20,
    maxLessonsPerCourse: 100,
    maxVideoDurationMinutes: 90,
    maxUploadFileSizeMB: 250,
    allowedCategories: [],
    canCreatePaidCourses: true,
    minCoursePrice: 0,
    maxCoursePrice: 50000,
    maxDiscountPercent: 80,
    canCreateCoupons: true,
    requireCourseApproval: false,
    canEditSeo: true,
    canPublishBlog: true,
    canAccessAnalytics: true,
    canDeleteCourses: true,
    isGlobalDefault: true,
  } as unknown as IInstructorLimit;
}

export async function getInstructorUsage(instructorId: string): Promise<InstructorQuotaUsage> {
  await connectDB();
  const limits = await getEffectiveInstructorLimits(instructorId);

  const [activeCourses, draftCourses, totalCourses] = await Promise.all([
    Course.countDocuments({ instructor: instructorId, status: "published" }),
    Course.countDocuments({ instructor: instructorId, status: { $in: ["draft", "pending_review"] } }),
    Course.countDocuments({ instructor: instructorId, status: { $ne: "archived" } }),
  ]);

  return {
    activeCourses,
    draftCourses,
    totalCourses,
    maxActiveCourses: limits.maxActiveCourses,
    maxDraftCourses: limits.maxDraftCourses,
    allowedCategories: limits.allowedCategories || [],
    canCreatePaidCourses: limits.canCreatePaidCourses,
    minCoursePrice: limits.minCoursePrice,
    maxCoursePrice: limits.maxCoursePrice,
    requireCourseApproval: limits.requireCourseApproval,
    canEditSeo: limits.canEditSeo,
    canPublishBlog: limits.canPublishBlog,
  };
}

export async function verifyInstructorQuota(
  instructorId: string,
  action: "create_course" | "publish_course" | "add_module" | "add_lesson",
  payload?: any
): Promise<{ allowed: boolean; reason?: string }> {
  await connectDB();
  const limits = await getEffectiveInstructorLimits(instructorId);

  switch (action) {
    case "create_course": {
      const currentDrafts = await Course.countDocuments({
        instructor: instructorId,
        status: { $in: ["draft", "pending_review"] },
      });

      if (currentDrafts >= limits.maxDraftCourses) {
        return {
          allowed: false,
          reason: `Quota limit reached: Maximum allowed draft/pending courses is ${limits.maxDraftCourses}. Please publish, archive, or delete existing drafts.`,
        };
      }

      if (payload?.category && limits.allowedCategories.length > 0) {
        if (!limits.allowedCategories.includes(payload.category)) {
          return {
            allowed: false,
            reason: `You are not authorized to create courses in category "${payload.category}". Allowed categories: ${limits.allowedCategories.join(", ")}.`,
          };
        }
      }

      if (payload?.price > 0 && !limits.canCreatePaidCourses) {
        return {
          allowed: false,
          reason: "Your account is restricted to free foundational courses. Paid course creation is not enabled.",
        };
      }

      if (payload?.price != null && (payload.price < limits.minCoursePrice || payload.price > limits.maxCoursePrice)) {
        return {
          allowed: false,
          reason: `Course price must be between ₹${limits.minCoursePrice} and ₹${limits.maxCoursePrice}.`,
        };
      }
      break;
    }

    case "publish_course": {
      const currentActive = await Course.countDocuments({
        instructor: instructorId,
        status: "published",
      });

      if (currentActive >= limits.maxActiveCourses) {
        return {
          allowed: false,
          reason: `Quota limit reached: Maximum allowed published courses is ${limits.maxActiveCourses}. Please archive an existing course or request an quota increase from an administrator.`,
        };
      }
      break;
    }

    case "add_module": {
      if (payload?.courseId) {
        const course = await Course.findById(payload.courseId);
        if (course && (course.modules?.length || 0) >= limits.maxModulesPerCourse) {
          return {
            allowed: false,
            reason: `Maximum module limit of ${limits.maxModulesPerCourse} modules reached for this course.`,
          };
        }
      }
      break;
    }

    case "add_lesson": {
      if (payload?.courseId && payload?.moduleId) {
        const course = await Course.findById(payload.courseId);
        const moduleItem = course?.modules?.find((m: any) => m._id.toString() === payload.moduleId.toString());
        if (moduleItem && (moduleItem.lessons?.length || 0) >= limits.maxLessonsPerCourse) {
          return {
            allowed: false,
            reason: `Maximum lesson limit of ${limits.maxLessonsPerCourse} lessons per module reached.`,
          };
        }
      }

      if (payload?.durationMinutes && payload.durationMinutes > limits.maxVideoDurationMinutes) {
        return {
          allowed: false,
          reason: `Lesson duration (${payload.durationMinutes} min) exceeds maximum permitted length of ${limits.maxVideoDurationMinutes} minutes.`,
        };
      }
      break;
    }
  }

  return { allowed: true };
}
