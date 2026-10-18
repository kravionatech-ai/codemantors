import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILearningPath extends Document {
  title: string;
  slug: string;
  description: string;
  icon: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  estimatedHours: number;
  courses: Types.ObjectId[];
  learningObjectives: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LearningPathSchema = new Schema<ILearningPath>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true },
    icon: { type: String, default: "Compass" },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "All Levels",
    },
    estimatedHours: { type: Number, default: 40 },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    learningObjectives: [{ type: String }],
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const LearningPath: Model<ILearningPath> =
  mongoose.models.LearningPath ||
  mongoose.model<ILearningPath>("LearningPath", LearningPathSchema);

export default LearningPath;
