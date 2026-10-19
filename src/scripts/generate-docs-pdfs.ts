import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { markdownToHtml } from "../lib/markdown-parser";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const DOCS_DIR = path.resolve(process.cwd(), "docs");
const SCREENSHOTS_DIR = path.join(DOCS_DIR, "screenshots");

function getBase64Image(filename: string): string {
  const filePath = path.join(SCREENSHOTS_DIR, filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString("base64")}`;
  }
  return "";
}

function processDocumentContent(mdContent: string): string {
  let html = markdownToHtml(mdContent);

  // Callouts
  html = html.replace(/<blockquote[^>]*>\s*<p>\[!NOTE\]\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi, '<div class="callout callout-note"><strong>NOTE:</strong> $1</div>');
  html = html.replace(/<blockquote[^>]*>\s*<p>\[!WARNING\]\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi, '<div class="callout callout-warning"><strong>WARNING:</strong> $1</div>');
  html = html.replace(/<blockquote[^>]*>\s*<p>\[!TIP\]\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi, '<div class="callout callout-tip"><strong>TIP:</strong> $1</div>');
  html = html.replace(/<blockquote[^>]*>\s*<p>\[!IMPORTANT\]\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi, '<div class="callout callout-important"><strong>IMPORTANT:</strong> $1</div>');

  // Fallback for raw callout markers if not in blockquote
  html = html.replace(/> \[!NOTE\]\s*([^\n<]+)/gi, '<div class="callout callout-note"><strong>NOTE:</strong> $1</div>');
  html = html.replace(/> \[!WARNING\]\s*([^\n<]+)/gi, '<div class="callout callout-warning"><strong>WARNING:</strong> $1</div>');
  html = html.replace(/> \[!TIP\]\s*([^\n<]+)/gi, '<div class="callout callout-tip"><strong>TIP:</strong> $1</div>');
  html = html.replace(/> \[!IMPORTANT\]\s*([^\n<]+)/gi, '<div class="callout callout-important"><strong>IMPORTANT:</strong> $1</div>');

  // Figure mappings
  const figureMap: Record<string, { file: string; caption: string }> = {
    "Figure 1:": { file: "fig01_login_portal.png", caption: "Figure 1: User Authentication & Sign-In Interface" },
    "Figure 2:": { file: "fig02_admin_dashboard.png", caption: "Figure 2: Admin Executive Dashboard & Telemetry" },
    "Figure 3:": { file: "fig03_admin_users.png", caption: "Figure 3: User & Role Permissions Management" },
    "Figure 4:": { file: "fig04_admin_course_moderation.png", caption: "Figure 4: Course Catalog Governance & Moderation" },
    "Figure 5:": { file: "fig05_admin_category_management.png", caption: "Figure 5: Taxonomy & Category CMS Management" },
    "Figure 6:": { file: "fig06_admin_seo_center.png", caption: "Figure 6: Technical SEO Control Center & Page Metadata" },
    "Figure 7:": { file: "fig07_admin_popup_campaigns.png", caption: "Figure 7: Event & Marketing Popup Campaign Studio" },
    "Figure 8:": { file: "fig08_admin_razorpay_settings.png", caption: "Figure 8: Razorpay Payment Gateway Configuration" },
    "Figure 9:": { file: "fig09_instructor_studio_dashboard.png", caption: "Figure 9: Instructor Studio Dashboard & Analytics" },
    "Figure 10:": { file: "fig10_instructor_course_builder.png", caption: "Figure 10: Course Creation Studio & Metadata Wizard" },
    "Figure 11:": { file: "fig11_instructor_curriculum_builder.png", caption: "Figure 11: Curriculum Builder & Module Hierarchy" },
    "Figure 12:": { file: "fig12_instructor_video_lesson_editor.png", caption: "Figure 12: Video & Media Lesson Editor" },
    "Figure 13:": { file: "fig13_instructor_document_lesson_studio.png", caption: "Figure 13: PDF & Rich Text Document Lesson Studio" },
    "Figure 14:": { file: "fig14_student_learning_center.png", caption: "Figure 14: Student Learning Center Dashboard" },
    "Figure 15:": { file: "fig15_student_course_player.png", caption: "Figure 15: Interactive Learning Player & Notes Reader" },
    "Figure 16:": { file: "fig16_student_course_basket.png", caption: "Figure 16: Course Basket & Checkout Workspace" },
  };

  Object.keys(figureMap).forEach((key) => {
    const fig = figureMap[key];
    const b64 = getBase64Image(fig.file);
    if (b64) {
      const imgHtml = `
        <div class="figure-container">
          <img src="${b64}" alt="${fig.caption}" class="figure-img" />
          <div class="figure-caption">${fig.caption}</div>
        </div>
      `;
      const pattern = new RegExp(`<div class="callout callout-note"><strong>NOTE:<\\/strong>\\s*Figure Reference:.*?${key}.*?<\\/div>`, "gi");
      html = html.replace(pattern, imgHtml);
    }
  });

  return html;
}

function buildDocumentHtml(
  title: string,
  subtitle: string,
  docId: string,
  contentHtml: string
): string {
  const currentDate = "October 19, 2026";
  const version = "v1.2.0 (Production Release)";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 22mm 16mm 22mm 16mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.6;
      font-size: 10pt;
      margin: 0;
      padding: 0;
    }
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 92vh;
      padding: 40px 10px;
    }
    .cover-badge {
      display: inline-block;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #2563eb;
      background: #eff6ff;
      padding: 6px 14px;
      border-radius: 9999px;
      border: 1px solid #bfdbfe;
      margin-bottom: 24px;
    }
    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin: 0 0 16px 0;
    }
    .cover-subtitle {
      font-size: 13pt;
      color: #475569;
      font-weight: 400;
      line-height: 1.5;
      margin: 0 0 40px 0;
    }
    .cover-metadata {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px 24px;
      margin-top: 30px;
    }
    .cover-metadata table {
      width: 100%;
      border-collapse: collapse;
    }
    .cover-metadata td {
      padding: 6px 0;
      font-size: 9.5pt;
      border: none;
      background: transparent !important;
    }
    .cover-metadata td.meta-label {
      font-weight: 700;
      color: #64748b;
      width: 35%;
    }
    .cover-metadata td.meta-val {
      font-weight: 600;
      color: #0f172a;
    }
    .cover-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      font-size: 8.5pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    h1 {
      font-size: 17pt;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 26px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1e293b;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #334155;
      margin-top: 16px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    p {
      margin: 0 0 10px 0;
    }
    pre {
      background: #0f172a;
      border-radius: 6px;
      margin: 12px 0;
      padding: 10px 14px;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    code {
      font-family: "Cascadia Code", "Fira Code", Consolas, Courier, monospace;
      font-size: 8pt;
      color: #38bdf8;
    }
    p code, td code, li code {
      background: #f1f5f9;
      color: #0369a1;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 8.5pt;
      border: 1px solid #e2e8f0;
    }
    .table-responsive, .table-wrapper {
      margin: 14px 0;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin: 10px 0;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 10px;
      border: 1px solid #334155;
    }
    td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      color: #334155;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .callout {
      padding: 10px 14px;
      border-radius: 6px;
      margin: 14px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }
    .callout-note {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e3a8a;
    }
    .callout-warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #78350f;
    }
    .callout-tip {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      color: #064e3b;
    }
    .callout-important {
      background: #faf5ff;
      border-left: 4px solid #a855f7;
      color: #581c87;
    }
    .figure-container {
      margin: 18px 0;
      page-break-inside: avoid;
      text-align: center;
    }
    .figure-img {
      max-width: 100%;
      height: auto;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .figure-caption {
      font-size: 8.5pt;
      font-weight: 700;
      color: #475569;
      margin-top: 6px;
      text-align: center;
    }
    ul, ol {
      margin: 0 0 10px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 4px;
      font-size: 9pt;
    }
    a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <div>
      <div class="cover-badge">Kraviona Tech Solutions • Official Platform Guide</div>
      <h1 class="cover-title">${title}</h1>
      <div class="cover-subtitle">${subtitle}</div>
    </div>

    <div class="cover-metadata">
      <table>
        <tr>
          <td class="meta-label">Document ID:</td>
          <td class="meta-val">${docId}</td>
        </tr>
        <tr>
          <td class="meta-label">Platform Version:</td>
          <td class="meta-val">${version}</td>
        </tr>
        <tr>
          <td class="meta-label">Publisher:</td>
          <td class="meta-val">Kraviona Tech Solutions (Private Limited)</td>
        </tr>
        <tr>
          <td class="meta-label">Release Date:</td>
          <td class="meta-val">${currentDate}</td>
        </tr>
        <tr>
          <td class="meta-label">Classification:</td>
          <td class="meta-val">Verified Production Technical Manual</td>
        </tr>
      </table>
    </div>

    <div class="cover-footer">
      <span>CodeMentors Learning Management System</span>
      <span>Confidential & Proprietary • Kraviona Tech Solutions</span>
    </div>
  </div>

  <div class="content-body">
    ${contentHtml}
  </div>
</body>
</html>`;
}

