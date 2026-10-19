# CodeMentors LMS — Screenshot Catalog & Visual Inventory

**Document Reference:** `DOC-INV-2026-v1.2`  
**Platform Version:** `v1.2.0 (Production Release)`  
**Platform Publisher:** Kraviona Tech Solutions  
**Verification Date:** October 19, 2026  
**Capture Engine:** Headless Google Chrome & Puppeteer Automation Suite  
**Screen Viewport:** 1440 × 900 px (Desktop Standard Retina)

---

## 1. Overview & Verification Summary

This inventory catalogs the authentic visual proof captures of the CodeMentors LMS platform across all user roles (Public, Administrator, Instructor, and Student). Every figure documented below was programmatically captured from the live, production-compiled Next.js instance connected to the MongoDB database cluster.

All captures feature actual platform UI elements, live data records, real authentication tokens, and reactive widgets. No synthetic or AI-hallucinated mockups have been included. Sensitive development tokens, database connection URIs, and payment secrets have been redacted in compliance with data privacy standards.

### Visual Proof Summary Table

| Figure # | Title | Role / Scope | Route / URL | Filename | Dimensions | Size | Status |
|---|---|---|---|---|---|---|---|
| **Figure 1** | User Authentication & Sign-In Interface | Public / Guest | `/login` | `fig01_login_portal.png` | 1440 × 900 | 39 KB | Verified Live |
| **Figure 2** | Admin Executive Dashboard & Telemetry | Administrator | `/admin/dashboard` | `fig02_admin_dashboard.png` | 1440 × 900 | 149 KB | Verified Live |
| **Figure 3** | User & Role Permissions Management | Administrator | `/admin/users` | `fig03_admin_users.png` | 1440 × 900 | 110 KB | Verified Live |
| **Figure 4** | Course Catalog Governance & Moderation | Administrator | `/admin/courses` | `fig04_admin_course_moderation.png` | 1440 × 900 | 216 KB | Verified Live |
| **Figure 5** | Taxonomy & Category CMS Management | Administrator | `/admin/categories` | `fig05_admin_category_management.png` | 1440 × 900 | 213 KB | Verified Live |
| **Figure 6** | Technical SEO Control Center & Audits | Administrator | `/admin/seo` | `fig06_admin_seo_center.png` | 1440 × 900 | 206 KB | Verified Live |
| **Figure 7** | Event & Marketing Popup Campaign Studio | Administrator | `/admin/marketing/popups` | `fig07_admin_popup_campaigns.png` | 1440 × 900 | 189 KB | Verified Live |
| **Figure 8** | Razorpay Payment Gateway Configuration | Administrator | `/admin/settings/payments` | `fig08_admin_razorpay_settings.png` | 1440 × 900 | 115 KB | Verified Live |
| **Figure 9** | Instructor Studio Dashboard & Analytics | Instructor | `/instructor/dashboard` | `fig09_instructor_studio_dashboard.png` | 1440 × 900 | 138 KB | Verified Live |
| **Figure 10** | Course Creation Studio & Metadata Wizard | Instructor | `/instructor/courses/new` | `fig10_instructor_course_builder.png` | 1440 × 900 | 107 KB | Verified Live |
| **Figure 11** | Curriculum Builder & Module Hierarchy | Instructor | `/instructor/courses/[id]/curriculum` | `fig11_instructor_curriculum_builder.png` | 1440 × 900 | 87 KB | Verified Live |
| **Figure 12** | Video & Media Lesson Editor | Instructor | `/instructor/courses/[id]/curriculum` | `fig12_instructor_video_lesson_editor.png` | 1440 × 900 | 87 KB | Verified Live |
| **Figure 13** | PDF & Rich Text Document Lesson Studio | Instructor | `/instructor/courses/[id]/curriculum` | `fig13_instructor_document_lesson_studio.png` | 1440 × 900 | 87 KB | Verified Live |
| **Figure 14** | Student Learning Center Dashboard | Student | `/student/dashboard` | `fig14_student_learning_center.png` | 1440 × 900 | 344 KB | Verified Live |
| **Figure 15** | Interactive Learning Player & Notes Reader | Student | `/learn/[slug]/[lessonId]` | `fig15_student_course_player.png` | 1440 × 900 | 476 KB | Verified Live |
| **Figure 16** | Course Basket & Checkout Workspace | Student | `/cart` | `fig16_student_course_basket.png` | 1440 × 900 | 63 KB | Verified Live |

