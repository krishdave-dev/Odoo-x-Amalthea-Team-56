"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Clock, Tag, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskDetailSidebar } from "@/components/MainPages/Task/TaskDetailSidebar";

// Priority configuration
const priorityConfig = {
  low: { bg: "bg-gray-100", text: "text-gray-700", label: "Low Priority" },
  medium: { bg: "bg-blue-100", text: "text-blue-700", label: "Medium Priority" },
  high: { bg: "bg-orange-100", text: "text-orange-700", label: "High Priority" },
  urgent: { bg: "bg-red-100", text: "text-red-700", label: "Urgent" },
};

// Status configuration
const statusConfig = {
  new: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  in_progress: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  completed: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
};

// Mock task data
const getMockTask = (id: string) => ({
  id: parseInt(id),
  title: "Implement User Authentication System",
  description: "Build a comprehensive authentication system with JWT tokens, refresh token rotation, password reset functionality, and email verification. Ensure proper security measures are in place including rate limiting and session management.",
  status: "in_progress" as const,
  priority: "high" as const,
  assignedTo: "Krish Dave",
  assignedBy: "Chhaya Patel",
  dueDate: "2025-11-20",
  createdAt: "2025-11-10T09:00:00Z",
  updatedAt: "2025-11-13T14:30:00Z",
  projectName: "OneFlow Platform",
  tags: ["Backend", "Security", "Authentication", "High Priority"],
  estimateHours: 24,
  hoursLogged: 12.5,
  collaborativeLink: "https://github.com/krishdave-dev/Odoo-x-Amalthea-Team-56", // Mock collaborative link
});

// Helper function to format date
function formatDate(dateStr: string): { formatted: string; isOverdue: boolean } {
  const date = new Date(dateStr);
  const now = new Date();
  
  const formatted = date.toLocaleDateString('en-US', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  
  const isOverdue = date < now;
  
  return { formatted, isOverdue };
}

// Helper function for relative time
function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Get initials
function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const task = getMockTask(taskId);
  const priorityStyle = priorityConfig[task.priority];
  const statusStyle = statusConfig[task.status];
  const { formatted: formattedDueDate, isOverdue } = formatDate(task.dueDate);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/task')}
            className="gap-2 hover:bg-blue-500 hover:border-blue-300 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Board
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <Badge variant="secondary" className="text-xs">
            Task #{task.id}
          </Badge>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Section - Task Overview (70%) */}
          <div className="lg:col-span-2">
            {/* Task Header Card */}
            <Card className="shadow-lg border-gray-200 h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
              <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-white to-blue-50/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <CardTitle className="text-2xl font-bold text-gray-900 leading-tight">
                      {task.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        className={`${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border} text-xs font-semibold`}
                        variant="outline"
                      >
                        {task.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge 
                        className={`${priorityStyle.bg} ${priorityStyle.text} text-xs font-semibold`}
                      >
                        {priorityStyle.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-blue-500" />
                    Description
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {task.description}
                  </p>
                </div>

                {/* Task Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  {/* Assignee */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Assigned To</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border-2 border-blue-200">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                            {getInitials(task.assignedTo)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{task.assignedTo}</p>
                          <p className="text-xs text-gray-500">by {task.assignedBy}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-green-50'}`}>
                      <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-600' : 'text-green-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Due Date</p>
                      <p className={`text-sm font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {formattedDueDate}
                      </p>
                      {isOverdue && (
                        <p className="text-xs text-red-500 font-medium">Overdue</p>
                      )}
                    </div>
                  </div>

                  {/* Time Tracking */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-purple-50">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Time Tracking</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {task.hoursLogged}h / {task.estimateHours}h
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-purple-600 h-1.5 rounded-full transition-all" 
                          style={{ width: `${Math.min((task.hoursLogged / task.estimateHours) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-50">
                      <Tag className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Project</p>
                      <p className="text-sm font-semibold text-gray-900">{task.projectName}</p>
                    </div>
                  </div>

                  {/* Collaborative Link */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Link2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">Collaborative Link</p>
                      {task.collaborativeLink ? (
                        <a
                          href={task.collaborativeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                        >
                          <span className="truncate max-w-[200px]">
                            {task.collaborativeLink.includes('github') ? 'View Repository' : 
                             task.collaborativeLink.includes('docs.google') ? 'Open Doc' :
                             task.collaborativeLink.includes('notion') ? 'View Notion' :
                             'View Link'}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No collaborative link added</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {task.tags && task.tags.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-purple-500" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Created:</span> {getRelativeTime(task.createdAt)}
                  </div>
                  <div className="h-3 w-px bg-gray-300" />
                  <div>
                    <span className="font-medium">Last updated:</span> {getRelativeTime(task.updatedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Activity & Comments (30%) */}
          <div className="lg:col-span-1 sticky top-6 self-start">
            <TaskDetailSidebar taskTitle={task.title} taskId={task.id} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
