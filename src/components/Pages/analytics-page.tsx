"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface AnalyticsData {
  totalProjects: number;
  tasksCompleted: number;
  totalHoursLogged: number;
  billableHours: number;
  nonBillableHours: number;
  projectProgress: Array<{ name: string; progress: number }>;
  resourceUtilization: Array<{
    name: string;
    utilized: number;
    available: number;
  }>;
  costVsRevenue: Array<{ project: string; cost: number; revenue: number }>;
}

export function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.organizationId) {
      setLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics?organizationId=${user.organizationId}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const ans = await response.json();

        console.log(ans);

        setAnalytics(ans.data);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user?.organizationId]);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      setDownloading(true);

      // Capture the content as an image
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(
        `analytics-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  const billablePercentage =
    analytics.totalHoursLogged > 0
      ? Math.round((analytics.billableHours / analytics.totalHoursLogged) * 100)
      : 0;

  const billableChartData = [
    { name: "Billable", value: analytics.billableHours, fill: "#1A3D63" },
    {
      name: "Non-billable",
      value: analytics.nonBillableHours,
      fill: "#4A7FA7",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0A1931]">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-[#4A7FA7]">
            Track project performance, resource utilization, and financial
            metrics
          </p>
        </div>
        <Button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Generating PDF..." : "Download PDF"}
        </Button>
      </div>

      {/* Content to be captured for PDF */}
      <div ref={contentRef}>
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#4A7FA7]">
                Total Projects
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[#1A3D63]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#0A1931]">
                {analytics.totalProjects}
              </div>
              <p className="text-xs text-[#4A7FA7] mt-1">Active projects</p>
            </CardContent>
          </Card>

          {/* Tasks Completed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#4A7FA7]">
                Tasks Completed
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#0A1931]">
                {analytics.tasksCompleted}
              </div>
              <p className="text-xs text-[#4A7FA7] mt-1">This period</p>
            </CardContent>
          </Card>

          {/* Total Hours */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#4A7FA7]">
                Hours Logged
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#0A1931]">
                {analytics.totalHoursLogged}
              </div>
              <p className="text-xs text-[#4A7FA7] mt-1">Total hours</p>
            </CardContent>
          </Card>

          {/* Billable Hours */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#4A7FA7]">
                Billable Hours
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#0A1931]">
                {analytics.billableHours}
              </div>
              <p className="text-xs text-[#4A7FA7] mt-1">
                {billablePercentage}% of total
              </p>
            </CardContent>
          </Card>

          {/* Non-billable Hours */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#4A7FA7]">
                Non-billable Hours
              </CardTitle>
              <Users className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#0A1931]">
                {analytics.nonBillableHours}
              </div>
              <p className="text-xs text-[#4A7FA7] mt-1">
                {100 - billablePercentage}% of total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Billable vs Non-billable Hours Pie Chart */}
          <Card data-chart="true">
            <CardHeader>
              <CardTitle className="text-[#0A1931]">
                Billable vs Non-billable Hours
              </CardTitle>
              <CardDescription className="text-[#4A7FA7]">
                Distribution of billable hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={billableChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {billableChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value}h`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Progress Chart */}
          <Card data-chart="true">
            <CardHeader>
              <CardTitle className="text-[#0A1931]">
                Project Progress %
              </CardTitle>
              <CardDescription className="text-[#4A7FA7]">
                Completion status by project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics.projectProgress}
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12, fill: "#4A7FA7" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    label={{
                      value: "Progress %",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#4A7FA7",
                    }}
                    tick={{ fill: "#4A7FA7" }}
                  />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="progress" fill="#1A3D63" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Resource Utilization Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card data-chart="true">
            <CardHeader>
              <CardTitle className="text-[#0A1931]">
                Resource Utilization
              </CardTitle>
              <CardDescription className="text-[#4A7FA7]">
                Team member utilization rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics.resourceUtilization}
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12, fill: "#4A7FA7" }}
                  />
                  <YAxis
                    label={{
                      value: "Hours",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#4A7FA7",
                    }}
                    tick={{ fill: "#4A7FA7" }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="utilized" fill="#1A3D63" name="Utilized" />
                  <Bar dataKey="available" fill="#B3CFE5" name="Available" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Cost vs Revenue */}
          <Card data-chart="true">
            <CardHeader>
              <CardTitle className="text-[#0A1931]">
                Project Cost vs Revenue
              </CardTitle>
              <CardDescription className="text-[#4A7FA7]">
                Financial performance by project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={analytics.costVsRevenue}
                  margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="project"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 12, fill: "#4A7FA7" }}
                  />
                  <YAxis
                    label={{
                      value: "Amount ($)",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#4A7FA7",
                    }}
                    tick={{ fill: "#4A7FA7" }}
                  />
                  <Tooltip
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Bar dataKey="cost" fill="#E15353" name="Cost" />
                  <Bar dataKey="revenue" fill="#1A3D63" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
