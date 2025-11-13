"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  User,
  Mail,
  Shield,
  Calendar,
  Briefcase,
  ListTodo,
  Clock,
  DollarSign,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: number;
  name: string | null;
  email: string;
  role: string;
  hourlyRate: number;
  isActive: boolean;
  createdAt: Date;
  organizationId: number;
  organization: {
    name: string;
  };
}

interface ProjectWithTasks {
  id: number;
  name: string;
  code: string | null;
  status: string;
  roleInProject: string | null;
  tasks: Array<{
    id: number;
    title: string;
    status: string;
    priority: number;
    dueDate: Date | null;
    hoursLogged: number;
  }>;
}

const getRoleBadgeColor = (role: string) => {
  const roleColors: Record<string, string> = {
    admin: "bg-red-500",
    manager: "bg-blue-500",
    finance: "bg-green-500",
    member: "bg-gray-500",
  };
  return roleColors[role.toLowerCase()] || "bg-gray-500";
};

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    new: "bg-blue-500",
    in_progress: "bg-yellow-500",
    in_review: "bg-purple-500",
    blocked: "bg-red-500",
    completed: "bg-green-500",
    planned: "bg-blue-500",
    active: "bg-green-500",
    on_hold: "bg-orange-500",
    cancelled: "bg-red-500",
  };
  return statusMap[status.toLowerCase()] || "bg-gray-500";
};

const getPriorityColor = (priority: number) => {
  const priorityMap: Record<number, string> = {
    1: "bg-gray-500",
    2: "bg-blue-500",
    3: "bg-orange-500",
    4: "bg-red-500",
  };
  return priorityMap[priority] || "bg-gray-500";
};

const getPriorityLabel = (priority: number) => {
  const priorityMap: Record<number, string> = {
    1: "Low",
    2: "Medium",
    3: "High",
    4: "Critical",
  };
  return priorityMap[priority] || "Unknown";
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (userId && currentUser?.organizationId) {
      fetchUserProfile();
      fetchUserProjects();
    }
  }, [userId, currentUser?.organizationId]);

  const fetchUserProfile = async () => {
    if (!currentUser?.organizationId) return;
    
    try {
      const response = await fetch(
        `/api/users/${userId}?organizationId=${currentUser.organizationId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await response.json();
      setUserProfile(data.data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    }
  };

  const fetchUserProjects = async () => {
    if (!currentUser?.organizationId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/users/${userId}/projects?organizationId=${currentUser.organizationId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user projects");
      }

      const data = await response.json();
      setProjects(data.data);
    } catch (error) {
      console.error("Error fetching user projects:", error);
      toast({
        title: "Error",
        description: "Failed to load user projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while waiting for user or data
  if (!currentUser || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!userProfile && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The user profile you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const totalTasks = projects.reduce((sum, project) => sum + project.tasks.length, 0);
  const completedTasks = projects.reduce(
    (sum, project) =>
      sum + project.tasks.filter((task) => task.status === "completed").length,
    0
  );
  const totalHoursLogged = projects.reduce(
    (sum, project) =>
      sum + project.tasks.reduce((taskSum, task) => taskSum + task.hoursLogged, 0),
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
              {userProfile?.name
                ? userProfile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : userProfile?.email[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#0A1931]">
                {userProfile?.name || "User Profile"}
              </h1>
              <p className="mt-1 text-[#4A7FA7] flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {userProfile?.email}
              </p>
            </div>
          </div>
          <div>
            <Badge className={getRoleBadgeColor(userProfile?.role || "member")}>
              {userProfile?.role || "member"}
            </Badge>
          </div>
        </div>
      </div>

      {/* User Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>Organization</span>
              </div>
              <p className="font-medium">{userProfile?.organization.name}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Role</span>
              </div>
              <Badge className={getRoleBadgeColor(userProfile?.role || "member")}>
                {userProfile?.role || "member"}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Hourly Rate</span>
              </div>
              <p className="font-medium">
                {formatCurrency(Number(userProfile?.hourlyRate || 0))}/hr
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Member Since</span>
              </div>
              <p className="font-medium">
                {userProfile?.createdAt
                  ? format(new Date(userProfile.createdAt), "MMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Projects</p>
              <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Total Tasks</p>
              <p className="text-3xl font-bold text-purple-600">{totalTasks}</p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completedTasks}</p>
            </div>

            <div className="text-center p-6 bg-orange-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Hours Logged</p>
              <p className="text-3xl font-bold text-orange-600">
                {totalHoursLogged.toFixed(1)}h
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects and Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Projects & Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mb-4 opacity-20" />
              <p>No projects assigned to this user</p>
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3
                          className="text-lg font-semibold cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          {project.name}
                        </h3>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        {project.roleInProject && (
                          <Badge variant="outline">{project.roleInProject}</Badge>
                        )}
                      </div>
                      {project.code && (
                        <p className="text-sm text-muted-foreground">
                          Code: <span className="font-mono">{project.code}</span>
                        </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {project.tasks.length} task{project.tasks.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {project.tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tasks assigned in this project
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {project.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => router.push(`/tasks/${task.id}`)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{task.title}</h4>
                              <Badge className={getStatusColor(task.status)} variant="secondary">
                                {task.status.replace(/_/g, " ")}
                              </Badge>
                              <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                {getPriorityLabel(task.priority)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {task.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                                </div>
                              )}
                              {task.hoursLogged > 0 && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {task.hoursLogged}h logged
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
