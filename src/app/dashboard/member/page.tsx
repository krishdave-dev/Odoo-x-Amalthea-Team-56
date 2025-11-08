"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MemberDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect members to the tasks page (their main workspace)
    router.replace("/task");
  }, [router]);

  return null;
}
