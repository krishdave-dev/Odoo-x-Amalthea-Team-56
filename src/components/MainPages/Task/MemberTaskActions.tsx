"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PlayCircle, CheckCircle, Clock } from "lucide-react";

interface MemberTaskActionsProps {
  taskId: number;
  currentStatus: string;
  onStatusChange: () => void;
}

export function MemberTaskActions({
  taskId,
  currentStatus,
  onStatusChange,
}: MemberTaskActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [logHoursOpen, setLogHoursOpen] = useState(false);
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Failed to update status";
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Task status updated successfully",
      });

      onStatusChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogHours = async () => {
    const hoursNum = parseFloat(hours);
    if (!hoursNum || hoursNum <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter valid hours (greater than 0)",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/timesheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: hoursNum, notes }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : data.error?.message || "Failed to log hours";
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Hours logged successfully",
      });

      setLogHoursOpen(false);
      setHours("");
      setNotes("");
      onStatusChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log hours",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status Change Buttons */}
      {currentStatus === "new" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange("in_progress")}
          disabled={isUpdating}
          className="flex items-center gap-1"
        >
          <PlayCircle className="h-3 w-3" />
          Start
        </Button>
      )}

      {currentStatus === "in_progress" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange("completed")}
          disabled={isUpdating}
          className="flex items-center gap-1"
        >
          <CheckCircle className="h-3 w-3" />
          Complete
        </Button>
      )}

      {/* Log Hours Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setLogHoursOpen(true)}
        disabled={isUpdating}
        className="flex items-center gap-1"
      >
        <Clock className="h-3 w-3" />
        Log Hours
      </Button>

      {/* Log Hours Dialog */}
      <Dialog open={logHoursOpen} onOpenChange={setLogHoursOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Hours</DialogTitle>
            <DialogDescription>
              Record the time you spent working on this task
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="hours">Hours *</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="0.5"
                placeholder="e.g., 2.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the work done..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogHoursOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleLogHours} disabled={isUpdating}>
              {isUpdating ? "Logging..." : "Log Hours"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
