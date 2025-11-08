"use client";

import { TaskForm } from "@/components/CRUDPages/create-edit-task/TaskForm";

const mockData = {
  title: "Fix login page bug",
  assignee: "abhi",
  project: "odoo",
  tags: ["bug", "urgent"],
  description: "Login button not responding on Safari.",
};

export default function EditTaskPage() {
  return <TaskForm mode="edit" initialData={mockData} />;
}
