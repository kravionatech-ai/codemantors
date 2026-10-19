import React from "react";
import { Metadata } from "next";
import { resolvePageSeo } from "@/lib/seo";
import ContactClient from "./ContactClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return await resolvePageSeo("/contact", {
    title: "Contact & Support | CodeMentors — Developer Education",
    description:
      "Have questions regarding courses, certificates, billing, or curriculum? Contact the CodeMentors team.",
    canonicalPath: "/contact",
  });
}

export default function ContactPage() {
  return <ContactClient />;
}
