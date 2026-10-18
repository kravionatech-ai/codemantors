import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILessonProgress extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: string;
  isCompleted: boolean;
  completedAt?: Date;
  lastPositionSeconds: number;
  notes?: string;
  isBookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LessonProgressSchema = new Schema<ILessonProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lessonId: { type: String, required: true, index: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastPositionSeconds: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    isBookmarked: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

LessonProgressSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true });

export const LessonProgress: Model<ILessonProgress> =
  mongoose.models.LessonProgress ||
  mongoose.model<ILessonProgress>("LessonProgress", LessonProgressSchema);

export default LessonProgress;
