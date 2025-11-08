"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect admins to the projects page
    router.replace("/project");
  }, [router]);

  return null;
}
