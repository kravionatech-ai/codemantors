import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "super_admin" | "admin" | "instructor" | "student" | "support";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  permissions?: string[];
  instructorStatus?: "pending" | "approved" | "rejected";
  isSuspended?: boolean;
  suspensionReason?: string;
  avatar?: string;
  headline?: string;
  bio?: string;
  website?: string;
  skills?: string[];
  experienceYears?: number;
  profileSlug?: string;
  isPublicProfileVisible?: boolean;
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  notificationPreferences?: {
    newEnrollment?: boolean;
    newReview?: boolean;
    studentQuestion?: boolean;
    platformUpdate?: boolean;
  };
  isActive: boolean;
  isVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "instructor", "student", "support"],
      default: "student",
      index: true,
    },
    permissions: [{ type: String }],
    instructorStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    isSuspended: { type: Boolean, default: false, index: true },
    suspensionReason: { type: String, default: "" },
    avatar: { type: String, default: "" },
    headline: { type: String, default: "" },
    bio: { type: String, default: "" },
    website: { type: String, default: "" },
    skills: [{ type: String }],
    experienceYears: { type: Number, default: 0 },
    profileSlug: { type: String, trim: true },
    isPublicProfileVisible: { type: Boolean, default: true },
    socialLinks: {
      github: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
    notificationPreferences: {
      newEnrollment: { type: Boolean, default: true },
      newReview: { type: Boolean, default: true },
      studentQuestion: { type: Boolean, default: true },
      platformUpdate: { type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
