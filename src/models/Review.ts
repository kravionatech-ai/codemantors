import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReview extends Document {
  courseId: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number; // 1 to 5
  reviewText: string;
  status: "approved" | "flagged" | "rejected";
  instructorReply?: {
    text: string;
    repliedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["approved", "flagged", "rejected"],
      default: "approved",
      index: true,
    },
    instructorReply: {
      text: { type: String, trim: true },
      repliedAt: { type: Date },
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