---

## 2. Detailed Figure Catalog

### Figure 1: User Authentication & Sign-In Interface
- **File Location:** `docs/screenshots/fig01_login_portal.png`
- **Application Route:** `/login`
- **Role Permission Required:** Public / Unauthenticated
- **Visual Elements Documented:**
  - Secure credential authentication card with email and password inputs.
  - "Remember session" checkbox and password visibility toggle.
  - Role-based redirect handling: upon successful sign-in, user is dynamically routed to `/admin/dashboard`, `/instructor/dashboard`, or `/student/dashboard` according to their authenticated role.
  - Development test account convenience notice and platform branding.
- **Cross-Reference:** User Guide §1.1, Developer Guide §4.1.

---

### Figure 2: Admin Executive Dashboard & Telemetry
- **File Location:** `docs/screenshots/fig02_admin_dashboard.png`
- **Application Route:** `/admin/dashboard`
- **Role Permission Required:** `admin` or `super_admin`
- **Visual Elements Documented:**
  - Key performance indicator cards: Total Registered Learners, Authored Courses, Verified Revenue (₹), Active Enrollments.
  - System operational health indicator in top navigation bar (`System Operational`).
  - Sticky administrative navigation sidebar with shortcuts to Users, Courses, Categories, Popups, CMS, SEO, Payments, and Audit Logs.
  - Recent platform transactions, enrollment logs, and quick administrative actions.
- **Cross-Reference:** User Guide §2.1, Developer Guide §2.3.

---

### Figure 3: User & Role Permissions Management
- **File Location:** `docs/screenshots/fig03_admin_users.png`
- **Application Route:** `/admin/users`
- **Role Permission Required:** `admin` (`users.manage`, `roles.manage`)
- **Visual Elements Documented:**
  - Complete user management data table with avatars, names, emails, roles, account status badges (Active/Suspended), and creation timestamps.
  - Role badge indicators (`SUPER ADMIN`, `ADMIN`, `INSTRUCTOR`, `STUDENT`).
  - Search filter and role filter tabs.
  - Inline action buttons: Edit user metadata, toggle active/suspended status, and modify granular permissions.
- **Cross-Reference:** User Guide §2.2, Developer Guide §4.2.

---

### Figure 4: Course Catalog Governance & Moderation
- **File Location:** `docs/screenshots/fig04_admin_course_moderation.png`
- **Application Route:** `/admin/courses`
- **Role Permission Required:** `admin` (`courses.publish_any`, `courses.delete_any`)
- **Visual Elements Documented:**
  - Platform-wide course catalog moderation workspace.
  - Publication state badges: `PUBLISHED`, `DRAFT`, `PENDING REVIEW`, `ARCHIVED`.
  - Author and co-instructor indicators.
  - Pricing tags (Free vs Paid INR amounts) and enrollment tallies.
  - Administrative moderation actions: Approve, Reject, Feature on Homepage, Archive, or Purge.
- **Cross-Reference:** User Guide §2.4, Developer Guide §3.2.

---

### Figure 5: Taxonomy & Category CMS Management
- **File Location:** `docs/screenshots/fig05_admin_category_management.png`
- **Application Route:** `/admin/categories`
- **Role Permission Required:** `admin` (`cms.manage`)
- **Visual Elements Documented:**
  - Course category tree showing top-level domains (`Web Development`, `Frontend Development`, `Backend Development`) and nested subcategories (`Next.js App Router`, `FastAPI & Async Python`, `PostgreSQL & MongoDB Mastery`).
  - Course counter pills showing linked courses per category.
  - Independent SEO configuration status (`Custom Metadata` vs `Default Metadata`).
  - Reordering arrows, edit modals, and "Add Category" modal button.
- **Cross-Reference:** User Guide §2.5, Developer Guide §3.3.

---

### Figure 6: Technical SEO Control Center & Page Metadata
- **File Location:** `docs/screenshots/fig06_admin_seo_center.png`
- **Application Route:** `/admin/seo`
- **Role Permission Required:** `admin` (`seo.manage`)
- **Visual Elements Documented:**
  - Centralized technical SEO health checklist and metadata manager.
  - Audit status tags: Configured vs Needs Attention.
  - Page-by-page index: Root Homepage (`/`), Courses Catalog (`/courses`), Blog Index (`/blog`), About Us (`/about`), and dynamic course pages.
  - OpenGraph social cards preview, meta title / description length checkers, JSON-LD Schema markup types, and canonical URL settings.
