"use client";

import { useState } from "react";
import { ProjectCard } from "@/components/MainPages/Project/ProjectCard";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";

// Mock data - will be replaced with API calls later
const mockProjects = [
  {
    id: 1,
    title: "Website Redesign",
    description:
      "Complete overhaul of company website with new branding and improved UX",
    status: "active" as const,
    teamMembers: 5,
    dueDate: "Dec 15, 2025",
    tasksCompleted: 12,
    totalTasks: 25,
  },
  {
    id: 2,
    title: "Mobile App Development",
    description: "Native mobile application for iOS and Android platforms",
    status: "active" as const,
    teamMembers: 8,
    dueDate: "Jan 30, 2026",
    tasksCompleted: 8,
    totalTasks: 40,
  },
  {
    id: 3,
    title: "Marketing Campaign",
    description: "Q4 marketing campaign for product launch",
    status: "planning" as const,
    teamMembers: 4,
    dueDate: "Nov 20, 2025",
    tasksCompleted: 3,
    totalTasks: 15,
  },
  {
    id: 4,
    title: "Database Migration",
    description: "Migrate legacy database to new cloud infrastructure",
    status: "completed" as const,
    teamMembers: 3,
    dueDate: "Oct 30, 2025",
    tasksCompleted: 18,
    totalTasks: 18,
  },
  {
    id: 5,
    title: "API Integration",
    description: "Integrate third-party APIs for enhanced functionality",
    status: "active" as const,
    teamMembers: 6,
    dueDate: "Dec 1, 2025",
    tasksCompleted: 15,
    totalTasks: 22,
  },
  {
    id: 6,
    title: "Security Audit",
    description: "Comprehensive security audit and vulnerability assessment",
    status: "planning" as const,
    teamMembers: 2,
    dueDate: "Nov 25, 2025",
    tasksCompleted: 0,
    totalTasks: 10,
  },
];

export function ProjectPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(mockProjects.length / itemsPerPage);

  const paginatedProjects = mockProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const PaginationControls = () => (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
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
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track all your projects in one place
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

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
        <PaginationControls />
      </div>

      {/* Projects Grid/List */}
      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              description={project.description}
              status={project.status}
              teamMembers={project.teamMembers}
              dueDate={project.dueDate}
              tasksCompleted={project.tasksCompleted}
              totalTasks={project.totalTasks}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedProjects.map((project) => (
            <div key={project.id} className="rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                      project.status === "active" ? "bg-green-500/10 text-green-700 border-green-500/20" :
                      project.status === "completed" ? "bg-blue-500/10 text-blue-700 border-blue-500/20" :
                      "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{project.teamMembers}</div>
                    <div className="text-xs">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{project.tasksCompleted}/{project.totalTasks}</div>
                    <div className="text-xs">Tasks</div>
                  </div>
                  <div className="text-center min-w-24">
                    <div className="font-semibold text-foreground">{project.dueDate}</div>
                    <div className="text-xs">Due Date</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Pagination */}
      <div className="mt-6">
        <PaginationControls />
      </div>
    </div>
  );
}
