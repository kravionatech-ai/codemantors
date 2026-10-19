import React, { Suspense } from "react";
import { Metadata } from "next";
import { resolvePageSeo } from "@/lib/seo";
import CoursesClient from "./CoursesClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return await resolvePageSeo("/courses", {
    title: "Browse Software Engineering & Programming Courses | CodeMentors",
    description:
      "Explore industry-leading courses in Next.js, Node.js, Python, Cloud Architecture, and DevOps taught by senior engineers.",
    canonicalPath: "/courses",
  });
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#64748B]">Loading courses...</div>}>
      <CoursesClient />
    </Suspense>
  );
}