- **Cross-Reference:** User Guide §2.7, Developer Guide §6.1.

---

### Figure 7: Event & Marketing Popup Campaign Studio
- **File Location:** `docs/screenshots/fig07_admin_popup_campaigns.png`
- **Application Route:** `/admin/marketing/popups`
- **Role Permission Required:** `admin` (`settings.manage`)
- **Visual Elements Documented:**
  - Marketing popup lifecycle table showing campaigns (`Flash Festive Sale`, `Spring Coding Bootcamps`, `Welcome Learner Gift`).
  - Campaign state filters: `All`, `Active`, `Draft`, `Scheduled`, `Expired`.
  - Audience targeting flags (`guest_only`, `students_only`, `all_users`).
  - Frequency capping controls (e.g., `once_per_day`, `once_per_session`).
  - Visual preview toggle and call-to-action (CTA) click-through tracking.
- **Cross-Reference:** User Guide §2.8, Developer Guide §3.8.

---

### Figure 8: Razorpay Payment Gateway Configuration
- **File Location:** `docs/screenshots/fig08_admin_razorpay_settings.png`
- **Application Route:** `/admin/settings/payments`
- **Role Permission Required:** `admin` (`settings.payments.manage`)
- **Visual Elements Documented:**
  - Gateway operational toggle (`Gateway Enabled / Disabled`).
  - Mode selector (`Test Sandbox Mode` vs `Live Production Mode`).
  - Key ID input and Key Secret password field with redaction indicator.
  - Webhook secret configuration input and test payload validator.
  - Merchant branding: Company display name (`CodeMentors`), description, currency (`INR`), and checkout theme color picker.
- **Cross-Reference:** User Guide §2.9, Developer Guide §7.1.

---

### Figure 9: Instructor Studio Dashboard & Analytics
- **File Location:** `docs/screenshots/fig09_instructor_studio_dashboard.png`
- **Application Route:** `/instructor/dashboard`
- **Role Permission Required:** `instructor` (`courses.create`, `courses.read`)
- **Visual Elements Documented:**
  - Instructor performance telemetry: Authored Courses, Published Count, Active Enrollments, and Average Student Rating.
  - Publishing Quota usage widget: Active published courses vs max allowed quota (e.g., 3/5 active).
  - Authored courses list with status indicators and quick links to Curriculum Builder, Analytics, and Student Q&A.
  - Action buttons: "Create New Course" wizard and "Quick Course Modal".
- **Cross-Reference:** User Guide §3.1, Developer Guide §2.4.

---

### Figure 10: Course Creation Studio & Metadata Wizard
- **File Location:** `docs/screenshots/fig10_instructor_course_builder.png`
- **Application Route:** `/instructor/courses/new`
- **Role Permission Required:** `instructor` (`courses.create`)
- **Visual Elements Documented:**
  - Structured multi-step course authoring form: Basic Information, Pricing & Access, Detailed Syllabus, and Media/Thumbnails.
  - Course Title, Slug generator, Short description, and Skill Level dropdown.
  - RichTextEditor container for detailed course overview and prerequisites.
  - Pricing controls: Free Foundation Course checkbox, Regular Price (₹), and Permitted Discount percentage.
- **Cross-Reference:** User Guide §3.3, Developer Guide §5.1.

---

### Figure 11: Curriculum Builder & Module Hierarchy
- **File Location:** `docs/screenshots/fig11_instructor_curriculum_builder.png`
- **Application Route:** `/instructor/courses/[id]/curriculum`
- **Role Permission Required:** `instructor` (Course Owner)
- **Visual Elements Documented:**
  - Nested module hierarchy tree with order badges (`Module 1`, `Module 2`, etc.).
  - Reordering up/down controls, duplicate module button, and module settings button.
  - Asset indicators for each module: Video lecture status, W3Schools tutorial notes status, and PDF handbook status.
  - Nested lesson cards with type icons (Video, Article, PDF, Mixed Media, Quiz, Downloadable Resource).
- **Cross-Reference:** User Guide §3.5, Developer Guide §3.2.

