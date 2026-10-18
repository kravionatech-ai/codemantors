import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IEnrollment extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  enrolledAt: Date;
  status: "active" | "completed" | "refunded" | "cancelled";
  progressPercentage: number;
  completedLessons: string[]; // lesson _ids as strings
  lastAccessedLessonId?: string;
  completedAt?: Date;
  certificateId?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    enrolledAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "completed", "refunded", "cancelled"],
      default: "active",
      index: true,
    },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    completedLessons: [{ type: String }],
    lastAccessedLessonId: { type: String },
    completedAt: { type: Date },
    certificateId: { type: Schema.Types.ObjectId, ref: "Certificate" },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true }
);

// Prevent duplicate active enrollments per user per course
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);

export default Enrollment;
