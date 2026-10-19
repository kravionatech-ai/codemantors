import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Rich markdown or HTML
  authorId: Types.ObjectId;
  category: string;
  tags: string[];
  coverImage?: string;
  readingTimeMinutes: number;
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
  viewsCount: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    noFollow?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true, default: "Engineering", index: true },
    tags: [{ type: String }],
    coverImage: { type: String, default: "" },
    readingTimeMinutes: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date },
    viewsCount: { type: Number, default: 0 },
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
  { timestamps: true }
);

BlogPostSchema.index({ title: "text", excerpt: "text", content: "text" });

export const BlogPost: Model<IBlogPost> =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);

export default BlogPost;
