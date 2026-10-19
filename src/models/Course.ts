import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type LessonType =
  | "video"
  | "article"
  | "text"
  | "pdf"
  | "mixed"
  | "quiz"
  | "coding"
  | "resource";

export interface IContentBlock {
  _id?: Types.ObjectId;
  type: "text" | "video" | "pdf" | "code" | "quiz" | "callout";
  order: number;
  title?: string;
  data: {
    text?: string;
    videoUrl?: string;
    videoDuration?: number;
    videoProvider?: string;
    pdfUrl?: string;
    pdfTitle?: string;
    codeLanguage?: string;
    codeSnippet?: string;
    quizId?: Types.ObjectId;
    calloutType?: "info" | "warning" | "success" | "tip";
    calloutText?: string;
  };
}

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
  description?: string;
  order: number;
  durationMinutes: number;
  isPreview: boolean;
  isRequired?: boolean;
  status?: "draft" | "published" | "archived";
  videoUrl?: string;
  videoDuration?: number; // in seconds
  videoProvider?: "youtube" | "vimeo" | "custom" | "html5";
  captionsUrl?: string;
  content?: string; // Rich markdown or article text with code blocks
  pdfUrl?: string;
  pdfTitle?: string;
  fileSize?: string;
  downloadAllowed?: boolean;
  readingTimeMinutes?: number;
  contentBlocks?: IContentBlock[];
  resources?: Array<{
    title: string;
    url: string;
    fileType?: string;
    size?: string;
  }>;
  quizId?: Types.ObjectId;
  codingExercise?: ICodingExercise;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    noFollow?: boolean;
  };
}

export interface IModule {
  _id: Types.ObjectId;
  title: string;
  slug?: string;
  description?: string;
  order: number;
  status?: "draft" | "published" | "archived";
  isRequired?: boolean;
  learningObjectives?: string[];
  estimatedDurationMinutes?: number;
  videoUrl?: string;
  videoDuration?: number; // in seconds
  pdfUrl?: string;
  pdfTitle?: string;
  notes?: string;
  lessons: ILesson[];
}

export interface ICourseAnnouncement {
  _id?: Types.ObjectId;
  title: string;
  content: string;
  createdAt: Date;
  isPinned?: boolean;
  createdBy?: Types.ObjectId;
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  category: string; // or category slug / ref
  subcategory?: string;
  format?: "Video" | "Text" | "PDF/Document" | "Mixed";
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  language: string;
  price: number; // in INR or native integer (e.g. 1999)
  discountPrice?: number;
  isFree: boolean;
  thumbnail: string;
  previewVideoUrl?: string;
  instructor: Types.ObjectId;
  coInstructors?: Types.ObjectId[];
  requirements: string[];
  whatYouWillLearn: string[];
  targetAudience: string[];
  status: "draft" | "pending_review" | "published" | "unpublished" | "archived";
  isFeatured: boolean;
  ratingAverage: number;
  ratingCount: number;
  enrolledCount: number;
  totalDurationMinutes: number;
  totalLessonsCount: number;
  certificateEnabled: boolean;
  passingScore: number; // default 70
  tags?: string[];
  coverImage?: string;
  maxStudents?: number;
  accessDurationDays?: number;
  announcements?: ICourseAnnouncement[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    noFollow?: boolean;
  };
  modules: IModule[];
  createdAt: Date;
  updatedAt: Date;
}

const ContentBlockSchema = new Schema<IContentBlock>(
  {
    type: {
      type: String,
      enum: ["text", "video", "pdf", "code", "quiz", "callout"],
      default: "text",
    },
    order: { type: Number, default: 0 },
    title: { type: String, default: "" },
    data: {
      text: { type: String, default: "" },
      videoUrl: { type: String, default: "" },
      videoDuration: { type: Number, default: 0 },
      videoProvider: { type: String, default: "youtube" },
      pdfUrl: { type: String, default: "" },
      pdfTitle: { type: String, default: "" },
      codeLanguage: { type: String, default: "javascript" },
      codeSnippet: { type: String, default: "" },
      quizId: { type: Schema.Types.ObjectId, ref: "Quiz" },
      calloutType: { type: String, enum: ["info", "warning", "success", "tip"], default: "info" },
      calloutText: { type: String, default: "" },
    },
  },
  { _id: true }
);

const LessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["video", "article", "text", "pdf", "mixed", "quiz", "coding", "resource"],
      default: "video",
    },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 5 },
    isPreview: { type: Boolean, default: false },
    isRequired: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    videoUrl: { type: String, default: "" },
    videoDuration: { type: Number, default: 0 },
    videoProvider: {
      type: String,
      enum: ["youtube", "vimeo", "custom", "html5"],
      default: "youtube",
    },
    captionsUrl: { type: String, default: "" },
    content: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    pdfTitle: { type: String, default: "" },
    fileSize: { type: String, default: "" },
    downloadAllowed: { type: Boolean, default: true },
    readingTimeMinutes: { type: Number, default: 5 },
    contentBlocks: [ContentBlockSchema],
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
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      keywords: [{ type: String }],
      ogImage: { type: String, default: "" },
      canonicalUrl: { type: String, default: "" },
      noIndex: { type: Boolean, default: false },
      noFollow: { type: Boolean, default: false },
    },
  },
  { _id: true }
);

const ModuleSchema = new Schema<IModule>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, default: "" },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    isRequired: { type: Boolean, default: true },
    learningObjectives: [{ type: String }],
    estimatedDurationMinutes: { type: Number, default: 0 },
    videoUrl: { type: String, default: "" },
    videoDuration: { type: Number, default: 0 },
    pdfUrl: { type: String, default: "" },
    pdfTitle: { type: String, default: "" },
    notes: { type: String, default: "" },
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
    subcategory: { type: String, default: "" },
    format: {
      type: String,
      enum: ["Video", "Text", "PDF/Document", "Mixed"],
      default: "Mixed",
    },
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
    coInstructors: [{ type: Schema.Types.ObjectId, ref: "User" }],
    requirements: [{ type: String }],
    whatYouWillLearn: [{ type: String }],
    targetAudience: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "pending_review", "published", "unpublished", "archived"],
      default: "draft",
      index: true,
    },
    accessDurationDays: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    ratingAverage: { type: Number, default: 5.0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    enrolledCount: { type: Number, default: 0 },
    totalDurationMinutes: { type: Number, default: 0 },
    totalLessonsCount: { type: Number, default: 0 },
    certificateEnabled: { type: Boolean, default: true },
    passingScore: { type: Number, default: 70 },
    tags: [{ type: String }],
    coverImage: { type: String, default: "" },
    maxStudents: { type: Number },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      keywords: [{ type: String }],
      ogImage: { type: String, default: "" },
      canonicalUrl: { type: String, default: "" },
      noIndex: { type: Boolean, default: false },
      noFollow: { type: Boolean, default: false },
    },
    announcements: [
      {
        title: { type: String, required: true },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        isPinned: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    modules: [ModuleSchema],
  },
  { timestamps: true }
);

// Text search indexes for title, description, category
CourseSchema.index({ title: "text", subtitle: "text", description: "text" });

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
