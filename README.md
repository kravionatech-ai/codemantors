# CodeMentors — Professional Online Learning Management System (LMS)

[![Next.js 16](https://img.shields.io/badge/Next.js-16%20(App%20Router)-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248.svg)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Verified-0c2340.svg)](https://razorpay.com/)

**CodeMentors** is a complete, production-ready full-stack online learning platform engineered specifically for software developers, engineers, and tech career switchers. The platform delivers mixed-modality technical learning with HD video lessons, deep-dive syntax-highlighted articles, interactive conceptual quizzes, in-browser coding practice sandboxes, cryptographic completion certificates, and multi-role dashboards for students, instructors, and platform administrators.

---

## 1. Key Features & Highlights

### 🎥 Mixed-Modality Learning Engine
- **Video Player**: Custom styled controls, timeline scrubber, forward/rewind 10s, volume/mute, playback speeds (0.75x to 2x), fullscreen, video completion tracking at 90% threshold, and periodic position auto-save every 10 seconds.
- **Article Reader**: Rich technical documentation layout, table of contents (TOC) generated dynamically from headings, estimated reading time, copyable code blocks with language tags, callout banners (`[!NOTE]`, `[!TIP]`), and mark-as-complete workflows.
- **Quiz Engine**: Timed assessments, single/multiple-choice, code snippet comprehension, server-side score calculation, instant detailed feedback, passing thresholds, and retry attempt counters.
- **Coding Practice Sandbox**: In-browser client sandboxed code runner, test cases validator (expected vs. actual output), hints accordion, and code reset.
- **Personal Notes & Bookmarks**: Dedicated per-lesson persistent notes scratchpad and bookmarking for quick reference.

### 🏆 Cryptographic Certificates & Verification
- Automatic certificate issuance upon 100% course curriculum completion and passing of required assessments.
- Unique credential verification code (e.g. `CM-2026-X89J21`).
- Public verification portal at `/certificates/[code]` with printable certificate styling and digital verification seal.

### 💳 Razorpay Payments, Coupons & Refunds
- Verified server-side HMAC-SHA256 signature verification (`orderId|paymentId` against secret).
- Support for percentage and fixed discount coupons (e.g. `WELCOME20`, `CODEMENTOR500`).
- Automated duplicate payment callback protection and idempotent enrollment fulfillment.
- 7-Day Refund Request workflow with administrative review queue, payment ledger reconciliation, and enrollment access revocation.

### 👥 Role-Based Portals
- **Student Dashboard (`/dashboard`)**: Continue Learning quick-resume banner, enrolled courses progress bars, quiz attempt records, certificate gallery, and profile settings.
- **Instructor Studio (`/instructor`)**: Authored course metrics (total students, ratings, gross earnings), course draft creation, module & lesson management, and review replies.
- **Admin Control Panel (`/admin`)**: Platform revenue ledger, total user counts, course moderation (publish/unpublish/feature), role delegation (`student` ↔ `instructor` ↔ `admin`), and refund queue approval.

---

## 2. Technology Stack

- **Framework**: Next.js 16 (App Router) with TypeScript & React 19
- **Styling**: Tailwind CSS v4 with dark navy/slate surface aesthetics
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Stateless JWT session cookies (`jose`), salted `bcryptjs` password hashing
- **Validation**: Zod schema validation
- **Icons**: Lucide React
- **Payments**: Razorpay Node SDK with test mode fallback and HMAC-SHA256 verification
- **SEO & Social**: Dynamic sitemap (`sitemap.xml`), `robots.txt`, OpenGraph metadata, and Schema.org JSON-LD

---

## 3. Demo Credentials

The database comes pre-seeded with realistic courses, lessons, quizzes, coding exercises, coupons, reviews, and test accounts:

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@codemetors.com` | `Password@12345` | `/admin` |
| **Instructor** | `alex@codemetors.com` | `Password@12345` | `/instructor` |
| **Student** | `student@codemetors.com` | `Password@12345` | `/dashboard` |

> *Tip: The Login page includes 1-click quick login buttons to auto-fill these demo credentials.*

---

## 4. Getting Started

### Prerequisites
- Node.js (v18.18+ or v20+ recommended)
- MongoDB running locally on port 27017 or a remote MongoDB Atlas URI

### Installation & Setup

1. **Clone or navigate to the repository:**
   ```bash
   cd codemetors
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file (copy from `.env.example`):
   ```ini
   MONGODB_URI=mongodb://127.0.0.1:27017/codementors
   JWT_SECRET=codementors-secure-production-ready-jwt-secret-key-32-chars-min
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   RAZORPAY_KEY_ID=rzp_test_codementors_demo
   RAZORPAY_KEY_SECRET=codementors_secret_key_mock_12345
   ```

4. **Seed the Database:**
   ```bash
   npm run seed
   ```

5. **Run the Automated Test Suite:**
   ```bash
   npm run test:workflows
   ```

6. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

7. **Build for Production:**
   ```bash
   npm run build
   npm run start
   ```

---

## 5. Project Directory Structure

```
codemetors/
├── src/
│   ├── app/                               # Next.js App Router Pages & API routes
│   │   ├── (public pages)
│   │   │   ├── page.tsx                   # Flagship Landing Page
│   │   │   ├── courses/page.tsx           # Course Catalog with dynamic filters
│   │   │   ├── courses/[slug]/page.tsx    # Course Details & Curriculum
│   │   │   ├── learning-paths/page.tsx    # Curated Career Roadmaps
│   │   │   ├── about/page.tsx             # About & Curriculum Directorate
│   │   │   ├── contact/page.tsx           # Contact & Support Tickets
│   │   │   ├── help/page.tsx              # Help Center & Knowledge Base
│   │   │   ├── faq/page.tsx               # Interactive FAQ Accordion
│   │   │   ├── terms/page.tsx             # Terms of Service
│   │   │   ├── privacy/page.tsx           # Privacy Policy
│   │   │   ├── refund-policy/page.tsx     # 7-Day Refund Policy
│   │   │   ├── login/page.tsx             # User Authentication & 1-Click Fillers
│   │   │   ├── register/page.tsx          # User Registration & Role Selection
│   │   │   ├── forgot-password/page.tsx   # Password Reset Dispatch
│   │   │   ├── certificates/[code]/page.tsx # Public Certificate Verification
│   │   │   ├── certificates/verify/page.tsx # Certificate Lookup Form
│   │   │   ├── sitemap.ts                 # Dynamic XML Sitemap
│   │   │   ├── robots.ts                  # Robots indexing rules
│   │   │   └── not-found.tsx              # Custom 404
│   │   ├── dashboard/page.tsx             # Student Dashboard
│   │   ├── instructor/page.tsx            # Instructor Studio
│   │   ├── admin/page.tsx                 # Root Admin Control Suite
│   │   ├── learn/[courseSlug]/[lessonId]/ # Core Learning Engine Room
│   │   └── api/                           # Secure REST Server Route Handlers
│   │       ├── auth/                      # Login, register, logout, me
│   │       ├── courses/                   # Listing, create, update, curriculum
│   │       ├── learn/                     # Access control, progress sync
│   │       ├── quizzes/                   # Quiz scoring & evaluation
│   │       ├── payments/                  # Razorpay order, verify, refund
│   │       ├── enrollments/               # Free & paid fulfillment
│   │       ├── coupons/                   # Coupon validation
│   │       ├── certificates/              # Certificate verification lookup
│   │       ├── reviews/                   # Course reviews & ratings
│   │       ├── notifications/             # In-app notifications
│   │       ├── admin/                     # Admin users, courses, refunds, stats
│   │       ├── instructor/                # Instructor metrics & authoring
│   │       └── seed/                      # Database seed endpoint
│   ├── components/                        # Reusable Accessible UI Components
│   │   ├── Navbar.tsx                     # Header with notifications & role switcher
│   │   ├── Footer.tsx                     # Footer with newsletter and legal links
│   │   ├── ui/
│   │   │   ├── CourseCard.tsx             # Interactive course card with progress
│   │   │   ├── Modal.tsx                  # Accessible modal with keyboard escape
│   │   │   └── CheckoutModal.tsx          # Razorpay checkout & coupon discounts
│   │   └── learning/
│   │       ├── VideoPlayer.tsx            # HD video player with resume & controls
│   │       ├── ArticleReader.tsx          # Technical tutorial reader with TOC & copy
│   │       ├── QuizPlayer.tsx             # Timed interactive quiz player & report
│   │       ├── CodingExercisePlayer.tsx   # Client sandbox code runner & unit tests
│   │       └── CertificateCard.tsx        # High-res verified certificate with seal
│   ├── context/
│   │   ├── AuthContext.tsx                # Client session state provider
│   │   └── ToastContext.tsx               # Reactive toast notifications provider
│   ├── lib/
│   │   ├── db.ts                          # Cached MongoDB connection singleton
│   │   ├── auth.ts                        # JWT and bcrypt security utilities
│   │   ├── razorpay.ts                    # Razorpay order & HMAC verification
│   │   ├── email.ts                       # Email & in-app notification dispatcher
│   │   └── seed.ts                        # Comprehensive mock data generator
│   ├── models/                            # Mongoose Schemas & TypeScript interfaces
│   │   ├── User.ts
│   │   ├── Course.ts
│   │   ├── Category.ts
│   │   ├── LearningPath.ts
│   │   ├── Enrollment.ts
│   │   ├── LessonProgress.ts
│   │   ├── Quiz.ts
│   │   ├── QuizAttempt.ts
│   │   ├── Certificate.ts
│   │   ├── Review.ts
│   │   ├── Payment.ts
│   │   ├── Refund.ts
│   │   ├── Coupon.ts
│   │   ├── Notification.ts
│   │   └── SupportTicket.ts
│   └── scripts/
│       ├── seed.ts                        # CLI seed runner
│       └── test-workflows.ts              # Automated LMS workflow test suite
├── package.json
└── tsconfig.json
```

---

## 6. External Services Configuration

| Service | Purpose | Configuration Requirements |
| :--- | :--- | :--- |
| **MongoDB** | Primary database | Set `MONGODB_URI` in `.env.local` to local or MongoDB Atlas cluster. |
| **Razorpay** | Payment processing | Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env.local`. Test mode simulation works out of the box with `rzp_test_...` keys. |
| **SMTP / Email** | Transactional emails | Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in `.env.local` (e.g. SendGrid, Mailgun, AWS SES). A simulated console logger and in-app notifications run by default. |
| **Vercel / Node** | Production deployment | Connect repository to Vercel or host on any Node.js VPS. Set production environment variables. |

---

## 7. Quality Assurance & Production Verification

- **TypeScript Compilation**: `npx tsc --noEmit` passes with 0 errors.
- **Production Build**: `npm run build` succeeds with full route tree generation and static optimization.
- **Workflow Automated Tests**: `npm run test:workflows` passes 29/29 assertions covering security, enrollment, quizzes, certificate issuance, payments, and refund cycles.
