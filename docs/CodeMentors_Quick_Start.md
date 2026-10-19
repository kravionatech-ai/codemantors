# CodeMentors LMS — Developer & Operator Quick Start Guide

**Document ID:** `DOC-QS-2026-v1.2`  
**Platform Version:** `v1.2.0 (Production Release)`  
**Platform Publisher:** Kraviona Tech Solutions  
**Publication Date:** October 19, 2026

---

## 1. System Prerequisites & Environment

Before deploying or running CodeMentors locally, verify the following prerequisites:

| Requirement | Supported Version | Verification Command | Notes |
|---|---|---|---|
| **Node.js** | `>= 20.x` (`24.x` recommended) | `node -v` | Active LTS or Current |
| **NPM** | `>= 10.x` | `npm -v` | Node Package Manager |
| **MongoDB** | `>= 6.x` | `mongod --version` | Local or MongoDB Atlas URI |
| **Web Browser** | Chrome `>= 120` or Edge | `chrome --version` | For UI testing & PDF generation |

---

## 2. 5-Step Rapid Setup

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/kraviona/codementors.git
cd codementors
npm install
```

### Step 2: Configure Local Environment Variables
Create a `.env.local` file in the project root:
```env
# Database Connection
MONGODB_URI="mongodb://localhost:27017/codementors"

# Authentication Security
JWT_SECRET="codementors-secure-production-ready-jwt-secret-key-32-chars-min"
DEV_TEST_PASSWORD="DevOnly123!ChangeMe"

# Razorpay Payment Gateway (Test Sandbox Mode)
RAZORPAY_KEY_ID="rzp_test_codementors_demo"
RAZORPAY_KEY_SECRET="codementors_secret_key_mock_12345"
RAZORPAY_WEBHOOK_SECRET="codementors_webhook_secret_mock_12345"

# Platform Metadata
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Seed Test Accounts & Development Data
Seed the 3 deterministic development accounts:
```bash
npm run db:seed:test-accounts
```
*(Optional: Seed full demonstration catalog with courses, categories, and quizzes)*:
```bash
npm run db:seed
```

### Step 4: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Step 5: Run Verification Test Suite
Ensure all integration checks pass:
```bash
npm run test:accounts
```

---

## 3. Dedicated Development Test Personas

> [!WARNING]
> **DEVELOPMENT ONLY:** These credentials are configured strictly for local sandbox testing. Never deploy these credentials to production environments.

| Role | Email Address | Development Password | Portal Route | Primary Function |
|---|---|---|---|---|
| **Administrator** | `admin@codementors.test` | `DevOnly123!ChangeMe` | `/admin/dashboard` | Platform Governance, SEO, Users, Payments |
| **Instructor** | `instructor@codementors.test` | `DevOnly123!ChangeMe` | `/instructor/dashboard` | Course Authoring, Curriculum, Analytics |
| **Student** | `student@codementors.test` | `DevOnly123!ChangeMe` | `/student/dashboard` | Course Player, Quizzes, Certificates |

---

## 4. First Course Creation in 3 Minutes

Follow these steps to author your first course:

1. **Sign In:** Navigate to [http://localhost:3000/login](http://localhost:3000/login) and log in as `instructor@codementors.test`.
2. **Access Studio:** Click **"Create Course"** on the dashboard or go to `/instructor/courses/new`.
3. **Basic Information:**
   - Title: `Next.js App Router Mastery`
   - Slug: `nextjs-app-router-mastery`
   - Category: Select `Web Development`
   - Skill Level: Select `Intermediate`
4. **Pricing:** Check `Free Foundation Course` (or enter `₹1,999` for paid).
5. **Syllabus:** Author the course description using the **RichTextEditor** with formatting and bullet points.
6. **Save Draft:** Click **"Save Draft"** to generate the course ID.
7. **Build Curriculum:**
   - Navigate to `/instructor/courses/[id]/curriculum`.
   - Click **"Add Module"** (e.g., `Module 1: Foundations`).
   - Click **"Add Lesson"** inside the module.
   - Choose **Lesson Type: Video** and provide a stream URL.
   - Click **"Publish Course"** to deploy the course to the public catalog!

---

## 5. Common Startup Issues & Quick Fixes

| Issue | Diagnosis | Quick Resolution |
|---|---|---|
| **MongoDB connection refused** | Local MongoDB daemon is not running. | Run `mongod --dbpath <data_dir>` or provide a valid MongoDB Atlas URI in `MONGODB_URI`. |
| **Redirect loop on /login** | Stale or invalid JWT token in cookies. | Clear your browser cookies or open an Incognito window. |
| **Port 3000 already in use** | Another development process is occupying port 3000. | Start on a different port: `npx next dev -p 3005` or kill the existing process. |
| **Razorpay modal does not open** | Demo keys in production mode. | Toggle gateway mode to `Test` in `/admin/settings/payments` or set valid test keys in `.env.local`. |
| **TypeScript compile errors** | Node modules out of sync. | Run `npm run test:rich-text` to verify sanitizer, and ensure Node.js is `>= 20.x`. |

---

## 6. Key Operations Commands Reference

```bash
# Development
npm run dev                  # Start dev server on port 3000
npm run lint                 # Run ESLint validation

# Testing & QA
npm test                     # Run entire test suite (106 tests)
npm run test:accounts        # Verify 3 test accounts & auth
npm run test:rich-text       # Run RichTextEditor & XSS tests
npm run test:instructor      # Run Instructor Studio quota tests

# Production
npm run build                # Compile production Next.js build
npm start                    # Run production server on port 3000
```
