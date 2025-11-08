"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/components/MainPages/Project/ProjectCard";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Plus,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Flag,
} from "lucide-react";
import { StatsCards } from "@/components/MainPages/Stats/StatsCards";
import {
  TaskActionDialog,
  TaskModel,
  TaskStatus,
} from "@/components/MainPages/Task/TaskActionDialog";

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
      status: "new" as TaskStatus,
      hoursLogged: 0,
      expenses: [],
    },
    {
      id: 2,
      title: "Write API documentation",
      description: "Document all REST API endpoints with examples",
      priority: "medium" as const,
      assignedTo: "John Doe",
      dueDate: "Nov 15, 2025",
      projectName: "API Integration",
      status: "new" as TaskStatus,
      hoursLogged: 0,
      expenses: [],
    },
    {
      id: 3,
      title: "Set up CI/CD pipeline",
      description: "Configure automated testing and deployment workflow",
      priority: "high" as const,
      assignedTo: "Mike Chen",
      dueDate: "Nov 10, 2025",
      projectName: "Database Migration",
      status: "new" as TaskStatus,
      hoursLogged: 0,
      expenses: [],
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
      status: "in_progress" as TaskStatus,
      hoursLogged: 2,
      expenses: [],
    },
    {
      id: 5,
      title: "Database schema design",
      description: "Design and create database schema for new features",
      priority: "medium" as const,
      assignedTo: "Bob Smith",
      dueDate: "Nov 16, 2025",
      projectName: "Database Migration",
      status: "in_progress" as TaskStatus,
      hoursLogged: 1,
      expenses: [],
    },
    {
      id: 6,
      title: "Create social media content",
      description: "Develop content calendar and create posts for Q4 campaign",
      priority: "low" as const,
      assignedTo: "Emma Davis",
      dueDate: "Nov 18, 2025",
      projectName: "Marketing Campaign",
      status: "in_progress" as TaskStatus,
      hoursLogged: 1,
      expenses: [],
    },
    {
      id: 7,
      title: "Security vulnerability scan",
      description: "Run comprehensive security scan and document findings",
      priority: "high" as const,
      assignedTo: "David Lee",
      dueDate: "Nov 11, 2025",
      projectName: "Security Audit",
      status: "in_progress" as TaskStatus,
      hoursLogged: 0,
      expenses: [],
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
      status: "completed" as TaskStatus,
      hoursLogged: 5,
      expenses: [],
    },
    {
      id: 9,
      title: "User research interviews",
      description: "Conduct user interviews to gather requirements",
      priority: "low" as const,
      assignedTo: "John Doe",
      dueDate: "Nov 3, 2025",
      projectName: "Mobile App Development",
      status: "completed" as TaskStatus,
      hoursLogged: 3,
      expenses: [],
    },
    {
      id: 10,
      title: "Logo design review",
      description: "Review and approve final logo designs from agency",
      priority: "medium" as const,
      assignedTo: "Emma Davis",
      dueDate: "Nov 1, 2025",
      projectName: "Marketing Campaign",
      status: "completed" as TaskStatus,
      hoursLogged: 2,
      expenses: [],
    },
  ],
};

