"use client";

import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar, MoreVertical, Edit3, Trash2, Flag } from "lucide-react";
import { useState } from "react";
import { ProjectDetailsDialog } from "./ProjectDetailsDialog";

interface ProjectCardProps {
  projectId: number;
  title: string;
  tags?: string[];
  images?: string[];
  deadline?: string;
  managerName?: string;
  managerAvatar?: string;
  tasksCount?: number;
  completedTasksCount?: number;
  budget?: number | null;
  cachedCost?: number;
  organizationId: number;
  onEdit?: (projectId: number) => void;
  onDelete?: (projectId: number) => void;
}

export function ProjectCard({
  projectId,
  title,
  tags = [],
  images = [],
  deadline,
  managerName = "",
  managerAvatar,
  tasksCount = 0,
  completedTasksCount = 0,
  budget = null,
  cachedCost = 0,
  organizationId,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleEdit = () => {
    setPopoverOpen(false);
    onEdit?.(projectId);
  };

  const handleDelete = () => {
    setPopoverOpen(false);
    onDelete?.(projectId);
  };

  // Calculate progress percentage
  const progressPercentage = tasksCount > 0 
    ? Math.round((completedTasksCount / tasksCount) * 100) 
    : 0;

  // Calculate budget usage percentage
  const budgetUsagePercentage = budget && budget > 0
    ? Math.round((cachedCost / budget) * 100)
    : 0;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer p-4"
        onClick={() => setDetailsDialogOpen(true)}
      >
        <CardContent className="p-0">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex gap-2 mb-3 flex-wrap">
              {tags.map((t) => (
                <Badge key={t} className="bg-emerald-100 text-emerald-800" variant="outline">{t}</Badge>
              ))}
            </div>

            <h3 className="text-lg font-semibold mb-3">{title}</h3>

            {/* image thumbnails */}
            <div className="flex items-center gap-2 mb-4">
              {images.length ? (
                images.slice(0, 3).map((src, i) => (
                  <div key={i} className="w-20 h-14 overflow-hidden rounded-lg border">
                    <img src={src} alt={`img-${i}`} className="w-full h-full object-cover" />
                  </div>
                ))
              ) : (
                <div className="w-20 h-14 bg-neutral-100 rounded-lg" />
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                <span>{deadline ?? "-"}</span>
              </div>

              <div className="flex items-center gap-2">
                {managerAvatar ? (
                  <img src={managerAvatar} alt={managerName} className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-neutral-200" />
                )}
                <span>{tasksCount} tasks</span>
              </div>
            </div>

            {/* Progress Bar */}
            {tasksCount > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{completedTasksCount} of {tasksCount} completed</span>
                  <span className="font-medium">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Budget Usage */}
            {budget && budget > 0 && (
              <div className="space-y-1 mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(cachedCost)} of {formatCurrency(budget)} used</span>
                  <span className="font-medium">{budgetUsagePercentage}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      budgetUsagePercentage > 100 
                        ? 'bg-red-600' 
                        : budgetUsagePercentage > 80 
                        ? 'bg-amber-600' 
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(budgetUsagePercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="ml-4 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="p-2">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="end">
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={handleEdit}
                    className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded text-left w-full"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Project</span>
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex items-center gap-2 p-2 mt-1 text-red-600 hover:bg-red-50 rounded text-left w-full"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Project</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-0 mt-4">
        {/* footer intentionally left minimal; kept for spacing */}
      </CardFooter>
    </Card>

      <ProjectDetailsDialog
        projectId={projectId}
        projectName={title}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        organizationId={organizationId}
      />
    </>
  );
}
