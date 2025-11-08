"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FinanceDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect finance users to settings for now (can be changed to a finance-specific page later)
    router.replace("/settings");
  }, [router]);

  return null;
}