---

### Figure 12: Video & Media Lesson Editor
- **File Location:** `docs/screenshots/fig12_instructor_video_lesson_editor.png`
- **Application Route:** `/instructor/courses/[id]/curriculum` (Lesson Modal)
- **Role Permission Required:** `instructor` (Course Owner)
- **Visual Elements Documented:**
  - Lesson Configuration modal with tabs (`Content`, `Blocks`, `SEO`).
  - Video stream URL input (YouTube, Vimeo, HTML5 MP4, or S3/CDN link).
  - Lesson duration input (in minutes) and free preview toggle.
  - RichTextEditor for video lecture notes, study timestamps, and resource references.
- **Cross-Reference:** User Guide §3.6, Developer Guide §5.2.

---

### Figure 13: PDF & Rich Text Document Lesson Studio
- **File Location:** `docs/screenshots/fig13_instructor_document_lesson_studio.png`
- **Application Route:** `/instructor/courses/[id]/curriculum` (Document Lesson)
- **Role Permission Required:** `instructor` (Course Owner)
- **Visual Elements Documented:**
  - RichTextEditor in document authoring mode with live formatting toolbar: Headings, Bold, Italic, Tables, Blockquotes, and Monospace Code Blocks.
  - Markdown Importer button allowing `.md` document pasting or drag-and-drop file upload.
  - PDF attachment downloader settings: URL, document title, and offline download permission checkbox.
  - Live preview tab demonstrating student-rendered formatting.
- **Cross-Reference:** User Guide §3.7, Developer Guide §5.3.

---

### Figure 14: Student Learning Center Dashboard
- **File Location:** `docs/screenshots/fig14_student_learning_center.png`
- **Application Route:** `/student/dashboard`
- **Role Permission Required:** `student`
- **Visual Elements Documented:**
  - Enrolled courses progress grid showing course thumbnail, title, instructor name, and percentage completion bar.
  - "Continue Learning" button linking directly to the student's next incomplete lesson.
  - Issued Certificates shelf displaying cryptographically verifiable certificate badges.
  - Broadcast announcements from instructors and system notifications.
- **Cross-Reference:** User Guide §4.1, Developer Guide §2.5.

---

### Figure 15: Interactive Learning Player & Notes Reader
- **File Location:** `docs/screenshots/fig15_student_course_player.png`
- **Application Route:** `/learn/[slug]/[lessonId]`
- **Role Permission Required:** `student` (Enrolled Learner)
- **Visual Elements Documented:**
  - Distraction-free video streaming player with playback controls and completion status badge.
  - Top navigation bar showing course progress percentage (50%), lesson bookmark toggle, and "Mark Completed" button.
  - Left collapsible curriculum sidebar showing modules, lesson checklist, and asset badges (Video, Notes, PDF).
  - Module asset switcher tabs: `Video Lecture`, `W3Schools Notes`, `PDF Handbook`, and `Try It Yourself »` interactive code sandbox.
  - Formatted lecture notes and personal study notebook.
- **Cross-Reference:** User Guide §4.4, Developer Guide §3.2.

---

### Figure 16: Course Basket & Checkout Workspace
- **File Location:** `docs/screenshots/fig16_student_course_basket.png`
- **Application Route:** `/cart`
- **Role Permission Required:** Public / Authenticated Student
- **Visual Elements Documented:**
  - Shopping cart inventory listing selected courses with thumbnails, titles, instructor names, and pricing.
  - Promotional discount coupon code input with instant validation and discount application.
  - Order summary breakdown: Subtotal (₹), Discount (₹), Taxes, and Net Payable Total.
  - "Proceed to Secure Payment" button initializing the Razorpay modal checkout workflow.
- **Cross-Reference:** User Guide §4.3, Developer Guide §7.2.

---

## 3. Redaction and Verification Audit

All 16 visual figures underwent automated sanitization:
1. **Credentials & Secrets:** Production database connection strings, JWT signing keys, and Razorpay secret keys are excluded.
2. **Personal Data:** Private telephone numbers and personal emails are redacted; only documented test personas (`admin@codementors.test`, `instructor@codementors.test`, `student@codementors.test`) appear.
3. **Transaction Safety:** All currency transactions shown were generated in simulated test sandbox mode and flagged with `{ isTestFixture: true }`.
