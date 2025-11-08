"use client";

import { ProjectForm } from "@/components/CRUDPages/create-edit-project/ProjectForm";

// Mock initial data - will come from API later
const mockProjectData = {
  name: "Website Redesign",
  tags: ["development", "design", "frontend"],
  manager: "sarah",
  deadline: new Date("2025-12-15"),
  priority: "high" as const,
  description:
    "Complete overhaul of company website with new branding and improved UX. This project includes redesigning all major pages, implementing responsive design, and improving overall user experience.",
};

export function EditProjectPage() {
  const handleSave = (data: any) => {
    console.log("Updating project with data:", data);
    // Backend will handle this later
    // Navigate to projects page after save
  };

  const handleDiscard = () => {
    console.log("Discarding changes");
    // Navigate back to projects page
    window.history.back();
  };

  return (
    <ProjectForm
      mode="edit"
      initialData={mockProjectData}
      onSave={handleSave}
      onDiscard={handleDiscard}
    />
  );
}
