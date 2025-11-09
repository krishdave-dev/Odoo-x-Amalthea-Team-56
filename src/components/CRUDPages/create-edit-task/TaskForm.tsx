"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Upload, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { AttachmentList } from "@/components/ui/attachment-list";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface TaskFormProps {
  mode?: "create" | "edit";
  initialData?: any;
}

interface Project {
  id: number;
  name: string;
  code?: string;
  endDate?: string;
}

interface User {
  id: number;
  name?: string | null;
  email: string;
  role?: string;
}

export function TaskForm({ mode = "create", initialData }: TaskFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState(initialData?.title || "");
  const [assigneeId, setAssigneeId] = useState<string>(
    initialData?.assigneeId?.toString() || ""
  );
  const [projectId, setProjectId] = useState<string>(
    initialData?.projectId?.toString() || ""
  );
  const [deadline, setDeadline] = useState<Date | undefined>(
    initialData?.dueDate ? new Date(initialData.dueDate) : undefined
  );
  const [priority, setPriority] = useState<string>(
    initialData?.priority?.toString() || "2"
  );
  const [image, setImage] = useState<string | null>(
    initialData?.metadata?.image || null
  );
  const [descEditing, setDescEditing] = useState(false);
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [status, setStatus] = useState<string>(
    initialData?.status || "new"
  );
  const [attachmentRefresh, setAttachmentRefresh] = useState(0);
  
  // Generate temporary ID for pending tasks (used in create mode)
  const [tempTaskId] = useState(() => -Math.floor(Math.random() * 1000000));

  // Data from API
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projectMembers, setProjectMembers] = useState<User[]>([]); // Filtered by selected project
  const [selectedProjectEndDate, setSelectedProjectEndDate] = useState<Date | undefined>();
  const [loadingData, setLoadingData] = useState(true);

  // Timesheets state (kept for UI only in create mode)
  const [timesheets, setTimesheets] = useState<
    Array<{ employee: string; time: string }>
  >(
    initialData?.metadata?.timesheets || []
  );

  const [submitting, setSubmitting] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

  // Fetch projects and users on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.organizationId) return;

      try {
        setLoadingData(true);

        // Fetch projects - managers see their projects, admins see all
        const projectsRes = await fetch(
          `/api/projects?organizationId=${user.organizationId}&pageSize=100`,
          { credentials: "include" }
        );

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData.data || []);
        }

        // Fetch organization users for assignee selection
        const usersRes = await fetch(
          `/api/organizations/${user.organizationId}/users?activeOnly=true`,
          { credentials: "include" }
        );

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.data?.users || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load projects and users",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user?.organizationId, toast]);

  // Fetch project members when project is selected
  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (!projectId || !user?.organizationId) {
        setProjectMembers([]);
        setSelectedProjectEndDate(undefined);
        return;
      }

      try {
        const res = await fetch(
          `/api/projects/${projectId}?organizationId=${user.organizationId}`,
          { credentials: "include" }
        );

        if (res.ok) {
          const data = await res.json();
          const project = data.data;
          
          // Store project end date for deadline validation
          if (project?.endDate) {
            setSelectedProjectEndDate(new Date(project.endDate));
          } else {
            setSelectedProjectEndDate(undefined);
          }
          
          // Get project members from the members array
          if (project?.members && Array.isArray(project.members)) {
            const memberUsers = project.members.map((m: any) => m.user);
            setProjectMembers(memberUsers);
          } else {
            setProjectMembers([]);
          }

          // Reset assignee if they're not in the project
          if (assigneeId) {
            const isAssigneeInProject = project?.members?.some(
              (m: any) => m.user.id.toString() === assigneeId
            );
            if (!isAssigneeInProject) {
              setAssigneeId("");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching project members:", error);
        setProjectMembers([]);
        setSelectedProjectEndDate(undefined);
      }
    };

    fetchProjectMembers();
  }, [projectId, user?.organizationId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const removeTimesheet = (index: number) => {
    setTimesheets((prev) => prev.filter((_, i) => i !== index));
  };

  const addTimesheet = () => {
    setTimesheets((prev) => [...prev, { employee: "", time: "0h 00m" }]);
  };

  const totalWorkingHours = timesheets.reduce((acc, t) => {
    const match = t.time.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const mins = parseInt(match[2]) || 0;
      return acc + hours + mins / 60;
    }
    return acc;
  }, 0);

  const validateForm = (): boolean => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return false;
    }

    if (!projectId) {
      toast({
        title: "Validation Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      // Build server payload to match createTaskSchema/updateTaskSchema
      const payload: any = {
        title: title.trim(),
        description: description?.trim() || undefined,
        assigneeId: assigneeId ? parseInt(assigneeId) : undefined,
        priority: parseInt(priority),
        status: mode === "edit" ? status : "new", // Keep existing status in edit mode, new for create
        dueDate: deadline?.toISOString() || undefined,
        metadata: {
          image: image ?? undefined,
          timesheets,
        },
      };

      // Add projectId only for create mode
      if (mode === "create") {
        payload.projectId = parseInt(projectId);
      }

      // Add version for optimistic locking in edit mode
      if (mode === "edit" && initialData?.version) {
        payload.version = initialData.version;
      }

      const url = mode === "create" 
        ? "/api/tasks" 
        : `/api/tasks/${initialData?.id}`;
      
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        // Reassociate attachments if in create mode
        if (mode === "create" && data.data?.id && user?.organizationId) {
          console.log('🔄 Reassociating task attachments from temp ID:', tempTaskId, 'to task ID:', data.data.id);
          
          try {
            const reassociateResponse = await fetch('/api/attachments/reassociate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                organizationId: user.organizationId,
                temporaryOwnerId: tempTaskId,
                temporaryOwnerType: 'pending_task',
                actualOwnerId: data.data.id,
                actualOwnerType: 'task',
              }),
            });

            const reassociateResult = await reassociateResponse.json();
            console.log('🔄 Reassociate result:', reassociateResult);
          } catch (error) {
            console.error('Failed to reassociate attachments:', error);
          }
        }

        toast({
          title: "Success",
          description: `Task ${mode === "create" ? "created" : "updated"} successfully`,
        });

        // Redirect to tasks page
        router.push("/task");
      } else {
        const errorMsg = typeof data.error === 'string' 
          ? data.error 
          : data.error?.message || "Failed to save task";
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: error?.message || "An error occurred while saving the task",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = () => {
    router.push("/task");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-6">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {mode === "create" ? "Create New Task" : "Edit Task"}
          </h2>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleDiscard}
              disabled={submitting}
            >
              Discard
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || loadingData}
            >
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {loadingData && (
          <div className="mb-4 text-sm text-muted-foreground">
            Loading projects and users...
          </div>
        )}

        {/* Title */}
        <div className="mb-6">
          <Label htmlFor="task-title" className="text-base mb-2">
            Task Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            className="text-lg h-12"
            required
          />
        </div>

        {/* Project / Assignee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label className="block mb-2">
              Project <span className="text-destructive">*</span>
            </Label>
            {loadingData ? (
              <div className="h-11 border rounded-md flex items-center px-3 text-muted-foreground">
                Loading projects...
              </div>
            ) : (
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id.toString()}>
                      {proj.name} {proj.code ? `(${proj.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {projects.length > 0 
                ? `${projects.length} project${projects.length > 1 ? 's' : ''} available`
                : "No projects available"
              }
            </p>
          </div>

          <div>
            <Label className="block mb-2">Assignee</Label>
            {loadingData ? (
              <div className="h-11 border rounded-md flex items-center px-3 text-muted-foreground">
                Loading users...
              </div>
            ) : !projectId ? (
              <div className="h-11 border rounded-md flex items-center px-3 text-muted-foreground">
                Select a project first
              </div>
            ) : (
              <Select value={assigneeId || "unassigned"} onValueChange={(val) => setAssigneeId(val === "unassigned" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projectMembers.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name || u.email} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {projectId && (
              <p className="text-xs text-muted-foreground mt-1">
                {projectMembers.length > 0 
                  ? `${projectMembers.length} member${projectMembers.length > 1 ? 's' : ''} in this project`
                  : "No members assigned to this project"
                }
              </p>
            )}
          </div>
        </div>

        {/* Priority / Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label className="block mb-2">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">High</SelectItem>
                <SelectItem value="4">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block mb-2">Deadline</Label>
            <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  {deadline ? deadline.toDateString() : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(date) => {
                    setDeadline(date);
                    setDeadlineOpen(false);
                  }}
                  initialFocus
                  disabled={(date) => {
                    const today = new Date(new Date().setHours(0, 0, 0, 0));
                    // Can't select dates before today
                    if (date < today) return true;
                    // Can't select dates after project end date
                    if (selectedProjectEndDate) {
                      const projectEnd = new Date(selectedProjectEndDate);
                      projectEnd.setHours(0, 0, 0, 0);
                      if (date > projectEnd) return true;
                    }
                    return false;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Image - Legacy (keeping for backward compatibility) */}
        <div className="mb-6">
          <Label className="block mb-2">Image (Legacy)</Label>
          {image ? (
            <img
              src={image}
              alt="Task"
              className="h-40 w-auto rounded-md object-cover"
            />
          ) : (
            <Button variant="outline" asChild>
              <label
                htmlFor="task-image"
                className="cursor-pointer inline-flex items-center gap-2"
              >
                <Upload className="h-4 w-4" /> Upload Image
                <input
                  id="task-image"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </Button>
          )}
        </div>

        {/* Attachments - Images Only */}
        <div className="mb-6">
          <Label className="block mb-3 text-lg font-semibold">Task Images</Label>
          {user?.organizationId && (
            <>
              <FileUpload
                organizationId={user.organizationId}
                ownerType={mode === "create" ? "pending_task" : "task"}
                ownerId={mode === "create" ? tempTaskId : initialData?.id}
                uploadedBy={user.id}
                accept="image/*"
                maxSizeMB={10}
                multiple={true}
                showPreview={true}
                onUploadComplete={() => setAttachmentRefresh(prev => prev + 1)}
              />
              <div className="mt-4">
                <AttachmentList
                  ownerType={mode === "create" ? "pending_task" : "task"}
                  ownerId={mode === "create" ? tempTaskId : initialData?.id}
                  organizationId={user.organizationId}
                  allowDelete={true}
                  refreshTrigger={attachmentRefresh}
                />
              </div>
            </>
          )}
        </div>

        {/* Tabs row - description inline, others popovers */}
        <div className="flex items-center gap-4 border-b pb-2 mb-4">
          <button
            className="px-3 py-1 rounded-md border"
            onClick={() => setDescEditing(true)}
          >
            Description
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="px-3 py-1 rounded-md border">Task info</button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span className="font-medium">
                    {priority === "1" && "Low"}
                    {priority === "2" && "Medium"}
                    {priority === "3" && "High"}
                    {priority === "4" && "Urgent"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total working hours
                  </span>
                  <span className="font-medium">
                    {totalWorkingHours.toFixed(2)}h
                  </span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Description section inline edit */}
        <div className="mt-2">
          {descEditing ? (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              onBlur={() => setDescEditing(false)}
              placeholder="Type task description..."
            />
          ) : (
            <div
              className="min-h-24 text-muted-foreground italic cursor-text"
              onClick={() => setDescEditing(true)}
            >
              {description || "Click to add a description"}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
