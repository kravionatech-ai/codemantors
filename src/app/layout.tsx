import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | CodeMentors",
    default: "CodeMentors — Professional Online Learning Management System (LMS)",
  },
  description:
    "Master programming, web development, software engineering, and AI skills with video-based and text-based lessons, structured courses, quizzes, and accredited certificates.",
  keywords: [
    "Next.js",
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "Software Architecture",
    "LMS",
    "CodeMentors",
    "Coding Courses",
  ],
  authors: [{ name: "CodeMentors Editorial & Curriculum Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "CodeMentors — Learn to Code. Build Real Skills. Grow Your Career.",
    description:
      "Enterprise online learning platform for software developers. Master modern stacks with structured video lessons, interactive coding exercises, and accredited certificates.",
    url: "/",
    siteName: "CodeMentors",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeMentors — Professional Online Learning Management System",
    description: "Learn to Code. Build Real Skills. Grow Your Career.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "CodeMentors",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    logo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`,
    description:
      "Professional online learning platform supporting video and text-based courses, quizzes, and certificates.",
    sameAs: [
      "https://github.com",
      "https://twitter.com",
      "https://linkedin.com",
    ],
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
