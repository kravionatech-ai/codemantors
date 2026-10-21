import React from "react";
import { connectDB } from "@/lib/db";
import { LearningPath } from "@/models/LearningPath";
import "@/models/Course";
import LearningPathsClient from "./LearningPathsClient";

export const metadata = {
  title: "Curated Learning Paths & Career Roadmaps",
  description:
    "Explore structured learning roadmaps from foundational programming to senior software architecture. Track your progress across curated course sequences.",
};

export const dynamic = "force-dynamic";

export default async function LearningPathsPage() {
  await connectDB();
  const rawPaths = await LearningPath.find({ isPublished: true })
    .populate({
      path: "courses",
      select: "title slug subtitle thumbnail level totalDurationMinutes enrolledCount ratingAverage isFree price discountPrice",
    })
    .sort({ createdAt: -1 })
    .lean();

  const paths = JSON.parse(JSON.stringify(rawPaths));

  return <LearningPathsClient initialPaths={paths} />;
}
