import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

/**
 * Home page - redirects to project dashboard or login
 */
export default async function Home() {
  const user = await getCurrentUser();

  // Not logged in - redirect to login
  if (!user) {
    redirect("/login");
  }

  // Logged in - redirect to project dashboard (role-based views handled there)
  redirect("/project");
}
