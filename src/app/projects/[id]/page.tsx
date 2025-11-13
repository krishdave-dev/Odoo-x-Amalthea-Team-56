"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  ShoppingCart,
  Receipt,
  DollarSign,
  Loader2,
  ExternalLink,
  AlertCircle,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ListTodo,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Users,
  TrendingUp,
  Target,
  Code,
  Flag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateSalesOrderDialog } from "@/components/MainPages/Project/CreateSalesOrderDialog";
import { CreatePurchaseOrderDialog } from "@/components/MainPages/Project/CreatePurchaseOrderDialog";
import { CreateCustomerInvoiceDialog } from "@/components/MainPages/Project/CreateCustomerInvoiceDialog";
import { CreateVendorBillDialog } from "@/components/MainPages/Project/CreateVendorBillDialog";
import { CreateExpenseDialog } from "@/components/MainPages/Project/CreateExpenseDialog";
import { CreateExpenseChoiceDialog } from "@/components/MainPages/ExpenseOCR/CreateExpenseChoiceDialog";
import { OcrExpenseDialog } from "@/components/MainPages/ExpenseOCR/OcrExpenseDialog";
import { CreateTaskDialog } from "@/components/MainPages/Project/CreateTaskDialog";
import { useAuth } from "@/contexts/AuthContext";

interface ProjectLinks {
  tasks: Array<{
    id: number;
    title: string;
    status: string;
    priority: number;
    assignee?: {
      id: number;
      name: string | null;
    } | null;
    dueDate: Date | null;
    hoursLogged: number;
  }>;
  salesOrders: Array<{
    id: number;
    soNumber: string;
    partnerName: string | null;
    totalAmount: number;
    status: string;
    orderDate: Date;
  }>;
  purchaseOrders: Array<{
    id: number;
    poNumber: string;
    vendorName: string | null;
    totalAmount: number;
    status: string;
    orderDate: Date;
  }>;
  invoices: Array<{
    id: number;
    invoiceNumber: string;
    amount: number;
    status: string;
    invoiceDate: Date;
    salesOrder?: {
      id: number;
      soNumber: string;
    } | null;
  }>;
  bills: Array<{
    id: number;
    vendorName: string | null;
    amount: number;
    status: string;
    billDate: Date;
    purchaseOrder?: {
      id: number;
      poNumber: string;
    } | null;
  }>;
  expenses: Array<{
    id: number;
    amount: number;
    billable: boolean;
    status: string;
    note: string | null;
    user: {
      id: number;
      name: string | null;
    } | null;
    createdAt: Date;
  }>;
}

interface Project {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  organizationId: number;
  projectManagerId: number | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  budget: number | null;
  cachedHoursLogged: number;
  cachedCost: number;
  cachedRevenue: number;
  cachedProfit: number;
  progressPct: number;
  createdAt: Date;
  updatedAt: Date;
  projectManager?: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  members?: Array<{
    user: {
      id: number;
      name: string | null;
      email: string;
    };
    roleInProject: string | null;
  }>;
  _count?: {
    tasks: number;
    members: number;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "bg-yellow-500",
    submitted: "bg-yellow-500",
    confirmed: "bg-blue-500",
    sent: "bg-blue-500",
    approved: "bg-green-500",
    paid: "bg-green-500",
    invoiced: "bg-green-500",
    billed: "bg-green-500",
    rejected: "bg-red-500",
    cancelled: "bg-red-500",
    // Task statuses
    new: "bg-blue-500",
    in_progress: "bg-yellow-500",
    in_review: "bg-purple-500",
    blocked: "bg-red-500",
    completed: "bg-green-500",
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

const getProjectStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    planned: "bg-blue-500",
    active: "bg-green-500",
    in_progress: "bg-yellow-500",
    on_hold: "bg-orange-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
  };
  return statusMap[status.toLowerCase()] || "bg-gray-500";
};

const getProjectStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    planned: "Planned",
    active: "Active",
    in_progress: "In Progress",
    on_hold: "On Hold",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return statusMap[status.toLowerCase()] || status;
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);

  const [project, setProject] = useState<Project | null>(null);
  const [links, setLinks] = useState<ProjectLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createSOOpen, setCreateSOOpen] = useState(false);
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [createBillOpen, setCreateBillOpen] = useState(false);
  const [createExpenseOpen, setCreateExpenseOpen] = useState(false);
  const [createExpenseChoiceOpen, setCreateExpenseChoiceOpen] = useState(false);
  const [createExpenseOcrOpen, setCreateExpenseOcrOpen] = useState(false);

  // Task filtering and pagination state
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>("all");
  const [taskPage, setTaskPage] = useState(1);
  const tasksPerPage = 5;

  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user can manage finance documents (admin, manager, finance)
  const canManageFinance =
    user?.role === "admin" ||
    user?.role === "manager" ||
    user?.role === "finance";

  // Check if user can approve expenses (admin, manager)
  const canApproveExpenses = user?.role === "admin" || user?.role === "manager";

  // Check if user can create tasks (admin, manager)
  const canCreateTasks = user?.role === "admin" || user?.role === "manager";

  useEffect(() => {
    if (projectId && user?.organizationId) {
      fetchProjectDetails();
      fetchProjectLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user?.organizationId]);

  const fetchProjectDetails = async () => {
    if (!user?.organizationId) return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}?organizationId=${user.organizationId}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch project details");
      }

      const data = await response.json();
      setProject(data.data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    }
  };

  const fetchProjectLinks = async () => {
    if (!user?.organizationId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/links?organizationId=${user.organizationId}&include=tasks,salesOrders,purchaseOrders,invoices,bills,expenses&limit=100`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch project links");
      }

      const data = await response.json();
      setLinks(data.data.links);
    } catch (error) {
      console.error("Error fetching project links:", error);
      toast({
        title: "Error",
        description: "Failed to load project financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and paginate tasks
  const filteredTasks = React.useMemo(() => {
    if (!links?.tasks) return [];

    return links.tasks.filter((task) => {
      // Search filter
      const matchesSearch = task.title
        .toLowerCase()
        .includes(taskSearchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        taskStatusFilter === "all" || task.status === taskStatusFilter;

      // Priority filter
      const matchesPriority =
        taskPriorityFilter === "all" ||
        task.priority.toString() === taskPriorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [links?.tasks, taskSearchQuery, taskStatusFilter, taskPriorityFilter]);

  // Paginate tasks
  const paginatedTasks = React.useMemo(() => {
    const startIndex = (taskPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    return filteredTasks.slice(startIndex, endIndex);
  }, [filteredTasks, taskPage, tasksPerPage]);

  const totalTaskPages = Math.ceil(filteredTasks.length / tasksPerPage);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setTaskPage(1);
  }, [taskSearchQuery, taskStatusFilter, taskPriorityFilter]);

  // Show loading while waiting for user or data
  if (!user || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The project you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

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
          Back to Projects
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight text-[#0A1931]">
                {project?.name || "Loading..."}
              </h1>
              {project?.status && (
                <Badge className={getProjectStatusColor(project.status)}>
                  {getProjectStatusLabel(project.status)}
                </Badge>
              )}
            </div>
            {project?.code && (
              <p className="text-sm text-muted-foreground mb-1">
                Project Code:{" "}
                <span className="font-mono font-medium">{project.code}</span>
              </p>
            )}
            {project?.description && (
              <p className="mt-2 text-[#4A7FA7]">{project.description}</p>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : links ? (
        <>
          {/* Project Details Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Project Manager */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Project Manager</span>
                  </div>
                  <p className="font-medium">
                    {project?.projectManager?.name ||
                      project?.projectManager?.email ||
                      "Unassigned"}
                  </p>
                </div>

                {/* Team Size */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Team Members</span>
                  </div>
                  <p className="font-medium">
                    {project?._count?.members || project?.members?.length || 0}{" "}
                    members
                  </p>
                </div>

                {/* Created Date */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created</span>
                  </div>
                  <p className="font-medium">
                    {project?.createdAt
                      ? format(new Date(project.createdAt), "MMM dd, yyyy")
                      : "N/A"}
                  </p>
                </div>

                {/* Task Count */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ListTodo className="h-4 w-4" />
                    <span>Total Tasks</span>
                  </div>
                  <p className="font-medium">
                    {project?._count?.tasks || links.tasks.length} tasks
                  </p>
                </div>

                {/* Start Date */}
                {project?.startDate && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Flag className="h-4 w-4" />
                      <span>Start Date</span>
                    </div>
                    <p className="font-medium">
                      {format(new Date(project.startDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                )}

                {/* End Date / Deadline */}
                {project?.endDate && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Deadline</span>
                    </div>
                    <p className="font-medium">
                      {format(new Date(project.endDate), "MMM dd, yyyy")}
                    </p>
                  </div>
                )}

                {/* Progress Percentage */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Progress</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{project?.progressPct || 0}%</p>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${project?.progressPct || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Hours Logged */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Hours Logged</span>
                  </div>
                  <p className="font-medium">
                    {Number(project?.cachedHoursLogged || 0).toFixed(1)}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Overview */}
          {project?.budget && Number(project.budget) > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Budget */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Total Budget
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(Number(project.budget))}
                    </p>
                  </div>

                  {/* Spent */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Spent</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(Number(project.cachedCost || 0))}
                    </p>
                  </div>

                  {/* Remaining */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        Number(project.budget) - Number(project.cachedCost || 0)
                      )}
                    </p>
                  </div>

                  {/* Budget Progress */}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Budget Utilized
                    </p>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {Math.round(
                          (Number(project.cachedCost || 0) /
                            Number(project.budget)) *
                            100
                        )}
                        %
                      </p>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            Number(project.cachedCost || 0) /
                              Number(project.budget) >
                            1
                              ? "bg-red-600"
                              : Number(project.cachedCost || 0) /
                                  Number(project.budget) >
                                0.8
                              ? "bg-amber-600"
                              : "bg-blue-600"
                          }`}
                          style={{
                            width: `${Math.min(
                              (Number(project.cachedCost || 0) /
                                Number(project.budget)) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(
                      links.salesOrders.reduce(
                        (sum, so) => sum + so.totalAmount,
                        0
                      ) +
                        links.expenses
                          .filter(
                            (exp) =>
                              exp.billable &&
                              (exp.status === "approved" ||
                                exp.status === "paid")
                          )
                          .reduce((sum, exp) => sum + exp.amount, 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {links.salesOrders.length} Sales Orders +{" "}
                    {
                      links.expenses.filter(
                        (e) =>
                          e.billable &&
                          (e.status === "approved" || e.status === "paid")
                      ).length
                    }{" "}
                    Billable Expenses
                  </p>
                </div>
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Costs
                  </p>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(
                      links.purchaseOrders.reduce(
                        (sum, po) => sum + po.totalAmount,
                        0
                      ) +
                        links.bills.reduce(
                          (sum, bill) => sum + bill.amount,
                          0
                        ) +
                        links.expenses
                          .filter(
                            (exp) =>
                              !exp.billable &&
                              (exp.status === "approved" ||
                                exp.status === "paid")
                          )
                          .reduce((sum, exp) => sum + exp.amount, 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {links.purchaseOrders.length} POs + {links.bills.length}{" "}
                    Bills +{" "}
                    {
                      links.expenses.filter(
                        (e) =>
                          !e.billable &&
                          (e.status === "approved" || e.status === "paid")
                      ).length
                    }{" "}
                    Non-billable Expenses
                  </p>
                </div>
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Net Profit
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      links.salesOrders.reduce(
                        (sum, so) => sum + so.totalAmount,
                        0
                      ) +
                        links.expenses
                          .filter(
                            (exp) =>
                              exp.billable &&
                              (exp.status === "approved" ||
                                exp.status === "paid")
                          )
                          .reduce((sum, exp) => sum + exp.amount, 0) -
                        (links.purchaseOrders.reduce(
                          (sum, po) => sum + po.totalAmount,
                          0
                        ) +
                          links.bills.reduce(
                            (sum, bill) => sum + bill.amount,
                            0
                          ) +
                          links.expenses
                            .filter(
                              (exp) =>
                                !exp.billable &&
                                (exp.status === "approved" ||
                                  exp.status === "paid")
                            )
                            .reduce((sum, exp) => sum + exp.amount, 0)) >=
                      0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(
                      links.salesOrders.reduce(
                        (sum, so) => sum + so.totalAmount,
                        0
                      ) +
                        links.expenses
                          .filter(
                            (exp) =>
                              exp.billable &&
                              (exp.status === "approved" ||
                                exp.status === "paid")
                          )
                          .reduce((sum, exp) => sum + exp.amount, 0) -
                        (links.purchaseOrders.reduce(
                          (sum, po) => sum + po.totalAmount,
                          0
                        ) +
                          links.bills.reduce(
                            (sum, bill) => sum + bill.amount,
                            0
                          ) +
                          links.expenses
                            .filter(
                              (exp) =>
                                !exp.billable &&
                                (exp.status === "approved" ||
                                  exp.status === "paid")
                            )
                            .reduce((sum, exp) => sum + exp.amount, 0))
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Revenue - Costs
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          {project?.members && project.members.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({project.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.members.map((member) => (
                    <div
                      key={member.user.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {member.user.name
                          ? member.user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : member.user.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.user.name || member.user.email}
                        </p>
                        {member.roleInProject && (
                          <p className="text-xs text-muted-foreground">
                            {member.roleInProject}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-6 mb-6">
                  <TabsTrigger
                    value="tasks"
                    className="flex items-center gap-2"
                  >
                    <ListTodo className="h-4 w-4" />
                    <span className="hidden sm:inline">Tasks</span>
                    <Badge variant="secondary" className="ml-1">
                      {links.tasks.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="salesOrders"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Sales Orders</span>
                    <Badge variant="secondary" className="ml-1">
                      {links.salesOrders.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="purchaseOrders"
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="hidden sm:inline">Purchase Orders</span>
                    <Badge variant="secondary" className="ml-1">
                      {links.purchaseOrders.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="invoices"
                    className="flex items-center gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    <span className="hidden sm:inline">Invoices</span>
                    <Badge variant="secondary" className="ml-1">
                      {links.invoices.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="bills"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Bills</span>
                    <Badge variant="secondary" className="ml-1">
                      {links.bills.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="expenses"
                    className="flex items-center gap-2"
                  >
                    <Receipt className="h-4 w-4" />
                    <span className="hidden sm:inline">Expenses</span>
                    <Badge variant="secondary" className="ml-1">
                      {links.expenses.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {/* Tasks */}
                <TabsContent value="tasks">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Tasks ({filteredTasks.length})
                    </h3>
                    {canCreateTasks && (
                      <Button onClick={() => setCreateTaskOpen(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task
                      </Button>
                    )}
                  </div>

                  {/* Search and Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tasks..."
                        value={taskSearchQuery}
                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select
                      value={taskStatusFilter}
                      onValueChange={setTaskStatusFilter}
                    >
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          <SelectValue placeholder="Filter by status" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={taskPriorityFilter}
                      onValueChange={setTaskPriorityFilter}
                    >
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          <SelectValue placeholder="Filter by priority" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">High</SelectItem>
                        <SelectItem value="4">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <ListTodo className="h-12 w-12 mb-4 opacity-20" />
                      <p>
                        {links.tasks.length === 0
                          ? "No tasks in this project"
                          : "No tasks match your filters"}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {paginatedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => router.push(`/tasks/${task.id}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">
                                    {task.title}
                                  </h4>
                                  <Badge
                                    className={getStatusColor(task.status)}
                                  >
                                    {task.status.replace(/_/g, " ")}
                                  </Badge>
                                  <Badge
                                    className={getPriorityColor(task.priority)}
                                  >
                                    {getPriorityLabel(task.priority)}
                                  </Badge>
                                </div>
                                {task.assignee && (
                                  <p className="text-sm text-muted-foreground">
                                    Assigned to:{" "}
                                    {task.assignee.name || "Unknown User"}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {task.dueDate && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Due:{" "}
                                      {format(
                                        new Date(task.dueDate),
                                        "MMM dd, yyyy"
                                      )}
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalTaskPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-muted-foreground">
                            Showing {(taskPage - 1) * tasksPerPage + 1} to{" "}
                            {Math.min(
                              taskPage * tasksPerPage,
                              filteredTasks.length
                            )}{" "}
                            of {filteredTasks.length} tasks
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTaskPage(taskPage - 1)}
                              disabled={taskPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4 mr-1" />
                              Previous
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from(
                                { length: totalTaskPages },
                                (_, i) => i + 1
                              ).map((page) => (
                                <Button
                                  key={page}
                                  variant={
                                    page === taskPage ? "default" : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setTaskPage(page)}
                                  className="w-10"
                                >
                                  {page}
                                </Button>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setTaskPage(taskPage + 1)}
                              disabled={taskPage === totalTaskPages}
                            >
                              Next
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* Sales Orders */}
                <TabsContent value="salesOrders">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Sales Orders</h3>
                    {canManageFinance && (
                      <Button onClick={() => setCreateSOOpen(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Sales Order
                      </Button>
                    )}
                  </div>
                  {links.salesOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-20" />
                      <p>No sales orders linked to this project</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.salesOrders.map((so) => (
                        <div
                          key={so.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{so.soNumber}</h4>
                                <Badge className={getStatusColor(so.status)}>
                                  {so.status}
                                </Badge>
                              </div>
                              {so.partnerName && (
                                <p className="text-sm text-muted-foreground">
                                  Customer: {so.partnerName}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Date:{" "}
                                {format(new Date(so.orderDate), "MMM dd, yyyy")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {formatCurrency(so.totalAmount)}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Purchase Orders */}
                <TabsContent value="purchaseOrders">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Purchase Orders</h3>
                    {canManageFinance && (
                      <Button onClick={() => setCreatePOOpen(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Purchase Order
                      </Button>
                    )}
                  </div>
                  {links.purchaseOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                      <p>No purchase orders linked to this project</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.purchaseOrders.map((po) => (
                        <div
                          key={po.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{po.poNumber}</h4>
                                <Badge className={getStatusColor(po.status)}>
                                  {po.status}
                                </Badge>
                              </div>
                              {po.vendorName && (
                                <p className="text-sm text-muted-foreground">
                                  Vendor: {po.vendorName}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Date:{" "}
                                {format(new Date(po.orderDate), "MMM dd, yyyy")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {formatCurrency(po.totalAmount)}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Customer Invoices */}
                <TabsContent value="invoices">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Customer Invoices</h3>
                    {canManageFinance && (
                      <Button
                        onClick={() => setCreateInvoiceOpen(true)}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Button>
                    )}
                  </div>
                  {links.invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Receipt className="h-12 w-12 mb-4 opacity-20" />
                      <p>No customer invoices linked to this project</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.invoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {invoice.invoiceNumber}
                                </h4>
                                <Badge
                                  className={getStatusColor(invoice.status)}
                                >
                                  {invoice.status}
                                </Badge>
                              </div>
                              {invoice.salesOrder && (
                                <p className="text-sm text-muted-foreground">
                                  Linked to SO: {invoice.salesOrder.soNumber}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Date:{" "}
                                {format(
                                  new Date(invoice.invoiceDate),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {formatCurrency(invoice.amount)}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Vendor Bills */}
                <TabsContent value="bills">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Vendor Bills</h3>
                    {canManageFinance && (
                      <Button onClick={() => setCreateBillOpen(true)} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Bill
                      </Button>
                    )}
                  </div>
                  {links.bills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mb-4 opacity-20" />
                      <p>No vendor bills linked to this project</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.bills.map((bill) => (
                        <div
                          key={bill.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {bill.vendorName || "Unknown Vendor"}
                                </h4>
                                <Badge className={getStatusColor(bill.status)}>
                                  {bill.status}
                                </Badge>
                              </div>
                              {bill.purchaseOrder && (
                                <p className="text-sm text-muted-foreground">
                                  Linked to PO: {bill.purchaseOrder.poNumber}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Date:{" "}
                                {format(
                                  new Date(bill.billDate),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                {formatCurrency(bill.amount)}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Expenses */}
                <TabsContent value="expenses">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Expenses</h3>
                    <Button
                      onClick={() => {
                        // All roles: show choice between custom and OCR
                        setCreateExpenseChoiceOpen(true);
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Expense
                    </Button>
                  </div>
                  {links.expenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Receipt className="h-12 w-12 mb-4 opacity-20" />
                      <p>No expenses linked to this project</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {links.expenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {expense.user?.name || "Unknown User"}
                                </h4>
                                <Badge
                                  className={getStatusColor(expense.status)}
                                >
                                  {expense.status}
                                </Badge>
                                {expense.billable && (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50"
                                  >
                                    Billable
                                  </Badge>
                                )}
                              </div>
                              {expense.note && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {expense.note}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {format(
                                  new Date(expense.createdAt),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <p className="text-lg font-bold">
                                {formatCurrency(expense.amount)}
                              </p>
                              {canApproveExpenses &&
                                expense.status === "submitted" && (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(
                                            `/api/expenses/${expense.id}/approve?organizationId=${user?.organizationId}`,
                                            { method: "POST" }
                                          );
                                          if (!response.ok)
                                            throw new Error(
                                              "Failed to approve"
                                            );
                                          toast({
                                            title: "Success",
                                            description: "Expense approved",
                                          });
                                          fetchProjectLinks();
                                        } catch {
                                          toast({
                                            title: "Error",
                                            description:
                                              "Failed to approve expense",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(
                                            `/api/expenses/${expense.id}/reject?organizationId=${user?.organizationId}`,
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                reason: "Rejected by manager",
                                              }),
                                            }
                                          );
                                          if (!response.ok)
                                            throw new Error("Failed to reject");
                                          toast({
                                            title: "Success",
                                            description: "Expense rejected",
                                          });
                                          fetchProjectLinks();
                                        } catch {
                                          toast({
                                            title: "Error",
                                            description:
                                              "Failed to reject expense",
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              {(expense.status === "approved" ||
                                expense.status === "paid" ||
                                expense.status === "rejected" ||
                                expense.status === "draft") && (
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
          <p>Failed to load project details</p>
        </div>
      )}

      {/* Create Dialogs */}
      {project && user && (
        <>
          {/* Member-only choice dialog */}
          <CreateExpenseChoiceDialog
            open={createExpenseChoiceOpen}
            onOpenChange={setCreateExpenseChoiceOpen}
            onChoose={(mode) => {
              setCreateExpenseChoiceOpen(false);
              if (mode === "custom") {
                setCreateExpenseOpen(true);
              } else {
                setCreateExpenseOcrOpen(true);
              }
            }}
          />

          <CreateSalesOrderDialog
            open={createSOOpen}
            onOpenChange={setCreateSOOpen}
            projectId={projectId}
            organizationId={user.organizationId}
            onSuccess={fetchProjectLinks}
          />

          <CreatePurchaseOrderDialog
            open={createPOOpen}
            onOpenChange={setCreatePOOpen}
            projectId={projectId}
            organizationId={user.organizationId}
            onSuccess={fetchProjectLinks}
          />

          <CreateCustomerInvoiceDialog
            open={createInvoiceOpen}
            onOpenChange={setCreateInvoiceOpen}
            projectId={projectId}
            organizationId={user.organizationId}
            userId={user.id}
            salesOrders={links?.salesOrders.map((so) => ({
              id: so.id,
              soNumber: so.soNumber,
              totalAmount: so.totalAmount,
            }))}
            onSuccess={fetchProjectLinks}
          />

          <CreateVendorBillDialog
            open={createBillOpen}
            onOpenChange={setCreateBillOpen}
            projectId={projectId}
            organizationId={user.organizationId}
            userId={user.id}
            purchaseOrders={links?.purchaseOrders.map((po) => ({
              id: po.id,
              poNumber: po.poNumber,
              vendorName: po.vendorName || undefined,
              totalAmount: po.totalAmount,
            }))}
            onSuccess={fetchProjectLinks}
          />

          <CreateExpenseDialog
            open={createExpenseOpen}
            onOpenChange={setCreateExpenseOpen}
            projectId={projectId}
            organizationId={user.organizationId}
            userId={user.id}
            userRole={user.role}
            onSuccess={fetchProjectLinks}
          />

          {/* OCR flow dialog (member feature) */}
          <OcrExpenseDialog
            open={createExpenseOcrOpen}
            onOpenChange={setCreateExpenseOcrOpen}
            projectId={projectId}
            organizationId={user.organizationId}
            userId={user.id}
            onSuccess={fetchProjectLinks}
          />

          <CreateTaskDialog
            open={createTaskOpen}
            onOpenChange={setCreateTaskOpen}
            projectId={projectId}
            organizationId={user.organizationId}
            onSuccess={fetchProjectLinks}
          />
        </>
      )}
    </div>
  );
}
