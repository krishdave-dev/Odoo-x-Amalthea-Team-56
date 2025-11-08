"use client";

import { useState } from "react";
import { TaskCard } from "@/components/MainPages/Task/TaskCard";
import { Button } from "@/components/ui/button";
import {
  Plus,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Mock data - will be replaced with API calls later
const mockTasks = {
  new: [
    {
      id: 1,
      title: "Design new landing page",
      description:
        "Create mockups for the new product landing page with updated branding",
      priority: "high" as const,
      assignedTo: "Sarah Kim",
      dueDate: "Nov 12, 2025",
      projectName: "Website Redesign",
    },
    {
      id: 2,
      title: "Write API documentation",
      description: "Document all REST API endpoints with examples",
      priority: "medium" as const,
      assignedTo: "John Doe",
      dueDate: "Nov 15, 2025",
      projectName: "API Integration",
    },
    {
      id: 3,
      title: "Set up CI/CD pipeline",
      description: "Configure automated testing and deployment workflow",
      priority: "high" as const,
      assignedTo: "Mike Chen",
      dueDate: "Nov 10, 2025",
      projectName: "Database Migration",
    },
  ],
  inProgress: [
    {
      id: 4,
      title: "Implement user authentication",
      description:
        "Add OAuth 2.0 authentication flow with social login options",
      priority: "high" as const,
      assignedTo: "Alice Johnson",
      dueDate: "Nov 14, 2025",
      projectName: "Mobile App Development",
    },
    {
      id: 5,
      title: "Database schema design",
      description: "Design and create database schema for new features",
      priority: "medium" as const,
      assignedTo: "Bob Smith",
      dueDate: "Nov 16, 2025",
      projectName: "Database Migration",
    },
    {
      id: 6,
      title: "Create social media content",
      description: "Develop content calendar and create posts for Q4 campaign",
      priority: "low" as const,
      assignedTo: "Emma Davis",
      dueDate: "Nov 18, 2025",
      projectName: "Marketing Campaign",
    },
    {
      id: 7,
      title: "Security vulnerability scan",
      description: "Run comprehensive security scan and document findings",
      priority: "high" as const,
      assignedTo: "David Lee",
      dueDate: "Nov 11, 2025",
      projectName: "Security Audit",
    },
  ],
  completed: [
    {
      id: 8,
      title: "Setup project repository",
      description:
        "Initialize Git repository and setup branch protection rules",
      priority: "medium" as const,
      assignedTo: "Sarah Kim",
      dueDate: "Nov 5, 2025",
      projectName: "Website Redesign",
    },
    {
      id: 9,
      title: "User research interviews",
      description: "Conduct user interviews to gather requirements",
      priority: "low" as const,
      assignedTo: "John Doe",
      dueDate: "Nov 3, 2025",
      projectName: "Mobile App Development",
    },
    {
      id: 10,
      title: "Logo design review",
      description: "Review and approve final logo designs from agency",
      priority: "medium" as const,
      assignedTo: "Emma Davis",
      dueDate: "Nov 1, 2025",
      projectName: "Marketing Campaign",
    },
  ],
};

export function TaskPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const allTasks = [
    ...mockTasks.new,
    ...mockTasks.inProgress,
    ...mockTasks.completed,
  ];
  const totalPages = Math.ceil(allTasks.length / itemsPerPage);

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
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all your tasks across projects
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          New Task
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

      {/* Kanban or List View */}
      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* New Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                  {mockTasks.new.length}
                </span>
                New
              </h2>
            </div>
            <div className="space-y-3">
              {mockTasks.new.map((task) => (
                <TaskCard
                  key={task.id}
                  title={task.title}
                  description={task.description}
                  priority={task.priority}
                  assignedTo={task.assignedTo}
                  dueDate={task.dueDate}
                  projectName={task.projectName}
                />
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {mockTasks.inProgress.length}
                </span>
                In Progress
              </h2>
            </div>
            <div className="space-y-3">
              {mockTasks.inProgress.map((task) => (
                <TaskCard
                  key={task.id}
                  title={task.title}
                  description={task.description}
                  priority={task.priority}
                  assignedTo={task.assignedTo}
                  dueDate={task.dueDate}
                  projectName={task.projectName}
                />
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  {mockTasks.completed.length}
                </span>
                Completed
              </h2>
            </div>
            <div className="space-y-3">
              {mockTasks.completed.map((task) => (
                <TaskCard
                  key={task.id}
                  title={task.title}
                  description={task.description}
                  priority={task.priority}
                  assignedTo={task.assignedTo}
                  dueDate={task.dueDate}
                  projectName={task.projectName}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {allTasks
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((task) => (
              <div
                key={task.id}
                className="rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{task.title}</h3>
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                          task.priority === "high"
                            ? "bg-red-500/10 text-red-700 border-red-500/20"
                            : task.priority === "medium"
                            ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                            : "bg-blue-500/10 text-blue-700 border-blue-500/20"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      📁 {task.projectName}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="text-center min-w-24">
                      <div className="font-semibold text-foreground">
                        {task.assignedTo}
                      </div>
                      <div className="text-xs">Assigned To</div>
                    </div>
                    <div className="text-center min-w-24">
                      <div className="font-semibold text-foreground">
                        {task.dueDate}
                      </div>
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
