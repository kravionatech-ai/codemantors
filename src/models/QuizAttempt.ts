import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQuizAttemptAnswer {
  questionIndex: number;
  questionId?: string;
  selectedOptionIndices: number[];
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface IQuizAttempt extends Document {
  userId: Types.ObjectId;
  quizId: Types.ObjectId;
  courseId: Types.ObjectId;
  lessonId: string;
  attemptNumber: number;
  answers: IQuizAttemptAnswer[];
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  passed: boolean;
  timeSpentSeconds: number;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuizAttemptAnswerSchema = new Schema<IQuizAttemptAnswer>(
  {
    questionIndex: { type: Number, required: true },
    questionId: { type: String },
    selectedOptionIndices: [{ type: Number }],
    isCorrect: { type: Boolean, required: true },
    pointsAwarded: { type: Number, required: true, default: 0 },
  },
  { _id: false }
);

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    lessonId: { type: String, required: true, index: true },
    attemptNumber: { type: Number, required: true, default: 1 },
    answers: [QuizAttemptAnswerSchema],
    totalScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    scorePercentage: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    timeSpentSeconds: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

QuizAttemptSchema.index({ userId: 1, quizId: 1 });

export const QuizAttempt: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt ||
  mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);

export default QuizAttempt;
