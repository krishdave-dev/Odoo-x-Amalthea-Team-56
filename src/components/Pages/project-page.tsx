"use client";

import { useState } from "react";
import { ProjectCard } from "@/components/MainPages/Project/ProjectCard";
import { Button } from "@/components/ui/button";
import {
  Plus,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
              tags={[project.status]}
              images={[]}
              deadline={project.dueDate}
              managerName={"Abhi"}
              managerAvatar={undefined}
              tasksCount={project.totalTasks}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              tags={[project.status]}
              images={[]}
              deadline={project.dueDate}
              managerName={"Abhi"}
              managerAvatar={undefined}
              tasksCount={project.totalTasks}
            />
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
