import { redirect } from "next/navigation";

export default function CartRedirectPage() {
  redirect("/course-basket");
}
