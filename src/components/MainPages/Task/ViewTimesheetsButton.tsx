"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Timesheet {
  id: number;
  userId: number;
  start: string;
  end: string;
  durationHours: number;
  billable: boolean;
  notes: string | null;
  costAtTime: number;
  status: string;
  createdAt: string;
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

interface ViewTimesheetsButtonProps {
  taskId: number;
  taskTitle?: string;
  hoursLogged?: number;
}

export function ViewTimesheetsButton({
  taskId,
  taskTitle,
  hoursLogged = 0,
}: ViewTimesheetsButtonProps) {
  const { toast } = useToast();
  const [timesheetsModalOpen, setTimesheetsModalOpen] = useState(false);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loadingTimesheets, setLoadingTimesheets] = useState(false);

  const fetchTimesheets = async () => {
    setLoadingTimesheets(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/timesheets`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to fetch timesheets");
      
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setTimesheets(data.data);
      }
    } catch (error) {
      console.error("Error fetching timesheets:", error);
      toast({
        title: "Error",
        description: "Failed to load timesheets",
        variant: "destructive",
      });
    } finally {
      setLoadingTimesheets(false);
    }
  };

  return (
    <Dialog
      open={timesheetsModalOpen}
      onOpenChange={(open) => {
        setTimesheetsModalOpen(open);
        if (open) fetchTimesheets();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-1" />
          View Hours ({hoursLogged}h)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Timesheet Entries</DialogTitle>
          <DialogDescription>
            {taskTitle ? `Logged hours for: ${taskTitle}` : "View all logged hours for this task"}
          </DialogDescription>
        </DialogHeader>

        {loadingTimesheets ? (
          <div className="text-center py-8">Loading timesheets...</div>
        ) : timesheets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No timesheets logged yet
          </div>
        ) : (
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((ts) => (
                  <TableRow key={ts.id}>
                    <TableCell className="font-medium">
                      {ts.user.name || ts.user.email}
                    </TableCell>
                    <TableCell>
                      {new Date(ts.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{Number(ts.durationHours).toFixed(2)}h</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {ts.notes || "-"}
                    </TableCell>
                    <TableCell>{ts.billable ? "Yes" : "No"}</TableCell>
                    <TableCell>₹{Number(ts.costAtTime).toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{ts.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between font-semibold">
                <span>Total Hours:</span>
                <span>
                  {timesheets
                    .reduce((acc, ts) => acc + Number(ts.durationHours), 0)
                    .toFixed(2)}
                  h
                </span>
              </div>
              <div className="flex justify-between font-semibold text-sm text-muted-foreground mt-1">
                <span>Total Cost:</span>
                <span>
                  ₹
                  {timesheets
                    .reduce((acc, ts) => acc + Number(ts.costAtTime), 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
