# CodeMentors LMS — Comprehensive User Manual & Operations Guide

**Document ID:** `DOC-UG-2026-v1.2`  
**Platform Version:** `v1.2.0 (Production Release)`  
**Platform Publisher:** Kraviona Tech Solutions  
**Publication Date:** October 19, 2026  
**Target Audience:** Administrators, Instructors, Content Creators, and Students

---

## Document Control & Executive Overview

The **CodeMentors Learning Management System (LMS)** is an enterprise-grade developer education and course delivery platform. This manual provides exhaustive, step-by-step documentation for all operational roles: Platform Administrators, Course Instructors, and Enrolled Learners.

All procedures, navigation routes, UI controls, and workflows described in this manual have been validated against the production build of the CodeMentors codebase.

### Table of Contents

- [1. Authentication & Account Access](#1-authentication--account-access)
  - [1.1 Sign-In & Role Redirection](#11-sign-in--role-redirection)
  - [1.2 Development Test Personas & Credentials](#12-development-test-personas--credentials)
  - [1.3 Password Recovery & Session Security](#13-password-recovery--session-security)
- [2. Platform Administrator Manual](#2-platform-administrator-manual)
  - [2.1 Administrator Navigation & Executive Dashboard](#21-administrator-navigation--executive-dashboard)
  - [2.2 User Directory & Account Governance](#22-user-directory--account-governance)
  - [2.3 Role-Based Access Control (RBAC) & Instructor Quotas](#23-role-based-access-control-rbac--instructor-quotas)
  - [2.4 Course Catalog Moderation & Approval](#24-course-catalog-moderation--approval)
  - [2.5 Taxonomy & Category Management](#25-taxonomy--category-management)
  - [2.6 Dynamic CMS & Institutional Landing Pages](#26-dynamic-cms--institutional-landing-pages)
  - [2.7 Technical SEO Control Center & Page Metadata](#27-technical-seo-control-center--page-metadata)
  - [2.8 Marketing Popups & Event Campaign Studio](#28-marketing-popups--event-campaign-studio)
  - [2.9 Financial Settings, Orders, and Razorpay Gateway](#29-financial-settings-orders-and-razorpay-gateway)
  - [2.10 Global Site Branding & Audit Trail](#210-global-site-branding--audit-trail)
- [3. Course Instructor Manual](#3-course-instructor-manual)
  - [3.1 Instructor Studio Overview & Performance KPIs](#31-instructor-studio-overview--performance-kpis)
  - [3.2 Profile & Biography Settings](#32-profile--biography-settings)
  - [3.3 Course Authoring Wizard & Syllabus Configuration](#33-course-authoring-wizard--syllabus-configuration)
  - [3.4 Pricing, Discounts, and Quota Rules](#34-pricing-discounts-and-quota-rules)
  - [3.5 Curriculum Builder & Module Organization](#35-curriculum-builder--module-organization)
  - [3.6 Video & Media Lesson Production](#36-video--media-lesson-production)
  - [3.7 Rich Text, W3Schools Tutorials, and PDF Handbooks](#37-rich-text-w3schools-tutorials-and-pdf-handbooks)
  - [3.8 Multi-Block Mixed-Media Lessons](#38-multi-block-mixed-media-lessons)
  - [3.9 Quizzes & Automated Assessments](#39-quizzes--automated-assessments)
  - [3.10 Course Publication & Moderation Workflow](#310-course-publication--moderation-workflow)
  - [3.11 Student Enrollments, Reviews, and Q&A Announcements](#311-student-enrollments-reviews-and-qa-announcements)
- [4. Student & Learner Manual](#4-student--learner-manual)
  - [4.1 Registration, Onboarding, and Student Dashboard](#41-registration-onboarding-and-student-dashboard)
  - [4.2 Catalog Discovery, Filters, and Previews](#42-catalog-discovery-filters-and-previews)
  - [4.3 Course Basket, Coupons, and Razorpay Checkout](#43-course-basket-coupons-and-razorpay-checkout)
  - [4.4 Interactive Course Player & Study Notebook](#44-interactive-course-player--study-notebook)
  - [4.5 Quizzes, Assessments, and Certificate Verification](#45-quizzes-assessments-and-certificate-verification)
  - [4.6 Order History, Receipts, and Refund Requests](#46-order-history-receipts-and-refund-requests)
  - [4.7 Account Settings & Support Inquiries](#47-account-settings--support-inquiries)
- [5. Troubleshooting & Frequently Asked Questions](#5-troubleshooting--frequently-asked-questions)

---

## 1. Authentication & Account Access

### 1.1 Sign-In & Role Redirection

The CodeMentors LMS features a centralized, responsive authentication portal located at `/login`.

```
        ┌─────────────────────────────────────────────────────────┐
        │                     /login Portal                       │
        │             Enter Email & Password / JWT Auth           │
        └───────────────────────────┬─────────────────────────────┘
                                    │
                                    ▼
       ┌────────────────────────────┼────────────────────────────┐
       │                            │                            │
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  Super Admin │             │  Instructor  │             │   Student    │
│    / Admin   │             │              │             │              │
│      ▼       │             │      ▼       │             │      ▼       │
│    /admin/   │             │ /instructor/ │             │   /student/  │
│   dashboard  │             │   dashboard  │             │   dashboard  │
└──────────────┘             └──────────────┘             └──────────────┘
```

#### Step-by-Step Sign-In Workflow:
1. Navigate to `/login` via web browser.
2. Enter your registered email address and password into the respective fields.
3. Click the **"Sign In"** button.
4. The system validates credentials via `POST /api/auth/login`, issues an encrypted `cm_token` HTTP-only cookie, and inspects the user's role:
   - **`admin` / `super_admin`** users are routed directly to `/admin/dashboard`.
   - **`instructor`** users are routed directly to `/instructor/dashboard`.
   - **`student`** users are routed directly to `/student/dashboard`.
5. If you originally attempted to access a deep link while unauthenticated (e.g., `/learn/nextjs/lesson-3`), the system preserves the intended destination in the `?redirect=` URL query parameter and seamlessly routes you there upon authentication.

> [!NOTE]
> Figure Reference: See [Figure 1: User Authentication & Sign-In Interface](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig01_login_portal.png) in the Screenshot Inventory.

---

### 1.2 Development Test Personas & Credentials

> [!WARNING]
> **DEVELOPMENT / STAGING ENVIRONMENT NOTICE ONLY**  
> The accounts listed below are pre-seeded solely for local testing, integration validation, and demonstration purposes. These accounts must never be provisioned or shared in production environments.

The development database is provisioned with exactly three deterministic personas:

| Role | Email Address | Development Password | Portal Entry Point | Effective Permissions |
|---|---|---|---|---|
| **Platform Administrator** | `admin@codementors.test` | `DevOnly123!ChangeMe` | `/admin/dashboard` | Full System Administration (`*`) |
| **Course Instructor** | `instructor@codementors.test` | `DevOnly123!ChangeMe` | `/instructor/dashboard` | Course Authoring, Analytics, Q&A |
| **Enrolled Student** | `student@codementors.test` | `DevOnly123!ChangeMe` | `/student/dashboard` | Learning Player, Quizzes, Certificates |

To re-seed or verify these accounts on your local environment, execute:
```bash
npm run db:seed:test-accounts
npm run test:accounts
```

---

### 1.3 Password Recovery & Session Security

- **Session Inactivity:** Active sessions expire after 7 days of inactivity.
- **Password Reset:** If an account password is forgotten, users may access `/forgot-password`, submit their email address, and receive a secure one-time cryptographic reset token.
- **Session Termination:** Clicking **"Sign Out"** in the top navigation bar clears the `cm_token` cookie and invalidates the client session state immediately.

---

## 2. Platform Administrator Manual

### 2.1 Administrator Navigation & Executive Dashboard

The Administrator workspace is accessible at `/admin/dashboard`. The executive dashboard aggregates mission-critical telemetry into live KPI cards:

1. **Total Registered Learners:** Real-time count of active student records.
2. **Authored Courses:** Platform catalog volume broken down by Published, Draft, and Archived states.
3. **Verified Platform Revenue (₹):** Aggregate sum of completed payments processed through the payment gateway.
4. **Active Enrollments:** Cumulative count of active student course enrollments.
5. **System Operational Status:** Real-time database cluster latency and API heartbeat indicator.

> [!NOTE]
> Figure Reference: See [Figure 2: Admin Executive Dashboard & Telemetry](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig02_admin_dashboard.png).

---

### 2.2 User Directory & Account Governance

Accessible via `/admin/users`, the User Directory enables complete lifecycle control over platform accounts.

#### Administrative Capabilities:
- **Search & Filtering:** Search learners and staff by name or email. Filter by role (`Student`, `Instructor`, `Admin`, `Super Admin`) or status (`Active`, `Suspended`).
- **Account Creation:** Click **"Add User"** to manually provision staff accounts, define initial credentials, and assign primary roles.
- **Status Toggling:** Suspend compromised accounts instantly with one click. Suspended users are barred from logging in and rejected by edge middleware.
- **Role Elevation:** Promote instructors to administrators or grant temporary staff access with custom overrides.

> [!NOTE]
> Figure Reference: See [Figure 3: User & Role Permissions Management](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig03_admin_users.png).

---

### 2.3 Role-Based Access Control (RBAC) & Instructor Quotas

Administrators can inspect and adjust fine-grained permissions at `/admin/permissions` and instructor capacity limits at `/admin/settings/limits` (or via `/api/admin/instructors`):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Instructor Quotas & RBAC                        │
├──────────────────────────┬─────────────────────────────┬───────────────┤
│ Quota Parameter          │ Default Platform Limit      │ Custom Scope  │
├──────────────────────────┼─────────────────────────────┼───────────────┤
│ Max Active Courses       │ 5 Published Courses         │ Per-Instructor│
│ Max Draft Courses        │ 10 Draft Courses            │ Per-Instructor│
│ Max Modules per Course   │ 20 Modules                  │ Global / Rule │
│ Max Lessons per Module   │ 100 Lessons                 │ Global / Rule │
│ Max Video Duration       │ 90 Minutes per Video        │ Global / Rule │
│ Max Upload File Size     │ 250 Megabytes               │ Global / Rule │
│ Max Allowed Price        │ ₹50,000 INR                 │ Per-Instructor│
│ Require Approval Flag    │ False (Auto-Publish)        │ Per-Instructor│
│ SEO Editing Permitted    │ True                        │ Per-Instructor│
└──────────────────────────┴─────────────────────────────┴───────────────┘
```

When an instructor reaches their allocated ceiling (e.g., trying to publish a 6th course with a limit of 5), the system gracefully rejects the action and presents a descriptive modal directing them to request an administrative quota expansion.

---

### 2.4 Course Catalog Moderation & Approval

Accessible at `/admin/courses`, administrators supervise the complete catalog:

- **Publication Review:** Inspect submitted drafts in `pending_review` status. Check syllabus structure, pricing, learning outcomes, and video links.
- **Moderation Actions:**
  - **Approve & Publish:** Transitions status to `published`, making the course visible on `/courses`.
  - **Reject with Feedback:** Returns status to `draft` with instructor remediation notes.
  - **Feature Course:** Toggles the `isFeatured` badge, promoting the course to the homepage carousel.
  - **Archive / Soft Delete:** Removes the course from public listings while preserving access for previously enrolled students.

> [!NOTE]
> Figure Reference: See [Figure 4: Course Governance & Moderation](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig04_admin_course_moderation.png).

---

### 2.5 Taxonomy & Category Management

Accessible at `/admin/categories`, the taxonomy CMS manages course discovery domains:

- **Hierarchical Nesting:** Create parent domains (e.g., `Web Development`, `Backend Development`) and link specialized subcategories (e.g., `Next.js App Router`, `FastAPI & Async Python`).
- **Category Metadata:** Define name, unique URL slug (`/categories/nextjs-app-router`), icon name, and detailed rich text description.
- **Independent SEO:** Each category possesses dedicated SEO controls (custom meta title, description, and OpenGraph image).
- **Course Linking:** Courses assigned to categories automatically inherit taxonomy breadcrumbs and faceted filter tags.

> [!NOTE]
> Figure Reference: See [Figure 5: Taxonomy & Category CMS Management](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig05_admin_category_management.png).

---

### 2.6 Dynamic CMS & Institutional Landing Pages

Accessible at `/admin/cms/pages`, administrators build dynamic content pages (such as `/about`, `/help`, `/terms`, `/privacy`, and `/company`):

- **Section Architecture:** Each page comprises ordered sections (e.g., Hero, Detailed Description, Feature Grid, Callout).
- **Integrated Rich Text Editor:** Content within sections is edited using the unified `RichTextEditor`, featuring bold, italic, code formatting, tables, lists, and live preview.
- **Publication Lifecycle:** Draft pages remain invisible to guests; published pages are cached and accessible via `/pages/[slug]`.

---

### 2.7 Technical SEO Control Center & Page Metadata

Accessible at `/admin/seo`, the Technical SEO Control Center governs discoverability and search indexing:

- **Per-Page Index:** Manage metadata for root routes (`/`, `/courses`, `/blog`, `/faq`, `/contact`).
- **Audit Indicators:** The system evaluates metadata length and highlights pages requiring attention:
  - Meta Title: Recommended length between 40 and 60 characters.
  - Meta Description: Recommended length between 120 and 160 characters.
- **Social Open Graph:** Upload custom OpenGraph social share cards (1200 × 630 px).
- **Structured Data (JSON-LD):** Automatically generates Schema.org entities (`EducationalOrganization`, `Course`, `Article`, `FAQPage`, `BreadcrumbList`).
- **Robots & Sitemap:** Automatically compiles `/sitemap.xml` and `/robots.txt`. Private dashboard routes (`/admin/*`, `/instructor/*`, `/student/*`) are assigned `noindex, nofollow` headers to prevent search indexing.

> [!NOTE]
> Figure Reference: See [Figure 6: Technical SEO Control Center & Page Metadata](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig06_admin_seo_center.png).

---

### 2.8 Marketing Popups & Event Campaign Studio

Accessible at `/admin/marketing/popups`, administrators create promotional banners and lead capture modals:

- **Lifecycle States:** `Draft`, `Active`, `Scheduled` (date range), `Expired`.
- **Audience Targeting:**
  - `all_users`: Displays to all visitors.
  - `guest_only`: Targets unauthenticated visitors with sign-up promotions.
  - `students_only`: Targets logged-in students with bundle discounts.
- **Frequency Capping:** Limit impressions to `once_per_session`, `once_per_day`, or `unlimited`.
- **Call-to-Action (CTA):** Configure headline, body text, banner graphic, primary action URL, and track real click-through conversions.

> [!NOTE]
> Figure Reference: See [Figure 7: Event & Marketing Popup Campaign Studio](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig07_admin_popup_campaigns.png).

---

### 2.9 Financial Settings, Orders, and Razorpay Gateway

Accessible at `/admin/settings/payments` and `/admin/orders`:

- **Operational Gateway Toggle:** Enable or disable gateway checkout platform-wide.
- **Test vs Live Modes:** Switch seamlessly between Test Sandbox Mode and Production Live Mode.
- **Secret Credentials:** Store Key ID, Key Secret, and Webhook Signing Secret in encrypted database records.
- **Merchant Customization:** Customize merchant name (`CodeMentors`), transaction description, default currency (`INR`), and checkout brand color (`#172554`).
- **Order Audit Table:** View every transaction with Order ID, Student Name, Course Purchased, Amount, Payment State (`completed`, `pending`, `failed`, `refunded`), and Razorpay Reference ID.
- **Refund Processing:** Review student refund requests, verify lesson completion percentage, and execute automatic or manual refunds.

> [!NOTE]
> Figure Reference: See [Figure 8: Razorpay Payment Gateway Configuration](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig08_admin_razorpay_settings.png).

---

### 2.10 Global Site Branding & Audit Trail

- **Branding Settings (`/admin/settings/branding`):** Manage institutional identity (`Kraviona Tech Solutions`), logo URL, favicon, support email (`support@codementors.test`), and social profile links.
- **Audit Trail (`/admin/audit`):** Immutable chronological record logging all administrative actions: user logins, role changes, course status transitions, price modifications, and refund executions, complete with IP address and timestamp.

---

## 3. Course Instructor Manual

### 3.1 Instructor Studio Overview & Performance KPIs

The Instructor Studio is accessible at `/instructor/dashboard`:

- **Key Performance Indicators:** Displays Total Authored Courses, Published Count, Active Learner Enrollments, and Average Rating.
- **Publishing Quota Widget:** Displays current course quota usage (e.g., `3 of 5 active courses published`).
- **Courses Requiring Attention:** Alerts instructors to empty modules, missing video links, or unpublished drafts.
- **Recent Student Questions:** Direct feed of student discussion questions from enrolled courses.

> [!NOTE]
> Figure Reference: See [Figure 9: Instructor Studio Dashboard & Analytics](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig09_instructor_studio_dashboard.png).

---

### 3.2 Profile & Biography Settings

Accessible via `/instructor/settings`:
- Configure public instructor name, professional headline (e.g., *"Senior Distributed Systems Architect"*), social links (GitHub, LinkedIn, Twitter), and profile avatar.
- Author an engaging public biography and teaching philosophy using the integrated `RichTextEditor`.

---

### 3.3 Course Authoring Wizard & Syllabus Configuration

To create a new course, click **"Create New Course"** at `/instructor/courses/new`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Course Creation Wizard Steps                      │
├─────────────────────┬───────────────────────────┬──────────────────────┤
│ Step 1: Basics      │ Step 2: Pricing & Access  │ Step 3: Syllabus     │
├─────────────────────┼───────────────────────────┼──────────────────────┤
│ • Course Title      │ • Free vs Paid Selection  │ • Detailed Overview  │
│ • URL Slug          │ • Regular Price (INR ₹)   │ • Prerequisites      │
│ • Category Domain   │ • Discount Percentage     │ • Learning Outcomes  │
│ • Skill Level       │ • Access Duration (Months)│ • Target Audience    │
│ • Language          │ • Certificate Eligibility │ • Format Selection   │
└─────────────────────┴───────────────────────────┴──────────────────────┘
```

> [!NOTE]
> Figure Reference: See [Figure 10: Course Creation Studio & Metadata Wizard](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig10_instructor_course_builder.png).

---

### 3.4 Pricing, Discounts, and Quota Rules

- **Free Courses:** Checking "Free Foundation Course" allows students to enroll instantly with one click, bypassing the payment gateway.
- **Paid Courses:** Set a base price in INR (e.g., `₹2,999`). Optionally specify a discounted price (e.g., `₹1,499`) or percentage discount.
- **Quota Validation:** Prices must conform to platform rules (between `₹0` and `₹50,000`). If your account is restricted to free courses by an administrator, the paid course toggle will be locked with an explanatory message.

---

### 3.5 Curriculum Builder & Module Organization

Accessible at `/instructor/courses/[courseId]/curriculum`:

- **Module Creation:** Click **"Add Module"** to create a structured curriculum unit (e.g., *Module 1: Architecture & Foundations*).
- **Module Assets:** Configure module-level video lecture, W3Schools tutorial notes, and PDF handbook.
- **Reordering:** Click **"Up"** or **"Down"** arrows to reorder modules or individual lessons within seconds.
- **Cloning:** Click the **Duplicate** button to clone entire modules or lessons with unique IDs.

> [!NOTE]
> Figure Reference: See [Figure 11: Curriculum Builder & Module Hierarchy](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig11_instructor_curriculum_builder.png).

---

### 3.6 Video & Media Lesson Production

In the lesson creation modal, select **Lesson Type: Video**:
- **Video Source:** Input YouTube URL, Vimeo URL, MP4 link, or custom CDN stream.
- **Duration:** Enter lesson duration in minutes.
- **Free Preview:** Toggle the "Free Preview" switch to allow prospective learners to sample the lesson before purchasing.
- **Rich Lesson Notes:** Provide supplementary explanations, key takeaways, and code links using the `RichTextEditor`.

> [!NOTE]
> Figure Reference: See [Figure 12: Video & Media Lesson Editor](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig12_instructor_video_lesson_editor.png).

---

### 3.7 Rich Text, W3Schools Tutorials, and PDF Handbooks

- **Text & Article Lessons:** Author complete technical handbooks with the `RichTextEditor`. Embed formatted tables, bullet points, blockquotes, and syntax-highlighted code blocks (`html`, `javascript`, `python`, `typescript`).
- **Markdown Importer:** Have existing documentation in Markdown? Click the **"Import Markdown"** button, paste `.md` text or drag-and-drop a `.md` file, and the editor automatically converts it into structured HTML.
- **PDF Documents:** Provide a downloadable handbook URL, document title, and configure whether students may download the PDF or view it exclusively in the embedded reader.

> [!NOTE]
> Figure Reference: See [Figure 13: PDF & Rich Text Document Lesson Studio](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig13_instructor_document_lesson_studio.png).

---

### 3.8 Multi-Block Mixed-Media Lessons

For advanced hands-on lessons, select **Lesson Type: Mixed Media**:
- Sequentially stack independent content blocks:
  1. *Video Lecture Block* (concept introduction)
  2. *Rich Text Explanation Block* (theory & mechanics)
  3. *Syntax Code Block* (runnable code snippet)
  4. *Knowledge Check Block* (in-line conceptual quiz)
  5. *Downloadable Resource Block* (starter repository archive)
- Learners experience a seamless, guided learning progression without jumping between disjointed tabs.

---

### 3.9 Quizzes & Automated Assessments

Create interactive knowledge checks at `/instructor/courses/[courseId]/curriculum` or `/api/quizzes`:
- Define quiz title, instructions, time limit (minutes), and passing percentage (e.g., `80%`).
- Add multiple-choice questions with answer choices, correct answer designation, and post-submission explanations.
- Student quiz submissions are automatically graded; passing attempts are logged and count toward certificate eligibility.

---

### 3.10 Course Publication & Moderation Workflow

Before publishing, the system validates all publication prerequisites:
1. Course must contain at least 1 module.
2. The module must contain at least 1 published lesson.
3. Pricing and category must be defined.
4. Instructor must not exceed their active course publishing quota.

Once prerequisites are satisfied, clicking **"Publish Course"** either makes the course immediately live or submits it to the admin review queue depending on your instructor profile configuration.

---

### 3.11 Student Enrollments, Reviews, and Q&A Announcements

- **Enrollment Telemetry (`/instructor/enrollments`):** View enrolled student names, dates, and percentage completion.
- **Course Reviews (`/instructor/reviews`):** Read verified student ratings and post public instructor responses.
- **Broadcast Announcements (`/instructor/qa`):** Post announcements that appear directly inside enrolled students' dashboards.

---

## 4. Student & Learner Manual

### 4.1 Registration, Onboarding, and Student Dashboard

- **Account Registration:** Sign up at `/register` with your name, email, and password.
- **Student Dashboard (`/student/dashboard`):** Your personalized learning home:
  - **Enrolled Courses:** Interactive cards showing thumbnail, course title, instructor, and completion progress bar.
  - **"Continue Learning" Button:** Resumes playback exactly where you left off.
  - **Completed Shelf:** Displays earned certificates with quick links to download or share.
  - **Announcements & Notifications:** Real-time updates from course instructors.

> [!NOTE]
> Figure Reference: See [Figure 14: Student Learning Center Dashboard](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig14_student_learning_center.png).

---

### 4.2 Catalog Discovery, Filters, and Previews

- Browse the catalog at `/courses`.
- Filter by category domain, skill level (`Beginner`, `Intermediate`, `Advanced`), pricing (`Free`, `Paid`), and language.
- Click any course card to view the comprehensive Course Details page (`/courses/[slug]`), review the full syllabus, watch free preview lessons, and read instructor bios.

---

### 4.3 Course Basket, Coupons, and Razorpay Checkout

1. On any course page, click **"Enroll Free"** (for free courses) or **"Add to Basket"** (for paid courses).
2. Navigate to your cart at `/cart`.
3. Enter promotional coupon codes if available to apply instant discounts.
4. Click **"Proceed to Secure Payment"**.
5. The Razorpay payment modal opens, supporting UPI, Credit/Debit Cards, NetBanking, and Wallets.
6. Upon successful payment verification, your enrollment is generated instantaneously and you are redirected to the course player.

> [!NOTE]
> Figure Reference: See [Figure 16: Course Basket & Checkout Workspace](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig16_student_course_basket.png).

---

### 4.4 Interactive Course Player & Study Notebook

The course player at `/learn/[slug]/[lessonId]` provides an immersive learning environment:

- **Video Streaming:** High-definition video with keyboard shortcuts, speed controls (`0.5x` to `2.0x`), and full-screen mode.
- **Curriculum Sidebar:** Collapsible left navigation showing all modules, lesson titles, durations, and completion checkmarks.
- **Module Assets Tabs:**
  - *Video Lecture:* The primary video lesson.
  - *W3Schools Notes:* In-depth tutorial documentation with code syntax.
  - *PDF Handbook:* High-resolution technical handbook reader.
  - *Try It Yourself »:* Interactive code sandbox for live syntax experimentation.
- **Personal Study Notebook:** Take formatted personal study notes alongside any lesson. Notes are automatically saved to your account in the cloud.
- **Completion Tracking:** Click **"Mark Completed"** to log progress and unlock the next lesson.

> [!NOTE]
> Figure Reference: See [Figure 15: Interactive Learning Player & Notes Reader](file:///c:/Users/pc/Desktop/codemetors/docs/screenshots/fig15_student_course_player.png).

---

### 4.5 Quizzes, Assessments, and Certificate Verification

- **Taking Quizzes:** Answer multiple-choice questions within the allocated time. Review your score and detailed explanations upon submission.
- **Earning Certificates:** Upon completing 100% of curriculum lessons and passing all required quizzes, the platform automatically generates a cryptographically signed Certificate of Completion.
- **Public Verification:** Each certificate has a unique verification code verifiable by employers at `/certificates/verify` or via direct link `/certificates/[code]`.

---

### 4.6 Order History, Receipts, and Refund Requests

- Access payment receipts and transaction records at `/orders` or `/student/settings`.
- If unsatisfied with a purchased course, eligible students can submit a refund request within the allowed refund window (typically 7 days, provided less than 20% of lessons have been consumed).

---

### 4.7 Account Settings & Support Inquiries

- Manage your name, avatar, email preferences, and password at `/student/settings`.
- For technical assistance, submit a support ticket via the Help Desk at `/contact` or `/help`.

---

## 5. Troubleshooting & Frequently Asked Questions

| Symptom / Question | Root Cause | Solution |
|---|---|---|
| *"You do not have permission to access this resource"* | Logged in with incorrect user role. | Log out and sign in using an account endowed with the required role (`admin` or `instructor`). |
| *"Quota limit reached: Maximum allowed courses"* | Instructor has hit active course publishing limit. | Archive unneeded drafts, or contact an administrator to expand your quota in `/admin/settings/limits`. |
| Payment modal does not open on checkout. | Razorpay test credentials missing or gateway disabled. | Administrator must verify `/admin/settings/payments` has valid Key ID and gateway is toggled to **Enabled**. |
| Video lesson displays black screen. | Invalid video URL format or restricted embed permissions. | Ensure YouTube/Vimeo URLs are public/unlisted and allow third-party iframe embedding. |
| Certificate does not generate after completing lessons. | Course has mandatory quizzes that have not been passed. | Review curriculum for incomplete quizzes and achieve the required passing score (typically 80%). |
