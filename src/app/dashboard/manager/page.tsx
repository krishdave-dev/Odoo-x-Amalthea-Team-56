"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManagerDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect managers to the projects page
    router.replace("/project");
  }, [router]);

  return null;
}
