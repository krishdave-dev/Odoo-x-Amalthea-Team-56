"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Pencil,
  Search,
  X,
  Network,
} from "lucide-react";
import { StatsCards } from "@/components/MainPages/Stats/StatsCards";
import {
  TaskModel,
  TaskStatus,
} from "@/components/MainPages/Task/TaskActionDialog";
import { MemberTaskActions } from "@/components/MainPages/Task/MemberTaskActions";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { 
  SortableContext, 
  arrayMove,
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { getNextStatus } from "@/utils/taskStatusFlow";
import { useToast } from "@/hooks/use-toast";
import { DroppableColumn } from "@/components/MainPages/Task/DroppableColumn";

// Fetch tasks from backend API

export function TaskPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [activeId, setActiveId] = useState<string | null>(null);

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
      } catch {
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
      
      // Sort tasks by status order and priority hierarchy within each status
      const statusOrder: Record<TaskStatus, number> = { 
        new: 1, 
        in_progress: 2, 
        completed: 3 
      };
      const priorityOrder: Record<string, number> = { 
        high: 3, 
        medium: 2, 
        low: 1 
      };
      
      const sortedData = data.sort((a, b) => {
        // First sort by status
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        
        // Within same status, sort by priority (high to low)
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, sort by due date (earliest first)
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateA - dateB;
      });
      
      setTasksState(sortedData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load tasks";
      setError(msg);
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
      }
    };

    fetchKPIs();
  }, [currentUser?.organizationId]);

  const allTasks = tasksState;

  const filterCounts = useMemo(() => {
    const assignees = new Set(allTasks.map((t) => t.assignedTo)).size;
    const priorities = allTasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { assignees, priorities };
  }, [allTasks]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  // Handle advancing task status with checkmark
  const handleAdvanceStatus = useCallback((taskId: number) => {
    setTasksState(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          const newStatus = getNextStatus(task.status) as TaskStatus;
          if (newStatus !== task.status) {
            toast({
              title: "Task Updated",
              description: `Task moved to ${newStatus.replace('_', ' ')} 🪄`,
            });
            return { ...task, status: newStatus };
          }
        }
        return task;
      });
      return updatedTasks;
    });
  }, [toast]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Extract task ID from the drag identifiers
    const activeTaskId = parseInt(activeId.split('-')[1]);
    if (!activeTaskId) return;

    // Check if dropped on a droppable column (status change)
    const overStatus = overId.startsWith('droppable-') ? overId.split('-')[1] as TaskStatus : null;
    
    // Check if dropped on another task (for reordering or status change)
    const overTaskId = overId.startsWith('task-') ? parseInt(overId.split('-')[1]) : null;

    // Helper function to determine priority based on position
    const determinePriorityAtPosition = (
      tasks: TaskModel[],
      insertIndex: number,
      targetStatus: TaskStatus
    ): 'low' | 'medium' | 'high' => {
      // Get tasks in the target column only
      const columnTasks = tasks.filter(t => t.status === targetStatus);
      
      if (columnTasks.length === 0) {
        return 'medium'; // Default priority for empty column
      }

      // Find the position in the column
      let columnPosition = 0;
      let actualInsertIndex = insertIndex;
      
      for (let i = 0; i < tasks.length && i < insertIndex; i++) {
        if (tasks[i].status === targetStatus) {
          columnPosition++;
        }
      }

      // Check priority of card above and below
      const cardAbove = columnPosition > 0 ? columnTasks[columnPosition - 1] : null;
      const cardBelow = columnPosition < columnTasks.length ? columnTasks[columnPosition] : null;

      // Priority hierarchy: high > medium > low
      const priorityValue: Record<string, number> = { high: 3, medium: 2, low: 1 };
      
      if (!cardAbove && cardBelow) {
        // Dropped at the top
        const belowPriority = priorityValue[cardBelow.priority] || 2;
        // Should be same or higher priority than card below
        if (belowPriority === 3) return 'high';
        if (belowPriority === 2) return 'high'; // Boost to high if medium is below
        return 'medium';
      }
      
      if (cardAbove && !cardBelow) {
        // Dropped at the bottom
        const abovePriority = priorityValue[cardAbove.priority] || 2;
        // Should be same or lower priority than card above
        if (abovePriority === 1) return 'low';
        if (abovePriority === 2) return 'low'; // Lower to low if medium is above
        return 'medium';
      }
      
      if (cardAbove && cardBelow) {
        // Dropped in the middle
        const abovePriority = priorityValue[cardAbove.priority] || 2;
        const belowPriority = priorityValue[cardBelow.priority] || 2;
        
        // Should match the priority of the surrounding cards
        // If they're the same, use that priority
        if (abovePriority === belowPriority) {
          return cardAbove.priority as 'low' | 'medium' | 'high';
        }
        
        // If they differ, use the lower one to maintain hierarchy
        if (abovePriority > belowPriority) {
          return cardBelow.priority as 'low' | 'medium' | 'high';
        } else {
          return cardAbove.priority as 'low' | 'medium' | 'high';
        }
      }

      return 'medium'; // Default fallback
    };

    // Helper function to adjust all priorities in a column to maintain hierarchy
    const adjustColumnPriorities = (tasks: TaskModel[], status: TaskStatus): TaskModel[] => {
      const columnTasks = tasks.filter(t => t.status === status);
      const otherTasks = tasks.filter(t => t.status !== status);
      
      if (columnTasks.length === 0) return tasks;

      // Sort by current position (already in correct visual order from drag-drop)
      // Don't re-sort, just adjust priorities based on position
      const adjustedColumnTasks = columnTasks.map((task, index) => {
        const total = columnTasks.length;
        const position = index / total;

        let newPriority: 'low' | 'medium' | 'high';
        
        if (position < 0.33) {
          // Top 33% - High priority
          newPriority = 'high';
        } else if (position < 0.67) {
          // Middle 34% - Medium priority
          newPriority = 'medium';
        } else {
          // Bottom 33% - Low priority
          newPriority = 'low';
        }

        return { ...task, priority: newPriority };
      });

      // Merge back with other tasks, maintaining order
      const result: TaskModel[] = [];
      let columnIndex = 0;
      let otherIndex = 0;

      for (const task of tasks) {
        if (task.status === status) {
          result.push(adjustedColumnTasks[columnIndex++]);
        } else {
          result.push(otherTasks[otherIndex++]);
        }
      }

      return result;
    };

    setTasksState(prevTasks => {
      const activeTask = prevTasks.find(t => t.id === activeTaskId);
      if (!activeTask) return prevTasks;

      let updatedTasks = [...prevTasks];

      // Case 1: Dropped on a droppable area (empty space in status column)
      if (overStatus && !overTaskId) {
        // Remove task from current position
        updatedTasks = updatedTasks.filter(t => t.id !== activeTaskId);
        
        // Find the last task in the target column
        const targetColumnTasks = updatedTasks.filter(t => t.status === overStatus);
        const lastTaskInColumn = targetColumnTasks[targetColumnTasks.length - 1];
        
        // Determine insertion index
        let insertIndex: number;
        if (lastTaskInColumn) {
          insertIndex = updatedTasks.findIndex(t => t.id === lastTaskInColumn.id) + 1;
        } else {
          // Column is empty
          if (overStatus === 'new') {
            insertIndex = 0;
          } else if (overStatus === 'in_progress') {
            const lastNewTask = updatedTasks.filter(t => t.status === 'new').pop();
            insertIndex = lastNewTask ? updatedTasks.findIndex(t => t.id === lastNewTask.id) + 1 : 0;
          } else {
            insertIndex = updatedTasks.length;
          }
        }

        // Determine priority based on position
        const newPriority = determinePriorityAtPosition(updatedTasks, insertIndex, overStatus);
        
        // Create task with new status and priority
        const taskWithNewStatusAndPriority = { 
          ...activeTask, 
          status: overStatus,
          priority: newPriority
        };
        
        // Insert at calculated position
        updatedTasks.splice(insertIndex, 0, taskWithNewStatusAndPriority);

        // Adjust all priorities in the target column to maintain hierarchy
        updatedTasks = adjustColumnPriorities(updatedTasks, overStatus);

        if (activeTask.status !== overStatus) {
          // Also adjust the source column if status changed
          updatedTasks = adjustColumnPriorities(updatedTasks, activeTask.status);
        }

        toast({
          title: "Task Updated",
          description: `Moved to ${overStatus.replace('_', ' ')} with ${newPriority} priority 🎯`,
        });

        return updatedTasks;
      }

      // Case 2: Dropped on another task (exact positioning)
      if (overTaskId) {
        const overTask = prevTasks.find(t => t.id === overTaskId);
        if (!overTask) return prevTasks;

        const activeIndex = prevTasks.findIndex(t => t.id === activeTaskId);
        const overIndex = prevTasks.findIndex(t => t.id === overTaskId);

        // Remove the active task first
        updatedTasks = prevTasks.filter(t => t.id !== activeTaskId);
        
        // Calculate the correct insertion index
        let insertIndex = overIndex;
        if (activeIndex < overIndex) {
          insertIndex = overIndex - 1;
        }

        // Determine priority based on surrounding cards
        const newPriority = determinePriorityAtPosition(updatedTasks, insertIndex, overTask.status);
        
        // Update status and priority to match the target position
        const taskWithNewStatusAndPriority = { 
          ...activeTask, 
          status: overTask.status,
          priority: newPriority
        };
        
        // Insert at the exact position
        updatedTasks.splice(insertIndex, 0, taskWithNewStatusAndPriority);

        // Adjust all priorities in the target column to maintain hierarchy
        updatedTasks = adjustColumnPriorities(updatedTasks, overTask.status);

        if (activeTask.status !== overTask.status) {
          // Also adjust the source column if status changed
          updatedTasks = adjustColumnPriorities(updatedTasks, activeTask.status);
          toast({
            title: "Task Updated",
            description: `Moved to ${overTask.status.replace('_', ' ')} with ${newPriority} priority 🎯`,
          });
        } else {
          toast({
            title: "Priority Updated",
            description: `Priority changed to ${newPriority} 🔄`,
          });
        }
      }

      return updatedTasks;
    });
  };

  // filter state (only used on this page)
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [deadlineFilter, setDeadlineFilter] = useState<
    "all" | "next7" | "overdue"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // State for expanded status groups in list view
  const [expandedStatuses, setExpandedStatuses] = useState<{
    new: boolean;
    in_progress: boolean;
    completed: boolean;
  }>({
    new: false,
    in_progress: false,
    completed: false,
  });
  
  const toggleStatusExpanded = (status: 'new' | 'in_progress' | 'completed') => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

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
    setSearchQuery("");
  };

  const parseDueDate = (d?: string) => {
    if (!d) return null;
    const parsed = Date.parse(d);
    return isNaN(parsed) ? null : new Date(parsed);
  };

  const matchesFilters = (task: TaskModel) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesDescription = task.description?.toLowerCase().includes(query);
      const matchesAssignee = task.assignedTo.toLowerCase().includes(query);
      const matchesProject = task.projectName.toLowerCase().includes(query);
      const matchesTags = task.tags?.some(tag => tag.toLowerCase().includes(query));
      
      if (!matchesTitle && !matchesDescription && !matchesAssignee && !matchesProject && !matchesTags) {
        return false;
      }
    }
    
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
    .filter(matchesFilters);

  const filteredInProgress = allTasks
    .filter((t) => t.status === "in_progress")
    .filter(matchesFilters);

  const filteredCompleted = allTasks
    .filter((t) => t.status === "completed")
    .filter(matchesFilters);

  const filteredAll = [
    ...filteredNew,
    ...filteredInProgress,
    ...filteredCompleted,
  ];

  // Reset to page 1 when filters change or view changes
  useEffect(() => {
    setCurrentPage(1);
    // Reset expanded states when switching to list view
    if (view === 'list') {
      setExpandedStatuses({
        new: false,
        in_progress: false,
        completed: false,
      });
    }
  }, [selectedAssignees, selectedPriorities, selectedProjects, deadlineFilter, searchQuery, view]);
  
  // Pagination settings
  const tasksPerColumnKanban = 5; // Max 5 tasks per column in kanban view
  const tasksPerStatusList = 3; // Show 3 tasks per status in list view initially
  
  // Apply pagination based on view type
  let paginatedFilteredNew: TaskModel[];
  let paginatedFilteredInProgress: TaskModel[];
  let paginatedFilteredCompleted: TaskModel[];
  let totalPages: number;
  let startIndex: number;
  let endIndex: number;
  let totalFilteredTasks: number;
  
  if (view === "kanban") {
    // Kanban view: 5 tasks per column per page
    const startIdx = (currentPage - 1) * tasksPerColumnKanban;
    const endIdx = startIdx + tasksPerColumnKanban;
    
    paginatedFilteredNew = filteredNew.slice(startIdx, endIdx);
    paginatedFilteredInProgress = filteredInProgress.slice(startIdx, endIdx);
    paginatedFilteredCompleted = filteredCompleted.slice(startIdx, endIdx);
    
    // Calculate total pages based on the column with most tasks
    const maxColumnTasks = Math.max(
      filteredNew.length,
      filteredInProgress.length,
      filteredCompleted.length
    );
    totalPages = Math.ceil(maxColumnTasks / tasksPerColumnKanban);
    
    // For display purposes
    totalFilteredTasks = filteredAll.length;
    startIndex = startIdx;
    endIndex = Math.min(
      startIdx + tasksPerColumnKanban,
      maxColumnTasks
    );
  } else {
    // List view: Show 3 tasks per status, with expand functionality
    paginatedFilteredNew = expandedStatuses.new 
      ? filteredNew 
      : filteredNew.slice(0, tasksPerStatusList);
    
    paginatedFilteredInProgress = expandedStatuses.in_progress
      ? filteredInProgress
      : filteredInProgress.slice(0, tasksPerStatusList);
    
    paginatedFilteredCompleted = expandedStatuses.completed
      ? filteredCompleted
      : filteredCompleted.slice(0, tasksPerStatusList);
    
    // For list view, pagination is handled by expand/collapse
    totalFilteredTasks = filteredAll.length;
    totalPages = 1; // No pagination in list view, only expand/collapse
    startIndex = 0;
    endIndex = totalFilteredTasks;
  }

  const PaginationControls = () => {
    const displayText = view === "kanban"
      ? `Page ${currentPage} of ${totalPages} (${totalFilteredTasks} total tasks, max 5 per column)`
      : `Showing ${totalFilteredTasks > 0 ? startIndex + 1 : 0} - ${Math.min(endIndex, totalFilteredTasks)} of ${totalFilteredTasks} tasks`;
    
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs text-muted-foreground">
          {displayText}
        </div>
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || totalPages === 0}
            className="h-7 px-2"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <div className="flex items-center gap-0.5">
            {totalPages > 0 && Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              // Show first 3, last 3, and pages around current
              const page = i + 1;
              const showPage = page <= 3 || page > totalPages - 3 || Math.abs(page - currentPage) <= 1;
              
              if (!showPage && (page === 4 || page === totalPages - 3)) {
                return <span key={page} className="px-1 text-xs text-muted-foreground">...</span>;
              }
              
              if (!showPage) return null;
              
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-7 w-7 p-0 text-xs"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="h-7 px-2"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A1931]">Tasks</h1>
          <p className="mt-2 text-[#4A7FA7]">
            {currentUser?.role === 'manager' 
              ? 'View and manage all tasks across the projects you manage'
              : currentUser?.role === 'member'
              ? 'View and work on tasks assigned to you'
              : 'View and manage all tasks across projects'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 border-[#B3CFE5]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="border-[#B3CFE5]">
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

          <Button variant="outline" size="sm" asChild className="border-[#B3CFE5]">
            <Link href="/map">
              <Network className="h-4 w-4 mr-2" />
              Dependency Map
            </Link>
          </Button>

          {currentUser && currentUser.role !== "member" && (
            <Button asChild className="bg-[#4A255F] hover:bg-[#3b1f4e]">
              <Link href="/createtask">
                <Plus className="h-4 w-4" />
                New Task
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Metrics */}
      <StatsCards 
        data={kpiMetrics} 
        className="mb-6" 
        userRole={currentUser?.role as 'admin' | 'manager' | 'member'}
      />

      {/* View Toggle and Pagination */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-[#B3CFE5] p-1 bg-white">
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
        {view === "kanban" && <PaginationControls />}
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div className="mb-4 text-sm text-muted-foreground">Loading tasks…</div>
      )}
      {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

      {/* Kanban or List View */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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
              <DroppableColumn 
                id="new" 
                items={paginatedFilteredNew.map(t => `task-${t.id}`)}
              >
                <div className="space-y-3">
                  {paginatedFilteredNew.map((task) => (
                    <TaskCard
                      key={task.id}
                      title={task.title}
                      description={task.description || ''}
                      priority={task.priority}
                      assignedTo={task.assignedTo}
                      assignedBy={task.assignedBy}
                      tags={task.tags}
                      dueDate={task.dueDate}
                      projectName={task.projectName}
                      status={task.status}
                      taskId={task.id}
                      images={task.images || []}
                      onAdvanceStatus={handleAdvanceStatus}
                    />
                  ))}
                </div>
              </DroppableColumn>
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
            <DroppableColumn 
              id="in_progress" 
              items={paginatedFilteredInProgress.map(t => `task-${t.id}`)}
            >
              <div className="space-y-3">
                {paginatedFilteredInProgress.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    description={task.description || ''}
                    priority={task.priority}
                    assignedTo={task.assignedTo}
                    assignedBy={task.assignedBy}
                    tags={task.tags}
                    dueDate={task.dueDate}
                    projectName={task.projectName}
                    status={task.status}
                    taskId={task.id}
                    images={task.images || []}
                    onAdvanceStatus={handleAdvanceStatus}
                  />
                ))}
              </div>
            </DroppableColumn>
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
            <DroppableColumn 
              id="completed" 
              items={paginatedFilteredCompleted.map(t => `task-${t.id}`)}
            >
              <div className="space-y-3">
                {paginatedFilteredCompleted.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    description={task.description || ''}
                    priority={task.priority}
                    assignedTo={task.assignedTo}
                    assignedBy={task.assignedBy}
                    tags={task.tags}
                    dueDate={task.dueDate}
                    projectName={task.projectName}
                    status={task.status}
                    taskId={task.id}
                    images={task.images || []}
                    onAdvanceStatus={handleAdvanceStatus}
                  />
                ))}
              </div>
            </DroppableColumn>
          </div>
        </div>
      ) : (
        // List View - Grouped by Status
        <div className="space-y-8">
          {/* New Tasks Section */}
          {paginatedFilteredNew.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <h3 className="text-xl font-semibold">New</h3>
                <Badge variant="secondary" className="rounded-full">
                  {filteredNew.length}
                </Badge>
              </div>
              <DroppableColumn 
                id="new" 
                items={paginatedFilteredNew.map(t => `task-${t.id}`)}
              >
                <div className="space-y-3">
                  {paginatedFilteredNew.map((task) => (
                    <TaskCard
                      key={task.id}
                      variant="compact"
                      title={task.title}
                      description={task.description || ''}
                      priority={task.priority}
                      assignedTo={task.assignedTo}
                      assignedBy={task.assignedBy}
                      tags={task.tags}
                      dueDate={task.dueDate}
                      projectName={task.projectName}
                      status={task.status}
                      taskId={task.id}
                      images={task.images || []}
                      onAdvanceStatus={handleAdvanceStatus}
                    />
                  ))}
                </div>
              </DroppableColumn>
              {filteredNew.length > tasksPerStatusList && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStatusExpanded('new')}
                  className="w-full mt-3 text-sm"
                >
                  {expandedStatuses.new 
                    ? `Show Less` 
                    : `View More (${filteredNew.length - tasksPerStatusList} more)`
                  }
                </Button>
              )}
            </div>
          )}

          {/* In Progress Tasks Section */}
          {paginatedFilteredInProgress.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <h3 className="text-xl font-semibold">In Progress</h3>
                <Badge variant="secondary" className="rounded-full bg-blue-100 text-blue-700">
                  {filteredInProgress.length}
                </Badge>
              </div>
              <DroppableColumn 
                id="in_progress" 
                items={paginatedFilteredInProgress.map(t => `task-${t.id}`)}
              >
                <div className="space-y-3">
                  {paginatedFilteredInProgress.map((task) => (
                    <TaskCard
                      key={task.id}
                      variant="compact"
                      title={task.title}
                      description={task.description || ''}
                      priority={task.priority}
                      assignedTo={task.assignedTo}
                      assignedBy={task.assignedBy}
                      tags={task.tags}
                      dueDate={task.dueDate}
                      projectName={task.projectName}
                      status={task.status}
                      taskId={task.id}
                      images={task.images || []}
                      onAdvanceStatus={handleAdvanceStatus}
                    />
                  ))}
                </div>
              </DroppableColumn>
              {filteredInProgress.length > tasksPerStatusList && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStatusExpanded('in_progress')}
                  className="w-full mt-3 text-sm"
                >
                  {expandedStatuses.in_progress 
                    ? `Show Less` 
                    : `View More (${filteredInProgress.length - tasksPerStatusList} more)`
                  }
                </Button>
              )}
            </div>
          )}

          {/* Completed Tasks Section */}
          {paginatedFilteredCompleted.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2 border-b pb-2">
                <h3 className="text-xl font-semibold">Completed</h3>
                <Badge variant="secondary" className="rounded-full">
                  {filteredCompleted.length}
                </Badge>
              </div>
              <DroppableColumn 
                id="completed" 
                items={paginatedFilteredCompleted.map(t => `task-${t.id}`)}
              >
                <div className="space-y-3">
                  {paginatedFilteredCompleted.map((task) => (
                    <TaskCard
                      key={task.id}
                      variant="compact"
                      title={task.title}
                      description={task.description || ''}
                      priority={task.priority}
                      assignedTo={task.assignedTo}
                      assignedBy={task.assignedBy}
                      tags={task.tags}
                      dueDate={task.dueDate}
                      projectName={task.projectName}
                      status={task.status}
                      taskId={task.id}
                      images={task.images || []}
                      onAdvanceStatus={handleAdvanceStatus}
                    />
                  ))}
                </div>
              </DroppableColumn>
              {filteredCompleted.length > tasksPerStatusList && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStatusExpanded('completed')}
                  className="w-full mt-3 text-sm"
                >
                  {expandedStatuses.completed 
                    ? `Show Less` 
                    : `View More (${filteredCompleted.length - tasksPerStatusList} more)`
                  }
                </Button>
              )}
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
      </DndContext>

      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div className="opacity-80 rotate-3 scale-105 shadow-2xl">
            {(() => {
              const taskId = parseInt(activeId.split('-')[1]);
              const task = allTasks.find(t => t.id === taskId);
              if (!task) return null;
              
              return (
                <TaskCard
                  title={task.title}
                  description={task.description || ''}
                  priority={task.priority}
                  assignedTo={task.assignedTo}
                  assignedBy={task.assignedBy}
                  tags={task.tags}
                  dueDate={task.dueDate}
                  projectName={task.projectName}
                  status={task.status}
                  taskId={task.id}
                  images={task.images || []}
                  variant={view === "list" ? "compact" : "default"}
                />
              );
            })()}
          </div>
        ) : null}
      </DragOverlay>

      {/* Bottom Pagination - Only show in Kanban view */}
      {view === "kanban" && (
        <div className="mt-6">
          <PaginationControls />
        </div>
      )}
    </div>
  );
}