async function run() {
  console.log("=== Generating Official Documentation PDFs via Puppeteer ===");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });

  async function exportPdf(
    mdFilename: string,
    pdfFilename: string,
    title: string,
    subtitle: string,
    docId: string
  ) {
    console.log(`\nCompiling ${pdfFilename}...`);
    const page = await browser.newPage();
    const mdPath = path.join(DOCS_DIR, mdFilename);
    const pdfPath = path.join(DOCS_DIR, pdfFilename);

    const mdContent = fs.readFileSync(mdPath, "utf-8");
    const parsedHtml = processDocumentContent(mdContent);
    const fullHtml = buildDocumentHtml(title, subtitle, docId, parsedHtml);

    // Using load instead of networkidle0 prevents stalling on unresolved external assets
    await page.setContent(fullHtml, { waitUntil: "load", timeout: 30000 });

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 7.5pt; font-family: sans-serif; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 16mm; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;">
          <span>CodeMentors LMS — ${title}</span>
          <span>Version 1.2.0</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 7.5pt; font-family: sans-serif; color: #94a3b8; width: 100%; display: flex; justify-content: space-between; padding: 0 16mm; border-top: 1px solid #f1f5f9; padding-top: 4px;">
          <span>Kraviona Tech Solutions • Official Documentation</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      margin: {
        top: "22mm",
        bottom: "22mm",
        left: "16mm",
        right: "16mm",
      },
    });

    const stats = fs.statSync(pdfPath);
    console.log(`✔ Generated: ${pdfFilename} (${Math.round(stats.size / 1024)} KB)`);
    await page.close();
  }

  // 1. User Guide PDF
  await exportPdf(
    "CodeMentors_User_Guide.md",
    "CodeMentors_User_Guide.pdf",
    "Comprehensive User Manual & Operations Guide",
    "End-to-End Operational Documentation for Administrators, Instructors, and Students",
    "DOC-UG-2026-v1.2"
  );

  // 2. Developer Guide PDF
  await exportPdf(
    "CodeMentors_Developer_Guide.md",
    "CodeMentors_Developer_Guide.pdf",
    "Technical Architecture & Developer Guide",
    "Deep Architectural Reference, Schemas, Security Pipelines, SEO, and Payment Protocols",
    "DOC-DEV-2026-v1.2"
  );

  // 3. Quick Start PDF
  await exportPdf(
    "CodeMentors_Quick_Start.md",
    "CodeMentors_Quick_Start.pdf",
    "Developer & Operator Quick Start Guide",
    "Rapid Onboarding, 5-Step Setup, Test Personas, First Course Authoring, and Common Fixes",
    "DOC-QS-2026-v1.2"
  );

  await browser.close();
  console.log("\n=======================================================");
  console.log("ALL 3 DOCUMENTATION PDFS GENERATED SUCCESSFULLY!");
  console.log("=======================================================\n");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("PDF generation failure:", err);
    process.exit(1);
  });
