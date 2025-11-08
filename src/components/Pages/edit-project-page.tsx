"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectForm } from "@/components/CRUDPages/create-edit-project/ProjectForm";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProjectData {
  id: number;
  name: string;
  code?: string;
  tags?: string[];
  projectManagerId?: number;
  teamMembers?: number[];
  startDate?: Date;
  endDate?: Date;
  priority?: "low" | "medium" | "high";
  image?: string;
  description?: string;
  status?: string;
  budget?: number;
}

export function EditProjectPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId || !user?.organizationId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/projects/${projectId}?organizationId=${user.organizationId}`,
          { credentials: "include" }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const project = result.data;
            
            // Get team member IDs from project members
            const teamMemberIds = project.members?.map((m: any) => m.userId) || [];
            
            setProjectData({
              id: project.id,
              name: project.name,
              code: project.code || undefined,
              projectManagerId: project.projectManagerId || undefined,
              teamMembers: teamMemberIds,
              startDate: project.startDate ? new Date(project.startDate) : undefined,
              endDate: project.endDate ? new Date(project.endDate) : undefined,
              description: project.description || undefined,
              status: project.status,
              budget: project.budget || undefined,
            });
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to load project data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          title: "Error",
          description: "An error occurred while loading the project",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, user?.organizationId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <ProjectForm
      mode="edit"
      initialData={projectData}
    />
  );
}
