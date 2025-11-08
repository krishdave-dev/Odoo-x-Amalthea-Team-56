"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ProjectCard } from "@/components/MainPages/Project/ProjectCard";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/MainPages/Stats/StatsCards";
import {
  Plus,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Project {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  projectManagerId: number | null;
  projectManager: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  _count: {
    tasks: number;
    members: number;
  };
}

interface PaginatedResponse {
  data: Project[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function ProjectPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6;

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.organizationId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const url = `/api/projects?organizationId=${user.organizationId}&page=${currentPage}&pageSize=${itemsPerPage}`;
        const response = await fetch(url, { credentials: "include" });

        if (response.ok) {
          const result: PaginatedResponse = await response.json();
          if (result.data) {
            setProjects(result.data);
            setTotalPages(result.pagination.totalPages);
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch projects",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "An error occurred while fetching projects",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user?.organizationId, currentPage, toast]);

  const PaginationControls = () => (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        disabled={currentPage === 1 || loading}
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(page)}
            disabled={loading}
            className="w-9"
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages || loading}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  if (loading && projects.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track all your projects in one place
            </p>
          </div>
          <Button asChild>
            <Link href="/createproject">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all your projects in one place
          </p>
        </div>
        <Button asChild>
          <Link href="/createproject">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Stats Metrics */}
      <StatsCards data={metrics} className="mb-6" />

      {/* View Toggle and Pagination */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border p-1">
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
            List
          </Button>
        </div>
        {totalPages > 1 && <PaginationControls />}
      </div>

      {/* Projects Grid/List */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No projects found</p>
          <Button asChild>
            <Link href="/createproject">
              <Plus className="h-4 w-4" />
              Create your first project
            </Link>
          </Button>
        </div>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.name}
              tags={[project.status]}
              images={[]}
              deadline={project.endDate ? format(new Date(project.endDate), "MMM dd, yyyy") : undefined}
              managerName={project.projectManager?.name || project.projectManager?.email || "Unassigned"}
              managerAvatar={undefined}
              tasksCount={project._count.tasks}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.name}
              tags={[project.status]}
              images={[]}
              deadline={project.endDate ? format(new Date(project.endDate), "MMM dd, yyyy") : undefined}
              managerName={project.projectManager?.name || project.projectManager?.email || "Unassigned"}
              managerAvatar={undefined}
              tasksCount={project._count.tasks}
            />
          ))}
        </div>
      )}

      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <PaginationControls />
        </div>
      )}
    </div>
  );
}
