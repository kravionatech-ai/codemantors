import { redirect } from "next/navigation";

export default function InstructorRedirect() {
  redirect("/instructor/dashboard");
}
