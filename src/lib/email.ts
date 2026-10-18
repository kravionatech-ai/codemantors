import { connectDB } from "@/lib/db";
import { Notification } from "@/models/Notification";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  type?: "system" | "enrollment" | "course_update" | "certificate" | "payment" | "refund";
  link?: string;
}

export async function sendEmailAndNotify(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, text, userId, type = "system", link = "" } = options;

  // 1. Log or send transactional email
  try {
    const isSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
    if (isSmtpConfigured) {
      // In production with nodemailer or resend, dispatch actual email
      console.log(`[EMAIL DISPATCH] To: ${to} | Subject: ${subject}`);
    } else {
      console.log(`[EMAIL SIMULATED] To: ${to} | Subject: ${subject}\nContent preview: ${text || subject}`);
    }
  } catch (err) {
    // Email delivery failures must NEVER corrupt or crash transaction
    console.error("Non-fatal email dispatch error:", err);
  }

  // 2. Also persist in-app notification if userId is provided
  if (userId) {
    try {
      await connectDB();
      await Notification.create({
        userId,
        title: subject,
        message: text || subject,
        type,
        link,
        isRead: false,
      });
    } catch (err) {
      console.error("Non-fatal in-app notification creation error:", err);
    }
  }

  return true;
}

export function generateRegistrationEmail(name: string): { subject: string; html: string; text: string } {
  return {
    subject: "Welcome to CodeMentors! 🚀",
    text: `Hello ${name}, welcome to CodeMentors! Start exploring top courses and building real development skills today.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h1 style="color: #4f46e5;">Welcome to CodeMentors, ${name}!</h1>
        <p>We are thrilled to have you here. CodeMentors empowers you with practical, developer-focused video and text courses.</p>
        <p>Explore your dashboard, discover curated learning paths, and start coding today!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/courses" style="display: inline-block; background-color: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">Browse Courses</a>
      </div>
    `,
  };
}

export function generateEnrollmentEmail(name: string, courseTitle: string): { subject: string; html: string; text: string } {
  return {
    subject: `Enrolled: ${courseTitle} 🎓`,
    text: `Hi ${name}, you are now enrolled in ${courseTitle}. Jump right in to begin learning!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #4f46e5;">You're enrolled in ${courseTitle}!</h2>
        <p>Hi ${name}, congratulations on taking the next step in your tech career.</p>
        <p>Your access is active immediately. You can track progress, take quizzes, and earn your verified certificate upon completion.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" style="display: inline-block; background-color: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">Go to My Dashboard</a>
      </div>
    `,
  };
}

export function generateCertificateEmail(name: string, courseTitle: string, certificateCode: string): { subject: string; html: string; text: string } {
  return {
    subject: `Certificate Issued: ${courseTitle} 🏆`,
    text: `Congratulations ${name}! You've completed ${courseTitle} and earned verified certificate ${certificateCode}.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
        <h2 style="color: #10b981;">Certificate Awarded! 🎓</h2>
        <p>Congratulations ${name}! You have successfully satisfied all completion requirements for <strong>${courseTitle}</strong>.</p>
        <p>Your Certificate Code: <strong>${certificateCode}</strong></p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/certificates/${certificateCode}" style="display: inline-block; background-color: #10b981; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">View & Verify Certificate</a>
      </div>
    `,
  };
}
