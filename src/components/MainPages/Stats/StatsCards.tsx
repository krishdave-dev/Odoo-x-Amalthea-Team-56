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

export function StatsCards({ data, className }: StatsCardsProps) {
  const items = [
    {
      label: "Active Projects",
      value: formatNumber(data.activeProjects),
      icon: <Briefcase className="h-5 w-5 text-blue-600" />,
      accent: "bg-blue-50 border-blue-100",
    },
    {
      label: "Delayed Tasks",
      value: formatNumber(data.delayedTasks),
      icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      accent: "bg-amber-50 border-amber-100",
    },
    {
      label: "Hours Logged",
      value: formatNumber(data.hoursLogged),
      icon: <Clock className="h-5 w-5 text-emerald-600" />,
      accent: "bg-emerald-50 border-emerald-100",
    },
    {
      label: "Revenue Earned",
      value: formatCurrency(data.revenueEarned),
      icon: <DollarSign className="h-5 w-5 text-indigo-600" />,
      accent: "bg-indigo-50 border-indigo-100",
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
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
              <div className="rounded-md bg-white/70 p-2 ring-1 ring-black/5">
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
