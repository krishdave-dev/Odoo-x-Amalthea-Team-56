"use client";

import { ProjectForm } from "@/components/CRUDPages/create-edit-project/ProjectForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function CreateProjectPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect members - they don't have permission to create projects
  useEffect(() => {
    if (user && user.role === "member") {
      router.push("/project");
    }
  }, [user, router]);

  // Show nothing while checking permissions
  if (!user || user.role === "member") {
    return null;
  }

  const handleSave = (data: any) => {
    console.log("Creating project with data:", data);
    // Backend will handle this later
    // Navigate to projects page after save
  };

  const handleDiscard = () => {
    console.log("Discarding changes");
    // Navigate back to projects page
    window.history.back();
  };

  return (
    <ProjectForm mode="create" onSave={handleSave} onDiscard={handleDiscard} />
  );
}