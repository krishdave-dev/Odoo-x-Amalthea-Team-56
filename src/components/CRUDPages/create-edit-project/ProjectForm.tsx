"use client";

import * as React from "react";
import { useState } from "react";
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

interface ProjectFormProps {
  mode: "create" | "edit";
  initialData?: {
    name?: string;
    tags?: string[];
    manager?: string;
    deadline?: Date;
    priority?: "low" | "medium" | "high";
    image?: string;
    description?: string;
  };
  onSave?: (data: any) => void;
  onDiscard?: () => void;
}

// Mock data for dropdowns
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

const managerOptions = [
  { value: "john", label: "John Doe" },
  { value: "sarah", label: "Sarah Kim" },
  { value: "alice", label: "Alice Johnson" },
  { value: "bob", label: "Bob Smith" },
  { value: "emma", label: "Emma Davis" },
];

export function ProjectForm({
  mode,
  initialData,
  onSave,
  onDiscard,
}: ProjectFormProps) {
  const [projectName, setProjectName] = useState(initialData?.name || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [manager, setManager] = useState(initialData?.manager || "");
  const [deadline, setDeadline] = useState<Date | undefined>(
    initialData?.deadline
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    initialData?.priority || "medium"
  );
  const [image, setImage] = useState(initialData?.image || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.image || null
  );

  const breadcrumbItems = [
    { label: "Projects", href: "/project" },
    { label: mode === "create" ? "Create Project" : "Edit Project" },
  ];

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

  const handleSave = () => {
    const data = {
      name: projectName,
      tags,
      manager,
      deadline,
      priority,
      image,
      description,
    };
    onSave?.(data);
    console.log("Saving project:", data);
  };

  const handleDiscard = () => {
    onDiscard?.();
    // Reset form or navigate away
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header with Breadcrumb and Actions */}
        <div className="mb-10 flex items-center justify-between gap-4">
          <Breadcrumb items={breadcrumbItems} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDiscard} size="default">
              Discard
            </Button>
            <Button onClick={handleSave} size="default">
              Save
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
              />
            </div>

            {/* Row 1: Tags and Project Manager */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-base">Tags</Label>
                <MultiSelect
                  options={tagOptions}
                  selected={tags}
                  onChange={setTags}
                  placeholder="Select tags..."
                />
              </div>

              {/* Project Manager */}
              <div className="space-y-3">
                <Label htmlFor="project-manager" className="text-base">
                  Project Manager <span className="text-destructive">*</span>
                </Label>
                <Select value={manager} onValueChange={setManager}>
                  <SelectTrigger id="project-manager" className="h-11">
                    <SelectValue placeholder="Select project manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Deadline and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deadline */}
              <div className="space-y-3">
                <Label className="text-base">
                  Deadline <span className="text-destructive">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-11",
                        !deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Priority */}
              <div className="space-y-3">
                <Label className="text-base">
                  Priority <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={priority}
                  onValueChange={(value) =>
                    setPriority(value as "low" | "medium" | "high")
                  }
                  className="flex gap-6 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="font-normal cursor-pointer">
                      Low
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label
                      htmlFor="medium"
                      className="font-normal cursor-pointer"
                    >
                      Medium
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label
                      htmlFor="high"
                      className="font-normal cursor-pointer"
                    >
                      High
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="text-base">Project Image</Label>
              {imagePreview ? (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Project preview"
                      className="h-48 w-auto rounded-lg border object-cover shadow-sm"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="outline" asChild className="h-11">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Upload a project image (optional)
                  </span>
                </div>
              )}
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
            <Button variant="outline" onClick={handleDiscard} size="lg">
              Discard Changes
            </Button>
            <Button onClick={handleSave} size="lg">
              {mode === "create" ? "Create Project" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}