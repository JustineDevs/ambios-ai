import { redirect } from "next/navigation";

/** The governed agent at / is the single canonical chat surface. */
export default function AIPage() {
  redirect("/");
}
