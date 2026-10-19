import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISiteSettings extends Document {
  key: string; // "global_config"
  siteName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl?: string;
  brandColors?: {
    primaryNavy: string;
    primaryBlue: string;
    accentCyan: string;
    background: string;
  };
  heroBanner: {
    title: string;
    subtitle: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    badgeText: string;
  };
  announcementBanner: {
    enabled: boolean;
    message: string;
    linkText: string;
    linkUrl: string;
    bannerType: "info" | "warning" | "success" | "sale";
  };
  navigation: {
    headerLinks: Array<{
      label: string;
      href: string;
      order: number;
      isVisible: boolean;
    }>;
    footerColumns: Array<{
      title: string;
      links: Array<{ label: string; href: string }>;
    }>;
    socialLinks: {
      twitter?: string;
      github?: string;
      linkedin?: string;
      youtube?: string;
      discord?: string;
    };
  };
  seoDefaults: {
    defaultTitle: string;
    titleTemplate: string;
    defaultDescription: string;
    defaultOgImage: string;
    canonicalDomain: string;
    googleSiteVerification?: string;
    bingSiteVerification?: string;
    robotsTxtContent?: string;
    sitemapEnabled: boolean;
  };
  features: {
    courseApprovalRequired: boolean;
    allowPublicRegistration: boolean;
    enableReviews: boolean;
    enableCertificates: boolean;
    maintenanceMode: boolean;
  };
  companyBranding: {
    enabled: boolean;
    companyName: string;
    companyUrl: string;
    logoUrl?: string;
    tagline: string;
    shortDescription: string;
    services: string[];
    contact: {
      website: string;
      email: string;
      phone: string;
    };
    displayPosition: "footer_bottom" | "footer_brand" | "both";
    openInNewTab: boolean;
  };
  emailSettings?: {
    provider: string;
    fromName: string;
    fromEmail: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpSecure?: boolean;
  };
  storageSettings?: {
    provider: string;
    maxImageSizeBytes: number;
    maxVideoSizeBytes: number;
    allowedImageTypes: string[];
    allowedDocTypes: string[];
  };
  securitySettings?: {
    sessionTimeoutHours: number;
    maxLoginAttempts: number;
    lockoutMinutes: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
  };
  limitsSettings?: {
    maxCoursesPerInstructor: number;
    maxFileSizeMb: number;
    requireCourseApproval: boolean;
  };
  integrationsSettings?: {
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
    metaPixelId?: string;
  };
  contactSettings?: {
    supportEmail: string;
    supportPhone: string;
    address: string;
  };
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, required: true, unique: true, default: "global_config", index: true },
    siteName: { type: String, default: "CodeMentors" },
    tagline: { type: String, default: "Learn to Code. Build Real Skills. Grow Your Career." },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
    brandColors: {
      primaryNavy: { type: String, default: "#172554" },
      primaryBlue: { type: String, default: "#2563EB" },
      accentCyan: { type: String, default: "#06B6D4" },
      background: { type: String, default: "#F8FAFC" },
    },
    heroBanner: {
      title: { type: String, default: "Learn to Code. Build Real Skills. Grow Your Career." },
      subtitle: {
        type: String,
        default:
          "Production-ready programming courses, hands-on architectural code challenges, and recognized developer credentials taught by top engineering leaders.",
      },
      primaryCtaText: { type: String, default: "Explore Courses" },
      primaryCtaLink: { type: String, default: "/courses" },
      secondaryCtaText: { type: String, default: "Browse Learning Paths" },
      secondaryCtaLink: { type: String, default: "/learning-paths" },
      badgeText: { type: String, default: "🚀 New: Next.js 15 & Full-Stack Docker Tracks Available" },
    },
    announcementBanner: {
      enabled: { type: Boolean, default: true },
      message: { type: String, default: "🎉 Flash Sale: Use coupon WELCOME20 at checkout for an extra 20% off all architectural masterclasses!" },
      linkText: { type: String, default: "Claim Offer" },
      linkUrl: { type: String, default: "/courses" },
      bannerType: { type: String, default: "sale" },
    },
    navigation: {
      headerLinks: [
        {
          label: { type: String, required: true },
          href: { type: String, required: true },
          order: { type: Number, default: 0 },
          isVisible: { type: Boolean, default: true },
        },
      ],
      footerColumns: [
        {
          title: { type: String, required: true },
          links: [
            {
              label: { type: String, required: true },
              href: { type: String, required: true },
            },
          ],
        },
      ],
      socialLinks: {
        twitter: { type: String, default: "https://twitter.com/codementors" },
        github: { type: String, default: "https://github.com/codementors" },
        linkedin: { type: String, default: "https://linkedin.com/company/codementors" },
        youtube: { type: String, default: "https://youtube.com/@codementors" },
        discord: { type: String, default: "https://discord.gg/codementors" },
      },
    },
    seoDefaults: {
      defaultTitle: { type: String, default: "CodeMentors — Production-Grade Developer Education & Masterclasses" },
      titleTemplate: { type: String, default: "%s | CodeMentors" },
      defaultDescription: {
        type: String,
        default:
          "Master software engineering, cloud systems, and modern web frameworks with structured courses, quizzes, and accredited certificates.",
      },
      defaultOgImage: { type: String, default: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop" },
      canonicalDomain: { type: String, default: "http://localhost:3005" },
      googleSiteVerification: { type: String, default: "" },
      bingSiteVerification: { type: String, default: "" },
      robotsTxtContent: { type: String, default: "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /student/\nDisallow: /instructor/\nDisallow: /checkout\nDisallow: /cart\nDisallow: /learn/*/*" },
      sitemapEnabled: { type: Boolean, default: true },
    },
    features: {
      courseApprovalRequired: { type: Boolean, default: false },
      allowPublicRegistration: { type: Boolean, default: true },
      enableReviews: { type: Boolean, default: true },
      enableCertificates: { type: Boolean, default: true },
      maintenanceMode: { type: Boolean, default: false },
    },
    companyBranding: {
      enabled: { type: Boolean, default: true },
      companyName: { type: String, default: "Kraviona Tech Solutions" },
      companyUrl: { type: String, default: "https://kraviona.com/" },
      logoUrl: { type: String, default: "" },
      tagline: {
        type: String,
        default: "Web Development | Backend Engineering | Technical SEO | AI Automation",
      },
      shortDescription: {
        type: String,
        default:
          "Kraviona Tech Solutions is a technology company focused on web development, full-stack application development, backend engineering, technical SEO, web performance, and AI automation.",
      },
      services: {
        type: [String],
        default: [
          "MERN Stack Development",
          "React.js and Next.js Development",
          "Node.js Backend and API Development",
          "Technical SEO and Website Performance Optimization",
          "UI/UX and Web Application Development",
          "AI Automation and AI Chatbot Development",
          "E-commerce Development",
        ],
      },
      contact: {
        website: { type: String, default: "https://kraviona.com/contact" },
        email: { type: String, default: "contact@kraviona.com" },
        phone: { type: String, default: "+91 96085 53167" },
      },
      displayPosition: {
        type: String,
        enum: ["footer_bottom", "footer_brand", "both"],
        default: "both",
      },
      openInNewTab: { type: Boolean, default: true },
    },
    emailSettings: {
      provider: { type: String, default: "simulated" },
      fromName: { type: String, default: "CodeMentors Support" },
      fromEmail: { type: String, default: "support@codementors.com" },
      smtpHost: { type: String, default: "" },
      smtpPort: { type: Number, default: 587 },
      smtpUser: { type: String, default: "" },
      smtpPass: { type: String, default: "" },
      smtpSecure: { type: Boolean, default: false },
    },
    storageSettings: {
      provider: { type: String, default: "local" },
      maxImageSizeBytes: { type: Number, default: 5242880 },
      maxVideoSizeBytes: { type: Number, default: 524288000 },
      allowedImageTypes: { type: [String], default: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
      allowedDocTypes: { type: [String], default: ["application/pdf", "application/zip"] },
    },
    securitySettings: {
      sessionTimeoutHours: { type: Number, default: 168 },
      maxLoginAttempts: { type: Number, default: 5 },
      lockoutMinutes: { type: Number, default: 15 },
      passwordMinLength: { type: Number, default: 8 },
      requireTwoFactor: { type: Boolean, default: false },
    },
    limitsSettings: {
      maxCoursesPerInstructor: { type: Number, default: 50 },
      maxFileSizeMb: { type: Number, default: 100 },
      requireCourseApproval: { type: Boolean, default: false },
    },
    integrationsSettings: {
      googleAnalyticsId: { type: String, default: "" },
      googleTagManagerId: { type: String, default: "" },
      metaPixelId: { type: String, default: "" },
    },
    contactSettings: {
      supportEmail: { type: String, default: "support@codementors.com" },
      supportPhone: { type: String, default: "+91 96085 53167" },
      address: { type: String, default: "Tech Innovation Hub, Cyber City, Bangalore, India" },
    },
  },
  { timestamps: true }
);

export const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings || mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);

export default SiteSettings;
