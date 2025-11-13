import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function getMonthDays(year: number, month: number) {
  // month: 0-indexed
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sunday
}

export function TaskCalendar({
  tasks,
  year: initialYear,
  month: initialMonth,
  onMonthChange
}: {
  tasks: Array<{ id: number; title: string; dueDate: string; status: string; priority: string; }>;
  year?: number;
  month?: number;
  onMonthChange?: (year: number, month: number) => void;
}) {
  const now = new Date();
  const [currentYear, setCurrentYear] = React.useState(initialYear ?? now.getFullYear());
  const [currentMonth, setCurrentMonth] = React.useState(initialMonth ?? now.getMonth());

  // Update internal state when props change
  React.useEffect(() => {
    if (initialYear !== undefined) setCurrentYear(initialYear);
    if (initialMonth !== undefined) setCurrentMonth(initialMonth);
  }, [initialYear, initialMonth]);

  const daysInMonth = getMonthDays(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    let newYear = currentYear;
    let newMonth = currentMonth;

    if (direction === 'prev') {
      newMonth = currentMonth - 1;
      if (newMonth < 0) {
        newMonth = 11;
        newYear = currentYear - 1;
      }
    } else {
      newMonth = currentMonth + 1;
      if (newMonth > 11) {
        newMonth = 0;
        newYear = currentYear + 1;
      }
    }

    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    onMonthChange?.(newYear, newMonth);
  };

  // Map tasks to days
  const tasksByDay: Record<number, Array<typeof tasks[0]>> = {};
  tasks.forEach(task => {
    const date = new Date(task.dueDate);
    if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
      const day = date.getDate();
      if (!tasksByDay[day]) tasksByDay[day] = [];
      tasksByDay[day].push(task);
    }
  });

  // Color coding by status
  const statusColors: Record<string, string> = {
    new: "bg-gray-200 text-gray-700",
    in_progress: "bg-yellow-200 text-yellow-900",
    completed: "bg-green-200 text-green-900",
    blocked: "bg-red-200 text-red-900",
    review: "bg-blue-200 text-blue-900",
    urgent: "bg-red-300 text-red-900",
  };

  // Build grid cells - ensure all cells are the same size
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={"empty-"+i} className="bg-white border rounded-lg min-h-[80px] flex flex-col" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(
      <div key={day} className="bg-gray-50 border rounded-lg p-2 min-h-[80px] flex flex-col gap-1">
        <span className="text-xs font-semibold text-blue-700">{day}</span>
        <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
          {tasksByDay[day]?.map(task => (
            <span
              key={task.id}
              className={`block text-[10px] font-medium rounded px-1 py-0.5 truncate cursor-pointer transition-colors ${statusColors[task.status] || "bg-gray-100 text-gray-700"}`}
              title={task.title}
            >
              {task.title}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-blue-900">Calendar View</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-blue-900 min-w-[120px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 bg-white rounded-lg p-4 border border-blue-100 shadow">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="text-xs font-bold text-blue-600 text-center mb-2">{d}</div>
        ))}
        {cells}
      </div>
    </div>
  );
}
