import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";

interface ProjectCardProps {
  title: string;
  description: string;
  status: "active" | "completed" | "planning";
  teamMembers: number;
  dueDate: string;
  tasksCompleted: number;
  totalTasks: number;
}

const statusColors = {
  active: "bg-green-500/10 text-green-700 border-green-500/20",
  completed: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  planning: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
};

export function ProjectCard({
  title,
  description,
  status,
  teamMembers,
  dueDate,
  tasksCompleted,
  totalTasks,
}: ProjectCardProps) {
  const progress = (tasksCompleted / totalTasks) * 100;

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <Badge className={statusColors[status]} variant="outline">
            {status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {tasksCompleted}/{totalTasks} tasks
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{teamMembers} members</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{dueDate}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
