"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Briefcase, AlertTriangle, Clock, DollarSign } from "lucide-react";

type Numberish = number | string;

export interface StatsData {
  activeProjects: number;
  delayedTasks: number;
  hoursLogged: number;
  revenueEarned: number;
}

interface StatsCardsProps {
  data: StatsData;
  className?: string;
  userRole?: 'admin' | 'manager' | 'member';
}

function formatNumber(n: Numberish) {
  if (typeof n === "string") return n;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function StatsCards({ data, className, userRole = 'member' }: StatsCardsProps) {
  // Role-based labels
  const getLabels = () => {
    switch (userRole) {
      case 'admin':
        return {
          projects: "All Active Projects",
          tasks: "All Delayed Tasks",
          hours: "Total Hours Logged",
          revenue: "Total Revenue Earned",
        };
      case 'manager':
        return {
          projects: "My Active Projects",
          tasks: "Delayed Tasks",
          hours: "Hours Logged",
          revenue: "Revenue Earned",
        };
      case 'member':
      default:
        return {
          projects: "My Active Projects",
          tasks: "My Delayed Tasks",
          hours: "My Hours Logged",
          revenue: "My Revenue Earned",
        };
    }
  };

  const labels = getLabels();

  const items = [
    {
      label: labels.projects,
      value: formatNumber(data.activeProjects),
      icon: <Briefcase className="h-5 w-5 text-[#1A3D63]" />,
      accent: "bg-[#E8F2FA] border-[#B3CFE5]",
    },
    {
      label: labels.tasks,
      value: formatNumber(data.delayedTasks),
      icon: <AlertTriangle className="h-5 w-5 text-[#4A7FA7]" />,
      accent: "bg-[#E8F2FA] border-[#B3CFE5]",
    },
    {
      label: labels.hours,
      value: formatNumber(data.hoursLogged),
      icon: <Clock className="h-5 w-5 text-[#1A3D63]" />,
      accent: "bg-[#E8F2FA] border-[#B3CFE5]",
    },
    {
      label: labels.revenue,
      value: formatCurrency(data.revenueEarned),
      icon: <DollarSign className="h-5 w-5 text-[#4A7FA7]" />,
      accent: "bg-[#E8F2FA] border-[#B3CFE5]",
    },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
        className
      )}
    >
      {items.map((item) => (
        <Card
          key={item.label}
          className={cn(
            "border shadow-sm transition-colors hover:bg-muted/30",
            item.accent
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4A7FA7]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[#0A1931]">{item.value}</p>
              </div>
              <div className="rounded-md bg-white p-2 ring-1 ring-[#B3CFE5]">
                {item.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default StatsCards;
