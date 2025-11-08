"use client";

import { useEffect, useMemo, useState } from "react";
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
// Fetch tasks from backend API

export function TaskPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [tasksState, setTasksState] = useState<TaskModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    role: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use the backend's allowed max (100) to satisfy validation
        const res = await fetch(`/api/tasks?page=1&pageSize=100`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Failed to load tasks (${res.status})`);
        }
        const json = await res.json();
        const data = (json?.data ?? []) as TaskModel[];
        console.log(data);
        if (isMounted) setTasksState(data);
      } catch (e: any) {
        if (isMounted) setError(e?.message || "Failed to load tasks");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchTasks();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load current user for role-based filtering
  useEffect(() => {
    let mounted = true;
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return; // unauthenticated or error => show nothing extra
        const json = await res.json();
        const user = json?.user;
        if (mounted && user) setCurrentUser({ id: user.id, role: user.role });
      } catch (_) {
        // ignore
      }
    };
    fetchMe();
    return () => {
      mounted = false;
    };
  }, []);

  // Role-based visibility: managers see all tasks, others only see their assigned tasks
  const roleFilteredTasks = useMemo(() => {
    if (!currentUser) return tasksState; // until user loads, show all to avoid flicker
    if (currentUser.role === "manager") return tasksState;
    return tasksState.filter((t) => t.assigneeId === currentUser.id);
  }, [tasksState, currentUser]);

  const allTasks = roleFilteredTasks;
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

  const filteredNew = roleFilteredTasks
    .filter((t) => t.status === "new")
    .filter(matchesFilters);
  const filteredInProgress = roleFilteredTasks
    .filter((t) => t.status === "in_progress")
    .filter(matchesFilters);
  const filteredCompleted = roleFilteredTasks
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

  const role: "team" | "manager" | "admin" | string =
    currentUser?.role ?? "team";

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

      {/* Loading / Error States */}
      {loading && (
        <div className="mb-4 text-sm text-muted-foreground">Loading tasks…</div>
      )}
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      {/* Kanban or List View */}
      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-neutral-200/10">
          {/* New Column */}
          <div className="space-y-4 px-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">
                  {filteredNew.length}
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
                  {filteredInProgress.length}
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
                  {filteredCompleted.length}
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
