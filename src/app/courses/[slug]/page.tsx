import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { resolvePageSeo } from "@/lib/seo";
import CourseDetailsClient from "./CourseDetailsClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;

  try {
    await connectDB();
    const course = await Course.findOne({ slug })
      .select("title subtitle description thumbnail seo")
      .lean();

    if (!course) {
      return {
        title: "Course Not Found | CodeMentors",
        description: "The requested software engineering course could not be found.",
        robots: { index: false, follow: false },
      };
    }

    return await resolvePageSeo(`/courses/${slug}`, {
      title: course.seo?.title || `${course.title} | CodeMentors Masterclass`,
      description:
        course.seo?.description ||
        course.subtitle ||
        course.description?.substring(0, 160) ||
        "Master practical software architecture with CodeMentors.",
      ogImage: course.seo?.ogImage || course.thumbnail,
      canonicalPath: `/courses/${slug}`,
      noIndex: course.seo?.noIndex || false,
    });
  } catch (err) {
    console.error("Error generating course metadata:", err);
    return {
      title: "Course | CodeMentors",
      description: "Master modern software engineering with CodeMentors.",
    };
  }
}

export default async function CoursePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  let initialCourse: any = null;
  try {
    await connectDB();
    const foundCourse = await Course.findOne({ slug })
      .populate("instructor", "name avatar headline bio")
      .lean();

    if (foundCourse) {
      initialCourse = JSON.parse(JSON.stringify(foundCourse));
    }
  } catch (err) {
    console.warn("Could not preload course on server:", err);
  }

  // Schema.org Course JSON-LD
  const jsonLdCourse = initialCourse
    ? {
        "@context": "https://schema.org",
        "@type": "Course",
        name: initialCourse.title,
        description: initialCourse.subtitle || initialCourse.description,
        provider: {
          "@type": "EducationalOrganization",
          name: "CodeMentors",
          sameAs: "https://codementors.com",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "Online",
          courseWorkload: `PT${initialCourse.totalDurationMinutes || 120}M`,
        },
        offers: {
          "@type": "Offer",
          price: initialCourse.isFree ? "0" : String(initialCourse.discountPrice || initialCourse.price || 0),
          priceCurrency: "INR",
          category: initialCourse.isFree ? "Free" : "Paid",
          availability: "https://schema.org/InStock",
        },
      }
    : null;

  return (
    <>
      {jsonLdCourse && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCourse) }}
        />
      )}
      <CourseDetailsClient slug={slug} initialCourse={initialCourse} />
    </>
  );
}
