import mongoose, { Schema, Document, Model } from "mongoose";

export type SeoEntityType =
  | "homepage"
  | "about"
  | "contact"
  | "course_catalog"
  | "course"
  | "category"
  | "learning_path"
  | "blog_index"
  | "blog_post"
  | "instructor"
  | "cms_page"
  | "custom";

export interface IPageSeo extends Document {
  path: string; // e.g. "/", "/about", "/courses/nextjs-mastery"
  slug: string;
  entityType: SeoEntityType;
  entityId?: string; // Reference to course/post/category ID if applicable
  pageName: string;
  title: string;
  description: string;
  canonicalUrl: string;
  noIndex: boolean;
  noFollow: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredDataType?: "Organization" | "WebSite" | "Course" | "Article" | "Person" | "BreadcrumbList" | "None";
  structuredDataCustom?: string; // JSON-LD custom string
  status: "draft" | "published" | "archived";
  seoScore?: number;
  issues?: string[];
  lastAuditedAt?: Date;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PageSeoSchema = new Schema<IPageSeo>(
  {
    path: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    slug: { type: String, default: "", trim: true },
    entityType: {
      type: String,
      enum: [
        "homepage",
        "about",
        "contact",
        "course_catalog",
        "course",
        "category",
        "learning_path",
        "blog_index",
        "blog_post",
        "instructor",
        "cms_page",
        "custom",
      ],
      default: "custom",
      index: true,
    },
    entityId: { type: String, default: "" },
    pageName: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    canonicalUrl: { type: String, default: "", trim: true },
    noIndex: { type: Boolean, default: false },
    noFollow: { type: Boolean, default: false },
    ogTitle: { type: String, default: "", trim: true },
    ogDescription: { type: String, default: "", trim: true },
    ogImage: { type: String, default: "", trim: true },
    twitterCard: { type: String, enum: ["summary", "summary_large_image"], default: "summary_large_image" },
    twitterTitle: { type: String, default: "", trim: true },
    twitterDescription: { type: String, default: "", trim: true },
    twitterImage: { type: String, default: "", trim: true },
    structuredDataType: {
      type: String,
      enum: ["Organization", "WebSite", "Course", "Article", "Person", "BreadcrumbList", "None"],
      default: "None",
    },
    structuredDataCustom: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    seoScore: { type: Number, default: 100 },
    issues: [{ type: String }],
    lastAuditedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

PageSeoSchema.index({ entityType: 1, status: 1 });

export const PageSeo: Model<IPageSeo> =
  mongoose.models.PageSeo || mongoose.model<IPageSeo>("PageSeo", PageSeoSchema);

export default PageSeo;
