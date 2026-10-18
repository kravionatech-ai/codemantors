import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type LessonType = "video" | "article" | "quiz" | "coding" | "resource";

export interface ICodingExercise {
  language: string;
  instructions: string;
  starterCode: string;
  solutionCode?: string;
  hints: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
    description?: string;
    isHidden?: boolean;
  }>;
}

export interface ILesson {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  type: LessonType;
  order: number;
  durationMinutes: number;
  isPreview: boolean;
  videoUrl?: string;
  videoDuration?: number; // in seconds
  content?: string; // Rich markdown or article text with code blocks
  resources?: Array<{
    title: string;
    url: string;
    fileType?: string;
    size?: string;
  }>;
  quizId?: Types.ObjectId;
  codingExercise?: ICodingExercise;
}

export interface IModule {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  lessons: ILesson[];
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  category: string; // or category slug / ref
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  language: string;
  price: number; // in INR or native integer (e.g. 1999)
  discountPrice?: number;
  isFree: boolean;
  thumbnail: string;
  previewVideoUrl?: string;
  instructor: Types.ObjectId;
  requirements: string[];
  whatYouWillLearn: string[];
  targetAudience: string[];
  status: "draft" | "pending_review" | "published" | "archived";
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  enrolledCount: number;
  totalDurationMinutes: number;
  totalLessonsCount: number;
  certificateEnabled: boolean;
  passingScore: number; // default 70
  modules: IModule[];
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["video", "article", "quiz", "coding", "resource"],
      default: "video",
    },
    order: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 5 },
    isPreview: { type: Boolean, default: false },
    videoUrl: { type: String, default: "" },
    videoDuration: { type: Number, default: 0 },
    content: { type: String, default: "" },
    resources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String, default: "pdf" },
        size: { type: String, default: "" },
      },
    ],
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz" },
    codingExercise: {
      language: { type: String, default: "javascript" },
      instructions: { type: String, default: "" },
      starterCode: { type: String, default: "" },
      solutionCode: { type: String, default: "" },
      hints: [{ type: String }],
      testCases: [
        {
          input: { type: String, default: "" },
          expectedOutput: { type: String, required: true },
          description: { type: String, default: "" },
          isHidden: { type: Boolean, default: false },
        },
      ],
    },
  },
  { _id: true }
);

const ModuleSchema = new Schema<IModule>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    lessons: [LessonSchema],
  },
  { _id: true }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    subtitle: { type: String, default: "" },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "All Levels",
      index: true,
    },
    language: { type: String, default: "English" },
    price: { type: Number, default: 0 },
    discountPrice: { type: Number },
    isFree: { type: Boolean, default: false, index: true },
    thumbnail: { type: String, default: "" },
    previewVideoUrl: { type: String, default: "" },
    instructor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requirements: [{ type: String }],
    whatYouWillLearn: [{ type: String }],
    targetAudience: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "pending_review", "published", "archived"],
      default: "draft",
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    ratingAverage: { type: Number, default: 5.0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    enrolledCount: { type: Number, default: 0 },
    totalDurationMinutes: { type: Number, default: 0 },
    totalLessonsCount: { type: Number, default: 0 },
    certificateEnabled: { type: Boolean, default: true },
    passingScore: { type: Number, default: 70 },
    modules: [ModuleSchema],
  },
  { timestamps: true }
);

// Text search indexes for title, description, category
CourseSchema.index({ title: "text", subtitle: "text", description: "text" });

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
