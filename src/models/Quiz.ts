import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "code_reading";

export interface IQuizOption {
  text: string;
  isCorrect: boolean;
}

export interface IQuizQuestion {
  _id?: Types.ObjectId;
  questionText: string;
  codeSnippet?: string;
  type: QuestionType;
  options: IQuizOption[];
  explanation: string;
  points: number;
}

export interface IQuiz extends Document {
  courseId: Types.ObjectId;
  lessonId: string;
  title: string;
  description: string;
  timeLimitMinutes: number; // 0 for unlimited
  passingPercentage: number; // e.g. 70
  maxAttempts: number; // 0 for unlimited
  shuffleQuestions: boolean;
  showExplanationImmediately: boolean;
  questions: IQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizOptionSchema = new Schema<IQuizOption>(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true, default: false },
  },
  { _id: true }
);

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionText: { type: String, required: true },
    codeSnippet: { type: String, default: "" },
    type: {
      type: String,
      enum: ["single_choice", "multiple_choice", "true_false", "code_reading"],
      default: "single_choice",
    },
    options: [QuizOptionSchema],
    explanation: { type: String, default: "" },
    points: { type: Number, default: 1 },
  },
  { _id: true }
);

const QuizSchema = new Schema<IQuiz>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lessonId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    timeLimitMinutes: { type: Number, default: 15 },
    passingPercentage: { type: Number, default: 70 },
    maxAttempts: { type: Number, default: 3 },
    shuffleQuestions: { type: Boolean, default: false },
    showExplanationImmediately: { type: Boolean, default: true },
    questions: [QuizQuestionSchema],
  },
  { timestamps: true }
);

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

export default Quiz;
