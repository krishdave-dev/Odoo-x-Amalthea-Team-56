"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultiSelect } from "@/components/ui/multi-select";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface ProjectFormProps {
  mode: "create" | "edit";
  initialData?: {
    id?: number;
    name?: string;
    code?: string;
    tags?: string[];
    projectManagerId?: number;
    teamMembers?: number[];
    startDate?: Date;
    endDate?: Date;
    priority?: "low" | "medium" | "high";
    image?: string;
    description?: string;
    status?: string;
    budget?: number;
  };
  onSave?: (data: any) => void;
  onDiscard?: () => void;
}

interface OrgUser {
  id: number;
  name: string | null;
  email: string;
  role: string;
}

// Mock data for tags
const tagOptions = [
  { value: "development", label: "Development" },
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "urgent", label: "Urgent" },
  { value: "backend", label: "Backend" },
  { value: "frontend", label: "Frontend" },
  { value: "database", label: "Database" },
];

export function ProjectForm({
  mode,
  initialData,
  onSave,
  onDiscard,
}: ProjectFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [projectName, setProjectName] = useState(initialData?.name || "");
  const [code, setCode] = useState(initialData?.code || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [projectManagerId, setProjectManagerId] = useState<string>(
    initialData?.projectManagerId?.toString() || ""
  );
  const [projectManagers, setProjectManagers] = useState<string[]>(
    initialData?.projectManagerId ? [initialData.projectManagerId.toString()] : []
  );
  const [teamMembers, setTeamMembers] = useState<string[]>(
    initialData?.teamMembers?.map(id => id.toString()) || []
  );
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.startDate
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.endDate
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    initialData?.priority || "medium"
  );
  const [image, setImage] = useState(initialData?.image || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [budget, setBudget] = useState<string>(
    initialData?.budget?.toString() || ""
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null
  );
  const [status, setStatus] = useState(initialData?.status || "planned");

  // Organization users
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Date picker popover states
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const breadcrumbItems = [
    { label: "Projects", href: "/project" },
    { label: mode === "create" ? "Create Project" : "Edit Project" },
  ];

  // Fetch organization users
  useEffect(() => {
    const fetchOrgUsers = async () => {
      if (!user?.organizationId) {
        return;
      }

      setLoadingUsers(true);
      try {
        const url = `/api/organizations/${user.organizationId}/users?activeOnly=true`;
        
        const response = await fetch(url, { credentials: "include" });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const users = data.data.users || [];
            setOrgUsers(users);
          }
        }
      } catch (error) {
        console.error("Error fetching organization users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchOrgUsers();
  }, [user?.organizationId]);

  // Get manager options (admins and managers only)
  const managerOptions = orgUsers
    .filter(u => u.role === "admin" || u.role === "manager")
    .map(u => ({
      value: u.id.toString(),
      label: u.name || u.email,
    }));

  // Get team member options based on user role
  const teamMemberOptions = orgUsers
    .filter(u => {
      // Exclude the current user (admin/manager can't add themselves as team member)
      if (user && u.id === user.id) {
        return false;
      }
      
      // For admins: exclude users who are selected as project managers
      if (user?.role === "admin") {
        if (projectManagers.includes(u.id.toString())) {
          return false;
        }
        return true; // Can see all other users
      }
      
      // Managers can see:
      // - members and finance roles
      // - other managers (but not themselves - already filtered above)
      if (user?.role === "manager") {
        return (
          u.role === "member" || 
          u.role === "finance" || 
          (u.role === "manager" && u.id !== user.id)
        );
      }
      
      // Default fallback
      return u.role === "member" || u.role === "finance";
    })
    .map(u => ({
      value: u.id.toString(),
      label: `${u.name || u.email} (${u.role})`,
    }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImage("");
  };

  const validateForm = (): boolean => {
    if (!projectName.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return false;
    }

    // Admins must select at least one project manager
    if (user?.role === "admin" && projectManagers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one project manager",
        variant: "destructive",
      });
      return false;
    }

    if (!endDate) {
      toast({
        title: "Validation Error",
        description: "End date (deadline) is required",
        variant: "destructive",
      });
      return false;
    }

    if (startDate && endDate && startDate > endDate) {
      toast({
        title: "Validation Error",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    // For admins: first project manager is the primary, rest are added as team members
    // For managers: use their own ID as project manager
    const primaryManagerId = user?.role === "admin" 
      ? (projectManagers.length > 0 ? parseInt(projectManagers[0]) : undefined)
      : user?.id;

    // Combine team members with additional project managers (if admin selected multiple)
    const allTeamMembers = user?.role === "admin" && projectManagers.length > 1
      ? [...teamMembers, ...projectManagers.slice(1)] // Add additional managers as team members
      : teamMembers;

    const projectData = {
      name: projectName,
      code: code || undefined,
      description: description || undefined,
      projectManagerId: primaryManagerId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      status,
      budget: budget ? parseFloat(budget) : undefined,
      version: 1, // For optimistic locking in edit mode
    };

    try {
      const url = mode === "create" 
        ? "/api/projects" 
        : `/api/projects/${initialData?.id}?organizationId=${user?.organizationId}`;
      
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(projectData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Project ${mode === "create" ? "created" : "updated"} successfully`,
        });

        // If creating and team members selected, add them
        if (mode === "create" && allTeamMembers.length > 0 && data.data?.id) {
          await addTeamMembers(data.data.id, allTeamMembers);
        }

        // If editing and team members changed, update them
        if (mode === "edit" && initialData?.id) {
          await updateTeamMembers(initialData.id, allTeamMembers);
        }

        onSave?.(data.data);
        router.push("/project");
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to save project",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: "An error occurred while saving the project",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addTeamMembers = async (projectId: number, members: string[]) => {
    try {
      const promises = members.map(userId =>
        fetch(`/api/projects/${projectId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId: parseInt(userId) }),
        })
      );

      await Promise.all(promises);
    } catch (error) {
      console.error("Error adding team members:", error);
      // Don't fail the whole operation, just log
    }
  };

  const updateTeamMembers = async (projectId: number, members: string[]) => {
    try {
      // Get current members from initial data
      const initialMembers = new Set(initialData?.teamMembers || []);
      const currentMembers = new Set(members.map(id => parseInt(id)));

      // Find members to add (in current but not in initial)
      const toAdd = Array.from(currentMembers).filter(id => !initialMembers.has(id));
      
      // Find members to remove (in initial but not in current)
      const toRemove = Array.from(initialMembers).filter(id => !currentMembers.has(id));

      // Add new members
      const addPromises = toAdd.map(userId =>
        fetch(`/api/projects/${projectId}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userId }),
        })
      );

      // Remove members
      const removePromises = toRemove.map(userId =>
        fetch(`/api/projects/${projectId}/members/${userId}?organizationId=${user?.organizationId}`, {
          method: "DELETE",
          credentials: "include",
        })
      );

      await Promise.all([...addPromises, ...removePromises]);
    } catch (error) {
      console.error("Error updating team members:", error);
      // Don't fail the whole operation, just log
    }
  };

  const handleDiscard = () => {
    onDiscard?.();
    router.push("/project");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header with Breadcrumb and Actions */}
        <div className="mb-10 flex items-center justify-between gap-4">
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleDiscard} 
              size="default"
              disabled={submitting}
            >
              Discard
            </Button>
            <Button 
              onClick={handleSave} 
              size="default"
              disabled={submitting || loadingUsers}
            >
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-8">
            {mode === "create" ? "Create New Project" : "Edit Project"}
          </h2>

          <div className="space-y-8">
            {/* Project Name */}
            <div className="space-y-3">
              <Label htmlFor="project-name" className="text-base">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="h-11"
                required
              />
            </div>

            {/* Row 1: Code and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Code */}
              <div className="space-y-3">
                <Label htmlFor="project-code" className="text-base">
                  Project Code
                </Label>
                <Input
                  id="project-code"
                  placeholder="e.g., PROJ-001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Status */}
              <div className="space-y-3">
                <Label htmlFor="status" className="text-base">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="h-11">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Project Manager and Team Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Manager(s) */}
              <div className="space-y-3">
                <Label htmlFor="project-manager" className="text-base">
                  Project Manager{user?.role === "admin" && "s"} {user?.role === "admin" && <span className="text-destructive">*</span>}
                </Label>
                {user?.role === "admin" ? (
                  // Admin can select multiple project managers
                  loadingUsers ? (
                    <div className="h-11 border rounded-md flex items-center px-3 text-muted-foreground">
                      Loading managers...
                    </div>
                  ) : (
                    <MultiSelect
                      options={managerOptions}
                      selected={projectManagers}
                      onChange={setProjectManagers}
                      placeholder="Select project managers..."
                    />
                  )
                ) : (
                  // Manager sees disabled field showing auto-assignment
                  <Select 
                    value={projectManagerId} 
                    onValueChange={setProjectManagerId}
                    disabled={true}
                  >
                    <SelectTrigger id="project-manager" className="h-11">
                      <SelectValue placeholder="Auto-assigned" />
                    </SelectTrigger>
                  </Select>
                )}
                {user?.role !== "admin" ? (
                  <p className="text-xs text-muted-foreground">
                    You will be auto-assigned as project manager
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {projectManagers.length > 0 
                      ? `${projectManagers.length} manager${projectManagers.length > 1 ? 's' : ''} selected. First will be primary.`
                      : "Select one or more project managers"
                    }
                  </p>
                )}
              </div>

              {/* Team Members */}
              <div className="space-y-3">
                <Label className="text-base">
                  Team Members
                </Label>
                {loadingUsers ? (
                  <div className="h-11 border rounded-md flex items-center px-3 text-muted-foreground">
                    Loading team members...
                  </div>
                ) : teamMemberOptions.length === 0 ? (
                  <div className="h-11 border rounded-md flex items-center px-3 text-muted-foreground">
                    No team members available
                  </div>
                ) : (
                  <MultiSelect
                    options={teamMemberOptions}
                    selected={teamMembers}
                    onChange={setTeamMembers}
                    placeholder="Select team members..."
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {user?.role === "admin" 
                    ? "Assign team members to this project"
                    : "Assign members, finance users, and other managers"
                  }
                  {!loadingUsers && ` (${teamMemberOptions.length} available)`}
                </p>
              </div>
            </div>

            {/* Row 3: Start Date and End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div className="space-y-3">
                <Label className="text-base">
                  Start Date
                </Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setStartDateOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date / Deadline */}
              <div className="space-y-3">
                <Label className="text-base">
                  Deadline <span className="text-destructive">*</span>
                </Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        setEndDateOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => 
                        startDate ? date < startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Row 4: Budget and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget */}
              <div className="space-y-3">
                <Label htmlFor="budget" className="text-base">
                  Budget
                </Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="Enter budget amount"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="h-11"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Priority - Removed as not in schema */}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter project description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Provide a detailed description of the project goals and
                requirements.
              </p>
            </div>
          </div>

          {/* Form Actions - Bottom */}
          <div className="mt-10 pt-6 border-t flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleDiscard} 
              size="lg"
              disabled={submitting}
            >
              Discard Changes
            </Button>
            <Button 
              onClick={handleSave} 
              size="lg"
              disabled={submitting || loadingUsers}
            >
              {submitting ? "Saving..." : mode === "create" ? "Create Project" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}