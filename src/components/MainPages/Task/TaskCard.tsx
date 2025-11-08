import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, AlertCircle } from "lucide-react";

interface TaskCardProps {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assignedTo: string;
  dueDate: string;
  projectName: string;
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  high: "bg-red-500/10 text-red-700 border-red-500/20",
};

export function TaskCard({
  title,
  description,
  priority,
  assignedTo,
  dueDate,
  projectName,
}: TaskCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{title}</CardTitle>
          <Badge className={priorityColors[priority]} variant="outline">
            {priority}
          </Badge>
        </div>
        <CardDescription className="text-sm line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>{projectName}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{assignedTo}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{dueDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