export function TaskPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [tasksState, setTasksState] = useState<TaskModel[]>([
    ...mockTasks.new,
    ...mockTasks.inProgress,
    ...mockTasks.completed,
  ] as TaskModel[]);

  const allTasks = tasksState;
  const totalPages = Math.ceil(allTasks.length / itemsPerPage);

  // Metrics calculation from mock data
  const metrics = useMemo(() => {
    const today = new Date();
    const activeProjects = new Set(allTasks.map((t) => t.projectName)).size; // number of distinct project names in tasks
    // Delayed tasks: due date parsed & overdue
    const delayedTasks = allTasks.filter((t) => {
      const d = Date.parse(t.dueDate);
      return !isNaN(d) && new Date(d) < today; // overdue by due date
    }).length;
    // Hours logged mock: assume high=6h, medium=4h, low=2h
    const hoursLogged = allTasks.reduce((sum, t) => {
      if (t.priority === "high") return sum + 6;
      if (t.priority === "medium") return sum + 4;
      return sum + 2;
    }, 0);
    const revenueEarned = hoursLogged * 90; // $90/hr placeholder
    return { activeProjects, delayedTasks, hoursLogged, revenueEarned };
  }, [allTasks]);

  // computed filter counts for the Filter popover
  const filterCounts = useMemo(() => {
    const assignees = new Set(allTasks.map((t) => t.assignedTo)).size;
    const priorities = allTasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { assignees, priorities };
  }, [allTasks]);

  // filter state (only used on this page)
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [deadlineFilter, setDeadlineFilter] = useState<
    "all" | "next7" | "overdue"
  >("all");

  const uniqueAssignees = useMemo(() => {
    return Array.from(new Set(allTasks.map((t) => t.assignedTo)));
  }, [allTasks]);

  const toggleAssignee = (name: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const togglePriority = (p: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const clearFilters = () => {
    setSelectedAssignees([]);
    setSelectedPriorities([]);
    setDeadlineFilter("all");
  };

  const parseDueDate = (d?: string) => {
    if (!d) return null;
    const parsed = Date.parse(d);
    return isNaN(parsed) ? null : new Date(parsed);
  };

  const matchesFilters = (task: any) => {
    if (
      selectedAssignees.length &&
      !selectedAssignees.includes(task.assignedTo)
    )
      return false;
    if (
      selectedPriorities.length &&
      !selectedPriorities.includes(task.priority)
    )
      return false;

    if (deadlineFilter !== "all") {
      const due = parseDueDate(task.dueDate);
      if (!due) return false;
      const today = new Date();
      const startOfToday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      if (deadlineFilter === "overdue") {
        if (!(due < startOfToday)) return false;
      } else if (deadlineFilter === "next7") {
        const in7 = new Date(startOfToday);
        in7.setDate(in7.getDate() + 7);
        if (!(due >= startOfToday && due <= in7)) return false;
      }
    }

    return true;
  };

  const filteredNew = tasksState
    .filter((t) => t.status === "new")
    .filter(matchesFilters);
  const filteredInProgress = tasksState
    .filter((t) => t.status === "in_progress")
    .filter(matchesFilters);
  const filteredCompleted = tasksState
    .filter((t) => t.status === "completed")
    .filter(matchesFilters);
  const filteredAll = [
    ...filteredNew,
    ...filteredInProgress,
    ...filteredCompleted,
  ];
  const handleTaskUpdate = (updated: TaskModel) => {
    setTasksState((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const role: "team" | "manager" | "admin" = "team"; // TODO: wire with auth later

  // Use ProjectCard from MainPages for task cards/list so visuals match project cards

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
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="flex flex-col text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start w-full px-3 py-2"
                >
                  Assignees
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start w-full px-3 py-2"
                >
                  Deadline
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start w-full px-3 py-2"
                >
                  Date of creation
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start w-full px-3 py-2"
                >
                  Priority
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start w-full px-3 py-2"
                >
                  Status
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
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
        <PaginationControls />
      </div>

      {/* Kanban or List View */}
      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-neutral-200/10">
          {/* New Column */}
          <div className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                  {mockTasks.new.length}
                </span>
                New
              </h2>
            </div>
            <div className="space-y-3">
              {filteredNew.map((task) => (
                <div key={task.id} className="space-y-2">
                  <ProjectCard
                    title={task.title}
                    tags={[task.projectName, task.priority]}
                    images={[]}
                    deadline={task.dueDate}
                    managerName={task.assignedTo}
                    managerAvatar={undefined}
                    tasksCount={1}
                  />
                  <TaskActionDialog
                    task={task}
                    onUpdate={handleTaskUpdate}
                    role={role}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {mockTasks.inProgress.length}
                </span>
                In Progress
              </h2>
            </div>
            <div className="space-y-3">
              {filteredInProgress.map((task) => (
                <div key={task.id} className="space-y-2">
                  <ProjectCard
                    title={task.title}
                    tags={[task.projectName, task.priority]}
                    images={[]}
                    deadline={task.dueDate}
                    managerName={task.assignedTo}
                    managerAvatar={undefined}
                    tasksCount={1}
                  />
                  <TaskActionDialog
                    task={task}
                    onUpdate={handleTaskUpdate}
                    role={role}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {mockTasks.completed.length}
                </span>
                Completed
              </h2>
            </div>
            <div className="space-y-3">
              {filteredCompleted.map((task) => (
                <div key={task.id} className="space-y-2">
                  <ProjectCard
                    title={task.title}
                    tags={[task.projectName, task.priority]}
                    images={[]}
                    deadline={task.dueDate}
                    managerName={task.assignedTo}
                    managerAvatar={undefined}
                    tasksCount={1}
                  />
                  <TaskActionDialog
                    task={task}
                    onUpdate={handleTaskUpdate}
                    role={role}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAll
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((task) => (
              <div key={task.id} className="space-y-2">
                <ProjectCard
                  title={task.title}
                  tags={[task.projectName, task.priority]}
                  images={[]}
                  deadline={task.dueDate}
                  managerName={task.assignedTo}
                  managerAvatar={undefined}
                  tasksCount={1}
                />
                <TaskActionDialog
                  task={task}
                  onUpdate={handleTaskUpdate}
                  role={role}
                />
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
