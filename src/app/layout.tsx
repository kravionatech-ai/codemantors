import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { CartProvider } from "@/context/CartContext";
import PublicNavShell from "@/components/PublicNavShell";

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
  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": "https://codementors.com/#organization",
        name: "CodeMentors",
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005",
        logo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005"}/logo.png`,
        description:
          "Professional online learning management system supporting video and text-based courses, quizzes, and certificates.",
        sameAs: [
          "https://github.com",
          "https://twitter.com",
          "https://linkedin.com",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://codementors.com/#website",
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005",
        name: "CodeMentors",
        publisher: {
          "@id": "https://codementors.com/#organization",
        },
      },
      {
        "@type": "WebApplication",
        name: "CodeMentors LMS Platform",
        applicationCategory: "EducationalApplication",
        operatingSystem: "All",
        provider: {
          "@type": "Organization",
          name: "Kraviona Tech Solutions",
          url: "https://kraviona.com/",
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#2563EB] selection:text-white">
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <PublicNavShell>{children}</PublicNavShell>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
