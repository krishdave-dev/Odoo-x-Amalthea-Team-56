"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar, FolderKanban, CheckCircle, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { canAdvanceStatus } from "@/utils/taskStatusFlow";

// ClickUp-style priority configuration
const priorityConfig = {
  low: { bg: "bg-gray-100 hover:bg-gray-200", text: "text-gray-700", label: "Low" },
  medium: { bg: "bg-blue-100 hover:bg-blue-200", text: "text-blue-700", label: "Medium" },
  high: { bg: "bg-orange-100 hover:bg-orange-200", text: "text-orange-700", label: "High" },
  urgent: { bg: "bg-red-100 hover:bg-red-200", text: "text-red-700", label: "Urgent" },
};

interface TaskCardProps {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assignedTo: string;
  dueDate: string;
  projectName: string;
  status?: string;
  taskId?: number;
  images?: string[];
  tags?: string[]; // Optional tags
  assignedBy?: string; // Optional "assigned by" field
  variant?: "default" | "compact"; // default for kanban, compact for list
  onAdvanceStatus?: (taskId: number) => void; // Callback for advancing status
  isDraggable?: boolean; // Whether the card can be dragged
}

// Helper function to format due date with relative time
function formatDueDate(dateStr: string): { formatted: string; relative: string; isOverdue: boolean } {
  if (!dateStr) return { formatted: "No due date", relative: "", isOverdue: false };
  
  try {
    const dueDate = new Date(dateStr);
    const now = new Date();
    
    // Reset time to compare dates only
    const dueDay = new Date(dueDate);
    dueDay.setHours(0, 0, 0, 0);
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Format as "DD MMM, YYYY"
    const formatted = dueDate.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    
    // Calculate relative time
    let relative = "";
    const isOverdue = diffDays < 0;
    
    if (diffDays === 0) {
      relative = "Due today";
    } else if (diffDays === 1) {
      relative = "Due tomorrow";
    } else if (diffDays > 0) {
      relative = `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else {
      const overdueDays = Math.abs(diffDays);
      relative = `Overdue by ${overdueDays} day${overdueDays > 1 ? 's' : ''}`;
    }
    
    return { formatted, relative, isOverdue };
  } catch {
    return { formatted: dateStr, relative: "", isOverdue: false };
  }
}

// Get initials from assignee name
function getInitials(name: string): string {
  if (!name || name === "Unassigned") return "?";
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TaskCard({
  title,
  description,
  priority,
  assignedTo,
  dueDate,
  projectName,
  status,
  taskId,
  images = [],
  tags = [],
  assignedBy,
  variant = "default",
  onAdvanceStatus,
  isDraggable = true,
}: TaskCardProps) {
  const router = useRouter();
  const priorityStyle = priorityConfig[priority] || priorityConfig.low;
  const { formatted: formattedDate, relative: relativeDate, isOverdue } = formatDueDate(dueDate);
  
  const isCompact = variant === "compact";
  const canAdvance = status ? canAdvanceStatus(status) : false;

  // Drag and drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id: `task-${taskId}`,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on drag handle or checkmark
    if ((e.target as HTMLElement).closest('[data-drag-handle]') || 
        (e.target as HTMLElement).closest('[data-checkmark-button]')) {
      return;
    }
    if (taskId) {
      router.push(`/tasks/${taskId}`);
    }
  };

  const handleCheckmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAdvanceStatus && taskId && canAdvance) {
      onAdvanceStatus(taskId);
    }
  };

  return (
    <TooltipProvider>
      <Card 
        ref={setNodeRef}
        style={style}
        onClick={handleCardClick}
        className={`shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 cursor-pointer group relative ${
          isDragging ? 'shadow-2xl scale-105 ring-2 ring-blue-400 opacity-50' : ''
        } ${
          isOver ? 'ring-2 ring-green-400 bg-green-50/30 scale-102' : ''
        }`}
      >
        {/* Drag Handle - List View Only */}
        {isCompact && isDraggable && (
          <div
            {...attributes}
            {...listeners}
            data-drag-handle
            className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {/* Top bar with title and priority badge */}
        <div className={`flex items-start justify-between gap-3 border-b border-gray-100 ${
          isCompact ? 'px-3 py-2.5 pl-7' : 'p-4 pb-3'
        }`}
          {...(isDraggable && !isCompact ? { ...attributes, ...listeners } : {})}
        >
          <h3 className={`text-sm font-semibold text-gray-900 flex-1 group-hover:text-blue-600 transition-colors ${
            isCompact ? 'line-clamp-1 leading-tight' : 'line-clamp-2 leading-snug'
          }`}>
            {title}
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                className={`${priorityStyle.bg} ${priorityStyle.text} text-xs font-medium cursor-help transition-colors ${
                  isCompact ? 'px-2 py-0.5' : 'px-2.5 py-0.5'
                }`}
                variant="secondary"
              >
                {priorityStyle.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Priority: {priorityStyle.label}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <CardContent className={isCompact ? 'px-3 py-2.5 space-y-2' : 'p-4 space-y-3.5'}>
          {/* Assignee section with avatar */}
          <div className={`flex items-center ${isCompact ? 'gap-2' : 'gap-2.5'}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className={`cursor-help shadow-sm ${
                  isCompact ? 'h-6 w-6 border border-gray-200' : 'h-8 w-8 border-2 border-gray-200'
                }`}>
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                    {getInitials(assignedTo)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>Assigned to: {assignedTo}</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex flex-col min-w-0">
              <span className={`text-xs text-gray-900 truncate ${
                isCompact ? 'font-medium' : 'font-semibold'
              }`}>
                {assignedTo}
              </span>
              {assignedBy && (
                <span className={`text-xs text-gray-500 truncate ${
                  isCompact ? 'leading-tight' : ''
                }`}>
                  Assigned by {assignedBy}
                </span>
              )}
            </div>
          </div>

          {/* Due date with relative time */}
          <div className={`flex text-xs ${
            isCompact ? 'items-center gap-1.5' : 'items-start gap-2'
          }`}>
            <Calendar className={`shrink-0 ${
              isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5 mt-0.5'
            } ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
            <div className={`min-w-0 ${
              isCompact ? 'flex items-center gap-2' : 'flex flex-col'
            }`}>
              <span className={`font-medium truncate ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                {formattedDate}
              </span>
              {relativeDate && (
                <span className={`text-xs truncate ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                  {isCompact ? `• ${relativeDate}` : relativeDate}
                </span>
              )}
            </div>
          </div>

          {/* Project name */}
          <div className={`flex items-center text-xs text-gray-600 ${
            isCompact ? 'gap-1.5' : 'gap-2'
          }`}>
            <FolderKanban className={`text-gray-400 shrink-0 ${
              isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5'
            }`} />
            <span className="truncate">{projectName}</span>
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className={`flex flex-wrap ${isCompact ? 'gap-1' : 'gap-1.5 pt-0.5'}`}>
              {tags.slice(0, 5).map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={`text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors ${
                    isCompact ? 'px-1.5 py-0 h-4' : 'px-2 py-0 h-5'
                  }`}
                >
                  {tag}
                </Badge>
              ))}
              {tags.length > 5 && (
                <Badge
                  variant="outline"
                  className={`text-xs bg-gray-50 text-gray-600 border-gray-200 ${
                    isCompact ? 'px-1.5 py-0 h-4' : 'px-2 py-0 h-5'
                  }`}
                >
                  +{tags.length - 5}
                </Badge>
              )}
            </div>
          )}

          {/* Images */}
          {images && images.length > 0 && (
            <div className={`flex flex-wrap ${isCompact ? 'gap-1' : 'mt-2 gap-1.5'}`}>
              {images.slice(0, 3).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Attachment ${idx + 1}`}
                  className={`object-cover rounded border border-gray-200 hover:border-gray-300 transition-colors ${
                    isCompact ? 'w-8 h-8' : 'w-11 h-11'
                  }`}
                />
              ))}
              {images.length > 3 && (
                <div className={`flex items-center justify-center bg-gray-100 border border-gray-200 rounded text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors ${
                  isCompact ? 'w-8 h-8' : 'w-11 h-11'
                }`}>
                  +{images.length - 3}
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Checkmark Button - Bottom Right */}
        {canAdvance && onAdvanceStatus && (
          <div className="absolute bottom-2 right-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  data-checkmark-button
                  onClick={handleCheckmarkClick}
                  className="h-8 w-8 p-0 rounded-full bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 transition-all hover:scale-110 shadow-sm hover:shadow-md group/check"
                >
                  <CheckCircle className="h-5 w-5 text-green-600 group-hover/check:text-green-700" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-green-600 text-white border-green-700">
                <p className="text-xs font-medium">
                  {status === 'new' && 'Mark as In Progress'}
                  {status === 'in_progress' && 'Mark as Completed'}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}
