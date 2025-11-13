"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type TaskStatus = "new" | "in_progress" | "completed";

export interface TaskModel {
  id: number;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  assignedTo: string;
  assigneeId?: number | null;
  assignedBy?: string; // Who assigned the task
  tags?: string[]; // Task tags
  dueDate: string; // human readable date
  projectName: string;
  status: TaskStatus;
  hoursLogged: number;
  expenses: { amount: number; note?: string; id: string }[];
  images?: string[];
}

interface TaskActionDialogProps {
  task: TaskModel;
  onUpdate: (task: TaskModel) => void;
  role: "team" | "manager" | "admin" | string; // simplistic role gate
}

export function TaskActionDialog({
  task,
  onUpdate,
  role,
}: TaskActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [hoursToLog, setHoursToLog] = useState<string>("");
  const [hoursNote, setHoursNote] = useState<string>("");
  const [expenseAmount, setExpenseAmount] = useState<string>("");
  const [expenseNote, setExpenseNote] = useState<string>("");

  const isTeamMember = role === "team" || role === "member";

  const resetFields = () => {
    setHoursToLog("");
    setHoursNote("");
    setExpenseAmount("");
    setExpenseNote("");
  };

  const handleApply = () => {
    let updated = { ...task };
    // status update
    updated.status = status;
    // hours logging
    const hours = parseFloat(hoursToLog);
    if (!isNaN(hours) && hours > 0) {
      updated.hoursLogged += hours;
    }
    // expense submission
    const expense = parseFloat(expenseAmount);
    if (!isNaN(expense) && expense > 0) {
      updated.expenses = [
        ...updated.expenses,
        {
          amount: expense,
          note: expenseNote || undefined,
          id: crypto.randomUUID(),
        },
      ];
    }

    onUpdate(updated);
    resetFields();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!isTeamMember}>
          Actions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Task</DialogTitle>
          <DialogDescription>
            Perform member actions: change status, log hours, submit expense.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={status}
              onValueChange={(v: TaskStatus) => setStatus(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Log Hours</label>
            <Input
              type="number"
              min={0}
              step={0.5}
              placeholder="e.g. 2"
              value={hoursToLog}
              onChange={(e) => setHoursToLog(e.target.value)}
            />
            <Textarea
              placeholder="Notes (optional)"
              value={hoursNote}
              onChange={(e) => setHoursNote(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Submit Expense</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="Amount"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
            />
            <Textarea
              placeholder="Expense note (optional)"
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Current Status</p>
              <Badge>{task.status.replace("_", " ")}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Hours Logged</p>
              <Badge variant="secondary">{task.hoursLogged}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Expenses</p>
              <Badge variant="outline">{task.expenses.length}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Priority</p>
              <Badge>{task.priority}</Badge>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
