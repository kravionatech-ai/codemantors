import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICertificate extends Document {
  certificateCode: string;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  issueDate: Date;
  gradePercentage: number;
  verificationUrl: string;
  metadata: {
    studentName: string;
    courseTitle: string;
    instructorName: string;
    instructorHeadline?: string;
    completionDate: string;
    durationHours?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateCode: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    issueDate: { type: Date, default: Date.now },
    gradePercentage: { type: Number, default: 100 },
    verificationUrl: { type: String, required: true },
    metadata: {
      studentName: { type: String, required: true },
      courseTitle: { type: String, required: true },
      instructorName: { type: String, required: true },
      instructorHeadline: { type: String, default: "CodeMentors Senior Instructor" },
      completionDate: { type: String, required: true },
      durationHours: { type: Number, default: 10 },
    },
  },
  { timestamps: true }
);

CertificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate ||
  mongoose.model<ICertificate>("Certificate", CertificateSchema);

export default Certificate;
