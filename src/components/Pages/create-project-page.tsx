"use client";

import { ProjectForm } from "@/components/CRUDPages/create-edit-project/ProjectForm";

export function CreateProjectPage() {
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
