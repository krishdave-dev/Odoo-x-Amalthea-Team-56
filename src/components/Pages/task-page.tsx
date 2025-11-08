"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TaskCard } from "@/components/MainPages/Task/TaskCard";
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
  Pencil,
} from "lucide-react";
import { StatsCards } from "@/components/MainPages/Stats/StatsCards";
import {
  TaskActionDialog,
  TaskModel,
  TaskStatus,
} from "@/components/MainPages/Task/TaskActionDialog";
import { MemberTaskActions } from "@/components/MainPages/Task/MemberTaskActions";
// Fetch tasks from backend API

export function TaskPage() {
  const router = useRouter();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const [tasksState, setTasksState] = useState<TaskModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    role: string;
    organizationId: number;
  } | null>(null);
  const [kpiMetrics, setKpiMetrics] = useState({
    activeProjects: 0,
    delayedTasks: 0,
    hoursLogged: 0,
    revenueEarned: 0,
  });

  // Load current user for role-based filtering
  useEffect(() => {
    let mounted = true;
    const fetchMe = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const user = json?.user;
        if (mounted && user) {
          setCurrentUser({ 
            id: user.id, 
            role: user.role,
            organizationId: user.organizationId 
          });
        }
      } catch (_) {
        // ignore
      }
    };
    fetchMe();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!currentUser) return; // Wait for user to load
    
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
      
      // Sort tasks by deadline (earliest first) - this creates priority
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        
        // If dates are invalid, put them at the end
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        
        return dateA - dateB; // Earliest deadline = highest priority
      });
      
      console.log(sortedData);
      setTasksState(sortedData);
    } catch (e: any) {
      setError(e?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fetch KPI metrics from API
  useEffect(() => {
    const fetchKPIs = async () => {
      if (!currentUser?.organizationId) return;

      try {
        const response = await fetch(
          `/api/analytics/dashboard/kpis?organizationId=${currentUser.organizationId}`,
          { credentials: "include" }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setKpiMetrics(result.data);
          }
        }
      } catch (error) {
        console.error("Error fetching KPIs:", error);
        // Silently fail - KPIs are not critical
      }
    };

    fetchKPIs();
  }, [currentUser?.organizationId]);

  // Backend now handles role-based filtering, so we use all tasks
  const allTasks = tasksState;
  const totalPages = Math.ceil(allTasks.length / itemsPerPage);

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
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [deadlineFilter, setDeadlineFilter] = useState<
    "all" | "next7" | "overdue"
  >("all");

  const uniqueAssignees = useMemo(() => {
    return Array.from(new Set(allTasks.map((t) => t.assignedTo)));
  }, [allTasks]);

  const uniqueProjects = useMemo(() => {
    return Array.from(new Set(allTasks.map((t) => t.projectName))).sort();
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

  const toggleProject = (projectName: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectName) ? prev.filter((p) => p !== projectName) : [...prev, projectName]
    );
  };

  const clearFilters = () => {
    setSelectedAssignees([]);
    setSelectedPriorities([]);
    setSelectedProjects([]);
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
    if (
      selectedProjects.length &&
      !selectedProjects.includes(task.projectName)
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

  const filteredNew = allTasks
    .filter((t) => t.status === "new")
    .filter(matchesFilters)
    .sort((a, b) => {
      // Sort by priority first (urgent=4, high=3, medium=2, low=1)
      const priorityMap: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by deadline (earliest first)
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      
      return 0;
    });
    
  const filteredInProgress = allTasks
    .filter((t) => t.status === "in_progress")
    .filter(matchesFilters)
    .sort((a, b) => {
      // Sort by priority first (urgent=4, high=3, medium=2, low=1)
      const priorityMap: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by deadline (earliest first)
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      
      return 0;
    });
    
  const filteredCompleted = allTasks
    .filter((t) => t.status === "completed")
    .filter(matchesFilters)
    .sort((a, b) => {
      // Sort by priority first (urgent=4, high=3, medium=2, low=1)
      const priorityMap: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by deadline (earliest first)
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      if (!isNaN(dateA) && !isNaN(dateB)) return dateA - dateB;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      
      return 0;
    });
    
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

  // Check if current user can edit tasks (managers and admins only)
  const canEditTasks = currentUser?.role === "admin" || currentUser?.role === "manager";

  // Navigate to edit task page
  const handleEditTask = (taskId: number) => {
    router.push(`/edittask?id=${taskId}`);
  };

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
            {currentUser?.role === 'manager' 
              ? 'View and manage all tasks across the projects you manage'
              : currentUser?.role === 'member'
              ? 'View and work on tasks assigned to you'
              : 'View and manage all tasks across projects'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                Filters
                {(selectedAssignees.length > 0 || selectedPriorities.length > 0 || selectedProjects.length > 0 || deadlineFilter !== "all") && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {selectedAssignees.length + selectedPriorities.length + selectedProjects.length + (deadlineFilter !== "all" ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Filters</h3>
                  {(selectedAssignees.length > 0 || selectedPriorities.length > 0 || selectedProjects.length > 0 || deadlineFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-1 text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Projects Filter */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Projects</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uniqueProjects.map((projectName) => (
                      <label key={projectName} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(projectName)}
                          onChange={() => toggleProject(projectName)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{projectName || "No Project"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Assignees Filter */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Assignees ({filterCounts.assignees})</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uniqueAssignees.map((assignee) => (
                      <label key={assignee} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAssignees.includes(assignee)}
                          onChange={() => toggleAssignee(assignee)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{assignee || "Unassigned"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Priority</h4>
                  <div className="space-y-2">
                    {["low", "medium", "high", "urgent"].map((priority) => (
                      <label key={priority} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPriorities.includes(priority)}
                          onChange={() => togglePriority(priority)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm capitalize flex items-center gap-2">
                          {priority}
                          {filterCounts.priorities[priority] && (
                            <Badge variant="secondary" className="text-xs">
                              {filterCounts.priorities[priority]}
                            </Badge>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Deadline Filter */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Deadline</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deadline"
                        checked={deadlineFilter === "all"}
                        onChange={() => setDeadlineFilter("all")}
                        className="rounded-full"
                      />
                      <span className="text-sm">All</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deadline"
                        checked={deadlineFilter === "next7"}
                        onChange={() => setDeadlineFilter("next7")}
                        className="rounded-full"
                      />
                      <span className="text-sm">Next 7 days</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deadline"
                        checked={deadlineFilter === "overdue"}
                        onChange={() => setDeadlineFilter("overdue")}
                        className="rounded-full"
                      />
                      <span className="text-sm text-red-600">Overdue</span>
                    </label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {currentUser && currentUser.role !== "member" && (
            <Button asChild>
              <Link href="/createtask">
                <Plus className="h-4 w-4" />
                New Task
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Metrics */}
      <StatsCards data={kpiMetrics} className="mb-6" />

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
                  <TaskCard
                    title={task.title}
                    description={task.description || ''}
                    priority={task.priority}
                    assignedTo={task.assignedTo}
                    dueDate={task.dueDate}
                    projectName={task.projectName}
                    status={task.status}
                    taskId={task.id}
                  />
                  {canEditTasks ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTask(task.id)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  ) : currentUser?.role === "member" ? (
                    <MemberTaskActions
                      taskId={task.id}
                      currentStatus={task.status}
                      onStatusChange={fetchTasks}
                    />
                  ) : null}
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
                  <TaskCard
                    title={task.title}
                    description={task.description || ''}
                    priority={task.priority}
                    assignedTo={task.assignedTo}
                    dueDate={task.dueDate}
                    projectName={task.projectName}
                    status={task.status}
                    taskId={task.id}
                  />
                  {canEditTasks ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTask(task.id)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  ) : currentUser?.role === "member" ? (
                    <MemberTaskActions
                      taskId={task.id}
                      currentStatus={task.status}
                      onStatusChange={fetchTasks}
                    />
                  ) : null}
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
                  <TaskCard
                    title={task.title}
                    description={task.description || ''}
                    priority={task.priority}
                    assignedTo={task.assignedTo}
                    dueDate={task.dueDate}
                    projectName={task.projectName}
                    status={task.status}
                    taskId={task.id}
                  />
                  {canEditTasks ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTask(task.id)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  ) : currentUser?.role === "member" ? (
                    <MemberTaskActions
                      taskId={task.id}
                      currentStatus={task.status}
                      onStatusChange={fetchTasks}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // List View - Grouped by Status
        <div className="space-y-8">
          {/* New Tasks Section */}
          {filteredNew.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <h3 className="text-xl font-semibold">New</h3>
                <Badge variant="secondary" className="rounded-full">
                  {filteredNew.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {filteredNew.map((task) => (
                  <div key={task.id} className="space-y-2">
                    <TaskCard
                      title={task.title}
                      description={task.description || ''}
                      priority={task.priority}
                      assignedTo={task.assignedTo}
                      dueDate={task.dueDate}
                      projectName={task.projectName}
                      status={task.status}
                      taskId={task.id}
                    />
                    {canEditTasks ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTask(task.id)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    ) : currentUser?.role === "member" ? (
                      <MemberTaskActions
                        taskId={task.id}
                        currentStatus={task.status}
                        onStatusChange={fetchTasks}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In Progress Tasks Section */}
          {filteredInProgress.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <h3 className="text-xl font-semibold">In Progress</h3>
                <Badge variant="secondary" className="rounded-full bg-blue-100 text-blue-700">
                  {filteredInProgress.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {filteredInProgress.map((task) => (
                  <div key={task.id} className="space-y-2">
                    <TaskCard
                      title={task.title}
                      description={task.description || ''}
                      priority={task.priority}
                      assignedTo={task.assignedTo}
                      dueDate={task.dueDate}
                      projectName={task.projectName}
                      status={task.status}
                      taskId={task.id}
                    />
                    {canEditTasks ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTask(task.id)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    ) : currentUser?.role === "member" ? (
                      <MemberTaskActions
                        taskId={task.id}
                        currentStatus={task.status}
                        onStatusChange={fetchTasks}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks Section */}
          {filteredCompleted.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <h3 className="text-xl font-semibold">Completed</h3>
                <Badge variant="secondary" className="rounded-full">
                  {filteredCompleted.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {filteredCompleted.map((task) => (
                  <div key={task.id} className="space-y-2">
                    <TaskCard
                      title={task.title}
                      description={task.description || ''}
                      priority={task.priority}
                      assignedTo={task.assignedTo}
                      dueDate={task.dueDate}
                      projectName={task.projectName}
                      status={task.status}
                      taskId={task.id}
                    />
                    {canEditTasks ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTask(task.id)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    ) : currentUser?.role === "member" ? (
                      <MemberTaskActions
                        taskId={task.id}
                        currentStatus={task.status}
                        onStatusChange={fetchTasks}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No tasks message */}
          {filteredAll.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No tasks found matching the filters
            </div>
          )}
        </div>
      )}

      {/* Bottom Pagination */}
      <div className="mt-6">
        <PaginationControls />
      </div>
    </div>
  );
}
