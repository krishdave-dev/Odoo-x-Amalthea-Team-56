"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectCard } from "@/components/MainPages/Project/ProjectCard";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/MainPages/Stats/StatsCards";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
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
  cachedCost: number;
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
  tasks?: Array<{ id: number }>;
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
  const router = useRouter();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
        let url = `/api/projects?organizationId=${user.organizationId}&page=${currentPage}&pageSize=${itemsPerPage}`;
        
        // Add status filter if not "all"
        if (statusFilter !== "all") {
          url += `&status=${statusFilter}`;
        }
        
        const response = await fetch(url, { credentials: "include" });

        if (response.ok) {
          const result = await response.json();
          
          // Check if it's a paginated response or a simple success response
          if (result.success && result.data) {
            // Handle paginated response from paginatedResponse()
            if (result.pagination) {
              setProjects(result.data);
              setTotalPages(result.pagination.totalPages || 1);
            } 
            // Handle direct data array
            else if (Array.isArray(result.data)) {
              setProjects(result.data);
              setTotalPages(1);
            }
            // Handle wrapped data
            else {
              setProjects([]);
              setTotalPages(1);
            }
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
  }, [user?.organizationId, currentPage, statusFilter, toast]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Calculate metrics from projects data
  const metrics = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const totalTasks = projects.reduce((sum, p) => sum + p._count.tasks, 0);
    
    return {
      activeProjects,
      delayedTasks: 0, // Would need task data to calculate
      hoursLogged: 0, // Would need timesheet data to calculate
      revenueEarned: 0, // Would need financial data to calculate
    };
  }, [projects]);

  // Handle edit project
  const handleEdit = (projectId: number) => {
    router.push(`/editproject?id=${projectId}`);
  };

  // Handle delete project
  const handleDeleteClick = (projectId: number) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete || !user?.organizationId) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/projects/${projectToDelete}?organizationId=${user.organizationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok || response.status === 204) {
        toast({
          title: "Success",
          description: "Project deleted successfully",
        });

        // Remove project from list
        setProjects(prev => prev.filter(p => p.id !== projectToDelete));
        
        // If current page becomes empty, go to previous page
        if (projects.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete project",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the project",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please log in to view projects</p>
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
            {user.role === "member" 
              ? "View and track projects you are assigned to"
              : "Manage and track all your projects in one place"
            }
          </p>
        </div>
        {/* Only show New Project button for admin, manager, and finance */}
        {user.role !== "member" && (
          <Button asChild>
            <Link href="/createproject">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Metrics */}
      <StatsCards data={metrics} className="mb-6" />

      {/* View Toggle, Filter and Pagination */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* View Toggle */}
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

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pagination */}
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
              projectId={project.id}
              title={project.name}
              tags={[project.status]}
              images={[]}
              deadline={project.endDate ? format(new Date(project.endDate), "MMM dd, yyyy") : undefined}
              managerName={project.projectManager?.name || project.projectManager?.email || "Unassigned"}
              managerAvatar={undefined}
              tasksCount={project._count.tasks}
              completedTasksCount={project.tasks?.length || 0}
              budget={project.budget ? Number(project.budget) : null}
              cachedCost={Number(project.cachedCost)}
              organizationId={user.organizationId}
              showActions={user.role !== "member"}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              projectId={project.id}
              title={project.name}
              tags={[project.status]}
              images={[]}
              deadline={project.endDate ? format(new Date(project.endDate), "MMM dd, yyyy") : undefined}
              managerName={project.projectManager?.name || project.projectManager?.email || "Unassigned"}
              managerAvatar={undefined}
              tasksCount={project._count.tasks}
              completedTasksCount={project.tasks?.length || 0}
              budget={project.budget ? Number(project.budget) : null}
              cachedCost={Number(project.cachedCost)}
              organizationId={user.organizationId}
              showActions={user.role !== "member"}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
              All tasks and data associated with this project will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
