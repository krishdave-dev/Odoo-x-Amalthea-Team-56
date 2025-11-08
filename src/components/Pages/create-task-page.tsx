"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TaskForm } from "@/components/CRUDPages/create-edit-task/TaskForm";

export default function CreateTaskPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect members to task page - only managers and admins can create tasks
  useEffect(() => {
    if (user && user.role === "member") {
      router.push("/task");
    }
  }, [user, router]);

  // Don't render form if user is a member
  if (!user || user.role === "member") {
    return null;
  }

  return <TaskForm mode="create" />;
}
