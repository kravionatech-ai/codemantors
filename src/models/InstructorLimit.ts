import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IInstructorLimit extends Document {
  instructorId?: Types.ObjectId; // null/undefined for global default limits
  isGlobalDefault: boolean;
  maxActiveCourses: number;
  maxDraftCourses: number;
  maxModulesPerCourse: number;
  maxLessonsPerCourse: number;
  maxVideoDurationMinutes: number;
  maxUploadFileSizeMB: number;
  allowedCategories: string[];
  canCreatePaidCourses: boolean;
  minCoursePrice: number;
  maxCoursePrice: number;
  maxDiscountPercent: number;
  canCreateCoupons: boolean;
  requireCourseApproval: boolean;
  canEditSeo: boolean;
  canPublishBlog: boolean;
  canAccessAnalytics: boolean;
  canDeleteCourses: boolean;
  customNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstructorLimitSchema = new Schema<IInstructorLimit>(
  {
    instructorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    isGlobalDefault: { type: Boolean, default: false, index: true },
    maxActiveCourses: { type: Number, default: 5 },
    maxDraftCourses: { type: Number, default: 10 },
    maxModulesPerCourse: { type: Number, default: 20 },
    maxLessonsPerCourse: { type: Number, default: 100 },
    maxVideoDurationMinutes: { type: Number, default: 90 },
    maxUploadFileSizeMB: { type: Number, default: 250 },
    allowedCategories: [{ type: String }],
    canCreatePaidCourses: { type: Boolean, default: true },
    minCoursePrice: { type: Number, default: 0 },
    maxCoursePrice: { type: Number, default: 50000 },
    maxDiscountPercent: { type: Number, default: 80 },
    canCreateCoupons: { type: Boolean, default: true },
    requireCourseApproval: { type: Boolean, default: false },
    canEditSeo: { type: Boolean, default: true },
    canPublishBlog: { type: Boolean, default: true },
    canAccessAnalytics: { type: Boolean, default: true },
    canDeleteCourses: { type: Boolean, default: true },
    customNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const InstructorLimit: Model<IInstructorLimit> =
  mongoose.models.InstructorLimit ||
  mongoose.model<IInstructorLimit>("InstructorLimit", InstructorLimitSchema);

export default InstructorLimit;
