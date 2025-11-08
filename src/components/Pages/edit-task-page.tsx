"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TaskForm } from "@/components/CRUDPages/create-edit-task/TaskForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface TaskData {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  assigneeId?: number;
  priority: number;
  status: string;
  dueDate?: string;
  metadata?: any;
  version?: number;
}

export default function EditTaskPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("id");
  
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect members - they don't have permission to edit tasks
  useEffect(() => {
    if (user && user.role === "member") {
      router.push("/task");
    }
  }, [user, router]);

  useEffect(() => {
    const fetchTask = async () => {
      if (!taskId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/tasks/${taskId}`,
          { credentials: "include" }
        );

        if (response.ok) {
          const result = await response.json();
          console.log("Task fetch result:", result); // Debug log
          if (result.success && result.data) {
            const task = result.data;
            
            setTaskData({
              id: task.id,
              title: task.title,
              description: task.description || undefined,
              projectId: task.projectId,
              assigneeId: task.assigneeId || undefined,
              priority: task.priority,
              status: task.status,
              dueDate: task.dueDate || undefined,
              metadata: task.metadata || undefined,
              version: task.version || 1,
            });
          } else {
            console.error("Task not found in response:", result);
            const errorMsg = typeof result.error === 'string' 
              ? result.error 
              : result.error?.message || "Task not found";
            toast({
              title: "Error",
              description: errorMsg,
              variant: "destructive",
            });
            router.push("/task");
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("Failed to fetch task:", response.status, errorData);
          const errorMsg = typeof errorData.error === 'string'
            ? errorData.error
            : errorData.error?.message || "Failed to load task data";
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          });
          router.push("/task");
        }
      } catch (error) {
        console.error("Error fetching task:", error);
        toast({
          title: "Error",
          description: "An error occurred while loading the task",
          variant: "destructive",
        });
        router.push("/task");
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [taskId, toast, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading task...</p>
      </div>
    );
  }

  // Don't show anything if user is a member
  if (!user || user.role === "member") {
    return null;
  }

  if (!taskData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Task not found</p>
      </div>
    );
  }

  return (
    <TaskForm
      mode="edit"
      initialData={taskData}
    />
  );
}
